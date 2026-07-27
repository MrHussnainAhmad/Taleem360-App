import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Ionicons } from '@expo/vector-icons';
import { useHoldToRefresh } from '@/components/ui/useHoldToRefresh';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type Exam = {
  id: number;
  title: string;
  type?: string;
  createdAt: string;
  subjects: any[];
  totalMax?: number;
  totalObtained?: number;
  percentage?: number;
};

export default function StudentTranscripts() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchTranscripts = async () => {
    try {
      const data = await apiClient('/api/student/transcripts');
      setExams(data || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load transcripts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchTranscripts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTranscripts();
  };
  const holdToRefresh = useHoldToRefresh(onRefresh);

  if (loading && !refreshing) {
    return <ScreenShell title="Transcripts"><SkeletonList rows={4} /></ScreenShell>;
  }

  return (
    <ScreenShell
      title="Transcripts"
      subtitle="View your exam transcripts"
      icon={<Ionicons name="document-text-outline" size={22} color="#FFFFFF" />}
      noSheetPadding
    >
      <FlatList
        data={exams}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} {...holdToRefresh.refreshControlProps} />}
        {...holdToRefresh.scrollProps}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={themeColors.textMuted} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyStateTitle, { color: themeColors.text }]}>No Transcripts Found</Text>
            <Text style={[styles.emptyStateDesc, { color: themeColors.textMuted }]}>
              Transcripts will appear here once all subject results for a term are published.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push(`/(student)/transcript/${item.id}` as any)}
          >
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.primaryBg }]}>
                  <Ionicons name="school-outline" size={24} color={themeColors.primary} />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>{item.title}</Text>
                    {item.type ? <Badge label={item.type} variant={item.type === 'PROMOTION' ? 'warning' : 'info'} /> : null}
                  </View>
                  <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                    Published on {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  {item.totalMax !== undefined && (
                    <Text style={{ color: themeColors.textMuted, fontSize: Typography.size.xs, marginTop: 4 }}>
                      Score: {item.totalObtained} / {item.totalMax} ({item.percentage}%)
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    flex: 1,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyStateTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.xs,
  },
  emptyStateDesc: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
