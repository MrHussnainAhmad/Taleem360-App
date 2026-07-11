/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemeColors } from '@/context/ThemePreferencesContext';

export function useTheme() {
  return useThemeColors();
}
