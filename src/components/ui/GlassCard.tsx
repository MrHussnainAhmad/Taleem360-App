/** Lightweight translucent surface. Real blur is opt-in for a single header. */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
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
  /** Blur intensity, default 25; used only when blur is enabled */
  intensity?: number;
  blur?: boolean;
  /** Show specular highlight overlay, default false */
  specular?: boolean;
  /** Show top-edge bright highlight, default false */
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
  blur = false,
  specular = false,
  topHighlight = false,
  padding = 16,
  contentStyle,
}: GlassCardProps) {
  const isDark = useColorScheme() === 'dark';
  const { glassIntensity } = useThemePreferences();

  // Multiply requested intensity by the user's global slider multiplier, capping at 100 (max blur)
  const baseIntensity = intensity;
  const finalIntensity = Math.min(100, Math.max(1, Math.round(baseIntensity * glassIntensity)));

  return (
    <View style={[glassCardOuter(isDark), { borderRadius: GLASS_CARD_RADIUS, shadowOpacity: 0, backgroundColor: blur ? 'transparent' : isDark ? 'rgba(28,35,38,0.94)' : 'rgba(255,255,255,0.94)' }, style]}>
      {/* 1) The frost layer */}
      {blur && <BlurView
        pointerEvents="none"
        intensity={isDark ? Math.round(finalIntensity * 0.7) : finalIntensity}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />}

      {/* Thin tint over blur — keeps glass slightly colored */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, glassInnerTint(isDark)]} />

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
