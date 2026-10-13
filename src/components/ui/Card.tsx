import { useThemeColors, useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
import React from 'react';
import { View, StyleSheet, ViewStyle, Text, TextStyle, StyleProp } from 'react-native';
import { Radius, Spacing, Shadows, Typography } from '@/constants/theme';
import { GlassCard } from './GlassCard';
import { usePortalVisuals } from '@/context/PortalVisualContext';


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
  const isPortalScreen = usePortalVisuals();
  const isDark = useColorScheme() === 'dark';

  if (isPortalScreen && title) {
    return (
      <View style={[{ marginTop: Spacing.sm }, style]}>
        <View style={[styles.header, { paddingHorizontal: 0, borderBottomColor: themeColors.border, borderBottomWidth: 1, paddingBottom: 14 }]}>
          <Text style={[styles.title, { color: themeColors.text, fontFamily: Typography.fontFamilyDisplay, fontSize: 20 }, titleStyle]}>{title}</Text>
          {headerRight}
        </View>
        <View style={noPadding ? undefined : { paddingVertical: Spacing.md }}>{children}</View>
        {footer ? <View style={{ paddingVertical: Spacing.md }}>{footer}</View> : null}
      </View>
    );
  }

  if (isSimple) {
    return (
      <View style={[
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderWidth: 1,
          borderRadius: Radius.lg,
          marginBottom: isPortalScreen ? 0 : Spacing.md,
          overflow: 'hidden',
        },
        style,
        isPortalScreen && { marginBottom: 0 },
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
      <GlassCard padding={0} style={[style, { marginBottom: isPortalScreen ? 0 : Spacing.md }]}>
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
        marginBottom: isPortalScreen ? 0 : Spacing.md,
      },
      style,
      isPortalScreen && { marginBottom: 0 },
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
    flexShrink: 1,
    fontFamily: Typography.fontFamilyDisplay,
    fontSize: 18,
  },
  content: {
    padding: Spacing.md,
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
