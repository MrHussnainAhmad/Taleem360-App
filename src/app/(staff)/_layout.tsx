import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useColorScheme, View } from 'react-native';
import { Colors, Radius, Typography } from '@/constants/theme';

export default function StaffLayout() {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  return (
    <Tabs 
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: themeColors.accent,
        tabBarInactiveTintColor: themeColors.textMuted,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.border,
          height: 72,
          paddingTop: 7,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontFamily: Typography.fontFamilyMedium,
          fontSize: 10,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginBottom: 2,
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
          tabBarItemStyle: styles.homeTabItem,
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
    transform: [{ translateY: -5 }],
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
