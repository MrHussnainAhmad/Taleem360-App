import { usePortalTabs } from '@/hooks/use-portal-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StudentDashboardProvider } from '@/context/StudentDashboardContext';
import { useAuth } from '@/context/AuthContext';
import { PortalVisualProvider } from '@/context/PortalVisualContext';

export default function StudentLayout() {
  const tabOptions = usePortalTabs();
  const { user } = useAuth();
  const isGraduated = user?.studentAcademicStatus === 'GRADUATED';
  

  return (
    <StudentDashboardProvider>
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
          href: isGraduated ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar-outline" color={color} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="submissions"
        options={{
          title: 'Submissions',
          href: isGraduated ? null : undefined,
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
        name="marks"
        options={{
          title: 'Marks',
          href: isGraduated ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="school-outline" color={color} size={21} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: isGraduated ? null : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" color={color} size={21} />
          ),
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
        name="submit/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="exams"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tests"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="test/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }}
      />
      <Tabs.Screen
        name="transcripts"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transcript/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="leave"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{ href: null }}
      />
      <Tabs.Screen name="diary" options={{ href: null }} />
      <Tabs.Screen name="timetable" options={{ href: null }} />
      <Tabs.Screen name="id-card" options={{ href: null }} />
      <Tabs.Screen name="tickets" options={{ href: null }} />
      <Tabs.Screen
        name="vouchers"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </PortalVisualProvider>
    </StudentDashboardProvider>
  );
}
