import { useThemeColors, useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { GlassCard } from './GlassCard';

type StatCardProps = {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  style?: ViewStyle;
  valueStyle?: TextStyle;
  labelNumberOfLines?: number;
  labelStyle?: TextStyle;
};

export function StatCard({ label, value, tone = 'default', icon, style, valueStyle, labelNumberOfLines = 1, labelStyle }: StatCardProps) {
  const themeColors = useThemeColors();

  const { isGlass, isSimple } = useThemePreferences();
  const isDark = useColorScheme() === 'dark';

  const toneBg =
    tone === 'success'
      ? themeColors.successBg
      : tone === 'warning'
        ? themeColors.warningBg
        : tone === 'error'
          ? themeColors.errorBg
          : tone === 'info' ? themeColors.infoBg : themeColors.accentMuted;

  if (isSimple) {
    return (
      <View style={[
        styles.card,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderRadius: Radius.lg },
        style
      ]}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: themeColors.textMuted }, labelStyle]} numberOfLines={labelNumberOfLines}>
            {label}
          </Text>
          {icon ? (
            <View style={[styles.icon, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              {React.cloneElement(icon as React.ReactElement, { color: themeColors.textMuted } as any)}
            </View>
          ) : null}
        </View>
        <Text style={[styles.value, { color: themeColors.text }, valueStyle]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    );
  }

  const content = (
    <View style={[
      styles.card, 
      !isGlass && { backgroundColor: toneBg, borderColor: themeColors.border },
      isGlass && { borderWidth: 0 },
      style
    ]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: themeColors.textMuted }, labelStyle]} numberOfLines={labelNumberOfLines}>
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
      <Text style={[styles.value, { color: themeColors.text }, valueStyle]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
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
    letterSpacing: 0,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  value: {
    fontFamily: Typography.fontFamilyDisplay,
    fontSize: 30,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
});
