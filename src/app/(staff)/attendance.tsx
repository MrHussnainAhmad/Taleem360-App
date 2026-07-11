import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonPage } from '@/components/ui/Skeleton';

type ClassAttendanceRecord = {
  id: number;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  studentName: string;
  sectionId: number;
  sectionName: string;
};

type AssignedSection = {
  id: number;
  name: string;
  classId: number;
  className: string;
};

type Student = {
  id: number;
  name: string;
  loginRollNumber: string;
  sectionId: number;
};

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';

export default function AttendanceScreen() {
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'MARK' | 'HISTORY'>('MARK');

  const [attendanceHistory, setAttendanceHistory] = useState<ClassAttendanceRecord[]>([]);
  const [assignedSections, setAssignedSections] = useState<AssignedSection[]>([]);
  const [studentsBySection, setStudentsBySection] = useState<Record<number, Student[]>>({});
  
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  
  // State for marking attendance
  // { studentId: status }
  const [attendanceMarks, setAttendanceMarks] = useState<Record<number, AttendanceStatus>>({});

  // Filter date for history
  const [historyDate, setHistoryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await apiClient('/api/staff/attendance');
      setAttendanceHistory(data.attendance || []);
      setAssignedSections(data.assignedSections || []);
      setStudentsBySection(data.studentsBySection || {});
      
      if (data.assignedSections && data.assignedSections.length > 0 && !selectedSectionId) {
        setSelectedSectionId(data.assignedSections[0].id);
        
        // Initialize attendance marks for the first section
        const students = data.studentsBySection[data.assignedSections[0].id] || [];
        const initialMarks: Record<number, AttendanceStatus> = {};
        students.forEach((s: Student) => initialMarks[s.id] = 'PRESENT');
        setAttendanceMarks(initialMarks);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSectionSelect = (sectionId: number) => {
    setSelectedSectionId(sectionId);
    // Initialize marks for this section
    const students = studentsBySection[sectionId] || [];
    const initialMarks: Record<number, AttendanceStatus> = {};
    students.forEach((s: Student) => initialMarks[s.id] = 'PRESENT');
    setAttendanceMarks(initialMarks);
  };

  const setStudentStatus = (studentId: number, status: AttendanceStatus) => {
    setAttendanceMarks(prev => ({ ...prev, [studentId]: status }));
  };

  const submitAttendance = async () => {
    if (!selectedSectionId) return;
    
    setSubmitting(true);
    try {
      const records = Object.entries(attendanceMarks).map(([studentId, status]) => ({
        studentId: parseInt(studentId),
        status
      }));

      await apiClient('/api/staff/attendance', {
        method: 'POST',
        body: JSON.stringify({
          sectionId: selectedSectionId,
          date: new Date().toISOString(),
          records
        })
      });

      Alert.alert('Success', 'Attendance marked successfully.');
      // Switch back to history to see it
      setActiveTab('HISTORY');
      fetchData(); // Refresh history
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<ClassAttendanceRecord>[] = [
    { 
      key: 'date', 
      title: 'Date', 
      width: 100,
      render: (item) => <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>{new Date(item.date).toLocaleDateString()}</Text>
    },
    { key: 'studentName', title: 'Student', flex: 1 },
    { key: 'sectionName', title: 'Class', width: 60 },
    { 
      key: 'status', 
      title: 'Status', 
      width: 80,
      render: (item) => {
        let variant: 'success' | 'error' | 'warning' | 'info' = 'info';
        if (item.status === 'PRESENT') variant = 'success';
        if (item.status === 'ABSENT') variant = 'error';
        if (item.status === 'LATE') variant = 'warning';
        return <Badge label={item.status} variant={variant} />;
      }
    },
  ];

  if (loading && !refreshing) {
    return <SkeletonPage title="Class Attendance" subtitle="Loading class records." eyebrow="Staff operations" iconName="checkmark-circle-outline" variant="table" rows={6} />;
  }

  const currentStudents = selectedSectionId ? (studentsBySection[selectedSectionId] || []) : [];

  const todayStr = new Date().toISOString().split('T')[0];
  const isAlreadyMarked = attendanceHistory.some(r => r.date === todayStr && r.sectionId === selectedSectionId);

  const filteredHistory = attendanceHistory.filter(r => r.date === historyDate);

  const changeDate = (days: number) => {
    const d = new Date(historyDate);
    d.setDate(d.getDate() + days);
    setHistoryDate(d.toISOString().split('T')[0]);
  };

  return (
    <ScreenShell
      title="Class Attendance"
      subtitle={activeTab === 'MARK' ? 'Mark daily class presence.' : 'Review attendance history.'}
      eyebrow="Staff operations"
      icon={<Ionicons name="checkmark-circle-outline" size={22} color="#FFFFFF" />}
      scrollable={false}
      sheetStyle={styles.shellSheet}
    >
      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'MARK' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('MARK')}
        >
          <Text style={[
            styles.tabText, 
            { color: themeColors.textMuted },
            activeTab === 'MARK' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }
          ]}>Mark Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'HISTORY' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('HISTORY')}
        >
          <Text style={[
            styles.tabText, 
            { color: themeColors.textMuted },
            activeTab === 'HISTORY' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }
          ]}>Recent Records</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : activeTab === 'MARK' ? (
        <ScrollView 
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        >
          {assignedSections.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: themeColors.textMuted }}>You have no assigned classes.</Text>
            </View>
          ) : (
            <>
              {/* Section Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionSelector}>
                {assignedSections.map(sec => (
                  <TouchableOpacity 
                    key={sec.id}
                    style={[
                      styles.sectionChip, 
                      { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                      selectedSectionId === sec.id && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                    ]}
                    onPress={() => handleSectionSelect(sec.id)}
                  >
                    <Text style={[
                      styles.sectionChipText, 
                      { color: themeColors.text },
                      selectedSectionId === sec.id && { color: '#FFF' }
                    ]}>
                      {sec.className} - {sec.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {isAlreadyMarked && (
                <View style={[styles.alreadyMarkedContainer, { backgroundColor: themeColors.successBg, borderColor: themeColors.success }]}>
                  <Text style={[styles.alreadyMarkedText, { color: themeColors.success }]}>Attendance has already been marked for this class today.</Text>
                </View>
              )}

              {currentStudents.length === 0 ? (
                <View style={styles.center}>
                  <Text style={{ color: themeColors.textMuted }}>No students found in this class.</Text>
                </View>
              ) : (
                <Card style={{ marginTop: Spacing.md }} noPadding>
                  {currentStudents.map((student, index) => (
                    <View 
                      key={student.id} 
                      style={[
                        styles.studentRow, 
                        { borderBottomColor: themeColors.border },
                        index === currentStudents.length - 1 && { borderBottomWidth: 0 }
                      ]}
                    >
                      <View style={styles.studentInfo}>
                        <Text style={[styles.studentName, { color: themeColors.text }]}>{student.name}</Text>
                        <Text style={[styles.studentRoll, { color: themeColors.textMuted }]}>{student.loginRollNumber}</Text>
                      </View>
                      
                      <View style={styles.statusSegment}>
                        {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] as AttendanceStatus[]).map(status => {
                          const isSelected = attendanceMarks[student.id] === status;
                          
                          let bg = themeColors.surface;
                          let textCol = themeColors.textMuted;
                          
                          if (isSelected) {
                            if (status === 'PRESENT') { bg = themeColors.successBg; textCol = themeColors.success; }
                            else if (status === 'ABSENT') { bg = themeColors.errorBg; textCol = themeColors.error; }
                            else if (status === 'LATE') { bg = themeColors.warningBg; textCol = themeColors.warning; }
                            else { bg = themeColors.primaryBg; textCol = themeColors.primary; }
                          }

                          return (
                            <TouchableOpacity
                              key={status}
                              style={[
                                styles.statusBtn,
                                { backgroundColor: bg },
                                isAlreadyMarked && { opacity: 0.5 }
                              ]}
                              onPress={() => !isAlreadyMarked && setStudentStatus(student.id, status)}
                              disabled={isAlreadyMarked}
                            >
                              <Text style={[styles.statusBtnText, { color: textCol }]}>
                                {status === 'PRESENT' ? 'P' : status === 'ABSENT' ? 'A' : status === 'LATE' ? 'L' : 'V'}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                  
                  <View style={{ padding: Spacing.md, borderTopWidth: 1, borderTopColor: themeColors.border }}>
                    <Button 
                      title={isAlreadyMarked ? "Attendance Marked" : submitting ? "Submitting..." : "Submit Attendance"} 
                      onPress={submitAttendance} 
                      disabled={submitting || isAlreadyMarked}
                    />
                  </View>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      ) : (
        <View style={styles.flex}>
          <View style={[styles.dateFilter, { borderColor: themeColors.border }]}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateBtn}>
              <Text style={{ color: themeColors.primary }}>{"< Prev"}</Text>
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: themeColors.text }]}>{new Date(historyDate).toLocaleDateString()}</Text>
            <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateBtn}>
              <Text style={{ color: themeColors.primary }}>{"Next >"}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.flex}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            <Card noPadding>
              {filteredHistory.length === 0 ? (
                <View style={styles.center}>
                  <Text style={{ color: themeColors.textMuted }}>No records found for this date.</Text>
                </View>
              ) : (
                <Table 
                  columns={columns} 
                  data={filteredHistory} 
                  keyExtractor={(item) => String(item.id)} 
                  style={{ borderWidth: 0 }}
                />
              )}
            </Card>
          </ScrollView>
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  shellSheet: {
    padding: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  sectionSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  sectionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  sectionChipText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  studentRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  studentName: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  studentRoll: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  statusSegment: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBtnText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.sm,
  },
  alreadyMarkedContainer: {
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  alreadyMarkedText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  dateBtn: {
    padding: Spacing.sm,
  },
  dateText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
  }
});
