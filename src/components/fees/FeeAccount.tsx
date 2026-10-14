import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from '@/utils/api';
import { preparePickedContent } from '@/utils/content-upload';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SkeletonList } from '@/components/ui/Skeleton';
type Invoice = {
  id: number;
  billingMonth: string;
  billingKind: string;
  billingLabel: string | null;
  dueDate: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
};
type Account = {
  id: string;
  providerName: string;
  accountTitle: string;
  accountNumber: string;
  qrUrl: string | null;
};
type Paging = { page: number; pages: number; total: number };
type Data = {
  invoices: Invoice[];
  paymentAccounts: Account[];
  submissions: { invoiceId: number; status: string; reviewerNote: string | null }[];
  activePagination: Paging;
  paidPagination: Paging;
  summary: { billed: number; paid: number; balance: number };
};
type Details = {
  items: { id: number; label: string; type: string; amount: number }[];
  payments: { id: number; receiptNumber: string; amount: number; method: string; receivedAt: string }[];
  page: number;
  hasMore: boolean;
};
type Proof = { uri: string; name: string; mimeType?: string | null; size?: number | null };
const money = (value: number) => `PKR ${Number(value || 0).toLocaleString('en-PK')}`;
export function FeeAccount({ studentId, header }: { studentId?: number; header?: React.ReactNode }) {
  const colors = useThemeColors();
  const endpoint = '/api/student/fees?' + (studentId ? 'studentId=' + studentId + '&' : '');
  const [data, setData] = useState<Data | null>(null),
    [activePage, setActivePage] = useState(1),
    [paidPage, setPaidPage] = useState(1),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [details, setDetails] = useState<Record<number, Details>>({}),
    [openId, setOpenId] = useState<number | null>(null),
    [detailBusy, setDetailBusy] = useState(false);
  const [paying, setPaying] = useState<Invoice | null>(null),
    [accountId, setAccountId] = useState(''),
    [amount, setAmount] = useState(''),
    [bank, setBank] = useState(''),
    [reference, setReference] = useState(''),
    [proof, setProof] = useState<Proof | null>(null),
    [busy, setBusy] = useState(false),
    [paymentError, setPaymentError] = useState(''),
    [notice, setNotice] = useState('');
  const request = useRef(0),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const load = useCallback(async () => {
    const version = ++request.current;
    setLoading(true);
    setError('');
    try {
      const result = await apiClient(endpoint + `activePage=${activePage}&paidPage=${paidPage}`);
      if (mounted.current && version === request.current) setData(result);
    } catch (e) {
      if (mounted.current && version === request.current)
        setError(e instanceof Error ? e.message : 'Could not load fees.');
    } finally {
      if (mounted.current && version === request.current) setLoading(false);
    }
  }, [endpoint, activePage, paidPage]);
  useEffect(() => {
    void load();
  }, [load]);
  async function detail(id: number, page = 1) {
    setDetailBusy(true);
    setError('');
    try {
      const result: Details = await apiClient(endpoint + `invoiceId=${id}&page=${page}`);
      if (mounted.current)
        setDetails((old) => ({
          ...old,
          [id]: {
            ...result,
            items: page === 1 ? result.items : [...(old[id]?.items || []), ...result.items],
            payments: page === 1 ? result.payments : [...(old[id]?.payments || []), ...result.payments],
          },
        }));
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Could not load receipts.');
    } finally {
      if (mounted.current) setDetailBusy(false);
    }
  }
  async function chooseProof() {
    setPaymentError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!/\.(jpg|jpeg|png|webp|pdf)$/i.test(asset.name))
        throw new Error('Choose a JPG, PNG, WebP or PDF receipt.');
      if (Platform.OS === 'web') {
        const blob = await (await fetch(asset.uri)).blob();
        if (blob.size <= 0 || blob.size > 5 * 1024 * 1024)
          throw new Error('Receipt must be 5 MB or smaller.');
        setProof({ ...asset, size: blob.size });
      } else setProof(await preparePickedContent(asset));
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : 'Could not open receipt.');
    }
  }
  const valid = Boolean(
    paying &&
    proof &&
    accountId &&
    bank.trim().length >= 2 &&
    reference.trim().length >= 2 &&
    Number.isInteger(Number(amount)) &&
    Number(amount) > 0 &&
    Number(amount) <= paying.totalAmount - paying.paidAmount,
  );
  async function submit() {
    if (!valid || !paying || !proof || busy) return;
    setBusy(true);
    setPaymentError('');
    try {
      const signature = await apiClient(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action: 'signature', invoiceId: paying.id }),
      });
      const url = `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`;
      const parameters = {
        api_key: signature.apiKey,
        timestamp: String(signature.timestamp),
        signature: signature.signature,
        folder: signature.folder,
        allowed_formats: signature.allowedFormats,
        type: signature.type,
        overwrite: String(signature.overwrite),
      };
      let uploaded;
      if (Platform.OS === 'web') {
        const form = new FormData();
        Object.entries(parameters).forEach(([key, value]) => form.append(key, String(value)));
        form.append('file', await (await fetch(proof.uri)).blob(), proof.name);
        const response = await fetch(url, { method: 'POST', body: form });
        uploaded = await response.json();
        if (!response.ok) throw new Error(uploaded.error?.message || 'Receipt upload failed');
      } else {
        const response = await FileSystem.uploadAsync(url, proof.uri, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          parameters,
        });
        uploaded = JSON.parse(response.body);
        if (response.status < 200 || response.status >= 300)
          throw new Error(uploaded.error?.message || 'Receipt upload failed');
      }
      await apiClient(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          action: 'complete',
          invoiceId: paying.id,
          paymentAccountId: accountId,
          amount: Number(amount),
          sourceBankName: bank.trim(),
          transactionId: reference.trim(),
          publicId: uploaded.public_id,
          format: uploaded.format,
          resourceType: uploaded.resource_type,
        }),
      });
      if (mounted.current) {
        setPaying(null);
        setProof(null);
        setDetails({});
        setNotice('Payment submitted. Your institution will verify the receipt.');
        await load();
      }
    } catch (e) {
      if (mounted.current) setPaymentError(e instanceof Error ? e.message : 'Payment submission failed.');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  function begin(invoice: Invoice) {
    setPaying(invoice);
    setAccountId(data?.paymentAccounts[0]?.id || '');
    setAmount(String(invoice.totalAmount - invoice.paidAmount));
    setBank('');
    setReference('');
    setProof(null);
    setPaymentError('');
  }
  function rows(paid: boolean) {
    const invoices =
      data?.invoices.filter((row) =>
        paid ? row.status === 'PAID' : ['DUE', 'PARTIAL'].includes(row.status),
      ) || [];
    return invoices.length ? (
      invoices.map((invoice) => {
        const submission = data?.submissions.find((row) => row.invoiceId === invoice.id),
          pending = submission?.status === 'SUBMITTED',
          expanded = openId === invoice.id,
          info = details[invoice.id];
        return (
          <View
            key={invoice.id}
            style={{ gap: 10, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}
          >
            <Button
              variant="ghost"
              title={`${invoice.billingLabel || (invoice.billingKind === 'ONE_TIME' ? 'One-time challan' : invoice.billingMonth)} · ${invoice.status}`}
              disabled={detailBusy}
              onPress={() => {
                setOpenId(expanded ? null : invoice.id);
                if (!expanded && !info) void detail(invoice.id);
              }}
            />
            <Text style={{ color: colors.text }}>
              Due {invoice.dueDate} · Total {money(invoice.totalAmount)} · Balance{' '}
              {money(invoice.totalAmount - invoice.paidAmount)}
            </Text>
            {submission?.status === 'REJECTED' ? (
              <Text style={{ color: colors.error }}>
                Previous proof rejected{submission.reviewerNote ? `: ${submission.reviewerNote}` : ''}
              </Text>
            ) : null}
            {!paid ? (
              <Button
                title={pending ? 'Awaiting verification' : 'Pay challan'}
                disabled={pending || !data?.paymentAccounts.length || loading}
                onPress={() => begin(invoice)}
              />
            ) : null}
            {expanded ? (
              <View style={{ gap: 10 }}>
                {info ? (
                  <>
                    {info.items.map((item) => (
                      <Text key={item.id} style={{ color: colors.text }}>
                        {item.label}: {item.type === 'DISCOUNT' ? '−' : ''}
                        {money(item.amount)}
                      </Text>
                    ))}
                    <Text style={{ color: colors.text, fontWeight: 'bold' }}>Verified receipts</Text>
                    {info.payments.map((payment) => (
                      <Text key={payment.id} style={{ color: colors.text }}>
                        {payment.receiptNumber} · {money(payment.amount)} · {payment.method} ·{' '}
                        {new Date(payment.receivedAt).toLocaleString()}
                      </Text>
                    ))}
                    {!info.payments.length ? (
                      <Text style={{ color: colors.textMuted }}>No verified receipts yet.</Text>
                    ) : null}
                    {info.hasMore ? (
                      <Button
                        title="More items and receipts"
                        loading={detailBusy}
                        onPress={() => void detail(invoice.id, info.page + 1)}
                      />
                    ) : null}
                  </>
                ) : (
                  <Button
                    title="Load challan details"
                    loading={detailBusy}
                    onPress={() => void detail(invoice.id)}
                  />
                )}
              </View>
            ) : null}
          </View>
        );
      })
    ) : (
      <Text style={{ color: colors.textMuted }}>No challans to show.</Text>
    );
  }
  return (
    <>
      <ScreenShell
        title="Fees & payments"
        subtitle="Challans, payment evidence and verified receipts."
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              setDetails({});
              void load();
            }}
          />
        }
      >
        {header}
        {error ? (
          <Card>
            <Text accessibilityRole="alert" style={{ color: colors.error }}>
              {error}
            </Text>
            <Button title="Retry fees" onPress={() => void load()} />
          </Card>
        ) : null}
        {notice ? <Text style={{ color: colors.success }}>{notice}</Text> : null}
        {!data && loading ? (
          <SkeletonList rows={4} />
        ) : data ? (
          <>
            <Card title="Fee balance">
              <Text style={{ color: colors.text }}>Billed: {money(data.summary.billed)}</Text>
              <Text style={{ color: colors.text }}>Paid: {money(data.summary.paid)}</Text>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                Outstanding: {money(data.summary.balance)}
              </Text>
            </Card>
            <Card title="Payment accounts">
              {data.paymentAccounts.length ? (
                data.paymentAccounts.map((account) => (
                  <View key={account.id} style={{ gap: 6, paddingVertical: 10 }}>
                    <Text style={{ color: colors.text }}>
                      {account.providerName} · {account.accountTitle}
                    </Text>
                    <Text selectable style={{ color: colors.text }}>
                      {account.accountNumber}
                    </Text>
                    {account.qrUrl ? (
                      <Image
                        source={{ uri: account.qrUrl }}
                        style={{ width: 140, height: 140, resizeMode: 'contain' }}
                      />
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textMuted }}>
                  Your institution has not configured a payment account.
                </Text>
              )}
            </Card>
            <Card title="Active challans">
              {rows(false)}
              <FeePages paging={data.activePagination} busy={loading} onPage={setActivePage} />
            </Card>
            <Card title="Paid challans & receipts">
              {rows(true)}
              <FeePages paging={data.paidPagination} busy={loading} onPage={setPaidPage} />
            </Card>
          </>
        ) : null}
      </ScreenShell>
      <Modal
        visible={Boolean(paying)}
        title="Submit payment evidence"
        onClose={() => {
          if (!busy) setPaying(null);
        }}
        footer={
          <>
            <Button title="Cancel" variant="ghost" disabled={busy} onPress={() => setPaying(null)} />
            <Button title="Submit payment" loading={busy} disabled={!valid} onPress={() => void submit()} />
          </>
        }
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
          <Text style={{ color: colors.text }}>
            Balance: {money((paying?.totalAmount || 0) - (paying?.paidAmount || 0))}. Partial payments are
            allowed.
          </Text>
          <Text style={{ color: colors.text }}>Destination account</Text>
          {data?.paymentAccounts.map((account) => (
            <Button
              key={account.id}
              title={`${account.providerName} · ${account.accountTitle} · ${account.accountNumber}`}
              variant={account.id === accountId ? 'solid' : 'outline'}
              disabled={busy}
              onPress={() => setAccountId(account.id)}
            />
          ))}
          <Input
            label="Amount (PKR)"
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
            editable={!busy}
          />
          <Input
            label="Source bank or wallet"
            value={bank}
            onChangeText={setBank}
            maxLength={120}
            editable={!busy}
          />
          <Input
            label="Transaction ID"
            value={reference}
            onChangeText={setReference}
            maxLength={160}
            autoCapitalize="none"
            editable={!busy}
          />
          <Button
            title={proof?.name || 'Choose receipt image or PDF'}
            disabled={busy}
            onPress={() => void chooseProof()}
          />
          {paymentError ? (
            <Text accessibilityRole="alert" style={{ color: colors.error }}>
              {paymentError}
            </Text>
          ) : null}
        </ScrollView>
      </Modal>
    </>
  );
}
function FeePages({
  paging,
  busy,
  onPage,
}: {
  paging: Paging;
  busy: boolean;
  onPage: (page: number) => void;
}) {
  const colors = useThemeColors();
  return paging.pages > 1 ? (
    <View style={{ gap: 8, marginTop: 12 }}>
      <Text style={{ color: colors.text }}>
        Page {paging.page} of {paging.pages} · {paging.total} challans
      </Text>
      <Button
        title="Previous challans"
        disabled={busy || paging.page <= 1}
        onPress={() => onPage(paging.page - 1)}
      />
      <Button
        title="Next challans"
        disabled={busy || paging.page >= paging.pages}
        onPress={() => onPage(paging.page + 1)}
      />
    </View>
  ) : null;
}
