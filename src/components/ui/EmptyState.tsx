import { useThemeColors } from '@/context/ThemePreferencesContext';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
};

export function EmptyState({ icon, title, message, action, style }: EmptyStateProps) {
  const themeColors = useThemeColors();

  return (
    <View style={[styles.container, style]}>
      {icon ? <View style={[styles.iconWrap, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>{icon}</View> : null}
      <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: themeColors.textMuted }]}>{message}</Text> : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  title: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.md,
  },
});
