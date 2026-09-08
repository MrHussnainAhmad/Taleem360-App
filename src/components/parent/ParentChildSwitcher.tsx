import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ParentPeriod, useParentPortal } from '@/context/ParentPortalContext';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { SkeletonBlock } from '@/components/ui/Skeleton';

export function ParentChildSwitcher() {
  const { children, selectedChild, selectedStudentId, setSelectedStudentId, loading, error, refreshChildren } = useParentPortal();
  const colors = useThemeColors();

  if (loading) return <View style={styles.loading}><SkeletonBlock width={42} height={42} radius={Radius.full} /><View style={styles.loadingCopy}><SkeletonBlock width="34%" height={10} /><SkeletonBlock width="66%" height={16} /><SkeletonBlock width="28%" height={11} /></View></View>;
  if (error) return <StateRow icon="alert-circle-outline" label={error} error onPress={() => void refreshChildren()} />;
  if (!selectedChild) return <StateRow icon="people-outline" label="No student linked to this account" />;

  if (children.length === 1) {
    return (
      <View style={styles.group}>
      <View style={[styles.single, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}> 
        <Avatar name={selectedChild.name} />
        <View style={styles.studentCopy}>
          <Text style={[styles.overline, { color: colors.textMuted }]}>VIEWING STUDENT</Text>
          <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>{selectedChild.name}</Text>
          <Text style={[styles.studentMeta, { color: colors.textMuted }]}>{formatClass(selectedChild.className, selectedChild.sectionName)}</Text>
        </View>
        <View style={[styles.linkedBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          <Text style={[styles.linkedText, { color: colors.textMuted }]}>Linked</Text>
        </View>
      </View>
      <ParentPeriodSelector />
      </View>
    );
  }

  return (
    <View style={styles.group}>
      <Text style={[styles.switchLabel, { color: colors.textMuted }]}>CHOOSE STUDENT</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {children.map((child) => {
          const selected = child.id === selectedStudentId;
          return (
            <TouchableOpacity
              key={child.id}
              activeOpacity={0.78}
              onPress={() => setSelectedStudentId(child.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? colors.primaryBg : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                },
              ]}
            >
              <Avatar name={child.name} small />
              <View style={styles.chipCopy}>
                <Text style={[styles.chipName, { color: colors.text }]} numberOfLines={1}>{child.name}</Text>
                <Text style={[styles.chipMeta, { color: colors.textMuted }]}>{formatClass(child.className, child.sectionName)}</Text>
              </View>
              {selected ? <Ionicons name="checkmark-circle" size={17} color={colors.accent} /> : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ParentPeriodSelector />
    </View>
  );
}

function ParentPeriodSelector() {
  const { period, periodAnchor, setPeriod, shiftPeriod } = useParentPortal();
  const colors = useThemeColors();
  const periods: ParentPeriod[] = ['DAILY', 'WEEKLY', 'MONTHLY'];
  return (
    <View style={styles.periodGroup}>
      <View style={[styles.periods, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        {periods.map((item) => {
          const active = item === period;
          return <TouchableOpacity key={item} activeOpacity={0.8} onPress={() => setPeriod(item)} style={[styles.period, active && { backgroundColor: colors.accent }]}> 
            <Text style={[styles.periodText, { color: active ? '#FFF' : colors.textMuted }]}>{item[0] + item.slice(1).toLowerCase()}</Text>
          </TouchableOpacity>;
        })}
      </View>
      <View style={styles.periodNavigation}>
        <TouchableOpacity accessibilityLabel="Previous period" onPress={() => shiftPeriod(-1)} style={[styles.arrow, { borderColor: colors.border }]}><Ionicons name="chevron-back" size={16} color={colors.text} /></TouchableOpacity>
        <Text style={[styles.anchor, { color: colors.textMuted }]}>{periodAnchor}</Text>
        <TouchableOpacity accessibilityLabel="Next period" onPress={() => shiftPeriod(1)} style={[styles.arrow, { borderColor: colors.border }]}><Ionicons name="chevron-forward" size={16} color={colors.text} /></TouchableOpacity>
      </View>
    </View>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.avatar, small && styles.avatarSmall, { backgroundColor: colors.accent }]}>
      <Text style={[styles.initial, small && styles.initialSmall]}>{name.trim().charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function StateRow({ icon, label, error = false, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; error?: boolean; onPress?: () => void }) {
  const colors = useThemeColors();
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.78} style={[styles.state, { backgroundColor: error ? colors.errorBg : colors.primaryBg, borderColor: error ? colors.error : colors.border }]}>
      <Ionicons name={icon} size={19} color={error ? colors.error : colors.accent} />
      <Text style={[styles.stateText, { color: error ? colors.error : colors.text }]} numberOfLines={2}>{label}</Text>
      {onPress ? <Text style={[styles.retry, { color: colors.accent }]}>Retry</Text> : null}
    </Wrapper>
  );
}

function formatClass(className: string, sectionName: string) {
  return sectionName && sectionName !== 'Whole Class' ? `${className} · ${sectionName}` : className;
}

const styles = StyleSheet.create({
  single: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: Spacing.ms, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.ms, paddingVertical: 10 },
  studentCopy: { flex: 1, minWidth: 0 },
  overline: { fontFamily: Typography.fontFamilyBold, fontSize: 9, letterSpacing: 0.9 },
  studentName: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md, marginTop: 2 },
  studentMeta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 },
  linkedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 5 },
  linkedText: { fontFamily: Typography.fontFamilySemiBold, fontSize: 10 },
  avatar: { width: 42, height: 42, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  avatarSmall: { width: 34, height: 34 },
  initial: { color: '#FFF', fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.base },
  initialSmall: { fontSize: Typography.size.sm },
  group: { gap: Spacing.sm },
  switchLabel: { fontFamily: Typography.fontFamilyBold, fontSize: 10, letterSpacing: 0.9, marginLeft: 2 },
  row: { gap: Spacing.sm, paddingRight: Spacing.md },
  chip: { width: 190, minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm },
  chipCopy: { flex: 1, minWidth: 0 },
  chipName: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  chipMeta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 },
  state: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md },
  stateText: { flex: 1, fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
  retry: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xs },
  loading: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: Spacing.ms, borderRadius: Radius.lg, paddingHorizontal: Spacing.ms },
  loadingCopy: { flex: 1, gap: 6 },
  periods: { flexDirection: 'row', alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.full, padding: 3, gap: 2 },
  periodGroup: { alignItems: 'flex-start', gap: 6 },
  periodNavigation: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrow: { width: 30, height: 30, borderWidth: 1, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  anchor: { minWidth: 82, textAlign: 'center', fontFamily: Typography.fontFamilySemiBold, fontSize: 10 },
  period: { minWidth: 76, alignItems: 'center', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 7 },
  periodText: { fontFamily: Typography.fontFamilyBold, fontSize: 10, letterSpacing: 0.2 },
});
