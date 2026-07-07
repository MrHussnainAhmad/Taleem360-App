import React from 'react';
import { View, StyleSheet, ViewStyle, Text, TextStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadows, Typography } from '@/constants/theme';
import { useColorScheme } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  title?: string;
  titleStyle?: TextStyle;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export function Card({ 
  children, 
  style, 
  title, 
  titleStyle, 
  headerRight, 
  footer,
  noPadding = false 
}: CardProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[
      styles.card,
      {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
      },
      style
    ]}>
      {(title || headerRight) && (
        <View style={[
          styles.header,
          { borderBottomColor: themeColors.border }
        ]}>
          {title && (
            <Text style={[styles.title, { color: themeColors.text }, titleStyle]}>
              {title}
            </Text>
          )}
          {headerRight && <View>{headerRight}</View>}
        </View>
      )}
      
      <View style={[styles.content, noPadding && styles.noPadding]}>
        {children}
      </View>

      {footer && (
        <View style={[
          styles.footer,
          { borderTopColor: themeColors.border }
        ]}>
          {footer}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.base,
  },
  content: {
    padding: Spacing.lg,
  },
  noPadding: {
    padding: 0,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  }
});
