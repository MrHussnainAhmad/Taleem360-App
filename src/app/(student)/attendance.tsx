import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { StatCard } from '@/components/ui/StatCard';
import { SkeletonTable } from '@/components/ui/Skeleton';

type AttendanceRecord = {
  id: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  sectionName: string;
};

export default function AttendanceScreen() {
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const data = await apiClient('/api/student/attendance');
      setAttendance(data.attendance || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const filteredAttendance = attendance.filter((item) => {
    const d = new Date(item.date);
    return d.getFullYear() === currentMonth.getFullYear() && d.getMonth() === currentMonth.getMonth();
  });

  const totalDays = filteredAttendance.length;
  const presentDays = filteredAttendance.filter((r) => r.status === 'PRESENT').length;
  const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    marginBottom: 0,
  },
  statContent: {
    padding: Spacing.md,
  },
  statLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  statusBadgeText: {
    fontSize: 10,
  },
});
