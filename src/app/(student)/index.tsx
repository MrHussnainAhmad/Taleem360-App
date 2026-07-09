import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/api';
import { registerForPushNotificationsWithResult } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/Skeleton';


type TimetableItem = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  teacherName: string;
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  if (!hours || !minutes) return timeStr;
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const formattedHours = h % 12 || 12;
  return `${formattedHours}:${minutes} ${ampm}`;
};

type Assignment = {
  id: number;
  title: string;
  dueAt: string;
  submission: any;
};

export default function StudentDashboard() {
  const { logout } = useAuth();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [latestScore, setLatestScore] = useState('-');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [hasExams, setHasExams] = useState(false);
  const [hasTests, setHasTests] = useState(false);
  const [hasTranscripts, setHasTranscripts] = useState(false);
  const [firstName, setFirstName] = useState('Student');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [hasPushToken, setHasPushToken] = useState(true);
  const [registeringPush, setRegisteringPush] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ttRes, assigRes, marksRes, notifRes, examsRes, testsRes, profileRes, announcementsRes, pushRes, transcriptsRes] = await Promise.all([
        apiClient('/api/student/timetable'),
        apiClient('/api/student/submissions'),
        apiClient('/api/student/marks'),
        apiClient('/api/me/notifications'),
        apiClient('/api/student/exams'),
        apiClient('/api/student/tests'),
        apiClient('/api/student/profile'),
        apiClient('/api/announcements/notifications'),
        apiClient('/api/me/push-token'),
        apiClient('/api/student/transcripts')
      ]);

      const today = new Date().getDay();
      const todayClasses = (ttRes.timetable || []).filter((t: any) => t.dayOfWeek === today);
      setTimetable(todayClasses);

      const pending = (assigRes.assignments || []).filter((a: any) => !a.submission);
      setAssignments(pending);

      // Latest Test Score
      const allMarks = marksRes.marks || [];
      if (allMarks.length > 0) {
        // Assume sorted by date descending, take the first one
        const latest = allMarks[0];
        const percentage = Math.round((latest.marksObtained / latest.totalMarks) * 100);
        setLatestScore(`${percentage}%`);
      } else {
        setLatestScore('N/A');
      }

      setAnnouncements(announcementsRes.announcements ? announcementsRes.announcements.slice(0, 2) : []);
      setUnreadNotificationsCount(notifRes.unreadCount || 0);
      setHasPushToken(Boolean(pushRes?.hasPushToken));
      
      const profileName = profileRes?.profile?.name || profileRes?.name;
      if (profileName) {
        setFirstName(profileName.split(' ')[0]);
      }
      
      setHasExams((examsRes || []).length > 0);
      setHasTests((testsRes || []).length > 0);
      setHasTranscripts(Array.isArray(transcriptsRes) && transcriptsRes.length > 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleEnablePush = async () => {
    setRegisteringPush(true);
    try {
      const result = await registerForPushNotificationsWithResult();
      if (!result.ok) {
        Alert.alert('Notifications not enabled', result.reason || 'Could not register this device for push notifications.');
        return;
      }

      const status = await apiClient('/api/me/push-token');
      const enabled = Boolean(status?.hasPushToken);
      setHasPushToken(enabled);
      Alert.alert(
        enabled ? 'Notifications enabled' : 'Still not enabled',
        enabled
          ? 'You will receive announcement alerts on this phone.'
          : 'The device token was generated, but the backend still does not show it. Please try again.'
      );
    } catch (err: any) {
      Alert.alert('Could not enable notifications', err.message || 'Please try again.');
    } finally {
      setRegisteringPush(false);
    }
  };

  if (loading && !refreshing) {
    return <SkeletonPage title="Dashboard" subtitle="Preparing your student overview." eyebrow="Student portal" iconName="school-outline" variant="dashboard" />;
  }

  if (error && !refreshing) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: themeColors.background }]}>
        <Text style={{ color: themeColors.error, fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.md }}>
          {error}
        </Text>
        <Button title="Retry" variant="outline" onPress={fetchData} style={{ marginTop: Spacing.md }} />
      </View>
    );
  }

  return (
    <ScreenShell
      title="Dashboard"
      subtitle={`Welcome back, ${firstName}.`}
      eyebrow="Student portal"
      icon={<Ionicons name="school-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      headerScrollable
      actions={
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.unreadIndicator} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      }
    >

      <View style={styles.grid}>
        <View style={styles.statRow}>
          <StatCard
            label="Latest Test"
            value={latestScore}
            tone="info"
            icon={<Ionicons name="ribbon-outline" size={18} color={themeColors.info} />}
          />
          <StatCard
            label="Pending Tasks"
            value={assignments.length}
            tone="warning"
            icon={<Ionicons name="time-outline" size={18} color={themeColors.warning} />}
          />
        </View>

        {(hasExams || hasTests || hasTranscripts) && (
          <View style={styles.quickLinksRow}>
            {hasTranscripts && (
              <TouchableOpacity 
                style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} 
                onPress={() => router.push('/(student)/transcripts' as any)}
              >
                <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Transcripts</Text>
              </TouchableOpacity>
            )}
            {hasExams && (
              <TouchableOpacity 
                style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} 
                onPress={() => router.push('/(student)/exams')}
              >
                <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Timetable</Text>
              </TouchableOpacity>
            )}
            {hasTests && (
              <TouchableOpacity 
                style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} 
                onPress={() => router.push('/(student)/tests')}
              >
                <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Online Tests</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!hasPushToken && (
          <Card style={styles.pushCard}>
            <View style={styles.pushCardContent}>
              <View style={[styles.pushIcon, { backgroundColor: themeColors.warningBg }]}>
                <Ionicons name="notifications-outline" size={22} color={themeColors.warning} />
              </View>
              <View style={styles.pushTextWrap}>
                <Text style={[styles.pushTitle, { color: themeColors.text }]}>Enable announcement alerts</Text>
                <Text style={[styles.pushBody, { color: themeColors.textMuted }]}>
                  Turn on push notifications for announcements and attendance updates.
                </Text>
              </View>
            </View>
            <Button
              title={registeringPush ? 'Enabling...' : 'Enable Notifications'}
              onPress={handleEnablePush}
              loading={registeringPush}
              disabled={registeringPush}
              icon={!registeringPush ? <Ionicons name="notifications" size={18} color="#FFFFFF" /> : undefined}
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        )}

        <Card title="Recent Announcements" style={{ marginBottom: Spacing.md }}>
          {announcements.length > 0 ? announcements.map((ann, index) => {
            const dateStr = ann.createdAtIso ? new Date(ann.createdAtIso).toLocaleString() : '';
            return (
            <TouchableOpacity 
              key={ann.id} 
              activeOpacity={0.7}
              onPress={() => router.push({
                pathname: '/(student)/announcement/[id]',
                params: {
                  id: ann.id,
                  title: ann.title,
                  content: ann.content,
                  senderRole: ann.senderRole,
                  createdAtIso: ann.createdAtIso
                }
              })}
            >
              <View 
                style={[
                  styles.assignmentItem, 
                  { borderBottomColor: themeColors.border },
                  index === announcements.length - 1 && { borderBottomWidth: 0, paddingBottom: 0 }
                ]}
              >
                <View style={styles.assignmentMeta}>
                  <Text style={[styles.assignmentTitle, { color: themeColors.text }]} numberOfLines={1}>{ann.title}</Text>
                  <Text style={[styles.assignmentDue, { color: themeColors.textMuted }]} numberOfLines={2}>{dateStr} - {ann.content}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}) : (
            <Text style={{ color: themeColors.textMuted }}>No new announcements.</Text>
          )}
          <Button 
            title="View All Announcements" 
            variant="outline" 
            onPress={() => router.push('/(student)/announcements')} 
            style={{ marginTop: Spacing.md, height: 36 }} 
          />
        </Card>

        <Card title="Today's Classes" style={{ marginBottom: Spacing.md }}>
          {timetable.length > 0 ? (
            <View>
              {timetable.map((item, idx) => {
                const isLast = idx === timetable.length - 1;
                return (
                  <View 
                    key={`${item.startTime}-${idx}`} 
                    style={[
                      styles.humanListItem, 
                      { borderBottomColor: themeColors.border },
                      isLast && { borderBottomWidth: 0, paddingBottom: 0 }
                    ]}
                  >
                    <View style={[styles.timeCircle, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                      <Text style={[styles.timeCircleText, { color: themeColors.text }]} numberOfLines={1}>
                        {formatTime(item.startTime).split(' ')[0]}
                      </Text>
                    </View>
                    <View style={styles.humanListContent}>
                      <Text style={[styles.humanListTitle, { color: themeColors.text }]} numberOfLines={1}>
                        {item.subjectName}
                      </Text>
                      <Text style={[styles.humanListSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {formatTime(item.startTime)} - {formatTime(item.endTime)} • {item.teacherName}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: themeColors.textMuted }}>No classes scheduled for today.</Text>
          )}
        </Card>

        <Card title="Pending Assignments">
          {assignments.length > 0 ? assignments.slice(0, 3).map((assignment, index) => (
            <View 
              key={assignment.id} 
              style={[
                styles.assignmentItem, 
                { borderBottomColor: themeColors.border },
                index === Math.min(assignments.length, 3) - 1 && { borderBottomWidth: 0, paddingBottom: 0 }
              ]}
            >
              <View style={styles.assignmentMeta}>
                <Text style={[styles.assignmentTitle, { color: themeColors.text }]}>{assignment.title}</Text>
                <Text style={[styles.assignmentDue, { color: themeColors.error }]}>Due: {new Date(assignment.dueAt).toLocaleString()}</Text>
              </View>
              <Badge label="Pending" variant="warning" />
            </View>
          )) : (
            <Text style={{ color: themeColors.textMuted }}>No pending assignments.</Text>
          )}
        </Card>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF6A5F',
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    marginTop: Spacing.xs,
  },
  grid: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    marginBottom: 0,
  },
  statContent: {
    padding: Spacing.md,
  },
  statLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  assignmentMeta: {
    flex: 1,
  },
  assignmentTitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: 4,
  },
  assignmentDue: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  },
  quickLinksRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickLink: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  pushCard: {
    marginBottom: Spacing.md,
  },
  pushCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pushIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  pushTextWrap: {
    flex: 1,
  },
  pushTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    marginBottom: 4,
  },
  pushBody: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  humanListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  timeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  timeCircleText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
  },
  humanListContent: {
    flex: 1,
  },
  humanListTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    marginBottom: 2,
  },
  humanListSubtitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
});
