import { useState } from 'react';
import { Platform, Switch, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiClient, apiResponse } from '@/utils/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/context/ThemePreferencesContext';

export function AssessmentTools({
  testId,
  sectionId,
  canPublish,
  published,
  onChanged,
}: {
  testId: number;
  sectionId: number;
  canPublish: boolean;
  published: boolean;
  onChanged: () => Promise<void>;
}) {
  const colors = useThemeColors();
  const [overwrite, setOverwrite] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [confirmPublish, setConfirmPublish] = useState(false);
  async function run(action: 'download' | 'upload' | 'publish') {
    setBusy(true);
    setMessage('');
    try {
      if (action === 'download') {
        const csv = await (
          await apiResponse(`/api/staff/marks/template?testId=${testId}&sectionId=${sectionId}`)
        ).text();
        const name = `assessment-${testId}-section-${sectionId}.csv`;
        if (Platform.OS === 'web') {
          const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
          const link = document.createElement('a');
          link.href = url;
          link.download = name;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
          const uri = FileSystem.cacheDirectory + name;
          await FileSystem.writeAsStringAsync(uri, csv);
          if (!(await Sharing.isAvailableAsync()))
            throw new Error('File sharing is unavailable on this device.');
          await Sharing.shareAsync(uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
        }
        return;
      }
      const form = new FormData();
      form.append('action', action);
      form.append('testId', String(testId));
      form.append('sectionId', String(sectionId));
      if (action === 'upload') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['text/*', 'application/csv', 'application/vnd.ms-excel'],
          copyToCacheDirectory: true,
        });
        if (result.canceled) return;
        const file = result.assets[0];
        if (!file.name.toLowerCase().endsWith('.csv') || (file.size || 0) > 1024 * 1024)
          throw new Error('Choose a CSV file no larger than 1 MB.');
        if (Platform.OS === 'web') form.append('csv', await (await fetch(file.uri)).blob(), file.name);
        else form.append('csv', { uri: file.uri, name: file.name, type: 'text/csv' } as unknown as Blob);
        form.append('overwrite', overwrite ? 'on' : '');
      }
      await apiClient('/api/staff/marks/tools', { method: 'POST', body: form });
      await onChanged();
      setConfirmPublish(false);
      setMessage(action === 'upload' ? 'CSV marks saved.' : 'Results published to students and parents.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Operation failed. Please retry.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Assessment tools">
      <View style={{ gap: 12 }}>
        <Button title="Download roster CSV" disabled={busy} onPress={() => void run('download')} />
        <Text style={{ color: colors.text }}>
          Fill in the roster template, then upload it. Enable overwrite to replace marks already saved.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Switch
            accessibilityLabel="Overwrite existing marks"
            value={overwrite}
            disabled={busy}
            onValueChange={setOverwrite}
          />
          <Text style={{ color: colors.text }}>Overwrite existing marks</Text>
        </View>
        <Button title="Upload marks CSV" disabled={busy} onPress={() => void run('upload')} />
        {canPublish ? (
          published ? (
            <Text style={{ color: colors.success }}>Results published</Text>
          ) : confirmPublish ? (
            <>
              <Text style={{ color: colors.text }}>
                Publish saved results for this entire section? All students must have marks saved.
              </Text>
              <Button title="Confirm publication" disabled={busy} onPress={() => void run('publish')} />
              <Button
                title="Cancel"
                variant="ghost"
                disabled={busy}
                onPress={() => setConfirmPublish(false)}
              />
            </>
          ) : (
            <Button title="Publish saved results" disabled={busy} onPress={() => setConfirmPublish(true)} />
          )
        ) : null}
        {busy ? <Text style={{ color: colors.text }}>Working…</Text> : null}
        {message ? (
          <Text accessibilityRole="alert" style={{ color: colors.text }}>
            {message}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
