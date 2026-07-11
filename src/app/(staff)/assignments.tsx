import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert, Linking, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { CardListSkeleton, FormSkeleton } from '@/components/ui/Skeleton';
import * as DocumentPicker from 'expo-document-picker';

const MAX_REFERENCE_BYTES = 5 * 1024 * 1024;

type StudentBase = {
  studentId: number;
  studentName: string;
  rollNumber: string;
};

type SubmittedStudent = StudentBase & {
  submissionId: number;
  fileKey: string;
  submittedAt: string;
  isLate: boolean;
};

type StaffAssignment = {
  id: number;
  title: string;
  description: string;
  dueAt: string;
  classId: number;
  sectionId: number;
  subjectId: number;
  className: string;
  sectionName: string;
  subjectName: string;
  referenceFileUrl: string | null;
  referenceFileName: string | null;
  submittedStudents: SubmittedStudent[];
  pendingStudents: StudentBase[];
};

type Option = {
  id: number;
  name: string;
  className?: string; // For sections
};

export default function AssignmentsScreen() {
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form State
  const [formSectionId, setFormSectionId] = useState<number | null>(null);
  const [formSubjectId, setFormSubjectId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [referenceFile, setReferenceFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  
  // Default to 7 days from now
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 7);
  const [formDueAt, setFormDueAt] = useState(defaultDate.toISOString().slice(0, 16));
  
  const [submitting, setSubmitting] = useState(false);

  const handlePickReference = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > MAX_REFERENCE_BYTES) {
      Alert.alert('File too large', 'Reference files must be 5MB or smaller.');
      return;
    }
    setReferenceFile(asset);
  };

  const uploadReference = async () => {
    if (!referenceFile) return null;
    const { signature, timestamp, cloudName, apiKey } = await apiClient('/api/upload/signature', { method: 'POST' });
    const formData = new FormData();
    formData.append('file', { uri: referenceFile.uri, name: referenceFile.name, type: referenceFile.mimeType || 'application/octet-stream' } as any);
    formData.append('api_key', apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', 'lms-uploads');
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: 'POST', body: formData });
    const payload = await response.json();
    if (!response.ok || !payload.public_id) throw new Error(payload.error?.message || 'Reference file upload failed');
    return payload.public_id as string;
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await apiClient('/api/staff/assignments');
      setAssignments(data.assignments || []);
      setSectionOptions(data.sectionOptions || []);
      setSubjectOptions(data.subjectOptions || []);
      
      if (data.sectionOptions?.length > 0 && !formSectionId) {
        setFormSectionId(data.sectionOptions[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  const handleCreate = async () => {
    if (!formSectionId || !formTitle.trim() || !formDueAt.trim()) {
      Alert.alert('Error', 'Class/Section, Title, and Due Date are required.');
      return;
    }

    setSubmitting(true);
    try {
      const referenceFileKey = await uploadReference();
      await apiClient('/api/staff/assignments', {
        method: 'POST',
        body: JSON.stringify({
          sectionId: formSectionId,
          subjectId: formSubjectId,
          title: formTitle,
          description: formDescription,
          dueAt: new Date(formDueAt).toISOString(),
          referenceFileKey,
          referenceFileName: referenceFile?.name || null,
        })
      });
      
      Alert.alert('Success', 'Assignment created successfully.');
      
      // Reset form
      setFormTitle('');
      setFormDescription('');
      setReferenceFile(null);
      
      // Refresh list and switch tab
      setActiveTab('LIST');
      fetchAssignments();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open the file."));
  };

  return (
    <ScreenShell
      title="Assignments"
      subtitle={activeTab === 'CREATE' ? 'Create work for your assigned classes.' : 'Track submissions and pending students.'}
      eyebrow="Staff operations"
      icon={<Ionicons name="document-text-outline" size={22} color="#FFFFFF" />}
      scrollable={false}
      sheetStyle={styles.shellSheet}
    >
      <View style={[styles.tabs, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'LIST' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('LIST')}
        >
          <Text style={[
            styles.tabText, 
            { color: themeColors.textMuted },
            activeTab === 'LIST' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }
          ]}>Created Assignments</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CREATE' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('CREATE')}
        >
          <Text style={[
            styles.tabText, 
            { color: themeColors.textMuted },
            activeTab === 'CREATE' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }
          ]}>New Assignment</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : activeTab === 'CREATE' ? (
        loading && !refreshing ? (
          <FormSkeleton />
        ) : (
        <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 100, Spacing.xl * 3) }}>
          <Card>
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.md }]}>Class / Section *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
              {sectionOptions.map(sec => (
                <TouchableOpacity 
                  key={sec.id}
                  style={[
                    styles.chip, 
                    { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                    formSectionId === sec.id && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                  ]}
                  onPress={() => setFormSectionId(sec.id)}
                >
                  <Text style={[
                    styles.chipText, 
                    { color: themeColors.text },
                    formSectionId === sec.id && { color: '#FFF' }
                  ]}>{sec.className} - {sec.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.md }]}>Subject (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
              <TouchableOpacity 
                style={[
                  styles.chip, 
                  { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                  formSubjectId === null && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                ]}
                onPress={() => setFormSubjectId(null)}
              >
                <Text style={[
                  styles.chipText, 
                  { color: themeColors.text },
                  formSubjectId === null && { color: '#FFF' }
                ]}>General</Text>
              </TouchableOpacity>
              {subjectOptions.map(sub => (
                <TouchableOpacity 
                  key={sub.id}
                  style={[
                    styles.chip, 
                    { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                    formSubjectId === sub.id && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                  ]}
                  onPress={() => setFormSubjectId(sub.id)}
                >
                  <Text style={[
                    styles.chipText, 
                    { color: themeColors.text },
                    formSubjectId === sub.id && { color: '#FFF' }
                  ]}>{sub.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input 
              label="Title *"
              placeholder="E.g., Chapter 1 Homework"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <Input 
              label="Description"
              placeholder="Instructions for the assignment..."
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />

            <Input 
              label="Due Date * (YYYY-MM-DDTHH:mm)"
              placeholder="2026-07-15T10:00"
              value={formDueAt}
              onChangeText={setFormDueAt}
            />

            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.sm }]}>Reference File (Optional)</Text>
            <TouchableOpacity
              style={[
                styles.filePicker,
                { 
                  borderColor: isGlass ? 'rgba(255,255,255,0.25)' : themeColors.border, 
                  backgroundColor: isGlass 
                    ? (isDark ? 'rgba(30,30,30,0.20)' : 'rgba(255,255,255,0.15)')
                    : themeColors.surface,
                  borderRadius: isSimple ? 4 : (isGlass ? 14 : 8),
                  borderStyle: isGlass ? 'solid' : 'dashed',
                }
              ]}
              onPress={handlePickReference}
              disabled={submitting}
            >
              <Ionicons name={referenceFile ? 'document-attach-outline' : 'cloud-upload-outline'} size={22} color={themeColors.primary} />
              <View style={styles.flex}>
                <Text style={[styles.filePickerTitle, { color: themeColors.text }]} numberOfLines={1}>
                  {referenceFile?.name || 'Select reference file'}
                </Text>
                <Text style={[styles.filePickerHint, { color: themeColors.textMuted }]}>PDF, DOCX, JPG, PNG, or WEBP · max 5MB</Text>
              </View>
              {referenceFile && (
                <TouchableOpacity onPress={() => setReferenceFile(null)} disabled={submitting}>
                  <Ionicons name="close-circle" size={22} color={themeColors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <Button 
              title={submitting ? "Creating..." : "Create Assignment"} 
              onPress={handleCreate} 
              disabled={submitting}
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        </ScrollView>
        )
      ) : (
        <ScrollView 
          style={styles.flex}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 100, Spacing.xl * 3) }}
        >
          {loading && !refreshing ? (
            <CardListSkeleton rows={5} />
          ) : assignments.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ color: themeColors.textMuted }}>No assignments created yet.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {assignments.map(assignment => {
                const isPastDue = new Date(assignment.dueAt) < new Date();
                const submitted = assignment.submittedStudents || [];
                const pending = assignment.pendingStudents || [];
                const totalStudents = submitted.length + pending.length;
                const isExpanded = expandedId === assignment.id;

                return (
                  <Card key={assignment.id} style={styles.card}>
                    <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : assignment.id)}>
                      <View style={styles.header}>
                        <Text style={[styles.subject, { color: themeColors.textMuted }]}>
                          {assignment.subjectName || 'General'} | {assignment.className} - {assignment.sectionName}
                        </Text>
                        <Text style={[styles.statsText, { color: themeColors.primary }]}>
                          {submitted.length}/{totalStudents} submitted
                        </Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: themeColors.text }]}>{assignment.title}</Text>
                      {assignment.description ? (
                        <Text style={[styles.description, { color: themeColors.textMuted }]} numberOfLines={2}>
                          {assignment.description}
                        </Text>
                      ) : null}
                      {assignment.referenceFileUrl ? (
                        <TouchableOpacity style={styles.referenceLink} onPress={() => openLink(assignment.referenceFileUrl!)}>
                          <Ionicons name="download-outline" size={16} color={themeColors.primary} />
                          <Text style={[styles.referenceLinkText, { color: themeColors.primary }]} numberOfLines={1}>
                            {assignment.referenceFileName || 'Open reference file'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                      
                      <View style={[styles.footer, { borderTopColor: themeColors.border, paddingBottom: isExpanded ? Spacing.md : 0 }]}>
                        <Text style={[styles.dateText, { color: isPastDue ? themeColors.error : themeColors.warning }]}>
                          Due: {new Date(assignment.dueAt).toLocaleString()}
                        </Text>
                        <Text style={{ color: themeColors.primary, fontSize: Typography.size.sm }}>
                          {isExpanded ? 'Hide Details' : 'View Submissions'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={[styles.expandedContent, { borderTopColor: themeColors.border }]}>
                        
                        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.sm }]}>Submitted ({submitted.length})</Text>
                        {submitted.length === 0 ? (
                          <Text style={{ color: themeColors.textMuted, fontSize: Typography.size.sm, marginBottom: Spacing.md }}>No submissions yet.</Text>
                        ) : (
                          <View style={{ marginBottom: Spacing.md }}>
                            {submitted.map(s => (
                              <View key={s.studentId} style={[styles.studentRow, { borderBottomColor: themeColors.border }]}>
                                <View style={styles.flex}>
                                  <Text style={[styles.studentName, { color: themeColors.text }]}>{s.rollNumber} - {s.studentName}</Text>
                                  <Text style={[styles.studentDetail, { color: s.isLate ? themeColors.error : themeColors.textMuted }]}>
                                    {s.isLate ? 'Late Submitted' : 'Submitted'} {new Date(s.submittedAt).toLocaleString()}
                                  </Text>
                                </View>
                                <Button 
                                  title="Open" 
                                  variant="outline" 
                                  onPress={() => openLink(s.fileKey)}
                                  style={{ height: 30, paddingHorizontal: 12 }}
                                  textStyle={{ fontSize: Typography.size.xs }}
                                />
                              </View>
                            ))}
                          </View>
                        )}

                        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.sm }]}>Pending ({pending.length})</Text>
                        {pending.length === 0 ? (
                          <Text style={{ color: themeColors.textMuted, fontSize: Typography.size.sm }}>Everyone has submitted.</Text>
                        ) : (
                          <View>
                            {pending.map(s => (
                              <View key={s.studentId} style={[styles.studentRow, { borderBottomColor: themeColors.border, paddingVertical: Spacing.sm }]}>
                                <Text style={[styles.studentName, { color: themeColors.textMuted }]}>{s.rollNumber} - {s.studentName}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
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
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subject: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    flex: 1,
  },
  statsText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
  },
  cardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    marginBottom: Spacing.xs,
  },
  description: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  dateText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
  },
  expandedContent: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: Spacing.md,
  },
  studentName: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  studentDetail: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  chipText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  filePickerTitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  filePickerHint: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  referenceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  referenceLinkText: {
    flex: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  }
});
