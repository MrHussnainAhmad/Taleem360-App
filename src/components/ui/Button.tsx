import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export type ButtonVariant = 'solid' | 'outline' | 'ghost';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({ 
  onPress, 
  title, 
  variant = 'solid', 
  disabled = false, 
  loading = false,
  style,
  textStyle,
  icon
}: ButtonProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: disabled ? themeColors.borderHover : themeColors.accent,
          borderWidth: 1,
          borderColor: disabled ? themeColors.borderHover : themeColors.accent,
        };
      case 'outline':
        return {
          backgroundColor: themeColors.surface,
          borderWidth: 1,
          borderColor: disabled ? themeColors.border : themeColors.borderHover,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: 'transparent',
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'solid':
        return {
          color: disabled ? themeColors.textMuted : '#FFFFFF',
        };
      case 'outline':
      case 'ghost':
        return {
          color: disabled ? themeColors.textMuted : themeColors.text,
        };
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        getContainerStyle(),
        style,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={getTextStyle().color} style={styles.iconSpacing} />
      ) : icon ? (
        <React.Fragment>
          {icon}
        </React.Fragment>
      ) : null}
      
      <Text style={[
        styles.text,
        getTextStyle(),
        textStyle
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    minHeight: 44,
  },
  text: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  disabled: {
    opacity: 0.6,
  },
  iconSpacing: {
    marginRight: Spacing.sm,
  }
});
