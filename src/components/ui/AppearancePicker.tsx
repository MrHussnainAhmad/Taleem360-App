import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, GlassColors, Typography } from '@/constants/theme';
import { SimpleColors } from '@/constants/theme.simpleUI';
import { ThemeMode, UIStyle, useThemeColors, useThemePreferences, useResolvedColorScheme } from '@/context/ThemePreferencesContext';

const appearances: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'light', label: 'Light', icon: 'sunny-outline' },
  { value: 'dark', label: 'Dark', icon: 'moon-outline' },
  { value: 'system', label: 'System', icon: 'phone-portrait-outline' },
];
const themes: { value: UIStyle; label: string; palette: typeof Colors }[] = [
  { value: 'default', label: 'Campus', palette: Colors },
  { value: 'glass', label: 'Frost', palette: GlassColors },
  { value: 'simple', label: 'Ink', palette: SimpleColors },
];

export function AppearancePicker() {
  const colors = useThemeColors();
  const scheme = useResolvedColorScheme();
  const { themeMode, uiStyle, setThemeMode, setUiStyle } = useThemePreferences();
  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.text }]}>Appearance</Text>
      <View accessibilityRole="tablist" style={[styles.segments, { backgroundColor: colors.backgroundElement }]}>
        {appearances.map((item) => {
          const selected = themeMode === item.value;
          return <TouchableOpacity key={item.value} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected }} aria-selected={selected} onPress={() => void setThemeMode(item.value)} style={[styles.segment, selected && { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name={item.icon} size={18} color={selected ? colors.text : colors.textMuted} />
            <Text style={[styles.optionText, { color: selected ? colors.text : colors.textMuted }]}>{item.label}</Text>
          </TouchableOpacity>;
        })}
      </View>
      <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>Theme</Text>
      <View style={styles.themes}>
        {themes.map((item) => {
          const selected = uiStyle === item.value;
          const palette = item.palette[scheme];
          return <TouchableOpacity key={item.value} accessibilityRole="radio" accessibilityLabel={`${item.label} theme`} accessibilityState={{ checked: selected }} aria-checked={selected} onPress={() => void setUiStyle(item.value)} style={styles.theme}>
            <View style={[styles.preview, { backgroundColor: palette.background, borderColor: selected ? colors.accent : colors.border, borderWidth: selected ? 2 : 1 }]}>
              <View style={[styles.previewHeader, { backgroundColor: palette.text }]} />
              <View style={styles.previewIdentity}>
                <View style={styles.previewLines}>
                  <View style={[styles.line, { backgroundColor: palette.text, width: '80%' }]} />
                  <View style={[styles.line, { backgroundColor: palette.border, width: '55%' }]} />
                </View>
                <View style={[styles.previewAvatar, { backgroundColor: palette.accentMuted }]} />
              </View>
              <View style={styles.previewStats}>
                <View style={[styles.miniStat, { backgroundColor: item.value === 'default' ? '#D9F279' : item.value === 'glass' ? '#CBEFF1' : '#F2DCE5' }]} />
                <View style={[styles.miniStat, { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.border }]} />
              </View>
              <View style={[styles.line, { backgroundColor: palette.border, marginHorizontal: 10 }]} />
            </View>
            <View style={styles.themeLabel}>
              <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
              <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={16} color={selected ? colors.accent : colors.textMuted} />
            </View>
          </TouchableOpacity>;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderBottomWidth: 1 },
  label: { fontFamily: Typography.fontFamilySemiBold, fontSize: 14, marginBottom: 12 },
  segments: { flexDirection: 'row', padding: 3, borderRadius: 8 },
  segment: { flex: 1, minHeight: 48, paddingVertical: 8, gap: 6, borderWidth: 1, borderColor: 'transparent', borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  optionText: { fontFamily: Typography.fontFamilyMedium, fontSize: 12, flexShrink: 1 },
  themes: { flexDirection: 'row', gap: 10 },
  theme: { flex: 1, minWidth: 0 },
  preview: { height: 112, borderRadius: 6, overflow: 'hidden' },
  previewHeader: { height: 3, marginTop: 9, marginHorizontal: 10, width: '50%' },
  previewIdentity: { flexDirection: 'row', gap: 6, padding: 10, alignItems: 'center' },
  previewAvatar: { width: 18, height: 23, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  previewLines: { flex: 1, gap: 5 },
  line: { height: 4, borderRadius: 1 },
  previewStats: { flexDirection: 'row', gap: 5, paddingHorizontal: 10, marginBottom: 10 },
  miniStat: { flex: 1, height: 25, borderRadius: 3 },
  themeLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2, paddingTop: 9 },
});
