import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { apiClient } from '@/utils/api';

type LeaveType = 'single' | 'multiple';

const isDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export default function StudentLeaveScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [leaveType, setLeaveType] = useState<LeaveType>('single');
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedStartDate = leaveType === 'single' ? singleDate : startDate;
  const selectedEndDate = leaveType === 'single' ? singleDate : endDate;

  const submit = async () => {
    if (!reason.trim() || !parentPhone.trim() || !isDate(selectedStartDate) || !isDate(selectedEndDate)) {
      Alert.alert('Complete the form', 'Enter a reason, parent/guardian phone number, and valid dates in YYYY-MM-DD format.');
      return;
    }
    if (selectedStartDate > selectedEndDate) {
      Alert.alert('Check the dates', 'The end date must be the same as or after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient('/api/student/leaves', {
        method: 'POST',
        body: JSON.stringify({
          reason: reason.trim(),
          startDate: selectedStartDate,
          endDate: selectedEndDate,
          parentPhone: parentPhone.trim(),
        }),
      });
      Alert.alert('Leave request sent', 'Your class teacher will review it. You will receive a notification when it is accepted or rejected.', [
        { text: 'Done', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Could not send request', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [styles.input, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.background }];

  return (
    <ScreenShell
      title="Request Leave"
      subtitle="Send a leave request to your class teacher."
      eyebrow="Student portal"
      icon={<Ionicons name="calendar-outline" size={22} color="#FFFFFF" />}
      actions={<TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>}
    >
      <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>How long do you need?</Text>
        <View style={styles.typeRow}>
          {(['single', 'multiple'] as LeaveType[]).map((type) => {
            const active = leaveType === type;
            return <TouchableOpacity key={type} onPress={() => setLeaveType(type)} style={[styles.typeOption, { borderColor: active ? themeColors.accent : themeColors.border, backgroundColor: active ? themeColors.accent : themeColors.background }]}>
              <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={18} color={active ? '#FFFFFF' : themeColors.textMuted} />
              <Text style={[styles.typeText, { color: active ? '#FFFFFF' : themeColors.text }]}>{type === 'single' ? 'One day' : 'Multiple days'}</Text>
            </TouchableOpacity>;
          })}
        </View>

        {leaveType === 'single' ? (
          <Field label="Leave date" value={singleDate} onChangeText={setSingleDate} placeholder="YYYY-MM-DD" inputStyle={inputStyle} />
        ) : (
          <View style={styles.dateRow}>
            <View style={styles.dateField}><Field label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" inputStyle={inputStyle} /></View>
            <View style={styles.dateField}><Field label="End date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" inputStyle={inputStyle} /></View>
          </View>
        )}

        <Field label="Parent / guardian cell number" value={parentPhone} onChangeText={setParentPhone} placeholder="+923000000000" keyboardType="phone-pad" inputStyle={inputStyle} />
        <Text style={[styles.label, { color: themeColors.text }]}>Reason for leave</Text>
        <TextInput value={reason} onChangeText={setReason} placeholder="E.g., sick leave or family event" placeholderTextColor={themeColors.textMuted} multiline textAlignVertical="top" style={[inputStyle, styles.reason]} />
        <Button title={submitting ? 'Sending request...' : 'Submit Leave Request'} onPress={submit} loading={submitting} disabled={submitting} icon={!submitting ? <Ionicons name="send-outline" size={18} color="#FFFFFF" /> : undefined} style={styles.submit} />
      </Card>
    </ScreenShell>
  );
}

function Field({ label, inputStyle, ...props }: { label: string; inputStyle: any; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'phone-pad' }) {
  const themeColors = useThemeColors();
  return <View style={styles.field}><Text style={[styles.label, { color: themeColors.text }]}>{label}</Text><TextInput {...props} autoCapitalize="none" placeholderTextColor={themeColors.textMuted} style={inputStyle} /></View>;
}

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.xl },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  sectionTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md, marginBottom: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeOption: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, paddingHorizontal: Spacing.sm },
  typeText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  dateField: { flex: 1 },
  field: { marginBottom: Spacing.md },
  label: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, marginBottom: Spacing.xs },
  input: { minHeight: 46, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, fontFamily: Typography.fontFamily, fontSize: Typography.size.md },
  reason: { minHeight: 110, paddingTop: Spacing.md },
  submit: { marginTop: Spacing.sm },
});
