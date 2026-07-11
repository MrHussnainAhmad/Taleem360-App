/**
 * GlassCard — translucent card with real blur, specular highlight,
 * top-bright border, and colored soft shadow.
 *
 * Uses expo-blur BlurView for actual frosted glass effect.
 * Background bleeds through at ~10-15% opacity tint.
 *
 * Only used by the 4 glass-scoped screens.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemePreferences } from '@/context/ThemePreferencesContext';
import {
  glassCardOuter,
  glassInnerTint,
  glassBorderColor,
  GLASS_BORDER_WIDTH,
  GLASS_CARD_RADIUS,
  SPECULAR_COLORS,
  SPECULAR_LOCATIONS,
  SPECULAR_START,
  SPECULAR_END,
  TOP_HIGHLIGHT_COLORS,
  TOP_HIGHLIGHT_LOCATIONS,
} from '@/constants/glassStyles';

type GlassCardProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Blur intensity, default 40 (iOS), Android auto-adjusts */
  intensity?: number;
  /** Show specular highlight overlay, default true */
  specular?: boolean;
  /** Show top-edge bright highlight, default true */
  topHighlight?: boolean;
  /** Inner padding, default 16 */
  padding?: number;
  /** Style for the inner content wrapper view */
  contentStyle?: StyleProp<ViewStyle>;
};

export function GlassCard({
  children,
  style,
  intensity = 25,
  specular = true,
  topHighlight = true,
  padding = 16,
  contentStyle,
}: GlassCardProps) {
  const isDark = useColorScheme() === 'dark';
  const { glassIntensity } = useThemePreferences();

  // Multiply requested intensity by the user's global slider multiplier, capping at 100 (max blur)
  const baseIntensity = intensity;
  const finalIntensity = Math.min(100, Math.max(1, Math.round(baseIntensity * glassIntensity)));

  return (
    <View style={[glassCardOuter(isDark), { borderRadius: GLASS_CARD_RADIUS }, style]}>
      {/* 1) The frost layer */}
      <BlurView
        pointerEvents="none"
        intensity={isDark ? Math.round(finalIntensity * 0.7) : finalIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Thin tint over blur — keeps glass slightly colored */}
      <View style={[StyleSheet.absoluteFill, glassInnerTint(isDark)]} />

      {/* Border overlay — uniform rgba(255,255,255,0.4) */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: GLASS_CARD_RADIUS,
            borderWidth: GLASS_BORDER_WIDTH,
            borderColor: glassBorderColor(isDark),
          },
        ]}
        pointerEvents="none"
      />

      {/* Top-edge bright highlight — catches light like Apple ref */}
      {topHighlight && (
        <LinearGradient
          colors={TOP_HIGHLIGHT_COLORS}
          locations={TOP_HIGHLIGHT_LOCATIONS}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: GLASS_CARD_RADIUS }]}
          pointerEvents="none"
        />
      )}

      {/* Specular highlight — top-left diagonal shine */}
      {specular && (
        <LinearGradient
          colors={SPECULAR_COLORS}
          locations={SPECULAR_LOCATIONS}
          start={SPECULAR_START}
          end={SPECULAR_END}
          style={[StyleSheet.absoluteFill, { borderRadius: GLASS_CARD_RADIUS }]}
          pointerEvents="none"
        />
      )}

      {/* Content */}
      <View style={[{ padding, position: 'relative', zIndex: 1 }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}
