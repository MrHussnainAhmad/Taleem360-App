import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, useColorScheme, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonPage } from '@/components/ui/Skeleton';

type OnlineTestRow = {
  onlineTest: {
    id: number;
    mode: string;
    durationMinutes: number;
    createdAt: string;
  };
  test: {
    title: string;
    maxMarks: number;
  };
  subjectName: string | null;
  className: string;
  isActive: boolean;
  submission?: {
    id: number;
    status: string;
    totalScore: number;
  };
};

export default function StudentTests() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tests, setTests] = useState<OnlineTestRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTests = async () => {
    try {
      const data = await apiClient('/api/student/tests');
      setTests(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTests();
  };

  const handleStartTest = (testId: number) => {
    router.push(`/test/${testId}`);
  };

  if (loading && !refreshing) {
    return <SkeletonPage title="My Tests" subtitle="Loading hosted tests." eyebrow="Student workflow" iconName="clipboard-outline" variant="cards" rows={5} />;
  }

  // Show all tests so the student can see submitted ones, in-progress ones, or expired ones.
  const visibleTests = tests;

  return (
    <ScreenShell
      title="My Tests"
      subtitle="Start hosted tests and submit answers before the timer ends."
      eyebrow="Student workflow"
      icon={<Ionicons name="clipboard-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : visibleTests.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
            No online tests are available for your class right now.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visibleTests.map((row) => (
            <Card key={row.onlineTest.id} style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.testInfo}>
                  <Text style={[styles.testTitle, { color: themeColors.text }]}>{row.test.title}</Text>
                  <Text style={[styles.testSubtitle, { color: themeColors.textMuted }]}>
                    {row.onlineTest.mode} - {row.subjectName || "Subject"} - {row.test.maxMarks} marks
                  </Text>
                  <View style={styles.durationRow}>
                    <Ionicons name="time-outline" size={14} color={themeColors.textMuted} />
                    <Text style={[styles.durationText, { color: themeColors.textMuted }]}>
                      {row.onlineTest.durationMinutes} minutes
                    </Text>
                  </View>
                </View>
                {row.submission && row.submission.status !== 'IN_PROGRESS' ? (
                  <View style={[styles.statusBadge, { backgroundColor: themeColors.border }]}>
                    <Ionicons name="checkmark-circle" size={16} color={themeColors.success} />
                    <Text style={[styles.statusText, { color: themeColors.text }]}>
                      {row.submission.status} - {row.submission.totalScore}/{row.test.maxMarks}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[
                      styles.startButton, 
                      { backgroundColor: row.isActive || row.submission?.status === 'IN_PROGRESS' ? themeColors.primary : themeColors.border }
                    ]}
                    onPress={() => handleStartTest(row.onlineTest.id)}
                    disabled={!row.isActive && row.submission?.status !== 'IN_PROGRESS'}
                  >
                    <Text style={[styles.startButtonText, { color: row.isActive || row.submission?.status === 'IN_PROGRESS' ? '#fff' : themeColors.textMuted }]}>
                      {row.submission?.status === 'IN_PROGRESS' ? 'Resume' : row.isActive ? 'Start' : 'Expired'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </Card>
          ))}
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
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    padding: 0,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  testInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  testTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    marginBottom: 4,
  },
  testSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    marginBottom: 6,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
  },
  startButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  startButtonText: {
    color: '#fff',
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  statusText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  }
});
