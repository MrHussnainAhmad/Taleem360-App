import { useThemeColors, useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { DashboardShortcut as GlassPressable } from '@/components/ui/DashboardShortcut';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useStudentDashboard } from '@/context/StudentDashboardContext';
import { registerForPushNotificationsWithResult } from '@/utils/notifications';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { DashboardMasthead } from '@/components/ui/DashboardMasthead';
import { DashboardMetric } from '@/components/ui/DashboardMetric';
import { DashboardSchedule } from '@/components/ui/DashboardSchedule';
import { SkeletonPage } from '@/components/ui/Skeleton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/context/AuthContext';
import {
  DASHBOARD_BG_COLORS_DARK,
  DASHBOARD_BG_COLORS_LIGHT,
} from '@/constants/glassStyles';


// ── Glass-aware pressable card wrapper ─────────────────

export default function StudentDashboard() {
  const router = useRouter();
  const wide = useWindowDimensions().width >= 900;
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const {
    snapshot,
    loading,
    error,
    refreshing,
    ensureDashboard,
    setHasPushToken,
  } = useStudentDashboard();

  const [registeringPush, setRegisteringPush] = useState(false);
  const isGraduatedStudent = user?.studentAcademicStatus === 'GRADUATED';

  // Home content only — no speculative profile/nav probes. Graduation comes from JWT.
  useEffect(() => {
    if (isGraduatedStudent) return;
    void ensureDashboard();
  }, [ensureDashboard, isGraduatedStudent]);

  const onRefresh = () => {
    void ensureDashboard({ force: true });
  };

  const handleEnablePush = async () => {
    setRegisteringPush(true);
    try {
      const result = await registerForPushNotificationsWithResult();
      if (!result.ok) {
        Alert.alert('Notifications not enabled', result.reason || 'Could not register this device for push notifications.');
        return;
      }

      setHasPushToken(true);
      Alert.alert(
        'Notifications enabled',
        'You will receive announcement alerts on this phone.'
      );
    } catch (err: any) {
      Alert.alert('Could not enable notifications', err.message || 'Please try again.');
    } finally {
      setRegisteringPush(false);
    }
  };

  const timetable = snapshot?.timetable || [];
  const assignments = snapshot?.assignments || [];
  const latestScore = snapshot?.latestScore || '-';
  const announcements = snapshot?.announcements || [];
  const firstName = snapshot?.firstName || 'Student';
  const hasPushToken = snapshot?.hasPushToken ?? true;

  if (isGraduatedStudent) {
    return (
      <ScreenShell
        title="Dashboard"
        subtitle="Graduated student access"
        masthead={<DashboardMasthead role="student" firstName={firstName} />}
        eyebrow="Graduated"
        headerHeight={116}
        headerPaddingBottom={Spacing.md}
        icon={<Ionicons name="school-outline" size={22} color={isGlass || isSimple ? themeColors.text : "#FFFFFF"} />}
        headerScrollable
        glassBackgroundColors={isDark ? DASHBOARD_BG_COLORS_DARK : DASHBOARD_BG_COLORS_LIGHT}
      >
        <View style={styles.grid}>
          <View style={[styles.graduateBanner, { backgroundColor: themeColors.primaryBg, borderColor: themeColors.primary }]}>
            <View style={[styles.graduateIcon, { backgroundColor: themeColors.primary }]}>
              <Ionicons name="school" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.graduateTitle, { color: themeColors.text }]}>You are graduated</Text>
            <Text style={[styles.graduateText, { color: themeColors.textMuted }]}>
              You are graduated, all you can access is Transcript, Attendance Record and Profile.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(student)/transcripts' as any)}
            style={[styles.graduateAction, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <View style={[styles.graduateActionIcon, { backgroundColor: themeColors.infoBg }]}>
              <Ionicons name="document-text-outline" size={22} color={themeColors.info} />
            </View>
            <View style={styles.leaveRequestContent}>
              <Text style={[styles.graduateActionTitle, { color: themeColors.text }]}>Transcript</Text>
              <Text style={[styles.graduateActionSubtitle, { color: themeColors.textMuted }]}>View your published academic records.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={themeColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(student)/attendance' as any)}
            style={[styles.graduateAction, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <View style={[styles.graduateActionIcon, { backgroundColor: themeColors.successBg }]}>
              <Ionicons name="calendar-outline" size={22} color={themeColors.success} />
            </View>
            <View style={styles.leaveRequestContent}>
              <Text style={[styles.graduateActionTitle, { color: themeColors.text }]}>Attendance Record</Text>
              <Text style={[styles.graduateActionSubtitle, { color: themeColors.textMuted }]}>Review your saved attendance history.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={themeColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(student)/profile' as any)}
            style={[styles.graduateAction, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}
          >
            <View style={[styles.graduateActionIcon, { backgroundColor: themeColors.warningBg }]}>
              <Ionicons name="person-outline" size={22} color={themeColors.warning} />
            </View>
            <View style={styles.leaveRequestContent}>
              <Text style={[styles.graduateActionTitle, { color: themeColors.text }]}>Profile</Text>
              <Text style={[styles.graduateActionSubtitle, { color: themeColors.textMuted }]}>View your read-only profile.</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScreenShell>
    );
  }

  if (loading && !refreshing && !snapshot) {
    return <SkeletonPage title="Dashboard" subtitle="Preparing your student overview." eyebrow="Student portal" iconName="school-outline" variant="dashboard" />;
  }

  if (error && !refreshing && !snapshot) {
    return (
      <ScreenShell
        title="Dashboard"
        subtitle={`Welcome back, ${firstName}.`}
        eyebrow="Student portal"
        headerHeight={116}
        headerPaddingBottom={Spacing.md}
        icon={<Ionicons name="school-outline" size={22} color="#FFFFFF" />}
      >
        <View style={[styles.center, { padding: Spacing.xl, flex: 1 }]}>
          <Text style={{ color: themeColors.error, fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.md, textAlign: 'center' }}>
            {error}
          </Text>
          <Button title="Retry" variant="outline" onPress={() => void ensureDashboard({ force: true })} style={{ marginTop: Spacing.md }} />
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
      masthead={<DashboardMasthead role="student" firstName={firstName} />}
      title="Dashboard"
      subtitle={`Welcome back, ${firstName}.`}
      eyebrow="Student portal"
      headerHeight={116}
      headerPaddingBottom={Spacing.md}
      icon={<Ionicons name="school-outline" size={22} color={isGlass || isSimple ? themeColors.text : "#FFFFFF"} />}
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
            <DashboardMetric label="Latest test" value={latestScore} icon="ribbon-outline" />
            <DashboardMetric label="Pending tasks" value={assignments.length} icon="time-outline" secondary />
          </View>
        <DashboardSchedule lessons={timetable} />
        <View style={[styles.workspace, wide && styles.workspaceWide]}>
          <View style={[styles.shortcuts, wide && styles.shortcutsWide]}>
          <Text style={[styles.sectionLabel, { color: themeColors.text }]}>My essentials</Text>
          <GlassPressable
            isGlass={isGlass}
            onPress={() => router.push('/(student)/diary' as any)}
            style={[
              styles.leaveRequestCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border }
            ]}
          >
            <View style={[styles.leaveRequestIcon, isGlass && styles.glassLeaveRequestIcon]}>
              <Ionicons name="book-outline" size={22} color={themeColors.info} />
            </View>
            <View style={styles.leaveRequestContent}>
              <Text style={[styles.leaveRequestTitle, { color: themeColors.text }]}>Daily Diary</Text>
              <Text style={[styles.leaveRequestSubtitle, { color: themeColors.textMuted }]}>Homework & classwork</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </GlassPressable>
          <GlassPressable
            isGlass={isGlass}
            onPress={() => router.push('/(student)/leave' as any)}
            style={[
              styles.leaveRequestCard,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
          >
            <View style={[styles.leaveRequestIcon, isGlass && styles.glassLeaveRequestIcon]}>
              <Ionicons name="calendar-outline" size={22} color={themeColors.accent} />
            </View>
            <View style={styles.leaveRequestContent}>
              <Text style={[styles.leaveRequestTitle, { color: themeColors.text }]}>Request a Leave</Text>
              <Text style={[styles.leaveRequestSubtitle, { color: themeColors.textMuted }]}>Leave requests</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </GlassPressable>

        <View style={styles.quickLinksRow}>
          <GlassPressable
            isGlass={isGlass}
            style={[
              styles.quickLink,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => router.push('/(student)/transcripts' as any)}
          >
            <Ionicons name="document-text-outline" size={20} color={themeColors.info} />
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Transcripts</Text>
          </GlassPressable>
          <GlassPressable
            isGlass={isGlass}
            style={[
              styles.quickLink,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => router.push('/(student)/exams')}
          >
            <Ionicons name="calendar-number-outline" size={20} color={themeColors.warning} />
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Exam Timetable</Text>
          </GlassPressable>
          <GlassPressable
            isGlass={isGlass}
            style={[
              styles.quickLink,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => router.push('/(student)/tests')}
          >
            <Ionicons name="pencil-outline" size={20} color={themeColors.accent} />
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Online Tests</Text>
          </GlassPressable>
          <GlassPressable
            isGlass={isGlass}
            style={[
              styles.quickLink,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            ]}
            onPress={() => router.push('/(student)/vouchers' as any)}
          >
            <Ionicons name="receipt-outline" size={20} color={themeColors.warning} />
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Fees</Text>
          </GlassPressable>
          {snapshot?.coursesEnabled && <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(student)/courses' as any)}>
            <Ionicons name="play-circle-outline" size={20} color={themeColors.info} />
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Courses</Text>
          </GlassPressable>}
          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(student)/timetable' as any)}>
            <Ionicons name="calendar-outline" size={20} color={themeColors.info} />
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>Class Timetable</Text>
          </GlassPressable>
          <GlassPressable isGlass={isGlass} style={[styles.quickLink, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => router.push('/(student)/id-card' as any)}>
            <Ionicons name="id-card-outline" size={20} color={themeColors.accent} />
            <Text style={[styles.quickLinkLabel, { color: themeColors.text }]}>ID Card</Text>
          </GlassPressable>
        </View>

        {!hasPushToken && (
          isGlass ? (
            <GlassCard>
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
            </GlassCard>
          ) : (
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
          )
        )}

        </View>
        <View style={styles.activity}>
        {renderCard('Recent Announcements', (
          <>
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
          </>
        ), { marginBottom: Spacing.md })}


        {renderCard('Pending Assignments', (
          <>
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
    marginTop: Spacing.md,
  },
  grid: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  workspace: { gap: 28 },
  workspaceWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 40 },
  shortcuts: { gap: 12 },
  shortcutsWide: { width: 340, flexShrink: 0 },
  activity: { flex: 1, minWidth: 0, gap: 12 },
  sectionLabel: { fontFamily: Typography.fontFamilyDisplay, fontSize: 20, marginTop: 6, marginBottom: 4 },
  leaveRequestCard: {
    minHeight: 70,
    marginTop: Spacing.xs,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  leaveRequestIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassLeaveRequestIcon: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  leaveRequestContent: {
    flex: 1,
  },
  leaveRequestTitle: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  },
  leaveRequestSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    marginBottom: 0,
  },
  compactStatValue: {
    fontSize: 30,
    lineHeight: 36,
  },
  compactStatCard: {
    minHeight: 112,
    padding: Spacing.md,
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
    flexWrap: 'wrap',
    gap: 1,
  },
  quickLink: {
    flexBasis: '30%',
    flexGrow: 1,
    minHeight: 100,
    padding: 10,
    borderRadius: 0,
    borderWidth: 0,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  quickLinkLabel: {
    flexShrink: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textAlign: 'center',
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
  glassCardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.sm,
  },
  graduateBanner: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  graduateIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  graduateTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  graduateText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  graduateAction: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  graduateActionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graduateActionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    marginBottom: 2,
  },
  graduateActionSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
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
