import React from 'react';
import { StyleSheet, Text, useColorScheme, View, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function StatCard({ label, value, tone = 'default', icon, style }: StatCardProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const toneColor =
    tone === 'success'
      ? themeColors.success
      : tone === 'warning'
        ? themeColors.warning
        : tone === 'error'
          ? themeColors.error
          : tone === 'info'
            ? themeColors.info
            : themeColors.accent;

  const toneBg =
    tone === 'success'
      ? themeColors.successBg
      : tone === 'warning'
        ? themeColors.warningBg
        : tone === 'error'
          ? themeColors.errorBg
          : themeColors.accentMuted;

  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, style]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: themeColors.textMuted }]} numberOfLines={1}>
          {label}
        </Text>
        {icon ? <View style={[styles.icon, { backgroundColor: toneBg, borderColor: themeColors.border }]}>{icon}</View> : null}
      </View>
      <Text style={[styles.value, { color: toneColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 104,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    flex: 1,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  value: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 30,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
});
