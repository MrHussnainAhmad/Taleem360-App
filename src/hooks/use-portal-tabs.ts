import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import { Typography } from '@/constants/theme';
import React from 'react';
import { Text } from 'react-native';
import { PlatformPressable } from '@react-navigation/elements';

export function usePortalTabs(): BottomTabNavigationOptions {
  const reducedMotion = useReducedMotion();
  const colors = useThemeColors();
  const { isGlass } = useThemePreferences();
  const insets = useSafeAreaInsets();
  return {
    headerShown: false,
    lazy: true,
    animation: reducedMotion ? 'none' : 'fade',
    transitionSpec: { animation: 'timing', config: { duration: 120 } },
    tabBarHideOnKeyboard: true,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarActiveBackgroundColor: 'transparent',
    tabBarStyle: {
      height: 66 + insets.bottom,
      paddingTop: 6,
      paddingBottom: 6 + insets.bottom,
      paddingHorizontal: 4,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: isGlass ? colors.background : colors.surface,
      elevation: 0,
    },
    tabBarItemStyle: { marginHorizontal: 2, borderRadius: 0 },
    tabBarButton: (props) => React.createElement(PlatformPressable, { ...props, style: [props.style, { paddingHorizontal: 0 }] }),
    tabBarLabelPosition: 'below-icon',
    tabBarLabel: ({ children, color, focused }) => React.createElement(Text, {
      style: { color, fontFamily: focused ? Typography.fontFamilyBold : Typography.fontFamilyMedium, fontSize: children.length > 10 ? 9 : 10, lineHeight: 12, textAlign: 'center', width: '100%', minHeight: 24, paddingTop: 2, borderBottomWidth: focused ? 2 : 0, borderBottomColor: colors.accent },
    }, children),
    tabBarLabelStyle: { fontFamily: Typography.fontFamilyMedium, fontSize: 10, marginTop: 2 },
    tabBarIconStyle: { marginTop: 2 },
  };
}
