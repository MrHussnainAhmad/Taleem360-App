import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, StyleSheet, RefreshControl, TouchableOpacity, Linking, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
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
  referenceFileUrl: string | null;
  referenceFileName: string | null;
  submission: { id: number; fileKey: string; fileUrl: string | null; createdAt: string } | null;
};

export default function SubmissionsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [moreBusy, setMoreBusy] = useState(false);
  const fetchAssignments = async (cursor?: string) => {
    setMoreBusy(true);
    setError('');
    try {
      const data = await apiClient(
        '/api/student/submissions' + (cursor ? '?cursor=' + encodeURIComponent(cursor) : ''),
      );
      setAssignments((old) => (cursor ? [...old, ...(data.assignments || [])] : data.assignments || []));
      setNextCursor(data.nextCursor || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setMoreBusy(false);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchAssignments();
  }, []);

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
      scrollable={false}
    >
      <FlatList
          testID="performance-list"
        data={loading && !refreshing ? [] : assignments}
        keyExtractor={(item) => String(item.id)}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={error ? <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text> : null}
        ListEmptyComponent={loading && !refreshing ? <SkeletonList rows={5} /> : <View style={styles.center}><Text style={{ color: themeColors.textMuted }}>No assignments found.</Text></View>}
        ListFooterComponent={<View>
          {nextCursor ? <Button title="Load more" loading={moreBusy} onPress={() => void fetchAssignments(nextCursor)} /> : null}
          {error ? <Button title="Retry" onPress={() => void fetchAssignments()} /> : null}
        </View>}
        renderItem={({ item: assignment }) => {
            const isSubmitted = !!assignment.submission;
            const isLateSubmission =
              isSubmitted && new Date(assignment.submission!.createdAt) > new Date(assignment.dueAt);
            const isOverdue = new Date(assignment.dueAt) < new Date() && !isSubmitted;

            return (
              <Card key={assignment.id} style={styles.card}>
                <View style={styles.header}>
                  <Text style={[styles.subject, { color: themeColors.textMuted }]}>
                    {assignment.subjectName}
                  </Text>
                  <Badge
                    label={
                      isLateSubmission
                        ? 'Late Submitted'
                        : isSubmitted
                          ? 'Submitted'
                          : isOverdue
                            ? 'Overdue'
                            : 'Pending'
                    }
                    variant={
                      isLateSubmission ? 'warning' : isSubmitted ? 'success' : isOverdue ? 'error' : 'warning'
                    }
                  />
                </View>
                <Text style={[styles.cardTitle, { color: themeColors.text }]}>{assignment.title}</Text>
                {assignment.description ? (
                  <Text style={[styles.description, { color: themeColors.textMuted }]} numberOfLines={2}>
                    {assignment.description}
                  </Text>
                ) : null}
                {assignment.referenceFileUrl ? (
                  <TouchableOpacity
                    style={styles.referenceLink}
                    onPress={() =>
                      Linking.openURL(assignment.referenceFileUrl!).catch(() =>
                        Alert.alert('Error', 'Could not open the reference file.'),
                      )
                    }
                  >
                    <Ionicons name="download-outline" size={16} color={themeColors.primary} />
                    <Text
                      style={[styles.referenceLinkText, { color: themeColors.primary }]}
                      numberOfLines={1}
                    >
                      {assignment.referenceFileName || 'Download reference file'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {assignment.submission ? (
                  <TouchableOpacity
                    style={styles.submissionLink}
                    onPress={() => {
                      const submittedFile = assignment.submission?.fileUrl;
                      if (!submittedFile || typeof submittedFile !== 'string') {
                        Alert.alert(
                          'File unavailable',
                          'This submission does not have an accessible file attached.',
                        );
                        return;
                      }
                      Linking.openURL(submittedFile).catch(() =>
                        Alert.alert('Error', 'Could not open your submitted file.'),
                      );
                    }}
                  >
                    <Ionicons name="document-attach-outline" size={16} color={themeColors.success} />
                    <Text
                      style={[styles.submissionLinkText, { color: themeColors.success }]}
                      numberOfLines={1}
                    >
                      View submitted file
                    </Text>
                    <Ionicons name="open-outline" size={15} color={themeColors.success} />
                  </TouchableOpacity>
                ) : null}

                <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
                  <Text
                    style={[
                      styles.dateText,
                      { color: isOverdue ? themeColors.error : themeColors.textMuted },
                    ]}
                  >
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
        }}
      />
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
  },
  referenceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  referenceLinkText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  submissionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  submissionLinkText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
});
