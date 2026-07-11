/**
 * Liquid Glass design tokens & helpers.
 * Used exclusively by the 4 glass-scoped screens:
 *   login, (student)/index, (staff)/index, settings
 */

import { Animated, ViewStyle } from 'react-native';

// ── Radius ─────────────────────────────────────────────
export const GLASS_CARD_RADIUS = 20;
export const GLASS_NAV_RADIUS = 24;

// ── Shadow — colored, barely-there, matches gradient ───
// Apple ref: almost no shadow, or very soft colored glow
export function glassShadow(isDark: boolean): ViewStyle {
  return {
    shadowColor: isDark ? 'rgba(80, 120, 255, 0.25)' : 'rgba(100, 120, 230, 0.18)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1, // opacity baked into color
    shadowRadius: 16,
    elevation: 0, // removed to fix android grey halo
  };
}

// ── Card outer shell (NO backgroundColor — BlurView provides it) ──
export function glassCardOuter(isDark: boolean): ViewStyle {
  return {
    borderRadius: GLASS_CARD_RADIUS,
    overflow: 'hidden',
    ...glassShadow(isDark),
  };
}

// ── Top-bright border — brighter on top edge, catches light ──
// RN doesn't support per-edge border color, so we use uniform
// and overlay a top highlight gradient
export function glassBorderColor(isDark: boolean): string {
  return isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)';
}
export const GLASS_BORDER_WIDTH = 1;

// ── Inner tint — very low opacity over BlurView ────────
// This gives the glass a slight white/dark tint
export function glassInnerTint(isDark: boolean): ViewStyle {
  return {
    backgroundColor: isDark
      ? 'rgba(20, 20, 20, 0.35)'
      : 'rgba(255, 255, 255, 0.20)',
  };
}

/** Slightly more opaque variant for input containers */
export function glassInputStyle(isDark: boolean): ViewStyle {
  return {
    backgroundColor: isDark
      ? 'rgba(30,30,30,0.20)'
      : 'rgba(255,255,255,0.15)',
    borderWidth: GLASS_BORDER_WIDTH,
    borderColor: 'rgba(255,255,255,0.30)',
    borderRadius: 14,
  };
}

// ── Specular highlight gradient config ─────────────────
// Top-left white gradient overlay — catches light like Apple ref
// Brighter version: 12% → 4% → 0%
export const SPECULAR_COLORS: [string, string, string] = [
  'rgba(255,255,255,0.12)',
  'rgba(255,255,255,0.04)',
  'rgba(255,255,255,0)',
];

export const SPECULAR_LOCATIONS: [number, number, number] = [0, 0.35, 1];

export const SPECULAR_START = { x: 0, y: 0 };
export const SPECULAR_END = { x: 1, y: 1 };

export const SPECULAR_OVERLAY_STYLE: ViewStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderRadius: GLASS_CARD_RADIUS,
};

// ── Top-edge highlight gradient ────────────────────────
// Brighter strip across top edge simulating specular rim
export const TOP_HIGHLIGHT_COLORS: [string, string, string] = [
  'rgba(255,255,255,0.45)',
  'rgba(255,255,255,0.08)',
  'rgba(255,255,255,0)',
];
export const TOP_HIGHLIGHT_LOCATIONS: [number, number, number] = [0, 0.06, 1];

// ── Screen background gradients ────────────────────────
// Colorful bg behind glass layers; without this glass is invisible

export const LOGIN_BG_COLORS_LIGHT: [string, string, string] = ['#667eea', '#764ba2', '#f093fb'];
export const LOGIN_BG_COLORS_DARK: [string, string, string] = ['#0f0c29', '#302b63', '#24243e'];

export const DASHBOARD_BG_COLORS_LIGHT: [string, string, string] = ['#a1c4fd', '#c2e9fb', '#e0c3fc'];
export const DASHBOARD_BG_COLORS_DARK: [string, string, string] = ['#0d1117', '#161b22', '#1a1e2e'];

export const SETTINGS_BG_COLORS_LIGHT: [string, string, string] = ['#ffecd2', '#fcb69f', '#a1c4fd'];
export const SETTINGS_BG_COLORS_DARK: [string, string, string] = ['#0d1117', '#1a1a2e', '#16213e'];

// ── Press animation ────────────────────────────────────
export function glassPressIn(animValue: Animated.Value) {
  Animated.spring(animValue, {
    toValue: 0.97,
    useNativeDriver: true,
    speed: 50,
    bounciness: 4,
  }).start();
}

export function glassPressOut(animValue: Animated.Value) {
  Animated.spring(animValue, {
    toValue: 1,
    useNativeDriver: true,
    speed: 30,
    bounciness: 6,
  }).start();
}
