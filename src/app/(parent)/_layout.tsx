import { usePortalTabs } from '@/hooks/use-portal-tabs';
import { Tabs, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParentPortalProvider } from '@/context/ParentPortalContext';
import { PortalVisualProvider } from '@/context/PortalVisualContext';
import { ParentBackButton } from '@/components/parent/ParentBackButton';
import { Radius, Spacing } from '@/constants/theme';
import { clearParentPortalDataCache } from '@/hooks/useParentPortalData';

export default function ParentLayout() {
  const tabOptions = usePortalTabs();
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
        screenOptions={tabOptions}
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
