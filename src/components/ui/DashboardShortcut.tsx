import { useReducedMotion } from '@/hooks/use-reduced-motion';
import React, { useRef } from 'react';
import { Animated, StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { glassPressIn, glassPressOut } from '@/constants/glassStyles';

type Props = { isGlass: boolean; children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void };

export function DashboardShortcut({ isGlass, children, style, onPress }: Props) {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const colors = useThemeColors();
  const flattened = StyleSheet.flatten(style);
  return (
    <Animated.View style={[style, { padding: 0, backgroundColor: 'transparent', transform: [{ scale }] }]}>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.65}
        onPress={onPress}
        onPressIn={isGlass ? () => glassPressIn(scale, reducedMotion) : undefined}
        onPressOut={isGlass ? () => glassPressOut(scale, reducedMotion) : undefined}
        style={{ flex: 1, width: '100%', minHeight: flattened?.minHeight, padding: flattened?.padding, flexDirection: flattened?.flexDirection, alignItems: flattened?.alignItems, justifyContent: flattened?.justifyContent, gap: flattened?.gap, backgroundColor: isGlass ? colors.surface : 'transparent' }}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
