import { useThemeColors, useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { DashboardShortcut as GlassPressable } from '@/components/ui/DashboardShortcut';
import { Alert, View, Text, StyleSheet, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { DashboardMasthead } from '@/components/ui/DashboardMasthead';
import { DashboardMetric } from '@/components/ui/DashboardMetric';
import { DashboardSchedule } from '@/components/ui/DashboardSchedule';
import { SkeletonPage } from '@/components/ui/Skeleton';
import {
  DASHBOARD_BG_COLORS_DARK,
  DASHBOARD_BG_COLORS_LIGHT,
} from '@/constants/glassStyles';


type TimetableItem = {
  startTime: string;
  endTime: string;
  subjectName: string | null;
  className: string | null;
  sectionName: string | null;
};


type Assignment = {
  id: number;
  title: string;
  dueAt: string;
  className: string | null;
  sectionName: string | null;
  subjectName: string | null;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  createdAtIso?: string;
  isRead: boolean;
};

// ── Glass-aware pressable wrapper ──────────────────────

export default function StaffDashboard() {
  const router = useRouter();
  const wide = useWindowDimensions().width >= 900;
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isDark = useColorScheme() === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [firstName, setFirstName] = useState('Staff Member');
  const [refreshing, setRefreshing] = useState(false);
  const [coursesEnabled, setCoursesEnabled] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Single lazy-fetch dashboard endpoint — server trims to today's timetable
      // and small previews only; full lists load on their own detail screens.
      const dashboard = await apiClient('/api/staff/dashboard');

      setTimetable(dashboard.timetable || []);
      setAssignments((dashboard.assignments || []).slice(0, 3));
      setAnnouncements((dashboard.announcements || []).slice(0, 3));
      setCoursesEnabled(Boolean(dashboard.coursesEnabled));

      if (dashboard.firstName) {
        setFirstName(dashboard.firstName);
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
      masthead={<DashboardMasthead role="staff" firstName={firstName} />}
      title="Dashboard"
      subtitle={`Welcome back, ${firstName}.`}
      eyebrow="Staff portal"
      icon={<Ionicons name="briefcase-outline" size={22} color={isGlass || isSimple ? themeColors.text : "#FFFFFF"} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      headerScrollable
      glassBackgroundColors={isDark ? DASHBOARD_BG_COLORS_DARK : DASHBOARD_BG_COLORS_LIGHT}
      actions={
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerActionButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={isGlass || isSimple ? themeColors.text : "#FFFFFF"} />
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
          <DashboardMetric label="Classes today" value={timetable.length} icon="calendar-outline" />
          <DashboardMetric label="Active assignments" value={assignments.length} icon="document-text-outline" secondary />
        </View>

        <DashboardSchedule lessons={timetable} />
        <View style={[styles.workspace, wide && styles.workspaceWide]}>
        <View style={[styles.shortcuts, wide && styles.shortcutsWide]}>
        <Text style={[styles.sectionLabel, { color: themeColors.text }]}>Teaching tools</Text>
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

          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(staff)/leave' as any)}>
            <View style={[styles.quickLinkIcon, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}><Ionicons name="calendar-outline" size={22} color={themeColors.warning} /></View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Request Leave</Text>
          </GlassPressable>
          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(staff)/leaves' as any)}>
            <View style={[styles.quickLinkIcon, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}><Ionicons name="list-outline" size={22} color={themeColors.primary} /></View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Leaves</Text>
          </GlassPressable>
          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(staff)/diary' as any)}>
            <View style={[styles.quickLinkIcon, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}><Ionicons name="book-outline" size={22} color={themeColors.info} /></View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Daily Diary</Text>
          </GlassPressable>
          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, !coursesEnabled && styles.disabledQuickLink]} onPress={() => coursesEnabled ? router.push('/(staff)/courses' as any) : Alert.alert('Courses unavailable', 'Course streaming has not been enabled by your institution.')}>
            <View style={[styles.quickLinkIcon, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}><Ionicons name="play-circle-outline" size={22} color={coursesEnabled ? themeColors.accent : themeColors.textMuted} /></View>
            <Text style={[styles.quickLinkLabel, { color: coursesEnabled ? themeColors.text : themeColors.textMuted }]}>Courses</Text>
          </GlassPressable>
          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(staff)/timetable' as any)}>
            <View style={[styles.quickLinkIcon, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}><Ionicons name="calendar-outline" size={22} color={themeColors.info} /></View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Timetable</Text>
          </GlassPressable>
          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(staff)/exams' as any)}>
            <View style={[styles.quickLinkIcon, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}><Ionicons name="calendar-number-outline" size={22} color={themeColors.warning} /></View>
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Exam Timetable</Text>
          </GlassPressable>
        </View>

        </View>
        <View style={styles.activity}>

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
        </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  workspace: { gap: 28 },
  workspaceWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 40 },
  shortcuts: { gap: 12 },
  shortcutsWide: { width: 340, flexShrink: 0 },
  activity: { flex: 1, minWidth: 0, gap: 12 },
  sectionLabel: { fontFamily: Typography.fontFamilyDisplay, fontSize: 20, marginTop: 6, marginBottom: 4 },
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
  compactStatCard: {
    minHeight: 112,
    padding: Spacing.md,
  },
  compactStatValue: {
    fontSize: 30,
    lineHeight: 36,
  },
  compactStatLabel: {
    fontSize: 12,
    lineHeight: 16,
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
    flexWrap: 'wrap',
    gap: 1,
  },
  quickLink: {
    flexBasis: '30%',
    flexGrow: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 112,
    padding: 8,
    gap: 10,
    borderRadius: 0,
    borderWidth: 0,
  },
  disabledQuickLink: {
    opacity: 0.58,
  },
  quickLinkIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
  },
  quickLinkLabel: {
    flexShrink: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textAlign: 'center',
  },
  humanListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  timeCircle: {
    width: 58,
    height: 44,
    borderRadius: 4,
    borderWidth: 0,
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
    paddingHorizontal: 0,
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
