import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useColorScheme, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';

type SkeletonBlockProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function SkeletonBlock({ width = '100%', height = 16, radius = Radius.sm, style }: SkeletonBlockProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = useThemeColors();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.block,
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: isDark ? themeColors.border : '#EEF0F3',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.statRow}>
        <SkeletonBlock height={104} style={styles.flex} radius={Radius.lg} />
        <SkeletonBlock height={104} style={styles.flex} radius={Radius.lg} />
      </View>
      <SkeletonBlock height={44} radius={Radius.md} />
      <SkeletonList rows={3} />
      <SkeletonBlock height={120} radius={Radius.lg} />
    </View>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.listRow}>
          <SkeletonBlock width={56} height={40} radius={Radius.sm} />
          <View style={styles.rowText}>
            <SkeletonBlock width="70%" height={14} />
            <SkeletonBlock width="46%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.cardBlock}>
          <View style={styles.cardHeader}>
            <SkeletonBlock width="44%" height={12} />
            <SkeletonBlock width={64} height={24} radius={Radius.full} />
          </View>
          <SkeletonBlock width="72%" height={18} />
          <SkeletonBlock width="54%" height={12} />
          <View style={styles.cardMetaRow}>
            <SkeletonBlock width="24%" height={12} />
            <SkeletonBlock width="24%" height={12} />
            <SkeletonBlock width="22%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function FormSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.chipRow}>
        <SkeletonBlock width={96} height={34} radius={Radius.full} />
        <SkeletonBlock width={118} height={34} radius={Radius.full} />
        <SkeletonBlock width={88} height={34} radius={Radius.full} />
      </View>
      <SkeletonBlock width="36%" height={12} />
      <SkeletonBlock height={48} radius={Radius.md} />
      <SkeletonBlock width="32%" height={12} />
      <SkeletonBlock height={86} radius={Radius.md} />
      <View style={styles.statRow}>
        <SkeletonBlock height={48} radius={Radius.md} style={styles.flex} />
        <SkeletonBlock height={48} radius={Radius.md} style={styles.flex} />
      </View>
      <SkeletonBlock height={44} radius={Radius.md} />
    </View>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <SkeletonBlock width="22%" height={12} />
        <SkeletonBlock width="34%" height={12} />
        <SkeletonBlock width="20%" height={12} />
      </View>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.tableRow}>
          <SkeletonBlock width="22%" height={14} />
          <SkeletonBlock width="34%" height={14} />
          <SkeletonBlock width="20%" height={24} radius={Radius.full} />
        </View>
      ))}
    </View>
  );
}

export function ScheduleSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.schedule}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.scheduleRow}>
          <View style={styles.scheduleTime}>
            <SkeletonBlock width={54} height={16} />
            <SkeletonBlock width={42} height={12} />
          </View>
          <View style={styles.timelineRail}>
            <SkeletonBlock width={12} height={12} radius={6} />
            {index < rows - 1 ? <SkeletonBlock width={2} height={54} radius={1} /> : null}
          </View>
          <View style={styles.scheduleBody}>
            <SkeletonBlock width="72%" height={16} />
            <SkeletonBlock width="46%" height={12} />
            <SkeletonBlock width="58%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function TestSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.stack}>
      <View style={styles.testHeader}>
        <SkeletonBlock width="56%" height={20} />
        <SkeletonBlock width="36%" height={12} />
        <SkeletonBlock height={40} radius={Radius.md} />
      </View>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.questionBlock}>
          <SkeletonBlock width="82%" height={16} />
          <SkeletonBlock width="64%" height={14} />
          <View style={styles.optionGrid}>
            <SkeletonBlock height={34} radius={Radius.md} style={styles.option} />
            <SkeletonBlock height={34} radius={Radius.md} style={styles.option} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.stack}>
      <View style={styles.profileHeader}>
        <SkeletonBlock width={82} height={82} radius={41} />
        <SkeletonBlock width="46%" height={18} />
        <SkeletonBlock width="32%" height={12} />
      </View>
      <SkeletonList rows={4} />
      <SkeletonBlock height={44} radius={Radius.md} />
      <SkeletonBlock height={44} radius={Radius.md} />
    </View>
  );
}

type SkeletonPageProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: 'dashboard' | 'profile' | 'list' | 'cards' | 'form' | 'table' | 'schedule' | 'test';
  rows?: number;
};

export function SkeletonPage({
  title,
  subtitle = 'Loading content.',
  eyebrow = 'Loading',
  iconName = 'hourglass-outline',
  variant = 'list',
  rows = 5,
}: SkeletonPageProps) {
  return (
    <ScreenShell
      title={title}
      subtitle={subtitle}
      eyebrow={eyebrow}
      icon={<Ionicons name={iconName} size={22} color="#FFFFFF" />}
    >
      {variant === 'dashboard' ? (
        <DashboardSkeleton />
      ) : variant === 'profile' ? (
        <ProfileSkeleton />
      ) : variant === 'cards' ? (
        <CardListSkeleton rows={rows} />
      ) : variant === 'form' ? (
        <FormSkeleton />
      ) : variant === 'table' ? (
        <SkeletonTable rows={rows} />
      ) : variant === 'schedule' ? (
        <ScheduleSkeleton rows={rows} />
      ) : variant === 'test' ? (
        <TestSkeleton rows={rows} />
      ) : (
        <SkeletonList rows={rows} />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: 'hidden',
  },
  stack: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  list: {
    gap: Spacing.md,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: Spacing.sm,
  },
  cardBlock: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    borderRadius: Radius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  table: {
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.26)',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.22)',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.16)',
  },
  schedule: {
    gap: Spacing.md,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  scheduleTime: {
    width: 64,
    gap: Spacing.xs,
    paddingTop: 2,
  },
  timelineRail: {
    width: 18,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  scheduleBody: {
    flex: 1,
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    borderRadius: Radius.lg,
  },
  testHeader: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  questionBlock: {
    gap: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    borderRadius: Radius.lg,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  option: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
});
