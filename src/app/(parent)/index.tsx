import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ParentChildSwitcher } from '@/components/parent/ParentChildSwitcher';
import { useParentPortalData } from '@/hooks/useParentPortalData';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';

type HomeData = {
  summary: { attendanceRate: number | null; academicAverage: number | null; outstandingFees: number; classesToday: number };
  todayClasses: { id: number; start: string; end: string; subject: string | null; teacher: string | null }[];
  recentResults: { id: number; title: string; subject: string; obtained: number; total: number }[];
  diary: { id: number; date: string; subject: string | null; content: string }[];
  upcomingTests: { id: number; title: string; subject: string; date: string }[];
  announcements: { id: number; title: string; content: string }[];
};

export default function ParentHomeScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { data, loading, refreshing, error, reload } = useParentPortalData<HomeData>('home');
  return (
    <ScreenShell
      title="Home"
      subtitle="A clear view of the student's day."
      eyebrow="Parent portal"
      icon={<Ionicons name="home-outline" size={22} color="#FFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
    >
      <ParentChildSwitcher />
      {loading ? <SkeletonList rows={4} /> : error ? <ErrorCard message={error} /> : data ? (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryLead}>
              <Text style={[styles.kicker, { color: colors.textMuted }]}>THIS MONTH</Text>
              <Text style={[styles.summaryTitle, { color: colors.text }]}>Progress at a glance</Text>
              <Text style={[styles.summaryHint, { color: colors.textMuted }]}>Attendance, results and the daily schedule in one place.</Text>
            </View>
            <View style={styles.metrics}>
              <Metric label="Attendance" value={percent(data.summary.attendanceRate)} icon="calendar-clear-outline" tone="success" />
              <Metric label="Average" value={percent(data.summary.academicAverage)} icon="trending-up-outline" tone="accent" />
              <Metric label="Classes" value={String(data.summary.classesToday)} icon="time-outline" tone="accent" />
              <Metric label="Fees due" value={compactMoney(data.summary.outstandingFees)} icon="wallet-outline" tone={data.summary.outstandingFees > 0 ? 'warning' : 'success'} />
            </View>
          </View>

          <View style={styles.quickRow}>
            <QuickAction icon="bar-chart-outline" label="Results" onPress={() => router.push('/(parent)/results' as never)} />
            <QuickAction icon="calendar-outline" label="Attendance" onPress={() => router.push('/(parent)/attendance' as never)} />
            <QuickAction icon="wallet-outline" label="Fees" onPress={() => router.push('/(parent)/fees' as never)} />
            <QuickAction icon="chatbubble-ellipses-outline" label="School" onPress={() => router.push('/(parent)/requests' as never)} />
          </View>

          <Section title="Today" subtitle="Classes and upcoming assessments" action={() => router.push('/(parent)/timetable' as never)}>
            {data.todayClasses.length ? data.todayClasses.slice(0, 3).map((item) => (
              <TimelineRow key={item.id} badge={item.start.slice(0, 5)} title={item.subject || 'Class period'} meta={item.teacher || 'Teacher not assigned'} />
            )) : <Empty icon="sunny-outline" text="No classes scheduled today." />}
            {data.upcomingTests.slice(0, 2).map((item) => (
              <TimelineRow key={`test-${item.id}`} badge={shortDate(item.date)} title={item.title} meta={`${item.subject} · Upcoming test`} accent />
            ))}
          </Section>

          <Section title="Latest performance" subtitle="Recently published results" action={() => router.push('/(parent)/results' as never)}>
            {data.recentResults.length ? data.recentResults.slice(0, 4).map((item) => (
              <ResultRow key={item.id} title={item.title} subject={item.subject} obtained={item.obtained} total={item.total} />
            )) : <Empty icon="bar-chart-outline" text="No published results yet." />}
          </Section>

          <Section title="School updates" subtitle="Diary notes and notices" action={() => router.push('/(parent)/notices' as never)}>
            {data.diary.slice(0, 2).map((item) => <UpdateRow key={`diary-${item.id}`} icon="book-outline" title={item.subject || 'Class diary'} text={item.content} />)}
            {data.announcements.slice(0, 2).map((item) => <UpdateRow key={`notice-${item.id}`} icon="megaphone-outline" title={item.title} text={item.content} />)}
            {!data.diary.length && !data.announcements.length ? <Empty icon="notifications-outline" text="No recent updates." /> : null}
          </Section>
        </>
      ) : null}
    </ScreenShell>
  );
}

