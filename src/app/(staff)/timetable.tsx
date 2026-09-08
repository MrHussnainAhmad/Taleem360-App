import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Spacing, Typography } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';

type Entry = { dayOfWeek: number; startTime: string; endTime: string; subjectName: string | null; className: string | null; sectionName: string | null };
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export default function StaffTimetableScreen() {
  const colors = useThemeColors();
  const [entries, setEntries] = useState<Entry[]>([]), [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { setError(''); const data = await apiClient('/api/staff/timetable'); setEntries(data.timetable || []); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not load timetable.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const groups = useMemo(() => DAYS.map((name, day) => ({ name, entries: entries.filter((entry) => entry.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime)) })).filter((group) => group.entries.length), [entries]);
  return <ScreenShell title="Teaching Timetable" subtitle="Your weekly classes and subjects." eyebrow="Schedule" icon={<Ionicons name="calendar-outline" size={22} color="#FFF" />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    {loading && !refreshing ? <SkeletonList rows={5} /> : error ? <Card><Text style={{ color: colors.error }}>{error}</Text></Card> : groups.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textMuted }]}>You have no assigned timetable yet.</Text></Card> : groups.map((group) => <Card title={group.name} key={group.name}>{group.entries.map((entry, index) => <View key={`${entry.dayOfWeek}-${entry.startTime}-${index}`} style={[styles.row, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}><View style={styles.time}><Text style={[styles.timeText, { color: colors.text }]}>{entry.startTime.slice(0, 5)}</Text><Text style={[styles.end, { color: colors.textMuted }]}>{entry.endTime.slice(0, 5)}</Text></View><View style={{ flex: 1 }}><Text style={[styles.subject, { color: colors.text }]}>{entry.subjectName || 'Class period'}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>{[entry.className, entry.sectionName].filter(Boolean).join(' · ') || 'Class not assigned'}</Text></View></View>)}</Card>)}
  </ScreenShell>;
}
const styles = StyleSheet.create({ empty: { textAlign: 'center', paddingVertical: Spacing.lg, fontFamily: Typography.fontFamily }, row: { flexDirection: 'row', gap: Spacing.md, paddingVertical: Spacing.md }, time: { width: 58 }, timeText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm }, end: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 }, subject: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md }, meta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, marginTop: 3 } });
