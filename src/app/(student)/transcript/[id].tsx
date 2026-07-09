import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, useColorScheme, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonPage } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function TranscriptDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDetails = async () => {
    try {
      const res = await apiClient(`/api/student/transcripts/${id}`);
      setData(res);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load transcript');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetails();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  if (loading && !refreshing) {
    return <SkeletonPage title="Transcript" subtitle="Loading results..." iconName="document-text-outline" />;
  }

  if (error && !refreshing) {
    return (
      <ScreenShell title="Not Found" noSheetPadding>
        <View style={[styles.center, { backgroundColor: themeColors.background }]}>
          <Text style={{ color: themeColors.error, fontFamily: Typography.fontFamilyMedium, fontSize: 16 }}>{error}</Text>
        </View>
      </ScreenShell>
    );
  }

  if (!data) return null;

  const totalMax = data.results.reduce((acc: number, r: any) => acc + r.maxMarks, 0);
  const totalObtained = data.results.reduce((acc: number, r: any) => acc + r.marksObtained, 0);
  const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : '0.0';

  return (
    <ScreenShell
      title={data.examTitle}
      subtitle={new Date(data.examCreatedAt).toLocaleDateString()}
      icon={<Ionicons name="book-outline" size={22} color="#FFFFFF" />}
      headerScrollable
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.container}>
        <View style={[styles.headerBox, { backgroundColor: themeColors.primaryBg }]}>
          <Ionicons name="school" size={40} color={themeColors.primary} style={{ marginBottom: 10 }} />
          <Text style={[styles.examTitle, { color: themeColors.primary }]}>{data.examTitle}</Text>
          <Text style={[styles.examDate, { color: themeColors.primary, opacity: 0.8 }]}>
            Issued on {new Date(data.examCreatedAt).toLocaleDateString()}
          </Text>
        </View>

        <Card style={styles.resultsCard} noPadding>
          <View style={[styles.tableHeader, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
            <Text style={[styles.headerCell, styles.cellSubject, { color: themeColors.textMuted }]}>Subject</Text>
            <Text style={[styles.headerCell, styles.cellMarks, { color: themeColors.textMuted }]}>Total</Text>
            <Text style={[styles.headerCell, styles.cellMarks, { color: themeColors.textMuted }]}>Score</Text>
          </View>
          
          <View>
            {data.results.map((r: any, idx: number) => (
              <View 
                key={idx} 
                style={[
                  styles.tableRow, 
                  { borderBottomColor: themeColors.border },
                  idx === data.results.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <Text style={[styles.cell, styles.cellSubject, { color: themeColors.text, fontFamily: Typography.fontFamilySemiBold }]}>
                  {r.subjectName}
                </Text>
                <Text style={[styles.cell, styles.cellMarks, { color: themeColors.textMuted }]}>
                  {r.maxMarks}
                </Text>
                <Text style={[styles.cell, styles.cellMarks, { color: themeColors.text, fontFamily: Typography.fontFamilyBold }]}>
                  {r.marksObtained}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.tableFooter, { backgroundColor: themeColors.primary, borderTopColor: themeColors.border }]}>
            <Text style={[styles.footerCell, styles.cellSubject, { color: '#FFFFFF' }]}>Overall Total</Text>
            <Text style={[styles.footerCell, styles.cellMarks, { color: 'rgba(255,255,255,0.8)' }]}>{totalMax}</Text>
            <Text style={[styles.footerCell, styles.cellMarks, { color: '#FFFFFF' }]}>{totalObtained}</Text>
          </View>
        </Card>

        <View style={[styles.summaryBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Percentage</Text>
          <Text style={[styles.summaryValue, { color: themeColors.primary }]}>{percentage}%</Text>
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  container: {
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerBox: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
  },
  examTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    textAlign: 'center',
    marginBottom: 4,
  },
  examDate: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  resultsCard: {
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  tableFooter: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 2,
  },
  headerCell: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: Typography.size.sm,
  },
  footerCell: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
  },
  cellSubject: {
    flex: 2,
  },
  cellMarks: {
    flex: 1,
    textAlign: 'right',
  },
  summaryBox: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerAction: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  summaryValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xxl,
  },
});