function Metric({ label, value, icon, tone }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; tone: 'accent' | 'success' | 'warning' }) {
  const colors = useThemeColors();
  const color = tone === 'success' ? colors.success : tone === 'warning' ? colors.warning : colors.accent;
  const background = tone === 'success' ? colors.successBg : tone === 'warning' ? colors.warningBg : colors.primaryBg;
  return <View style={[styles.metric, { borderColor: colors.border, backgroundColor: colors.surface }]}><View style={[styles.metricIcon, { backgroundColor: background }]}><Ionicons name={icon} size={17} color={color} /></View><Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text><Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text></View>;
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return <TouchableOpacity activeOpacity={0.72} onPress={onPress} style={styles.quick}><View style={[styles.quickIcon, { backgroundColor: colors.primaryBg }]}><Ionicons name={icon} size={20} color={colors.accent} /></View><Text style={[styles.quickText, { color: colors.text }]}>{label}</Text></TouchableOpacity>;
}

function Section({ title, subtitle, action, children }: { title: string; subtitle: string; action: () => void; children: React.ReactNode }) {
  const colors = useThemeColors();
  return <Card noPadding style={styles.section}><View style={[styles.sectionHead, { borderBottomColor: colors.border }]}><View style={styles.sectionCopy}><Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text></View><TouchableOpacity onPress={action} hitSlop={8}><Ionicons name="arrow-forward-circle-outline" size={24} color={colors.accent} /></TouchableOpacity></View>{children}</Card>;
}

function TimelineRow({ badge, title, meta, accent = false }: { badge: string; title: string; meta: string; accent?: boolean }) {
  const colors = useThemeColors();
  return <View style={[styles.row, { borderBottomColor: colors.border }]}><View style={[styles.timeBadge, { backgroundColor: accent ? colors.warningBg : colors.primaryBg }]}><Text style={[styles.timeText, { color: accent ? colors.warning : colors.accent }]}>{badge}</Text></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text><Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>{meta}</Text></View></View>;
}

function ResultRow({ title, subject, obtained, total }: { title: string; subject: string; obtained: number; total: number }) {
  const colors = useThemeColors();
  const score = total > 0 ? Math.round(obtained / total * 100) : 0;
  const scoreColor = score >= 80 ? colors.success : score >= 50 ? colors.accent : colors.warning;
  return <View style={[styles.row, { borderBottomColor: colors.border }]}><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text><Text style={[styles.rowMeta, { color: colors.textMuted }]}>{subject} · {obtained}/{total}</Text></View><Text style={[styles.score, { color: scoreColor }]}>{score}%</Text></View>;
}

function UpdateRow({ icon, title, text }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }) {
  const colors = useThemeColors();
  return <View style={[styles.row, { borderBottomColor: colors.border }]}><View style={[styles.updateIcon, { backgroundColor: colors.primaryBg }]}><Ionicons name={icon} size={17} color={colors.accent} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={2}>{text}</Text></View></View>;
}

function Empty({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) { const colors = useThemeColors(); return <View style={styles.empty}><Ionicons name={icon} size={22} color={colors.textMuted} /><Text style={[styles.emptyText, { color: colors.textMuted }]}>{text}</Text></View>; }
function ErrorCard({ message }: { message: string }) { const colors = useThemeColors(); return <Card><Text style={{ color: colors.error, fontFamily: Typography.fontFamilyMedium }}>{message}</Text></Card>; }
function percent(value: number | null) { return value === null ? '—' : `${value}%`; }
function compactMoney(value: number) { return value >= 100000 ? `PKR ${(value / 1000).toFixed(0)}k` : `PKR ${value.toLocaleString()}`; }
function shortDate(value: string) { return new Date(`${value}T00:00:00`).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' }); }

const styles = StyleSheet.create({
  summaryCard: { gap: Spacing.md, marginTop: Spacing.xs },
  summaryLead: { paddingHorizontal: 2 },
  kicker: { fontFamily: Typography.fontFamilyBold, fontSize: 10, letterSpacing: 1 },
  summaryTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.lg, marginTop: 4 },
  summaryHint: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, lineHeight: 18, marginTop: 3 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metric: { width: '48.5%', minHeight: 104, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.ms },
  metricIcon: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.lg, marginTop: Spacing.sm },
  metricLabel: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.xs, marginTop: 2 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  quick: { width: '23%', alignItems: 'center', gap: 6 },
  quickIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  quickText: { fontFamily: Typography.fontFamilySemiBold, fontSize: 11 },
  section: { marginTop: Spacing.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: Spacing.ms, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionCopy: { flex: 1 },
  sectionTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md },
  sectionSubtitle: { fontFamily: Typography.fontFamily, fontSize: 11, marginTop: 2 },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: Spacing.ms, paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  rowMeta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, lineHeight: 17, marginTop: 3 },
  timeBadge: { width: 62, minHeight: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  timeText: { fontFamily: Typography.fontFamilyBold, fontSize: 11 },
  score: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md },
  updateIcon: { width: 34, height: 34, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  empty: { minHeight: 86, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.md },
  emptyText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.xs, textAlign: 'center' },
});
