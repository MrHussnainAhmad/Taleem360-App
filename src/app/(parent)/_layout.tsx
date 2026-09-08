import { Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import { ParentPortalProvider } from '@/context/ParentPortalContext';
import { PortalVisualProvider } from '@/context/PortalVisualContext';
import { ParentBackButton } from '@/components/parent/ParentBackButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { clearParentPortalDataCache } from '@/hooks/useParentPortalData';

export default function ParentLayout() {
  const colors = useThemeColors();
  const { isGlass } = useThemePreferences();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  useEffect(() => clearParentPortalDataCache, []);
  const academicDetails = ['/attendance', '/results', '/diary', '/courses', '/timetable'];
  const accountDetails = ['/fees', '/notices', '/requests'];
  const backTarget = academicDetails.some((route) => pathname.endsWith(route))
    ? '/(parent)/academics' as const
    : accountDetails.some((route) => pathname.endsWith(route))
      ? '/(parent)/account' as const
      : null;
  return (
    <ParentPortalProvider>
      <PortalVisualProvider value>
      <View style={styles.container}>
      <Tabs
        initialRouteName="index"
        backBehavior="history"
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: isGlass ? {
            position: 'absolute',
            left: Spacing.ms,
            right: Spacing.ms,
            bottom: Math.max(insets.bottom, Spacing.ms),
            height: 66,
            paddingTop: 7,
            paddingBottom: 7,
            borderTopWidth: 0,
            borderRadius: Radius.xl,
            backgroundColor: 'transparent',
            elevation: 0,
          } : {
            height: 64 + insets.bottom,
            paddingTop: Spacing.sm,
            paddingBottom: Math.max(insets.bottom, Spacing.sm),
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
          tabBarBackground: isGlass ? () => <GlassCard intensity={55} specular={false} padding={0} style={StyleSheet.absoluteFill} contentStyle={styles.glassFill} /> : undefined,
          tabBarLabelStyle: { fontFamily: Typography.fontFamilySemiBold, fontSize: 11, marginTop: 2 },
          tabBarIconStyle: { marginTop: 1 },
        }}
      >
        <Tabs.Screen name="academics" options={{ title: 'Academics', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'school' : 'school-outline'} color={color} size={22} /> }} />
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={22} /> }} />
        <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={color} size={23} /> }} />
        {['attendance', 'results', 'diary', 'courses', 'timetable', 'fees', 'notices', 'requests'].map((name) => <Tabs.Screen key={name} name={name} options={{ href: null }} />)}
      </Tabs>
      {backTarget ? <View style={[styles.back, { top: insets.top + Spacing.sm }]}><ParentBackButton target={backTarget} /></View> : null}
      </View>
      </PortalVisualProvider>
    </ParentPortalProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { position: 'absolute', right: Spacing.md, zIndex: 50 },
  glassFill: { flex: 1, borderRadius: Radius.xl },
});
