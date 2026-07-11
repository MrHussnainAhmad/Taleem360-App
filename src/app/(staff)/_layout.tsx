import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { GlassCard } from '@/components/ui/GlassCard';

export default function StaffLayout() {
  const themeColors = useThemeColors();
  const { isGlass } = useThemePreferences();
  const insets = useSafeAreaInsets();

  const bottomInset = Math.max(insets.bottom, Spacing.md);

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarStyle: isGlass ? {
          position: 'absolute',
          bottom: bottomInset + Spacing.sm,
          left: Spacing.xl,
          right: Spacing.xl,
          height: 64,
          borderRadius: 32,
          borderWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0, // Remove android shadow
          paddingBottom: 0,
        } : {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          height: 72 + insets.bottom,
          paddingTop: 7,
          paddingBottom: 10 + insets.bottom,
        },
        tabBarBackground: isGlass ? () => (
          <GlassCard intensity={60} padding={0} style={[StyleSheet.absoluteFill, { borderRadius: 32 }]} />
        ) : undefined,
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamilyMedium,
          fontSize: 10,
          marginTop: isGlass ? -2 : 2,
        },
        tabBarIconStyle: {
          marginBottom: isGlass ? -2 : 2,
        },
        tabBarItemStyle: {
          paddingTop: isGlass ? 8 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" color={color} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="assignments"
        options={{
          title: 'Assignments',
          tabBarIcon: ({ color }) => (
            <Ionicons name="document-text-outline" color={color} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarItemStyle: [styles.homeTabItem, { paddingTop: 0 }],
          tabBarLabelStyle: {
            fontFamily: Typography.fontFamilySemiBold,
            fontSize: 11,
            marginTop: 3,
          },
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.homeIcon,
                {
                  backgroundColor: focused ? themeColors.accent : themeColors.surface,
                  borderColor: focused ? themeColors.accent : themeColors.border,
                },
              ]}
            >
              <Ionicons name={focused ? 'home' : 'home-outline'} color={focused ? '#FFFFFF' : color} size={22} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="host-tests"
        options={{
          title: 'Host Tests',
          tabBarIcon: ({ color }) => (
            <Ionicons name="pencil-outline" color={color} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" color={color} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="marks"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="mark-entry/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="announcement/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="batch-results/index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="batch-results/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  homeTabItem: {
    transform: [{ translateY: -15 }],
  },
  homeIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
