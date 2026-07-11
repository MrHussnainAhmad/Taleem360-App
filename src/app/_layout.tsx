import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Slot } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { ThemePreferencesProvider, useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemePreferencesProvider>
      <AppThemeRoot />
    </ThemePreferencesProvider>
  );
}

function AppThemeRoot() {
  const colorScheme = useColorScheme();
  const colors = useThemeColors();
  const { uiStyle, isLoaded } = useThemePreferences();

  useEffect(() => {
    console.log('[DEBUG THEME] uiStyle:', uiStyle, 'background:', colors.background);
  }, [uiStyle, colors.background]);

  useEffect(() => {
    if (isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoaded]);

  if (!isLoaded) return null;

  const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      background: colors.background,
      card: colors.surface,
      border: colors.border,
      primary: colors.accent,
      text: colors.text,
    },
  };

  return (
    <View style={styles.root}>
      {uiStyle === 'glass' ? (
        <LinearGradient
          colors={colorScheme === 'dark' ? ['#071126', '#18345D', '#251C4B'] : ['#DCEBFF', '#E9E2FF', '#D9F4F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={[styles.glow, styles.glowTop]} />
          <View style={[styles.glow, styles.glowBottom]} />
        </LinearGradient>
      ) : null}
      <ThemeProvider value={navigationTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <Slot />
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  glowTop: {
    top: -80,
    right: -70,
  },
  glowBottom: {
    bottom: 40,
    left: -110,
  },
});
