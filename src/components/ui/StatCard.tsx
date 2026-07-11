import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle, useColorScheme } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { GlassCard } from './GlassCard';

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function StatCard({ label, value, tone = 'default', icon, style }: StatCardProps) {
  const themeColors = useThemeColors();

  const { isGlass, isSimple } = useThemePreferences();
  const isDark = useColorScheme() === 'dark';

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

  if (isSimple) {
    return (
      <View style={[
        styles.card,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderRadius: 12 },
        style
      ]}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: themeColors.textMuted }]} numberOfLines={1}>
            {label}
          </Text>
          {icon ? (
            <View style={[styles.icon, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              {React.cloneElement(icon as React.ReactElement, { color: themeColors.textMuted } as any)}
            </View>
          ) : null}
        </View>
        <Text style={[styles.value, { color: themeColors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    );
  }

  const content = (
    <View style={[
      styles.card, 
      !isGlass && { backgroundColor: themeColors.surface, borderColor: themeColors.border }, 
      isGlass && { borderWidth: 0 },
      style
    ]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: themeColors.textMuted }]} numberOfLines={1}>
          {label}
        </Text>
        {icon ? (
          <View style={[
            styles.icon, 
            { backgroundColor: toneBg, borderColor: themeColors.border },
            isGlass && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
          ]}>
            {icon}
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: toneColor }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );

  if (isGlass) {
    return (
      <GlassCard 
        padding={0} 
        intensity={15} 
        specular={false} 
        style={[{ flex: 1 }, style?.marginBottom ? { marginBottom: style.marginBottom } : null]}
      >
        {content}
      </GlassCard>
    );
  }

  return content;
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
