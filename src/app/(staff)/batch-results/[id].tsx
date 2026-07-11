import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type ResultItem = {
  id: number;
  studentId: number;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  isEdited: boolean;
};

type SubjectDetails = {
  id: number;
  isPublished: boolean;
  isEffectivelyPublished: boolean;
  reviewDeadline: string;
  maxMarks: number;
  subjectName: string;
  examTitle: string;
  className: string;
  sectionName: string | null;
};

export default function BatchResultDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState<SubjectDetails | null>(null);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const data = await apiClient(`/api/staff/batch-results/${id}`);
      setSubject(data.subject);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleEditSave = async (resultId: number) => {
    if (!editValue || isNaN(Number(editValue))) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }
    const newMarks = Number(editValue);
    if (newMarks < 0 || newMarks > (subject?.maxMarks || 0)) {
      Alert.alert('Error', `Marks must be between 0 and ${subject?.maxMarks}`);
      return;
    }

    try {
      await apiClient(`/api/staff/batch-results/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ resultId, newMarks })
      });
      
      // Optimistic update
      setResults(prev => prev.map(r => r.id === resultId ? { ...r, marksObtained: newMarks, isEdited: true } : r));
      setEditingId(null);
      setEditValue('');
      Alert.alert('Success', 'Marks updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update marks');
    }
  };

  const handlePublish = () => {
    Alert.alert(
      "Publish Results",
      "Are you sure you want to publish these results? Once published, they cannot be edited and will be available to students.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Publish", 
          style: "destructive",
          onPress: async () => {
            setPublishing(true);
            try {
              await apiClient(`/api/staff/batch-results/${id}`, { method: 'POST' });
              Alert.alert('Success', 'Results published successfully');
              fetchData(); // Refresh to update status
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to publish results');
            } finally {
              setPublishing(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !refreshing) {
    return <SkeletonList rows={6} />;
  }

  if (error) {
    return (
      <ScreenShell title="Details" icon={<Ionicons name="alert-circle-outline" size={22} color="#FFFFFF" />}>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      </ScreenShell>
    );
  }

  if (!subject) return null;

  const isPublished = subject.isEffectivelyPublished;

  return (
    <ScreenShell
      title={subject.subjectName}
      subtitle={`${subject.className} ${subject.sectionName ? `- ${subject.sectionName}` : ''}`}
      eyebrow={subject.examTitle}
      icon={<Ionicons name="book-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      actions={
        <Badge 
          label={isPublished ? "Published" : "Pending"} 
          variant={isPublished ? "success" : "warning"} 
        />
      }
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Total Students</Text>
          <Text style={[styles.summaryValue, { color: themeColors.text }]}>{results.length}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: themeColors.textMuted }]}>Max Marks</Text>
          <Text style={[styles.summaryValue, { color: themeColors.text }]}>{subject.maxMarks}</Text>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Student Results</Text>
      
      <View style={{ gap: Spacing.sm, paddingBottom: Spacing.xl }}>
        {results.map((item) => (
          <View key={item.id.toString()} style={[styles.resultItem, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={styles.studentInfo}>
              <Text style={[styles.studentName, { color: themeColors.text }]}>{item.studentName}</Text>
              <Text style={[styles.rollNumber, { color: themeColors.textMuted }]}>Roll No: {item.rollNumber}</Text>
            </View>
            
            <View style={styles.marksSection}>
              {editingId === item.id ? (
                <View style={styles.editContainer}>
                  <Input 
                    value={editValue}
                    onChangeText={setEditValue}
                    keyboardType="numeric"
                    containerStyle={styles.editInputContainer}
                    style={styles.editInput}
                    autoFocus
                  />
                  <TouchableOpacity onPress={() => handleEditSave(item.id)} style={[styles.actionIcon, { backgroundColor: themeColors.success + '20' }]}>
                    <Ionicons name="checkmark" size={18} color={themeColors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)} style={[styles.actionIcon, { backgroundColor: themeColors.error + '20' }]}>
                    <Ionicons name="close" size={18} color={themeColors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.displayContainer}>
                  <Text style={[styles.marksValue, { color: themeColors.primary }]}>
                    {item.marksObtained}
                  </Text>
                  {!isPublished && !item.isEdited && (
                    <TouchableOpacity onPress={() => { setEditingId(item.id); setEditValue(item.marksObtained.toString()); }} style={{ marginLeft: Spacing.sm }}>
                      <Ionicons name="pencil" size={16} color={themeColors.textMuted} />
                    </TouchableOpacity>
                  )}
                  {item.isEdited && (
                    <Badge label="Edited" variant="info" style={{ marginLeft: Spacing.sm, paddingHorizontal: 6, paddingVertical: 2, transform: [{scale: 0.8}] }} />
                  )}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>

      {!isPublished && (
        <View style={styles.footerAction}>
          <Text style={[styles.deadlineWarning, { color: themeColors.error }]}>
            Review deadline: {new Date(subject.reviewDeadline).toLocaleString()}
          </Text>
          <Button 
            title={publishing ? "Publishing..." : "Publish Results"} 
            onPress={handlePublish} 
            disabled={publishing}
            style={{ width: '100%' }}
          />
        </View>
      )}
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
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.md,
    marginBottom: Spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
    marginBottom: 2,
  },
  rollNumber: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  marksSection: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marksValue: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editInputContainer: {
    marginBottom: 0,
    minWidth: 60,
  },
  editInput: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
    height: 32,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerAction: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    alignItems: 'center',
  },
  deadlineWarning: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
    textAlign: 'center',
  }
});
