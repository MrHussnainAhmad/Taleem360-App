import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/constants/theme';
import { useThemeColors, useThemePreferences, useResolvedColorScheme } from '@/context/ThemePreferencesContext';

type Props = { label: string; value: string | number; icon: keyof typeof Ionicons.glyphMap; secondary?: boolean };

export function DashboardMetric({ label, value, icon, secondary = false }: Props) {
  const colors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const dark = useResolvedColorScheme() === 'dark';
  const foreground = secondary ? colors.text : '#202422';
  const background = secondary ? colors.surface : isSimple ? '#F2DCE5' : isGlass ? '#CBEFF1' : '#D9F279';
  return (
    <View style={[styles.metric, { backgroundColor: background, borderColor: dark ? colors.border : '#D2DBBF' }]}>
      <View style={styles.top}>
        <Ionicons name={icon} size={19} color={foreground} />
        <Text style={[styles.value, { color: foreground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{value}</Text>
      </View>
      <Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metric: { flex: 1, minWidth: 0, minHeight: 106, padding: 16, borderRadius: 6, borderWidth: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  value: { flexShrink: 1, fontFamily: Typography.fontFamilyDisplay, fontSize: 32, lineHeight: 38, fontVariant: ['tabular-nums'] },
  label: { fontFamily: Typography.fontFamilyMedium, fontSize: 12, marginTop: 10 },
});
