import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { CardListSkeleton, FormSkeleton } from '@/components/ui/Skeleton';

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

type Option = {
  id: number;
  name: string;
  className?: string; // For sections
  sectionId?: number;
};

export default function MarksScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');

  const [tests, setTests] = useState<ManualTest[]>([]);
  const [sectionOptions, setSectionOptions] = useState<Option[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<Option[]>([]);
  
  // New Assessment Form State
  const [formSectionId, setFormSectionId] = useState<number | null>(null);
  const [formType, setFormType] = useState<'DAILY' | 'WEEKLY' | 'QUIZ'>('DAILY');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMaxMarks, setFormMaxMarks] = useState('10');
  
  // For manual tests, we can have multiple subject IDs. But for mobile simplicity, we can do single select or multiple select.
  // The backend supports multiple. Let's do a simple array of IDs.
  const [formSubjectIds, setFormSubjectIds] = useState<number[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await apiClient('/api/staff/marks');
      setTests(data.tests || []);
      setSectionOptions(data.sectionOptions || []);
      setSubjectOptions(data.subjectOptions || []);
      
      if (data.sectionOptions?.length > 0 && !formSectionId) {
        setFormSectionId(data.sectionOptions[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleSubject = (id: number) => {
    if (formSubjectIds.includes(id)) {
      setFormSubjectIds(formSubjectIds.filter(s => s !== id));
    } else {
      setFormSubjectIds([...formSubjectIds, id]);
    }
  };

  const handleCreate = async () => {
    if (!formSectionId || !formTitle.trim() || !formDate || !formMaxMarks || formSubjectIds.length === 0) {
      Alert.alert('Error', 'Please fill all required fields and select at least one subject.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient('/api/staff/marks', {
        method: 'POST',
        body: JSON.stringify({
          sectionId: formSectionId,
          type: formType,
          title: formTitle,
          date: formDate,
          maxMarks: Number(formMaxMarks),
          subjectIds: formSubjectIds
        })
      });
      
      Alert.alert('Success', 'Assessment created successfully.');
      
      // Reset form
      setFormTitle('');
      setFormMaxMarks('10');
      setFormSubjectIds([]);
      
      // Refresh list and switch tab
      setActiveTab('LIST');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create assessment');
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

        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.md }]}>Type *</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {['DAILY', 'WEEKLY', 'QUIZ'].map((type) => (
            <TouchableOpacity 
              key={type}
              style={[
                styles.chip, 
                { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                formType === type && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
              ]}
              onPress={() => setFormType(type as any)}
            >
              <Text style={[styles.chipText, { color: themeColors.text }, formType === type && { color: '#FFF' }]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text, marginBottom: Spacing.md }]}>Subjects * (Select at least one)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          {subjectOptions.filter(sub => sub.sectionId === formSectionId).length === 0 ? (
             <Text style={{ color: themeColors.textMuted, fontSize: Typography.size.sm }}>No subjects assigned for this section.</Text>
          ) : (
            subjectOptions.filter(sub => sub.sectionId === formSectionId).map(sub => (
              <TouchableOpacity 
                key={sub.id}
                style={[
                  styles.chip, 
                  { borderColor: themeColors.border, backgroundColor: themeColors.surface },
                  formSubjectIds.includes(sub.id) && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
                ]}
                onPress={() => toggleSubject(sub.id)}
              >
                <Text style={[styles.chipText, { color: themeColors.text }, formSubjectIds.includes(sub.id) && { color: '#FFF' }]}>{sub.name}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Input label="Title *" placeholder="E.g., Chapter 3 Quiz" value={formTitle} onChangeText={setFormTitle} />
        
        <View style={{ flexDirection: 'row', gap: Spacing.md }}>
          <View style={styles.flex}>
             <Input label="Date * (YYYY-MM-DD)" value={formDate} onChangeText={setFormDate} />
          </View>
          <View style={styles.flex}>
            <Input label="Total Marks *" keyboardType="numeric" value={formMaxMarks} onChangeText={setFormMaxMarks} />
          </View>
        </View>

        <Button 
          title={isSubmitting ? "Creating..." : "Create Assessment"} 
          onPress={handleCreate} 
          disabled={isSubmitting}
          style={{ marginTop: Spacing.md }}
        />
      </Card>
    </ScrollView>
  );

  return (
    <ScreenShell
      title="Enter Marks"
      subtitle={activeTab === 'CREATE' ? 'Create a manual assessment.' : 'Grade students by assessment.'}
      eyebrow="Staff operations"
      icon={<Ionicons name="create-outline" size={22} color="#FFFFFF" />}
      scrollable={false}
      sheetStyle={styles.shellSheet}
    >
      <View style={[styles.tabs, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'LIST' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('LIST')}
        >
          <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'LIST' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }]}>Assessments</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'CREATE' && { backgroundColor: themeColors.primaryBg }]}
          onPress={() => setActiveTab('CREATE')}
        >
          <Text style={[styles.tabText, { color: themeColors.textMuted }, activeTab === 'CREATE' && { color: themeColors.primary, fontFamily: Typography.fontFamilySemiBold }]}>New Assessment</Text>
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
            <View style={styles.center}><Text style={{ color: themeColors.textMuted }}>No manual assessments available.</Text></View>
          ) : (
            <View style={styles.list}>
              {tests.map(test => {
                return (
                  <Card key={test.id} style={styles.card}>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/(staff)/mark-entry/[id]', params: { id: String(test.id) } })}
                      activeOpacity={0.75}
                    >
                      <View style={styles.header}>
                        <Text style={[styles.subject, { color: themeColors.textMuted }]}>
                          {test.subjectName || 'Subject'} | {test.className} - {test.sectionName || 'Section'}
                        </Text>
                        <Badge label={test.type} variant="info" />
                      </View>
                      <Text style={[styles.cardTitle, { color: themeColors.text }]}>{test.title}</Text>
                      
                      <View style={styles.detailsRow}>
                        <Text style={[styles.detailText, { color: themeColors.textMuted }]}>{new Date(test.date).toLocaleDateString()}</Text>
                        <Text style={[styles.detailText, { color: themeColors.textMuted }]}>{test.maxMarks} marks</Text>
                        <Text style={[styles.detailText, { color: themeColors.primary, fontWeight: 'bold' }]}>{test.uploadedCount}/{test.roster.length} graded</Text>
                      </View>
                      
                      <View style={styles.cardAction}>
                        <Text style={[styles.cardActionText, { color: themeColors.primary }]}>Enter Marks</Text>
                        <Ionicons name="chevron-forward" size={16} color={themeColors.primary} />
                      </View>
                    </TouchableOpacity>
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
  cardAction: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  cardActionText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  sectionTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: Spacing.sm },
  chipText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
});
