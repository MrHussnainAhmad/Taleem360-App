import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonTable } from '@/components/ui/Skeleton';

type StudentRoster = {
  id: number;
  name: string;
  rollNumber: string;
  marksObtained: number | null;
};

type ManualTest = {
  id: number;
  title: string;
  type: 'DAILY' | 'WEEKLY' | 'QUIZ';
  maxMarks: string | number;
  date: string;
  className: string;
  sectionName: string;
  subjectName: string;
  uploadedCount: number;
  roster: StudentRoster[];
};

function assembleScopedTest(
  data: {
    tests?: Omit<ManualTest, 'roster' | 'uploadedCount'>[];
    rosters?: Record<string, { id: number; name: string; rollNumber: string }[]>;
    marks?: Record<string, number>;
  },
  testId: number,
  sectionId: number,
): ManualTest | null {
  const row = (data.tests || []).find((item) => item.id === testId);
  if (!row) return null;

  const rosterRows = data.rosters?.[String(sectionId)] || data.rosters?.[sectionId as unknown as string] || [];
  const marksMap = data.marks || {};
  const roster: StudentRoster[] = rosterRows.map((student) => ({
    id: student.id,
    name: student.name,
    rollNumber: student.rollNumber,
    marksObtained: marksMap[`${testId}:${student.id}`] ?? null,
  }));

  return {
    ...row,
    uploadedCount: roster.filter((student) => student.marksObtained !== null).length,
    roster,
  };
}

function buildMarksDraft(roster: StudentRoster[]) {
  const initialDraft: Record<number, string> = {};
  roster.forEach((student) => {
    if (student.marksObtained !== null) {
      initialDraft[student.id] = String(student.marksObtained);
    }
  });
  return initialDraft;
}

export default function MarkEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const testId = Number(params.id);
  const sectionIdParam = params.sectionId ? Number(params.sectionId) : null;
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [test, setTest] = useState<ManualTest | null>(null);
  const [marksDraft, setMarksDraft] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchTest();
  }, [testId, sectionIdParam]);

  const fetchTest = async () => {
    if (!sectionIdParam || !Number.isInteger(sectionIdParam) || sectionIdParam <= 0) {
      setError('Missing class section. Open from Marks list.');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const data = await apiClient(`/api/staff/marks?sectionId=${sectionIdParam}&testId=${testId}`);
      const found = assembleScopedTest(data, testId, sectionIdParam);
      if (!found) {
        setError('Assessment not found.');
        return;
      }
      setTest(found);
      setMarksDraft(buildMarksDraft(found.roster));
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTest();
  };

  const handleSaveMarks = async () => {
    if (!test) return;

    const records = Object.keys(marksDraft)
      .map((studentId) => ({
        studentId: Number(studentId),
        marksObtained: Number(marksDraft[Number(studentId)]),
      }))
      .filter((record) => !Number.isNaN(record.marksObtained));

    if (records.length === 0) {
      Alert.alert('Info', 'No marks entered to save.');
      return;
    }

    setSaving(true);
    try {
      await apiClient(`/api/staff/marks/${test.id}`, {
        method: 'POST',
        body: JSON.stringify({ records }),
      });

      Alert.alert('Success', 'Marks saved successfully.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const maxMarks = Number(test?.maxMarks || 0);
  const completedCount = test ? Object.values(marksDraft).filter((value) => value.trim() !== '').length : 0;

  return (
    <ScreenShell
      title="Enter Marks"
      subtitle={test ? `${test.className} - ${test.sectionName}` : 'Load assessment roster.'}
      eyebrow="Staff operations"
      icon={<Ionicons name="create-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      actions={
        <TouchableOpacity style={styles.headerAction} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      }
    >
      {loading && !refreshing ? (
        <SkeletonTable rows={6} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : test ? (
        <>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryTitleWrap}>
                <Text style={[styles.subject, { color: themeColors.textMuted }]}>{test.subjectName || 'Subject'} | {test.type}</Text>
                <Text style={[styles.testTitle, { color: themeColors.text }]}>{test.title}</Text>
                <Text style={[styles.detailText, { color: themeColors.textMuted }]}>
                  {new Date(test.date).toLocaleDateString()} - {test.maxMarks} marks
                </Text>
              </View>
              <View style={[styles.progressPill, { borderColor: themeColors.border }]}>
                <Text style={[styles.progressText, { color: themeColors.accent }]}>{completedCount}/{test.roster.length}</Text>
                <Text style={[styles.progressLabel, { color: themeColors.textMuted }]}>entered</Text>
              </View>
            </View>
          </Card>

          <Card noPadding style={styles.rosterCard}>
            <View style={[styles.tableHeader, { borderBottomColor: themeColors.border }]}>
              <Text style={[styles.tableHeaderText, { width: 58, color: themeColors.textMuted }]}>Roll</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, color: themeColors.textMuted }]}>Student</Text>
              <Text style={[styles.tableHeaderText, { width: 84, color: themeColors.textMuted, textAlign: 'right' }]}>Score</Text>
            </View>

            {test.roster.length === 0 ? (
              <View style={styles.center}>
                <Text style={{ color: themeColors.textMuted }}>No students found for this class.</Text>
              </View>
            ) : (
              test.roster.map((student, index) => (
                <View
                  key={student.id}
                  style={[
                    styles.studentRow,
                    { borderBottomColor: themeColors.border },
                    index === test.roster.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={[styles.rollText, { color: themeColors.text }]}>{student.rollNumber}</Text>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, { color: themeColors.text }]} numberOfLines={1}>{student.name}</Text>
                    <Text style={[styles.studentMeta, { color: themeColors.textMuted }]}>Max {maxMarks || test.maxMarks}</Text>
                  </View>
                  <TextInput
                    style={[styles.scoreInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={themeColors.textMuted}
                    value={marksDraft[student.id] || ''}
                    onChangeText={(value) => setMarksDraft((prev) => ({ ...prev, [student.id]: value }))}
                    textAlign="right"
                  />
                </View>
              ))
            )}
          </Card>

          <Button
            title={saving ? 'Saving Marks...' : 'Save Marks'}
            onPress={handleSaveMarks}
            disabled={saving || test.roster.length === 0}
            style={styles.saveButton}
          />
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  headerAction: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  center: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
    textAlign: 'center',
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryTitleWrap: {
    flex: 1,
  },
  subject: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  testTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.xs,
  },
  detailText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  progressPill: {
    minWidth: 74,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  progressText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
  },
  progressLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
  },
  rosterCard: {
    marginBottom: Spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  rollText: {
    width: 58,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  studentMeta: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  scoreInput: {
    width: 84,
    height: 38,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  saveButton: {
    height: 46,
    marginBottom: Spacing.xl,
  },
});
