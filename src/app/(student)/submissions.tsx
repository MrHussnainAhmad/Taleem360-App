import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonList } from '@/components/ui/Skeleton';

type Assignment = {
  id: number;
  title: string;
  description: string;
  dueAt: string;
  subjectName: string;
  submission: { id: number; createdAt: string } | null;
};

export default function SubmissionsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAssignments();
    }, [])
  );

  const fetchAssignments = async () => {
    try {
      const data = await apiClient('/api/student/submissions');
      setAssignments(data.assignments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  return (
    <ScreenShell
      title="Submissions"
      subtitle="Assignments and uploaded work."
      eyebrow="Student workflow"
      icon={<Ionicons name="document-attach-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading && !refreshing ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : assignments.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: themeColors.textMuted }}>No assignments found.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {assignments.map(assignment => {
            const isSubmitted = !!assignment.submission;
            const isLateSubmission = isSubmitted && new Date(assignment.submission!.createdAt) > new Date(assignment.dueAt);
            const isOverdue = new Date(assignment.dueAt) < new Date() && !isSubmitted;

            return (
              <Card key={assignment.id} style={styles.card}>
                <View style={styles.header}>
                  <Text style={[styles.subject, { color: themeColors.textMuted }]}>{assignment.subjectName}</Text>
                  <Badge 
                    label={isLateSubmission ? 'Late Submitted' : isSubmitted ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'} 
                    variant={isLateSubmission ? 'warning' : isSubmitted ? 'success' : isOverdue ? 'error' : 'warning'} 
                  />
                </View>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>{assignment.title}</Text>
                {assignment.description ? (
                  <Text style={[styles.description, { color: themeColors.textMuted }]} numberOfLines={2}>
                    {assignment.description}
                  </Text>
                ) : null}
                
                <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                  <Text style={[styles.dateText, { color: isOverdue ? themeColors.error : themeColors.textMuted }]}>
                    Due: {new Date(assignment.dueAt).toLocaleString()}
                  </Text>
                  
                  {!isSubmitted && (
                    <Button 
                      title="Submit" 
                      onPress={() => router.push(`/(student)/submit/${assignment.id}`)} 
                      style={{ height: 32, paddingHorizontal: 16 }} 
                      textStyle={{ fontSize: 13 }} 
                    />
                  )}
                </View>
              </Card>
            );
          })}
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
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.lg,
  },
  center: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subject: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  dateText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
  }
});
