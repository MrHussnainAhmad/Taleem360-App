import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React from 'react';
import { View, StyleSheet, ViewStyle, Text, TextStyle, StyleProp, useColorScheme } from 'react-native';
import { Radius, Spacing, Shadows, Typography } from '@/constants/theme';
import { GlassCard } from './GlassCard';


interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
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
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isDark = useColorScheme() === 'dark';

  if (isSimple) {
    return (
      <View style={[
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderWidth: 1,
          borderRadius: 12,
          marginBottom: Spacing.md,
          overflow: 'hidden',
        },
        style
      ]}>
        {(title || headerRight) && (
          <View style={[
            styles.header,
            { borderBottomColor: themeColors.border, borderBottomWidth: 1 }
          ]}>
            {title && (
              <Text style={[styles.title, { color: themeColors.text }, titleStyle]}>
                {title}
              </Text>
            )}
            {headerRight}
          </View>
        )}
        <View style={noPadding ? null : styles.content}>
          {children}
        </View>
        {footer && (
          <View style={[styles.footer, { borderTopColor: themeColors.border, borderTopWidth: 1 }]}>
            {footer}
          </View>
        )}
      </View>
    );
  }

  if (isGlass) {
    return (
      <GlassCard padding={0} style={[style, { marginBottom: Spacing.md }]}>
        {(title || headerRight) && (
          <View style={[
            styles.header,
            { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
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
            { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
          ]}>
            {footer}
          </View>
        )}
      </GlassCard>
    );
  }

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
