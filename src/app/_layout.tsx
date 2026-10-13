import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, View } from 'react-native';
import { Slot } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { BricolageGrotesque_600SemiBold } from '@expo-google-fonts/bricolage-grotesque';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/context/AuthContext';
import { ThemePreferencesProvider, useThemeColors, useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
import { VersionGuard } from '@/components/VersionGuard';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BricolageGrotesque_600SemiBold,
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
          colors={colorScheme === 'dark' ? ['#191E20', '#283338', '#212B2A'] : ['#EEF3F4', '#DFEAEC', '#EBF1EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
        </LinearGradient>
      ) : null}
      <ThemeProvider value={navigationTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <VersionGuard>
              <Slot />
            </VersionGuard>
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
});
