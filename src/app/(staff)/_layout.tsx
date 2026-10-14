import { usePortalTabs } from '@/hooks/use-portal-tabs';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PortalVisualProvider } from '@/context/PortalVisualContext';

export default function StaffLayout() {
  const tabOptions = usePortalTabs();


  return (
    <PortalVisualProvider value>
    <Tabs
      initialRouteName="index"
      backBehavior="initialRoute"
      screenOptions={tabOptions}
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
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={21} />,
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
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="leaves" options={{ href: null }} />
      <Tabs.Screen name="diary" options={{ href: null }} />
      <Tabs.Screen name="courses" options={{ href: null }} />
      <Tabs.Screen name="timetable" options={{ href: null }} />
      <Tabs.Screen name="exams" options={{ href: null }} />
      <Tabs.Screen name="tickets" options={{ href: null }} />
    </Tabs>
    </PortalVisualProvider>
  );
}
