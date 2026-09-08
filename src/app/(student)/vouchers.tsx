import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { preparePickedContent } from '@/utils/content-upload';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkeletonPage } from '@/components/ui/Skeleton';

type Invoice = { id: number; billingMonth: string; dueDate: string; status: string; totalAmount: number; paidAmount: number };
type Method = { id: string; providerName: string; accountTitle: string; accountNumber: string; qrUrl: string | null };
type Submission = { invoiceId: number; status: string; reviewerNote: string | null };
type Item = { id: number; invoiceId: number; label: string; type: string; amount: number };
type Payment = { id: number; invoiceId: number; receiptNumber: string; amount: number; method: string; receivedAt: string };
type Data = { invoices: Invoice[]; items: Item[]; payments: Payment[]; paymentMethods: Method[]; submissions: Submission[]; summary: { billed: number; paid: number; balance: number } };
type ReceiptAsset = { uri: string; name: string; mimeType?: string | null; size?: number | null };
const money = (value: number) => `PKR ${Number(value || 0).toLocaleString('en-PK')}`;

export default function FeesScreen() {
  const router = useRouter(); const colors = useThemeColors();
  const [data, setData] = useState<Data | null>(null), [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [paying, setPaying] = useState<Invoice | null>(null), [openId, setOpenId] = useState<number | null>(null), [amount, setAmount] = useState(''), [bank, setBank] = useState(''), [transaction, setTransaction] = useState(''), [proof, setProof] = useState<ReceiptAsset | null>(null), [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setData(await apiClient('/api/student/fees')); } catch (err: unknown) { Alert.alert('Could not load fees', err instanceof Error ? err.message : 'Please try again.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  async function chooseProof() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'], copyToCacheDirectory: true });
    if (result.canceled) return;
    try { setProof(await preparePickedContent(result.assets[0])); }
    catch (err: unknown) { Alert.alert('Invalid receipt', err instanceof Error ? err.message : 'Choose an image or PDF up to 5 MB.'); }
  }
  async function submitPayment() {
    if (!paying || !proof || !bank.trim() || !transaction.trim() || !Number.isInteger(Number(amount)) || Number(amount) <= 0) return;
    setBusy(true);
    try {
      const signature = await apiClient('/api/student/fees', { method: 'POST', body: JSON.stringify({ action: 'signature', invoiceId: paying.id }) });
      const response = await FileSystem.uploadAsync(`https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`, proof.uri, { fieldName: 'file', httpMethod: 'POST', uploadType: 1 as any, parameters: { api_key: signature.apiKey, timestamp: String(signature.timestamp), signature: signature.signature, folder: signature.folder, allowed_formats: signature.allowedFormats, type: signature.type } });
      const uploaded = JSON.parse(response.body); if (response.status < 200 || response.status >= 300) throw new Error(uploaded.error?.message || 'Receipt upload failed');
      await apiClient('/api/student/fees', { method: 'POST', body: JSON.stringify({ action: 'complete', invoiceId: paying.id, amount: Number(amount), sourceBankName: bank.trim(), transactionId: transaction.trim(), publicId: uploaded.public_id, format: uploaded.format, resourceType: uploaded.resource_type }) });
      setPaying(null); setProof(null); setAmount(''); setBank(''); setTransaction(''); await load(); Alert.alert('Payment submitted', 'Your institution will verify the receipt.');
    } catch (err: unknown) { Alert.alert('Payment failed', err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  function beginPayment(invoice: Invoice) { setPaying(invoice); setAmount(String(invoice.totalAmount - invoice.paidAmount)); setProof(null); setBank(''); setTransaction(''); }
  if (loading && !refreshing) return <SkeletonPage title="Fees" subtitle="Loading challans and receipts." eyebrow="Finance" iconName="receipt-outline" variant="list" />;
  const active = data?.invoices.filter((invoice) => !['PAID', 'VOID'].includes(invoice.status)) || [];
  const paid = data?.invoices.filter((invoice) => invoice.status === 'PAID') || [];

  const rows = (invoices: Invoice[], paidMode: boolean) => invoices.length === 0 ? <Text style={[styles.empty, { color: colors.textMuted }]}>Nothing to show.</Text> : invoices.map((invoice) => {
    const expanded = openId === invoice.id, pending = data?.submissions.find((item) => item.invoiceId === invoice.id && item.status === 'SUBMITTED'), rejected = data?.submissions.find((item) => item.invoiceId === invoice.id && item.status === 'REJECTED');
    return <View key={invoice.id} style={[styles.challan, { borderBottomColor: colors.border }]}><TouchableOpacity style={styles.row} onPress={() => setOpenId(expanded ? null : invoice.id)}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>{invoice.billingMonth}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>Due {invoice.dueDate} · {money(invoice.totalAmount)}</Text></View><Text style={[styles.status, { color: paidMode ? colors.success : colors.warning }]}>{paidMode ? 'PAID' : pending ? 'VERIFYING' : invoice.status}</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} /></TouchableOpacity>{rejected?.reviewerNote ? <Text style={styles.error}>Previous proof rejected: {rejected.reviewerNote}</Text> : null}{!paidMode ? <Button title={pending ? 'Awaiting verification' : 'Pay challan'} disabled={Boolean(pending)} onPress={() => beginPayment(invoice)} style={{ marginBottom: Spacing.md }} /> : null}{expanded ? <View style={[styles.details, { borderTopColor: colors.border }]}><Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CHALLAN</Text>{data?.items.filter((item) => item.invoiceId === invoice.id).map((item) => <View key={item.id} style={styles.detailRow}><Text style={{ color: colors.text }}>{item.label}</Text><Text style={{ color: colors.text }}>{item.type === 'DISCOUNT' ? '−' : ''}{money(item.amount)}</Text></View>)}<View style={styles.detailRow}><Text style={[styles.title, { color: colors.text }]}>Balance</Text><Text style={[styles.title, { color: colors.text }]}>{money(invoice.totalAmount - invoice.paidAmount)}</Text></View><Text style={[styles.sectionLabel, { color: colors.textMuted }]}>VERIFIED RECEIPTS</Text>{data?.payments.filter((payment) => payment.invoiceId === invoice.id).length ? data.payments.filter((payment) => payment.invoiceId === invoice.id).map((payment) => <View key={payment.id} style={styles.receipt}><View style={styles.detailRow}><Text style={[styles.title, { color: colors.text }]}>{payment.receiptNumber}</Text><Text style={{ color: colors.text }}>{money(payment.amount)}</Text></View><Text style={[styles.meta, { color: colors.textMuted }]}>{payment.method} · {new Date(payment.receivedAt).toLocaleString()}</Text></View>) : <Text style={[styles.meta, { color: colors.textMuted }]}>No verified receipt yet.</Text>}</View> : null}</View>;
  });

  return <><ScreenShell title="Fees" subtitle="Pay challans and view verified receipts." eyebrow="Finance" icon={<Ionicons name="receipt-outline" size={22} color="#FFF" />} actions={<TouchableOpacity onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color="#FFF" /></TouchableOpacity>} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    <View style={styles.summary}><Card><Text style={[styles.meta, { color: colors.textMuted }]}>Outstanding balance</Text><Text style={[styles.total, { color: colors.text }]}>{money(data?.summary.balance || 0)}</Text></Card></View>
    {data?.paymentMethods.length ? <Card title="Payment accounts">{data.paymentMethods.map((method) => <View key={method.id} style={styles.method}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>{method.providerName}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>{method.accountTitle} · {method.accountNumber}</Text></View>{method.qrUrl ? <Image source={{ uri: method.qrUrl }} style={styles.qr} /> : null}</View>)}</Card> : null}
    <Card title="Active challans">{rows(active, false)}</Card><Card title="Paid challans & receipts">{rows(paid, true)}</Card>
  </ScreenShell><Modal visible={Boolean(paying)} onClose={() => !busy && setPaying(null)} title="Pay challan" footer={<><Button title="Cancel" variant="ghost" disabled={busy} onPress={() => setPaying(null)} /><Button title="Submit payment" loading={busy} disabled={!proof || !bank.trim() || !transaction.trim() || !amount} onPress={() => void submitPayment()} /></>}><Text style={[styles.meta, { color: colors.textMuted, marginBottom: Spacing.md }]}>Balance {money((paying?.totalAmount || 0) - (paying?.paidAmount || 0))}</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="Amount" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><TextInput value={bank} onChangeText={setBank} placeholder="Source bank or wallet" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><TextInput value={transaction} onChangeText={setTransaction} placeholder="Transaction ID" placeholderTextColor={colors.textMuted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} /><Button title={proof ? proof.name : 'Choose receipt image or PDF'} variant="outline" onPress={() => void chooseProof()} /></Modal></>;
}

const styles = StyleSheet.create({ back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,.16)' }, summary: { gap: Spacing.sm }, total: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.xl, marginTop: 4 }, title: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md }, meta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, marginTop: 3 }, method: { paddingVertical: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, qr: { width: 76, height: 76, borderRadius: Radius.sm }, challan: { borderBottomWidth: StyleSheet.hairlineWidth }, row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md }, status: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xs }, details: { borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: Spacing.md, gap: Spacing.sm }, detailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md }, sectionLabel: { fontFamily: Typography.fontFamilyBold, fontSize: 10, letterSpacing: 1, marginTop: Spacing.sm }, receipt: { padding: Spacing.sm, borderRadius: Radius.sm, backgroundColor: 'rgba(127,127,127,.08)' }, input: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, fontFamily: Typography.fontFamily }, empty: { fontFamily: Typography.fontFamily, textAlign: 'center', paddingVertical: Spacing.lg }, error: { color: '#D0453A', fontSize: 12, marginBottom: Spacing.sm } });
