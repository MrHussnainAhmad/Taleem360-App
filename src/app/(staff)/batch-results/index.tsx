import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

type BatchExamSubject = {
  id: number;
  maxMarks: number;
  isPublished: boolean;
  reviewDeadline: string;
  subjectName: string;
  examTitle: string;
  className: string;
  sectionName: string | null;
  createdAt: string;
  isEffectivelyPublished: boolean;
};

export default function BatchResultsList() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<BatchExamSubject[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await apiClient('/api/staff/batch-results');
      setResults(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load batch results');
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
    return <SkeletonList rows={4} />;
  }

  return (
    <ScreenShell
      title="Batch Entry"
      subtitle="Review and publish exam results"
      eyebrow="Results"
      icon={<Ionicons name="albums-outline" size={22} color="#FFFFFF" />}
      scrollable={false}
      noSheetPadding
    >
      <FlatList
        data={error ? [] : results}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ gap: Spacing.md, paddingBottom: Spacing.xxl, paddingHorizontal: Spacing.md, paddingTop: Spacing.md, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          error ? (
            <View style={styles.center}>
              <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="document-text-outline" size={48} color={themeColors.border} />
              <Text style={[styles.emptyText, { color: themeColors.textMuted, marginTop: Spacing.md }]}>No batch results assigned to you.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
            const isPublished = item.isEffectivelyPublished;
            return (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => router.push(`/(staff)/batch-results/${item.id}` as any)}
              >
                <Card style={styles.card}>
                  <View style={styles.header}>
                    <View style={styles.titleContainer}>
                      <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>{item.examTitle}</Text>
                      <Text style={[styles.subtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {item.className} {item.sectionName ? `- ${item.sectionName}` : ''}
                      </Text>
                    </View>
                    <Badge 
                      label={isPublished ? "Published" : "Pending Review"} 
                      variant={isPublished ? "success" : "warning"} 
                    />
                  </View>
                  
                  <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
                  
                  <View style={styles.details}>
                    <View style={styles.detailItem}>
                      <Ionicons name="book-outline" size={16} color={themeColors.textMuted} />
                      <Text style={[styles.detailText, { color: themeColors.textMuted }]}>{item.subjectName}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="star-outline" size={16} color={themeColors.textMuted} />
                      <Text style={[styles.detailText, { color: themeColors.textMuted }]}>Max Marks: {item.maxMarks}</Text>
                    </View>
                  </View>
                  
                  {!isPublished && (
                    <Text style={[styles.deadline, { color: themeColors.error }]}>
                      Review Deadline: {new Date(item.reviewDeadline).toLocaleString()}
                    </Text>
                  )}
                </Card>
              </TouchableOpacity>
            );
          }}
        />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    marginTop: 100,
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    textAlign: 'center',
  },
  card: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    marginBottom: 2,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.sm,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  deadline: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    marginTop: Spacing.sm,
  }
});
