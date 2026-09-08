import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Spacing, Typography } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';

type Exam = { id: number; title: string; type: string; date: string; endDate: string | null; maxMarks: number; className: string; subjectName: string | null };
export default function StaffExamsScreen() {
  const colors = useThemeColors(); const [exams, setExams] = useState<Exam[]>([]), [loading, setLoading] = useState(true), [refreshing, setRefreshing] = useState(false), [error, setError] = useState('');
  const load = useCallback(async () => { try { setError(''); const data = await apiClient('/api/staff/exams'); setExams(data.exams || []); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not load exam timetable.'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <ScreenShell title="Exam Timetable" subtitle="Institution exams for your assigned classes." eyebrow="Assessment" icon={<Ionicons name="calendar-number-outline" size={22} color="#FFF" />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
    {loading && !refreshing ? <SkeletonList rows={4} /> : error ? <Card><Text style={{ color: colors.error }}>{error}</Text></Card> : exams.length === 0 ? <Card><Text style={[styles.empty, { color: colors.textMuted }]}>No active institution exams for your classes.</Text></Card> : exams.map((exam) => <Card key={exam.id}><View style={styles.head}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>{exam.title}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>{exam.className} · {exam.subjectName || 'General'}</Text></View><Text style={[styles.type, { color: colors.accent }]}>{exam.type}</Text></View><Text style={[styles.date, { color: colors.text }]}>{exam.date}{exam.endDate && exam.endDate !== exam.date ? ` – ${exam.endDate}` : ''}</Text><Text style={[styles.meta, { color: colors.textMuted }]}>Maximum marks: {exam.maxMarks}</Text></Card>)}
  </ScreenShell>;
}
const styles = StyleSheet.create({ empty: { textAlign: 'center', paddingVertical: Spacing.lg, fontFamily: Typography.fontFamily }, head: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }, title: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.lg }, meta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, marginTop: 4 }, type: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xs }, date: { fontFamily: Typography.fontFamilySemiBold, marginTop: Spacing.md } });
