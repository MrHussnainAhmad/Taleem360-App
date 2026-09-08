import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { ParentChildSwitcher } from '@/components/parent/ParentChildSwitcher';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';

const primary = [
  ['Results', 'Marks and subject progress', 'bar-chart-outline', 'results'],
  ['Attendance', 'Monthly attendance record', 'calendar-outline', 'attendance'],
  ['Diary', 'Classwork and homework', 'book-outline', 'diary'],
  ['Courses', 'Lectures and completion', 'play-circle-outline', 'courses'],
] as const;
const schedule = [
  ['Class timetable', 'Weekly lessons and teachers', 'time-outline', 'timetable'],
  ['Upcoming tests', 'Assessment dates and subjects', 'clipboard-outline', 'timetable'],
] as const;

export default function ParentAcademics() {
  const colors = useThemeColors();
  const router = useRouter();
  return (
    <ScreenShell title="Academics" subtitle="Learning, progress and schedule." eyebrow="Parent portal" icon={<Ionicons name="school-outline" size={22} color="#FFF" />}>
      <ParentChildSwitcher />
      <View style={styles.headingWrap}>
        <Text style={[styles.heading, { color: colors.text }]}>Learning overview</Text>
        <Text style={[styles.subheading, { color: colors.textMuted }]}>Open a section to see the complete student record.</Text>
      </View>
      <View style={styles.grid}>
        {primary.map(([title, text, icon, route]) => (
          <TouchableOpacity key={title} activeOpacity={0.74} onPress={() => router.push(`/(parent)/${route}` as never)} style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.tileIcon, { backgroundColor: colors.primaryBg }]}><Ionicons name={icon} size={22} color={colors.accent} /></View>
            <Text style={[styles.tileTitle, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.tileText, { color: colors.textMuted }]}>{text}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.accent} style={styles.tileArrow} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SCHEDULE</Text>
      <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {schedule.map(([title, text, icon, route], index) => (
          <TouchableOpacity key={title} activeOpacity={0.74} onPress={() => router.push(`/(parent)/${route}` as never)} style={[styles.listRow, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.listIcon, { backgroundColor: colors.primaryBg }]}><Ionicons name={icon} size={19} color={colors.accent} /></View>
            <View style={styles.listCopy}><Text style={[styles.listTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.listText, { color: colors.textMuted }]}>{text}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headingWrap: { marginTop: Spacing.xs },
  heading: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.lg },
  subheading: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, lineHeight: 18, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  tile: { width: '48.5%', minHeight: 148, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.ms },
  tileIcon: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md, marginTop: Spacing.ms },
  tileText: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, lineHeight: 17, marginTop: 3, paddingRight: 12 },
  tileArrow: { position: 'absolute', right: Spacing.ms, bottom: Spacing.ms },
  sectionLabel: { fontFamily: Typography.fontFamilyBold, fontSize: 10, letterSpacing: 1, marginTop: Spacing.sm },
  list: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  listRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: Spacing.ms, paddingHorizontal: Spacing.ms },
  listIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  listCopy: { flex: 1 },
  listTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  listText: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 3 },
});
