import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { apiClient } from '@/utils/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useThemeColors } from '@/context/ThemePreferencesContext';
type Section = { id: number; name: string; classId: number; className: string };
type Sent = { id: number; title: string; content: string; createdAt: string; targetType: string };
export function TeacherBroadcasts() {
  const colors = useThemeColors();
  const [sections, setSections] = useState<Section[]>([]),
    [selected, setSelected] = useState<Section | null>(null),
    [audience, setAudience] = useState<'CLASS' | 'SECTION'>('SECTION'),
    [title, setTitle] = useState(''),
    [content, setContent] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [sent, setSent] = useState<Sent[]>([]),
    [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
    apiClient('/api/staff/announcements?page=' + page)
      .then((data) => {
        if (!active) return;
        setSections(data.sections);
        setSent(data.sent);
        setHasMore(data.hasMore);
        setSelected((old) => old || data.sections[0] || null);
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [page, revision]);
  async function send() {
    if (!selected) return;
    setBusy(true);
    setMessage('');
    try {
      await apiClient('/api/staff/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetType: audience,
          targetClassId: selected.classId,
          targetSectionId: selected.id,
        }),
      });
      setTitle('');
      setContent('');
      setMessage('Announcement sent.');
      // The effect owns the read after sending. Changing page already triggers
      // it; when on page one, revision triggers exactly one reload instead.
      if (page !== 1) setPage(1);
      else setRevision(value => value + 1);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not send announcement.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Card title="Create announcement">
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.text }}>Choose one of your assigned classes or sections.</Text>
          {sections.map((section) => (
            <Button
              key={section.id}
              title={section.className + ' – ' + section.name}
              variant={selected?.id === section.id ? 'solid' : 'outline'}
              disabled={busy}
              onPress={() => setSelected(section)}
            />
          ))}
          <Button
            title="Selected section only"
            variant={audience === 'SECTION' ? 'solid' : 'outline'}
            disabled={busy}
            onPress={() => setAudience('SECTION')}
          />
          <Button
            title="Entire selected class"
            variant={audience === 'CLASS' ? 'solid' : 'outline'}
            disabled={busy}
            onPress={() => setAudience('CLASS')}
          />
          <Input label="Title" value={title} onChangeText={setTitle} maxLength={250} editable={!busy} />
          <Input
            label="Message"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={20000}
            editable={!busy}
          />
          <Button
            title="Send announcement"
            loading={busy}
            disabled={!selected || !title.trim() || !content.trim()}
            onPress={() => void send()}
          />
          {message ? (
            <>
              <Text accessibilityRole="alert" style={{ color: colors.text }}>
                {message}
              </Text>
              <Button
                title="Reload announcements"
                disabled={busy}
                onPress={() => setRevision((value) => value + 1)}
              />
            </>
          ) : null}
        </View>
      </Card>
      <Card title="Your sent announcements">
        <View style={{ gap: 12 }}>
          {sent.map((item) => (
            <View key={item.id}>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>{item.title}</Text>
              <Text style={{ color: colors.text }}>{item.content}</Text>
              <Text style={{ color: colors.textMuted }}>
                {item.targetType} · {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          ))}
          {!sent.length ? <Text style={{ color: colors.text }}>No sent announcements.</Text> : null}
          <Text style={{ color: colors.text }}>Page {page}</Text>
          <Button title="Previous sent" disabled={busy || page === 1} onPress={() => setPage(page - 1)} />
          <Button title="Next sent" disabled={busy || !hasMore} onPress={() => setPage(page + 1)} />
        </View>
      </Card>
    </>
  );
}
