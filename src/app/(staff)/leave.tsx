import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { apiClient } from '@/utils/api';

export default function StaffLeaveScreen() {
  const router = useRouter(); const colors = useThemeColors();
  const [reason, setReason] = useState(''); const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState(''); const [sending, setSending] = useState(false);
  const submit = async () => {
    if (!reason.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) { Alert.alert('Complete the form', 'Enter a reason and dates in YYYY-MM-DD format.'); return; }
    if (startDate > endDate) { Alert.alert('Check the dates', 'End date must be after start date.'); return; }
    setSending(true); try { await apiClient('/api/staff/leaves', { method: 'POST', body: JSON.stringify({ reason: reason.trim(), startDate, endDate }) }); Alert.alert('Request sent', 'Your leave request was submitted.', [{ text: 'Done', onPress: () => router.back() }]); } catch (e: any) { Alert.alert('Could not submit', e.message || 'Please try again.'); } finally { setSending(false); }
  };
  const input = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }];
  return <ScreenShell title="Request Leave" subtitle="Submit a leave request to administration." eyebrow="Staff portal" icon={<Ionicons name="calendar-outline" size={22} color="#FFFFFF" />} actions={<TouchableOpacity onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>}><Card><Text style={[styles.label, { color: colors.text }]}>Start date</Text><TextInput value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} style={input} /><Text style={[styles.label, { color: colors.text }]}>End date</Text><TextInput value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} style={input} /><Text style={[styles.label, { color: colors.text }]}>Reason</Text><TextInput value={reason} onChangeText={setReason} placeholder="Reason for leave" placeholderTextColor={colors.textMuted} multiline style={[input, styles.reason]} /><Button title={sending ? 'Submitting...' : 'Submit Request'} onPress={submit} loading={sending} disabled={sending} /></Card></ScreenShell>;
}
const styles = StyleSheet.create({ back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' }, label: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm, marginBottom: Spacing.xs }, input: { minHeight: 46, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, fontFamily: Typography.fontFamily, fontSize: Typography.size.md }, reason: { height: 100, paddingTop: Spacing.md, textAlignVertical: 'top' } });
