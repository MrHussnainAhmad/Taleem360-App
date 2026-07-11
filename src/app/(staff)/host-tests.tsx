import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert, Modal, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { CardListSkeleton, FormSkeleton } from '@/components/ui/Skeleton';

type Submission = {
  id: number;
  onlineTestId: number;
  studentName: string;
  rollNumber: string;
  status: string;
  violationReason?: string | null;
  totalScore: number;
  answers: Record<string, any>;
};

type Question = {
  id: number;
  onlineTestId: number;
  questionType: 'MCQ' | 'SHORT';
  prompt: string;
  marks: number;
  orderIndex: number;
};

type HostedTest = {
  id: number;
  title: string;
  type: string;
  maxMarks: number;
  date: string;
  className: string;
  sectionName: string;
  subjectName: string;
  durationMinutes: number | null;
  mode: 'MCQ' | 'MIX';
  submissions: Submission[];
  questions: Question[];
};

type Option = {
  id: number;
  name: string;
  className?: string;
  sectionId?: number;
};

export default function HostTestsScreen() {
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  const [tests, setTests] = useState<HostedTest[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Edit Test State
  const [editingTest, setEditingTest] = useState<HostedTest | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDuration, setEditDuration] = useState('');
  
  // Grade Modal State
  const [gradingSubmission, setGradingSubmission] = useState<{ submission: Submission, questions: Question[], testMaxMarks: number } | null>(null);
  const [shortScores, setShortScores] = useState<Record<number, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Test Form State
  const [formSectionId, setFormSectionId] = useState<number | null>(null);
  const [formSubjectId, setFormSubjectId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formMode, setFormMode] = useState<'MCQ' | 'MIX'>('MCQ');
  const [formDuration, setFormDuration] = useState('30');
  const [formMcqMarks, setFormMcqMarks] = useState('1');
  
  const [mcqs, setMcqs] = useState([{ prompt: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  const [shortQs, setShortQs] = useState([{ prompt: '', marks: '2' }]);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const data = await apiClient('/api/staff/host-tests');
      setTests(data.tests || []);
      setSectionOptions(data.assignedSlots || []);
      setSubjectOptions(data.subjectOptions || []);
      
      if (data.assignedSlots?.length > 0 && !formSectionId) {
        setFormSectionId(data.assignedSlots[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTests();
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Test', 'Are you sure you want to delete this test? All student submissions will be permanently lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient(`/api/staff/host-tests/${id}`, { method: 'DELETE' });
          fetchTests();
        } catch (e: any) {
          Alert.alert('Error', e.message || 'Failed to delete test');
        }
      }}
    ]);
  };

  const saveEdit = async () => {
    if (!editingTest) return;
    setIsSubmitting(true);
    try {
      await apiClient(`/api/staff/host-tests/${editingTest.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editTitle,
          durationMinutes: editDuration ? Number(editDuration) : undefined
        })
      });
      setEditingTest(null);
      fetchTests();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!gradingSubmission) return;
    setIsSubmitting(true);
    try {
      await apiClient(`/api/staff/host-tests/${gradingSubmission.submission.id}/grade`, {
        method: 'POST',
        body: JSON.stringify({ shortScores })
      });
      Alert.alert('Success', 'Submission graded.');
      setGradingSubmission(null);
      fetchTests();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to grade submission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTest = async () => {
    if (!formSectionId || !formTitle.trim() || !formDuration) {
      Alert.alert('Error', 'Please fill all required fields.');
      return;
    }
    
    // Validate MCQs
    const validMcqs = mcqs.map(m => ({
      prompt: m.prompt,
      options: m.options,
      correctOptionIndex: m.correctOptionIndex,
      marks: Number(formMcqMarks)
    }));
    
    const validShorts = formMode === 'MIX' ? shortQs.map(s => ({
      prompt: s.prompt,
      marks: Number(s.marks)
    })) : [];
    
    setIsSubmitting(true);
    try {
      await apiClient('/api/staff/host-tests', {
        method: 'POST',
        body: JSON.stringify({
          sectionId: formSectionId,
          subjectId: formSubjectId,
          title: formTitle,
          mode: formMode,
          durationMinutes: Number(formDuration),
          mcqs: validMcqs,
          shortQuestions: validShorts
        })
      });
      Alert.alert('Success', 'Test created and announced.');
      setFormTitle('');
      setMcqs([{ prompt: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
      setShortQs([{ prompt: '', marks: '2' }]);
      setActiveTab('LIST');
      fetchTests();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderNewTestTab = () => (
    <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
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
              <Text style={[styles.chipText, { color: themeColors.text }, formSectionId === sec.id && { color: '#FFF' }]}>
                {sec.className} - {sec.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.md }]}>Subject *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
          {subjectOptions.filter(sub => sub.sectionId === formSectionId).map(sub => (
            <TouchableOpacity 
              key={sub.id}
              style={[
                styles.chip, 
                { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                formSubjectId === sub.id && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
              ]}
              onPress={() => setFormSubjectId(sub.id)}
            >
              <Text style={[styles.chipText, { color: themeColors.text }, formSubjectId === sub.id && { color: '#FFF' }]}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Input label="Title *" placeholder="E.g., Midterm Exam" value={formTitle} onChangeText={setFormTitle} />
        
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={styles.flex}>
            <Text style={[styles.label, { color: themeColors.text, marginBottom: Spacing.xs }]}>Mode</Text>
            <TouchableOpacity 
              style={[styles.input, { borderColor: themeColors.border, backgroundColor: themeColors.surface, justifyContent: 'center' }]}
              onPress={() => setFormMode(formMode === 'MCQ' ? 'MIX' : 'MCQ')}
            >
              <Text style={{ color: themeColors.text }}>{formMode}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flex}>
            <Input label="Timer (min) *" keyboardType="numeric" value={formDuration} onChangeText={setFormDuration} />
          </View>
        </View>

        <Input label="Marks per MCQ *" keyboardType="numeric" value={formMcqMarks} onChangeText={setFormMcqMarks} />

        <View style={{ height: 1, backgroundColor: themeColors.border, marginVertical: Spacing.md }} />
        
        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.sm }]}>Multiple Choice Questions</Text>
        {mcqs.map((mcq, index) => (
          <View key={index} style={{ marginBottom: Spacing.md, padding: Spacing.sm, borderWidth: 1, borderColor: themeColors.border, borderRadius: 8 }}>
            <Input label={`Question ${index + 1}`} value={mcq.prompt} onChangeText={v => {
              const newMcqs = [...mcqs]; newMcqs[index].prompt = v; setMcqs(newMcqs);
            }} />
            <Text style={{ fontSize: 12, color: themeColors.textMuted, marginBottom: 4 }}>Options & Select Correct:</Text>
            {mcq.options.map((opt, optIdx) => (
              <View key={optIdx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <TouchableOpacity 
                  style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: mcq.correctOptionIndex === optIdx ? themeColors.success : themeColors.border, backgroundColor: mcq.correctOptionIndex === optIdx ? themeColors.success : 'transparent', marginRight: 8 }}
                  onPress={() => {
                    const newMcqs = [...mcqs]; newMcqs[index].correctOptionIndex = optIdx; setMcqs(newMcqs);
                  }}
                />
                <TextInput 
                  style={{ flex: 1, height: 36, borderWidth: 1, borderColor: themeColors.border, borderRadius: 6, paddingHorizontal: 8, color: themeColors.text }} 
                  placeholder={`Option ${optIdx + 1}`} 
                  placeholderTextColor={themeColors.textMuted}
                  value={opt} 
                  onChangeText={v => {
                    const newMcqs = [...mcqs]; newMcqs[index].options[optIdx] = v; setMcqs(newMcqs);
                  }} 
                />
              </View>
            ))}
          </View>
        ))}
        <Button title="+ Add MCQ" variant="outline" onPress={() => setMcqs([...mcqs, { prompt: '', options: ['', '', '', ''], correctOptionIndex: 0 }])} style={{ marginBottom: Spacing.md }} />

        {formMode === 'MIX' && (
          <>
            <View style={{ height: 1, backgroundColor: themeColors.border, marginVertical: Spacing.md }} />
            <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.sm }]}>Short Questions</Text>
            {shortQs.map((sq, index) => (
              <View key={index} style={{ marginBottom: Spacing.md, padding: Spacing.sm, borderWidth: 1, borderColor: themeColors.border, borderRadius: 8 }}>
                <Input label={`Short Question ${index + 1}`} value={sq.prompt} onChangeText={v => {
                  const newSq = [...shortQs]; newSq[index].prompt = v; setShortQs(newSq);
                }} />
                <Input label="Marks" keyboardType="numeric" value={sq.marks} onChangeText={v => {
                  const newSq = [...shortQs]; newSq[index].marks = v; setShortQs(newSq);
                }} />
              </View>
            ))}
            <Button title="+ Add Short Question" variant="outline" onPress={() => setShortQs([...shortQs, { prompt: '', marks: '2' }])} style={{ marginBottom: Spacing.md }} />
          </>
        )}

        <Button 
          title={isSubmitting ? "Creating..." : "Create & Host Test"} 
          onPress={handleCreateTest} 
          disabled={isSubmitting}
          style={{ marginTop: Spacing.lg }}
        />
      </Card>
    </ScrollView>
  );

  return (
    <ScreenShell
      title="Host Tests"
      subtitle={activeTab === 'CREATE' ? 'Build and publish an online test.' : 'Review submissions and grades.'}
      eyebrow="Staff operations"
      icon={<Ionicons name="clipboard-outline" size={22} color="#FFFFFF" />}
      scrollable={false}
      sheetStyle={styles.shellSheet}
    >
      <View style={[styles.tabs, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'LIST' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('LIST')}
        >
          <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'LIST' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }]}>Hosted Tests</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CREATE' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('CREATE')}
        >
          <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'CREATE' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }]}>New Test</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}><Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text></View>
      ) : activeTab === 'CREATE' ? (
        loading && !refreshing ? <FormSkeleton /> : renderNewTestTab()
      ) : (
        <ScrollView 
          style={styles.flex}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingBottom: Spacing.xl }}
        >
          {loading && !refreshing ? (
            <CardListSkeleton rows={5} />
          ) : tests.length === 0 ? (
            <View style={styles.center}><Text style={{ color: themeColors.textMuted }}>No tests hosted yet.</Text></View>
          ) : (
            <View style={styles.list}>
              {tests.map(test => {
                const isExpanded = expandedId === test.id;
                const submissions = test.submissions || [];
                
                return (
                  <Card key={test.id} style={styles.card}>
                    <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : test.id)}>
                      <View style={styles.header}>
                        <Text style={[styles.subject, { color: themeColors.textMuted }]}>
                          {test.subjectName} | {test.className} - {test.sectionName}
                        </Text>
                        <Badge label={test.mode} variant="info" />
                      </View>
                      <Text style={[styles.cardTitle, { color: themeColors.text }]}>{test.title}</Text>
                      
                      <View style={styles.detailsRow}>
                        <Text style={[styles.detailText, { color: themeColors.textMuted }]}>{test.durationMinutes} min</Text>
                        <Text style={[styles.detailText, { color: themeColors.textMuted }]}>{test.maxMarks} marks</Text>
                        <Text style={[styles.detailText, { color: themeColors.primary, fontWeight: 'bold' }]}>{submissions.length} subs</Text>
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={[styles.expandedContent, { borderTopColor: themeColors.border }]}>
                        <View style={[styles.footer, { borderTopColor: 'transparent', paddingBottom: Spacing.md, paddingTop: 0 }]}>
                          <Button title="Delete" variant="ghost" onPress={() => handleDelete(test.id)} style={{ height: 30, paddingHorizontal: 12, marginRight: Spacing.sm }} textStyle={{ fontSize: 12, color: themeColors.error }} />
                          <Button title="Edit" variant="outline" onPress={() => { setEditingTest(test); setEditTitle(test.title); setEditDuration(String(test.durationMinutes)); }} style={{ height: 30, paddingHorizontal: 12 }} textStyle={{ fontSize: 12 }} />
                        </View>
                        
                        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.sm }]}>Submissions ({submissions.length})</Text>
                        {submissions.length === 0 ? (
                          <Text style={{ color: themeColors.textMuted, fontSize: Typography.size.sm, marginBottom: Spacing.md }}>No submissions yet.</Text>
                        ) : (
                          <View>
                            {submissions.map(sub => (
                              <View key={sub.id} style={{ borderBottomWidth: 1, borderBottomColor: themeColors.border, paddingVertical: Spacing.sm }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <View style={styles.flex}>
                                    <Text style={[styles.studentName, { color: themeColors.text }]}>{sub.rollNumber} - {sub.studentName}</Text>
                                    <Text style={[styles.studentDetail, { color: sub.status === 'FAILED' || sub.status === 'ABANDONED' ? themeColors.error : themeColors.textMuted }]}>
                                      {sub.status.replace('_', ' ')} {sub.violationReason ? `(${sub.violationReason})` : ''}
                                    </Text>
                                  </View>
                                  <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ fontFamily: Typography.fontFamilyBold, color: themeColors.primary }}>{sub.totalScore}/{test.maxMarks}</Text>
                                    {test.mode === 'MIX' && sub.status === 'PENDING_REVIEW' && (
                                      <Button 
                                        title="Grade" 
                                        variant="solid" 
                                        onPress={() => setGradingSubmission({ submission: sub, questions: test.questions, testMaxMarks: test.maxMarks })} 
                                        style={{ height: 26, paddingHorizontal: 10, marginTop: 4 }} 
                                        textStyle={{ fontSize: 11 }} 
                                      />
                                    )}
                                  </View>
                                </View>
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

      {/* Edit Test Modal */}
      <Modal visible={!!editingTest} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Edit Test</Text>
            <Input label="Test Title" value={editTitle} onChangeText={setEditTitle} />
            <Input label="Duration (Minutes)" value={editDuration} onChangeText={setEditDuration} keyboardType="numeric" />
            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => setEditingTest(null)} disabled={isSubmitting} />
              <Button title="Save Changes" onPress={saveEdit} disabled={isSubmitting || !editTitle} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Grade Submission Modal */}
      <Modal visible={!!gradingSubmission} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.background, borderColor: themeColors.border, flex: 0.8 }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Grade Short Questions</Text>
            <Text style={{ color: themeColors.textMuted, marginBottom: Spacing.md }}>{gradingSubmission?.submission.studentName} ({gradingSubmission?.submission.rollNumber})</Text>
            
            <ScrollView style={{ flex: 1, marginBottom: Spacing.md }}>
              {gradingSubmission?.questions.filter(q => q.questionType === 'SHORT').map(q => (
                <View key={q.id} style={{ marginBottom: Spacing.lg, padding: Spacing.md, backgroundColor: themeColors.surface, borderRadius: 8 }}>
                  <Text style={{ fontFamily: Typography.fontFamilySemiBold, color: themeColors.text, marginBottom: Spacing.sm }}>{q.prompt}</Text>
                  <Text style={{ color: themeColors.textMuted, marginBottom: Spacing.md }}>Ans: {gradingSubmission.submission.answers[String(q.id)] || 'No answer'}</Text>
                  <Input 
                    label={`Score (Max ${q.marks})`} 
                    keyboardType="numeric" 
                    value={shortScores[q.id] || ''} 
                    onChangeText={v => setShortScores(prev => ({ ...prev, [q.id]: v }))} 
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={() => { setGradingSubmission(null); setShortScores({}); }} disabled={isSubmitting} />
              <Button title="Save Grade" onPress={handleGradeSubmit} disabled={isSubmitting} />
            </View>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  shellSheet: { padding: Spacing.md },
  flex: { flex: 1 },
  title: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xl, marginBottom: Spacing.md },
  tabs: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, padding: 2, marginBottom: Spacing.md },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
  center: { padding: Spacing.xl, alignItems: 'center' },
  errorText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.md },
  list: { gap: Spacing.md },
  card: { marginBottom: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  subject: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.xs, textTransform: 'uppercase', flex: 1 },
  cardTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, marginBottom: Spacing.xs },
  detailsRow: { flexDirection: 'row', gap: Spacing.lg, marginBottom: Spacing.xs },
  detailText: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, paddingTop: Spacing.md, marginTop: Spacing.sm },
  expandedContent: { borderTopWidth: 1, paddingTop: Spacing.sm, marginTop: Spacing.sm },
  sectionTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  studentName: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
  studentDetail: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: Spacing.sm },
  chipText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.xl, borderWidth: 1 },
  modalTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.lg, marginBottom: Spacing.lg },
  label: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
  input: { borderWidth: 1, borderRadius: 8, padding: Spacing.md, fontFamily: Typography.fontFamily, fontSize: Typography.size.md, minHeight: 44 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.md }
});
