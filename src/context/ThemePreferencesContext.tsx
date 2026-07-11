import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { Colors, GlassColors } from '@/constants/theme';
import { SimpleColors } from '@/constants/theme.simpleUI';

export type ThemeMode = 'light' | 'dark' | 'system';
export type UIStyle = 'default' | 'glass' | 'simple';

const THEME_MODE_KEY = 'themeMode';
const UI_STYLE_KEY = 'uiStyle';
const PREV_THEME_MODE_KEY = 'prevThemeMode';
const GLASS_INTENSITY_KEY = 'glassIntensity';

type ThemePreferencesContextValue = {
  themeMode: ThemeMode;
  uiStyle: UIStyle;
  isGlass: boolean;
  isSimple: boolean;
  isLoaded: boolean;
  glassIntensity: number;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setUiStyle: (style: UIStyle) => Promise<void>;
  setGlassIntensity: (intensity: number) => Promise<void>;
};

const ThemePreferencesContext = createContext<ThemePreferencesContextValue | undefined>(undefined);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

function isUIStyle(value: string | null): value is UIStyle {
  return value === 'default' || value === 'glass' || value === 'simple';
}

function applyThemeMode(mode: ThemeMode) {
  Appearance.setColorScheme(mode === 'system' ? null : mode);
}

export function ThemePreferencesProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [uiStyle, setUiStyleState] = useState<UIStyle>('default');
  const [glassIntensity, setGlassIntensityState] = useState<number>(1.0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [storedThemeMode, storedUIStyle, storedPrevThemeMode, storedGlassIntensity] = await Promise.all([
          AsyncStorage.getItem(THEME_MODE_KEY),
          AsyncStorage.getItem(UI_STYLE_KEY),
          AsyncStorage.getItem(PREV_THEME_MODE_KEY),
          AsyncStorage.getItem(GLASS_INTENSITY_KEY),
        ]);

        let nextThemeMode = isThemeMode(storedThemeMode) ? storedThemeMode : 'system';
        const nextUIStyle = isUIStyle(storedUIStyle) ? storedUIStyle : 'default';
        const nextGlassIntensity = storedGlassIntensity ? parseFloat(storedGlassIntensity) : 1.0;

        if (nextUIStyle === 'glass' && nextThemeMode !== 'light') {
          // If previous theme mode is not saved yet, save it before forcing light
          if (!storedPrevThemeMode) {
            await AsyncStorage.setItem(PREV_THEME_MODE_KEY, nextThemeMode);
          }
          nextThemeMode = 'light';
        }

        console.log('[DEBUG STORAGE] Loaded themeMode:', nextThemeMode, 'uiStyle:', nextUIStyle);

        setThemeModeState(nextThemeMode);
        setUiStyleState(nextUIStyle);
        setGlassIntensityState(nextGlassIntensity);
        applyThemeMode(nextThemeMode);
      } catch (error) {
        console.warn('Failed to load theme preferences', error);
        applyThemeMode('system');
      } finally {
        setIsLoaded(true);
      }
    };

    void loadPreferences();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    applyThemeMode(mode);
    try {
      await AsyncStorage.setItem(THEME_MODE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save appearance preference', error);
    }
  };

  const setUiStyle = async (style: UIStyle) => {
    try {
      if (style === 'glass' && uiStyle !== 'glass') {
        // Switching TO Glass: save current themeMode, force Light
        if (themeMode !== 'light') {
          await AsyncStorage.setItem(PREV_THEME_MODE_KEY, themeMode);
          await setThemeMode('light');
        }
      } else if (style === 'default' && uiStyle === 'glass') {
        // Switching AWAY from Glass: restore previous themeMode
        const prevThemeMode = await AsyncStorage.getItem(PREV_THEME_MODE_KEY);
        if (prevThemeMode && isThemeMode(prevThemeMode)) {
          await setThemeMode(prevThemeMode);
        }
        await AsyncStorage.removeItem(PREV_THEME_MODE_KEY);
      }

      setUiStyleState(style);
      await AsyncStorage.setItem(UI_STYLE_KEY, style);
    } catch (error) {
      console.warn('Failed to save theme preference', error);
    }
  };

  const setGlassIntensity = async (intensity: number) => {
    setGlassIntensityState(intensity);
    try {
      await AsyncStorage.setItem(GLASS_INTENSITY_KEY, intensity.toString());
    } catch (error) {
      console.warn('Failed to save glass intensity preference', error);
    }
  };

  const isGlass = uiStyle === 'glass';
  const isSimple = uiStyle === 'simple';

  return (
    <ThemePreferencesContext.Provider
      value={{
        themeMode,
        uiStyle,
        isGlass,
        isSimple,
        isLoaded,
        glassIntensity,
        setThemeMode,
        setUiStyle,
        setGlassIntensity,
      }}
    >
      {children}
    </ThemePreferencesContext.Provider>
  );
}

export function useThemePreferences() {
  const context = useContext(ThemePreferencesContext);
  if (!context) throw new Error('useThemePreferences must be used inside ThemePreferencesProvider');
  return context;
}

export function useThemeColors() {
  const scheme = useColorScheme();
  const { uiStyle } = useThemePreferences();
  const mode = scheme === 'dark' ? 'dark' : 'light';
  if (uiStyle === 'simple') return SimpleColors[mode];
  return uiStyle === 'glass' ? GlassColors[mode] : Colors[mode];
}
