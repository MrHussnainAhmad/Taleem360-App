import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, ScrollView, Animated, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonPage } from '@/components/ui/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  glassPressIn,
  glassPressOut,
} from '@/constants/glassStyles';


type TimetableItem = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  subjectName: string;
  sectionName: string;
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
  className: string;
  sectionName: string;
  subjectName: string;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  createdAtIso?: string;
  isRead: boolean;
};

// ── Glass-aware pressable wrapper ──────────────────────
function GlassPressable({ isGlass, children, style, onPress }: {
  isGlass: boolean;
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  if (!isGlass) {
    return onPress ? (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={style}>
        {children}
      </TouchableOpacity>
    ) : (
      <View style={style}>{children}</View>
    );
  }
  // Glass mode: wrap in GlassCard with press animation
  return (
    <Animated.View style={[{ flex: 1 }, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={() => glassPressIn(scale)}
        onPressOut={() => glassPressOut(scale)}
      >
        <GlassCard padding={Spacing.md}>
          {children}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function StaffDashboard() {
  const { logout } = useAuth();
  const router = useRouter();
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isDark = useColorScheme() === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [firstName, setFirstName] = useState('Staff Member');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ttRes, assigRes, profileRes, notifRes, announcementsRes] = await Promise.all([
        apiClient('/api/staff/timetable'),
        apiClient('/api/staff/assignments'),
        apiClient('/api/staff/profile'),
        apiClient('/api/me/notifications'),
        apiClient('/api/announcements/notifications')
      ]);

      const today = new Date().getDay();
      const todayClasses = (ttRes.timetable || []).filter((t: any) => t.dayOfWeek === today);
      setTimetable(todayClasses);

      // Only show active assignments
      const now = new Date();
      const active = (assigRes.assignments || []).filter((a: any) => new Date(a.dueAt) > now);
      setAssignments(active);

      if (announcementsRes?.announcements) {
        setAnnouncements(announcementsRes.announcements);
      }
      setUnreadNotificationsCount(notifRes?.unreadCount || 0);

      const profileName = profileRes?.profile?.name || profileRes?.name;
      if (profileName) {
        setFirstName(profileName.split(' ')[0]);
      }
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

  if (loading && !refreshing) {
    return <SkeletonPage title="Dashboard" subtitle="Preparing your staff overview." eyebrow="Staff portal" iconName="briefcase-outline" variant="dashboard" />;
  }

  if (error && !refreshing) {
    return (
      <ScreenShell
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}.`}
        eyebrow="Staff portal"
        icon={<Ionicons name="briefcase-outline" size={22} color="#FFFFFF" />}
      >
        <View style={[styles.center, { padding: Spacing.xl, flex: 1 }]}>
          <Text style={{ color: themeColors.error, fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.md, textAlign: 'center' }}>
            {error}
          </Text>
          <Button title="Retry" variant="outline" onPress={fetchData} style={{ marginTop: Spacing.md }} />
        </View>
      </ScreenShell>
    );
  }

  // Render card content — glass wraps in GlassCard, default uses Card
  const renderCard = (title: string, content: React.ReactNode, extraStyle?: any) => {
    return <Card title={title} style={extraStyle}>{content}</Card>;
  };

  return (
    <ScreenShell
      title="Dashboard"
      subtitle={`Welcome back, ${firstName}.`}
      eyebrow="Staff portal"
      icon={<Ionicons name="briefcase-outline" size={22} color={isGlass || isSimple ? themeColors.text : "#FFFFFF"} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      headerScrollable
      actions={
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={isGlass || isSimple ? themeColors.text : "#FFFFFF"} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.unreadIndicator} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={isGlass || isSimple ? themeColors.text : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      }
    >

      <View style={styles.grid}>
        <View style={styles.statRow}>
            <>
              <StatCard
                label="Classes Today"
                value={timetable.length}
                tone="info"
                icon={<Ionicons name="calendar-outline" size={18} color={themeColors.info} />}
              />
              <StatCard
                label="Active Assignments"
                value={assignments.length}
                tone="warning"
                icon={<Ionicons name="document-text-outline" size={18} color={themeColors.warning} />}
              />
            </>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksContainer}>
          <GlassPressable
            isGlass={isGlass}
            style={[
              styles.quickLink,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => router.push('/(staff)/attendance')}
          >
            <View style={[
              styles.quickLinkIcon,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              isGlass && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
            ]}>
              <Ionicons name="checkmark-circle-outline" size={24} color={isSimple ? themeColors.textMuted : themeColors.primary} />
            </View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Mark Attendance</Text>
          </GlassPressable>

          <GlassPressable
            isGlass={isGlass}
            style={[
              styles.quickLink,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => router.push('/(staff)/marks')}
          >
            <View style={[
              styles.quickLinkIcon,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              isGlass && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
            ]}>
              <Ionicons name="document-text-outline" size={24} color={isSimple ? themeColors.textMuted : themeColors.success} />
            </View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Enter Marks</Text>
          </GlassPressable>

          <GlassPressable
            isGlass={isGlass}
            style={[
              styles.quickLink,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => router.push('/(staff)/batch-results' as any)}
          >
            <View style={[
              styles.quickLinkIcon,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              isGlass && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.2)' }
            ]}>
              <Ionicons name="albums-outline" size={24} color={isSimple ? themeColors.textMuted : themeColors.warning} />
            </View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Batch Entry</Text>
          </GlassPressable>
        </View>

        {renderCard("Today's Classes", (
          <>
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
                      <View style={[
                        styles.timeCircle,
                        { backgroundColor: themeColors.background, borderColor: themeColors.border },
                        isGlass && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.25)' }
                      ]}>
                        <Text style={[styles.timeCircleText, { color: themeColors.text }]} numberOfLines={1}>
                          {formatTime(item.startTime).split(' ')[0]}
                        </Text>
                      </View>
                      <View style={styles.humanListContent}>
                        <Text style={[styles.humanListTitle, { color: themeColors.text }]} numberOfLines={1}>
                          {item.subjectName}
                        </Text>
                        <Text style={[styles.humanListSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                          {formatTime(item.startTime)} - {formatTime(item.endTime)} • {item.sectionName}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={{ color: themeColors.textMuted }}>No classes scheduled for today.</Text>
            )}
          </>
        ), { marginBottom: Spacing.md })}

        {renderCard('Active Assignments', (
          <>
            {assignments.length > 0 ? assignments.slice(0, 3).map((sub, index) => (
              <View 
                key={sub.id} 
                style={[
                  styles.submissionItem, 
                  { borderBottomColor: themeColors.border },
                  index === Math.min(assignments.length, 3) - 1 && { borderBottomWidth: 0, paddingBottom: 0 }
                ]}
              >
                <View style={styles.submissionMeta}>
                  <Text style={[styles.submissionTitle, { color: themeColors.text }]}>{sub.subjectName} - {sub.title}</Text>
                  <Text style={[styles.submissionTime, { color: themeColors.textMuted }]}>Due: {new Date(sub.dueAt).toLocaleString()}</Text>
                </View>
                <Badge label="Active" variant="info" />
              </View>
            )) : (
              <Text style={{ color: themeColors.textMuted }}>No active assignments.</Text>
            )}
          </>
        ), { marginBottom: Spacing.md })}

        {renderCard('Recent Announcements', (
          <>
            {announcements.length > 0 ? (
              <View style={styles.announcementsList}>
                {announcements.slice(0, 3).map((ann, index) => {
                  const dateStr = ann.createdAtIso ? new Date(ann.createdAtIso).toLocaleString() : '';
                  return (
                  <TouchableOpacity 
                    key={ann.id} 
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/(staff)/announcement/[id]',
                      params: {
                        id: ann.id,
                        title: ann.title,
                        content: ann.content,
                        createdAtIso: ann.createdAtIso
                      }
                    })}
                  >
                    <View 
                      style={[
                        styles.announcementItem,
                        { borderBottomColor: themeColors.border },
                        index === Math.min(announcements.length, 3) - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <View style={styles.announcementHeader}>
                        <Text style={[styles.announcementTitle, { color: themeColors.text }]} numberOfLines={1}>{ann.title}</Text>
                        {!ann.isRead && <View style={[styles.unreadDot, { backgroundColor: themeColors.primary }]} />}
                      </View>
                      <Text style={[styles.announcementDate, { color: themeColors.textMuted }]}>{dateStr}</Text>
                    </View>
                  </TouchableOpacity>
                )})}
              </View>
            ) : (
              <Text style={{ color: themeColors.textMuted }}>No new announcements.</Text>
            )}
            <Button 
              title="View All Announcements" 
              variant="outline" 
              onPress={() => router.push('/(staff)/announcements')} 
              style={{ marginTop: Spacing.md, height: 36 }} 
            />
          </>
        ))}
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
  submissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  submissionMeta: {
    flex: 1,
  },
  submissionTitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: 4,
  },
  submissionTime: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  },
  quickLinksContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickLink: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickLinkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  quickLinkLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    textAlign: 'center',
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
  glassCardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.sm,
  },
  humanListSubtitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  announcementsList: {
    paddingHorizontal: Spacing.md,
  },
  announcementItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  announcementTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  announcementDate: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  }
});
