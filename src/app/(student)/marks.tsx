import { useThemeColors } from '@/context/ThemePreferencesContext';
import React from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { fetchStudentMarksPage, useMonthWindowRecords } from '@/hooks/useMonthWindowRecords';

type MarkRecord = {
  id: number;
  testId?: number;
  marksObtained: number;
  totalMarks: number;
  testTitle: string;
  testDate: string;
  testType: string;
  subjectName: string;
  isOnline?: boolean;
  onlineTestId?: number;
};

export default function MarksScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const {
    viewMonth,
    filtered: filteredMarks,
    loading,
    refreshing,
    error,
    goPrevMonth,
    goNextMonth,
    refresh,
  } = useMonthWindowRecords<MarkRecord>({
    monthsBack: 0,
    fetchPage: fetchStudentMarksPage,
    getItemMonth: (item) => new Date(item.testDate),
  });

  const monthName = viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const subjectReport: Record<string, { totalObtained: number; totalMax: number }> = {};
  filteredMarks.forEach((m) => {
    if (!subjectReport[m.subjectName]) {
      subjectReport[m.subjectName] = { totalObtained: 0, totalMax: 0 };
    }
    subjectReport[m.subjectName].totalObtained += m.marksObtained;
    subjectReport[m.subjectName].totalMax += m.totalMarks;
  });

  const reportItems = Object.entries(subjectReport).map(([subject, stats]) => ({
    subject,
    percentage: Math.round((stats.totalObtained / stats.totalMax) * 100),
  }));

  const formatTestType = (type: string) =>
    type
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const testTypes = Array.from(new Set(filteredMarks.map((item) => item.testType).filter(Boolean)));
  const resultsTitle = testTypes.length > 0
    ? `${testTypes.map(formatTestType).join(' / ')} Test Results`
    : 'Test Results';

  const columns: Column<MarkRecord>[] = [
    {
      key: 'testDate',
      title: 'Date',
      width: 60,
      render: (item) => (
        <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>
          {new Date(item.testDate).toLocaleDateString()}
        </Text>
      ),
    },
    { key: 'subjectName', title: 'Subject', flex: 1 },
    {
      key: 'testTitle',
      title: 'Test',
      flex: 1,
      render: (item) => (
        <TouchableOpacity
          disabled={!item.isOnline || !item.onlineTestId}
          onPress={() => item.isOnline && item.onlineTestId && router.push(`/test/${item.onlineTestId}`)}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
            <Text style={[styles.testTitleCell, { color: themeColors.text }]} numberOfLines={2}>
              {item.testTitle}
            </Text>
            {item.isOnline && (
              <View style={{ backgroundColor: themeColors.primary + '20', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                <Text style={{ color: themeColors.primary, fontSize: 10, fontFamily: Typography.fontFamilyMedium }}>Online</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ),
    },
    {
      key: 'marksObtained',
      title: 'Score',
      width: 80,
      render: (item) => {
        const percentage = (item.marksObtained / item.totalMarks) * 100;
        let color = themeColors.text;
        if (percentage >= 80) color = themeColors.success;
        else if (percentage < 50) color = themeColors.error;

        return (
          <Text style={{ color, fontFamily: Typography.fontFamilySemiBold, fontSize: 13 }}>
            {item.marksObtained} / {item.totalMarks}
          </Text>
        );
      },
    },
  ];

  return (
    <ScreenShell
      title="Academic Marks"
      subtitle={monthName}
      eyebrow="Performance"
      icon={<Ionicons name="ribbon-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
    >
      {loading && !refreshing ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.monthSelector}>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={goPrevMonth}>
              <Ionicons name="chevron-back" size={18} color={themeColors.accent} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: themeColors.text }]}>{monthName}</Text>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={goNextMonth}>
              <Ionicons name="chevron-forward" size={18} color={themeColors.accent} />
            </TouchableOpacity>
          </View>

          {reportItems.length > 0 && (
            <Card title="Subject-wise Report" style={{ marginBottom: Spacing.md }}>
              <View style={styles.reportGrid}>
                {reportItems.map((item, idx) => (
                  <View key={idx} style={styles.reportItem}>
                    <Text style={[styles.reportSubject, { color: themeColors.text }]}>{item.subject}</Text>
                    <Text style={[styles.reportScore, { color: item.percentage < 50 ? themeColors.error : themeColors.success }]}>
                      {item.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.push('/(student)/transcripts' as any)}
            style={{ marginBottom: Spacing.md }}
          >
            <Card title="Batch Results (Terms)">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, gap: Spacing.sm }}>
                <Text style={{ color: themeColors.textMuted, flex: 1 }}>
                  Tap to open transcripts. Nothing is fetched until you open that screen.
                </Text>
                <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
              </View>
            </Card>
          </TouchableOpacity>

          <Card title={resultsTitle} noPadding style={{ flex: 1 }}>
            {filteredMarks.length > 0 ? (
              <Table
                columns={columns}
                data={filteredMarks}
                keyExtractor={(item) => String(item.id)}
                style={{ borderWidth: 0 }}
              />
            ) : (
              <View style={styles.emptyResults}>
                <Text style={[styles.emptyResultsText, { color: themeColors.textMuted }]}>No tests taken in this month.</Text>
              </View>
            )}
          </Card>
        </>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  monthText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  reportItem: {
    width: '45%',
    marginBottom: Spacing.sm,
  },
  reportSubject: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: 4,
  },
  reportScore: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
  },
  testTitleCell: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
  },
  emptyResults: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
});
