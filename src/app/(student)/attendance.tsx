import { useThemeColors } from '@/context/ThemePreferencesContext';
import React from 'react';
import { View, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { fetchStudentAttendancePage, useMonthWindowRecords } from '@/hooks/useMonthWindowRecords';

type AttendanceRecord = {
  id: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  sectionName: string;
};

export default function AttendanceScreen() {
  const themeColors = useThemeColors();

  const {
    viewMonth,
    filtered: filteredAttendance,
    loading,
    refreshing,
    error,
    goPrevMonth,
    goNextMonth,
    refresh,
  } = useMonthWindowRecords<AttendanceRecord>({
    monthsBack: 0,
    fetchPage: fetchStudentAttendancePage,
    getItemMonth: (item) => new Date(item.date),
  });

  const totalDays = filteredAttendance.length;
  const presentDays = filteredAttendance.filter((r) => r.status === 'PRESENT').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const monthName = viewMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const columns: Column<AttendanceRecord>[] = [
    { 
      key: 'date', 
      title: 'Date', 
      width: 100,
      render: (item) => <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>{new Date(item.date).toLocaleDateString()}</Text>
    },
    { key: 'sectionName', title: 'Section', flex: 1 },
    { 
      key: 'status', 
      title: 'Status', 
      width: 80,
      render: (item) => {
        let variant: 'success' | 'error' | 'warning' | 'info' = 'info';
        if (item.status === 'PRESENT') variant = 'success';
        if (item.status === 'ABSENT') variant = 'error';
        if (item.status === 'LATE') variant = 'warning';
        return <Badge label={item.status} variant={variant} style={styles.statusBadge} textStyle={styles.statusBadgeText} />;
      }
    },
  ];

  return (
    <ScreenShell
      title="Attendance"
      subtitle={monthName}
      eyebrow="Academic record"
      icon={<Ionicons name="calendar-outline" size={22} color="#FFFFFF" />}
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
          
          <View style={styles.statsRow}>
            <StatCard label="Total Days" value={totalDays} icon={<Ionicons name="calendar" size={18} color={themeColors.info} />} />
            <StatCard
              label="Percentage"
              value={`${attendancePercentage}%`}
              tone={attendancePercentage < 75 ? 'error' : 'success'}
              icon={<Ionicons name="analytics-outline" size={18} color={attendancePercentage < 75 ? themeColors.error : themeColors.success} />}
            />
          </View>

          <Card title="Monthly Record" noPadding style={{ flex: 1 }}>
            <Table 
              columns={columns} 
              data={filteredAttendance} 
              keyExtractor={(item) => String(item.id)} 
              style={{ borderWidth: 0 }}
            />
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeText: {
    fontSize: 10,
  },
});
