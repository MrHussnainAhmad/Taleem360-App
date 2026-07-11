import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { ScheduleTimeline } from '@/components/ui/ScheduleTimeline';
import { SkeletonPage } from '@/components/ui/Skeleton';

type ExamRow = {
  id: number;
  title: string;
  type: string;
  date: string;
  endDate: string | null;
  maxMarks: number;
  className: string;
  subjectName: string | null;
};

export default function StudentExams() {
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = async () => {
    try {
      const data = await apiClient('/api/student/exams');
      setExams(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExams();
  };

  if (loading && !refreshing) {
    return <SkeletonPage title="Exam Timetable" subtitle="Loading published schedule." eyebrow="Student schedule" iconName="calendar-number-outline" variant="schedule" rows={4} />;
  }

  return (
    <ScreenShell
      title="Exam Timetable"
      subtitle="Monthly, Mid, and Final papers arranged by date and subject."
      eyebrow="Student schedule"
      icon={<Ionicons name="calendar-number-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : exams.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
            No active institution exam timetable has been published for your class yet.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Ionicons name="calendar-number-outline" size={18} color={themeColors.accent} />
            </View>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Published Schedule</Text>
          </View>
          <ScheduleTimeline
            items={exams.map((exam) => {
              const startDate = new Date(exam.date).toLocaleDateString();
              const endDate = exam.endDate ? new Date(exam.endDate).toLocaleDateString() : '';
              return {
                id: String(exam.id),
                marker: endDate ? `${startDate}\n${endDate}` : startDate,
                title: exam.title,
                subtitle: exam.subjectName || 'Subject not assigned',
                meta: `${exam.maxMarks} marks`,
                badge: exam.type,
                tone: 'info',
              };
            })}
          />
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    padding: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.lg,
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
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  emptyText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
    textAlign: 'center',
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.base,
  }
});
