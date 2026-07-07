import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonTable } from '@/components/ui/Skeleton';

type MarkRecord = {
  id: number;
  marksObtained: number;
  totalMarks: number;
  testTitle: string;
  testDate: string;
  testType: string;
  subjectName: string;
};

export default function MarksScreen() {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      const data = await apiClient('/api/student/marks');
      setMarks(data.marks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load marks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMarks();
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const filteredMarks = marks.filter((item) => {
    const d = new Date(item.testDate);
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
  });

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Calculate subject-wise report
  const subjectReport: Record<string, { totalObtained: number, totalMax: number }> = {};
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
      render: (item) => <Text style={{ color: themeColors.textMuted, fontSize: 11 }}>{new Date(item.testDate).toLocaleDateString()}</Text>
    },
    { key: 'subjectName', title: 'Subject', flex: 1 },
    {
      key: 'testTitle',
      title: 'Test',
      flex: 1,
      render: (item) => (
        <Text style={[styles.testTitleCell, { color: themeColors.text }]} numberOfLines={2}>
          {item.testTitle}
        </Text>
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
      }
    },
  ];

  return (
    <ScreenShell
      title="Academic Marks"
      subtitle={monthName}
      eyebrow="Performance"
      icon={<Ionicons name="ribbon-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={prevMonth}>
              <Ionicons name="chevron-back" size={18} color={themeColors.accent} />
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: themeColors.text }]}>{monthName}</Text>
            <TouchableOpacity style={[styles.navBtn, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={nextMonth}>
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
    lineHeight: 16,
  },
  emptyResults: {
    minHeight: 140,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyResultsText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
});
