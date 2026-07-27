import React, { useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Spacing, Typography } from '@/constants/theme';
import { apiClient } from '@/utils/api';

type Leave = { id: number; studentName: string; sectionName: string; reason: string; startDate: string; endDate: string; parentPhone: string | null; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string };
export default function StaffLeavesScreen() {
  const router = useRouter(); const colors = useThemeColors(); const [leaves, setLeaves] = useState<Leave[]>([]); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const load = async () => { try { const result = await apiClient('/api/staff/leaves'); setLeaves(result.requests || []); } catch { setLeaves([]); } finally { setLoading(false); setRefreshing(false); } };
  const decide = async (id: number, status: 'APPROVED' | 'REJECTED') => { try { await apiClient(`/api/staff/leaves/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); setLeaves((current) => current.filter((leave) => leave.id !== id)); } catch (error: any) { alert(error.message || 'Could not update leave request.'); } };
  useEffect(() => { void load(); }, []);
  return <ScreenShell title="Leaves" subtitle="Student leave requests from your classes." eyebrow="Staff portal" icon={<Ionicons name="list-outline" size={22} color="#FFFFFF" />} actions={<TouchableOpacity onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={20} color="#FFFFFF" /></TouchableOpacity>} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}>{loading ? <SkeletonList rows={3} /> : leaves.length === 0 ? <View style={styles.empty}><Text style={{ color: colors.textMuted }}>No student leave requests.</Text></View> : leaves.map((leave) => <Card key={leave.id} style={styles.card}><View style={styles.row}><View style={styles.meta}><Text style={[styles.student, { color: colors.text }]}>{leave.studentName}</Text><Text style={[styles.section, { color: colors.textMuted }]}>{leave.sectionName} · {leave.startDate} — {leave.endDate}</Text><Text style={[styles.reason, { color: colors.textMuted }]}>{leave.reason}</Text>{leave.parentPhone ? <Text style={[styles.section, { color: colors.textMuted }]}>Parent: {leave.parentPhone}</Text> : null}</View><Badge label={leave.status} variant="warning" /></View><View style={styles.actions}><Button title="Approve" onPress={() => decide(leave.id, 'APPROVED')} /><Button title="Reject" variant="outline" onPress={() => decide(leave.id, 'REJECTED')} /></View></Card>)}</ScreenShell>;
}
const styles = StyleSheet.create({ back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' }, card: { marginBottom: Spacing.sm }, row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md }, meta: { flex: 1 }, student: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.md }, section: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 3 }, reason: { fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, marginTop: Spacing.xs }, actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }, empty: { alignItems: 'center', padding: Spacing.xl } });
