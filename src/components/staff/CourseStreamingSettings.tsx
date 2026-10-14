import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { apiClient } from '@/utils/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeColors } from '@/context/ThemePreferencesContext';
type Status = {
  provider: string | null;
  configured: boolean;
  institutionOverride?: { provider: string; configured: boolean } | null;
};
export function CourseStreamingSettings() {
  const colors = useThemeColors();
  const [status, setStatus] = useState<Status | null>(null),
    [provider, setProvider] = useState<'BUNNY' | 'MUX'>('BUNNY'),
    [fields, setFields] = useState<Record<string, string>>({}),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [removing, setRemoving] = useState(false);
  async function load() {
    try {
      setStatus(await apiClient('/api/course-streaming'));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not load streaming settings.');
    }
  }
  useEffect(() => {
    void load();
  }, []);
  const inputs =
    provider === 'BUNNY'
      ? [
          ['libraryId', 'Library ID'],
          ['apiKey', 'API key'],
          ['cdnHostname', 'CDN hostname'],
          ['tokenAuthKey', 'Token authentication key'],
        ]
      : [
          ['tokenId', 'Access token ID'],
          ['tokenSecret', 'Access token secret'],
        ];
  async function save(remove = false) {
    setBusy(true);
    setMessage('');
    try {
      await apiClient('/api/course-streaming', {
        method: remove ? 'DELETE' : 'PUT',
        ...(remove
          ? {}
          : {
              body: JSON.stringify({
                provider,
                ...Object.fromEntries(inputs.map(([key]) => [key, (fields[key] || '').trim()])),
              }),
            }),
      });
      setFields({});
      setRemoving(false);
      await load();
      setMessage(remove ? 'Personal credentials removed.' : 'Streaming credentials verified and saved.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save settings.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card title="Course streaming">
      <View style={{ gap: 12 }}>
        <Text style={{ color: colors.text }}>
          Personal provider: {status?.configured ? status.provider : 'Not configured'}
        </Text>
        {status?.institutionOverride?.configured ? (
          <Text style={{ color: colors.text }}>
            Your institution’s {status.institutionOverride.provider} provider takes priority for course
            videos.
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['BUNNY', 'MUX'] as const).map((p) => (
            <Button
              key={p}
              title={p}
              variant={provider === p ? 'solid' : 'outline'}
              disabled={busy}
              onPress={() => {
                setProvider(p);
                setFields({});
              }}
            />
          ))}
        </View>
        {inputs.map(([key, label]) => (
          <Input
            key={key}
            label={label}
            value={fields[key] || ''}
            onChangeText={(value) => setFields((old) => ({ ...old, [key]: value }))}
            editable={!busy}
            autoCapitalize="none"
            autoCorrect={false}
            {...(/key|secret/i.test(key) ? { secureTextEntry: true } : {})}
          />
        ))}
        <Button
          title="Verify and save"
          loading={busy}
          disabled={!inputs.every(([key]) => fields[key]?.trim())}
          onPress={() => void save()}
        />
        {status?.configured ? (
          removing ? (
            <>
              <Text style={{ color: colors.text }}>Remove your personal streaming credentials?</Text>
              <Button title="Confirm removal" disabled={busy} onPress={() => void save(true)} />
              <Button title="Cancel" disabled={busy} onPress={() => setRemoving(false)} />
            </>
          ) : (
            <Button
              title="Remove personal credentials"
              variant="outline"
              disabled={busy}
              onPress={() => setRemoving(true)}
            />
          )
        ) : null}
        {!status ? <Button title="Reload settings" disabled={busy} onPress={() => void load()} /> : null}
        {message ? (
          <Text accessibilityRole="alert" style={{ color: colors.text }}>
            {message}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}
