import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ label, variant = 'default', style, textStyle }: BadgeProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: themeColors.successBg,
          text: themeColors.success,
        };
      case 'warning':
        return {
          bg: themeColors.warningBg,
          text: themeColors.warning,
        };
      case 'error':
        return {
          bg: themeColors.errorBg,
          text: themeColors.error,
        };
      case 'info':
        return {
          bg: themeColors.infoBg,
          text: themeColors.info,
        };
      case 'default':
      default:
        return {
          bg: themeColors.border,
          text: themeColors.text,
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[styles.container, { backgroundColor: vStyles.bg, borderColor: vStyles.text }, style]}>
      <Text style={[styles.text, { color: vStyles.text }, textStyle]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
  }
});
