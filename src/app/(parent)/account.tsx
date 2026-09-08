import { RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ParentChildSwitcher } from '@/components/parent/ParentChildSwitcher';
import { useParentPortalData } from '@/hooks/useParentPortalData';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Radius, Spacing, Typography } from '@/constants/theme';

type AccountData = { parent: { name: string | null; email: string }; selectedStudent: { name: string; className: string; sectionName: string; campusName: string | null }; profile: { fatherName: string | null; classRoll: string; guardianEmail: string | null; whatsapp: string | null; emergency: string | null; status: string } | null };
const services = [
  ['Fees & payments', 'Challans and payment status', 'wallet-outline', 'fees'],
  ['School notices', 'Announcements and updates', 'notifications-outline', 'notices'],
  ['Leave & support', 'Send and track requests', 'chatbubbles-outline', 'requests'],
  ['App settings', 'Theme, notifications and security', 'settings-outline', 'settings'],
] as const;

export default function ParentAccount() {
  const colors = useThemeColors();
  const router = useRouter();
  const { logout } = useAuth();
  const { data, loading, refreshing, error, reload } = useParentPortalData<AccountData>('account');
  return (
    <ScreenShell title="Account" subtitle="Family access and school services." eyebrow="Parent portal" icon={<Ionicons name="person-circle-outline" size={23} color="#FFF" />} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}>
      <ParentChildSwitcher />
      {loading ? <SkeletonList rows={3} /> : error ? <Card><Text style={{ color: colors.error }}>{error}</Text></Card> : data ? (
        <>
          <View style={[styles.parentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.parentAvatar, { backgroundColor: colors.primaryBg }]}><Ionicons name="person-outline" size={24} color={colors.accent} /></View>
            <View style={styles.parentCopy}>
              <Text style={[styles.parentLabel, { color: colors.textMuted }]}>PARENT ACCOUNT</Text>
              <Text style={[styles.parentName, { color: colors.text }]} numberOfLines={1}>{data.parent.name || data.profile?.fatherName || 'Parent / Guardian'}</Text>
              <Text style={[styles.parentEmail, { color: colors.textMuted }]} numberOfLines={1}>{data.parent.email}</Text>
            </View>
            <View style={[styles.status, { backgroundColor: colors.successBg }]}><Text style={[styles.statusText, { color: colors.success }]}>ACTIVE</Text></View>
          </View>

          <View style={[styles.record, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.recordHead}><Text style={[styles.recordTitle, { color: colors.text }]}>Student record</Text><Text style={[styles.roll, { color: colors.accent }]}>Roll {data.profile?.classRoll || '—'}</Text></View>
            <View style={styles.details}>
              <Detail icon="school-outline" label="Class" value={formatClass(data.selectedStudent.className, data.selectedStudent.sectionName)} />
              <Detail icon="location-outline" label="Campus" value={data.selectedStudent.campusName || 'Main campus'} />
              <Detail icon="logo-whatsapp" label="WhatsApp" value={data.profile?.whatsapp || 'Not provided'} />
              <Detail icon="call-outline" label="Emergency" value={data.profile?.emergency || 'Not provided'} />
            </View>
          </View>
        </>
      ) : null}

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>SERVICES</Text>
      <View style={[styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {services.map(([label, description, icon, route], index) => (
          <TouchableOpacity key={route} activeOpacity={0.72} style={[styles.menu, index > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]} onPress={() => router.push(route === 'settings' ? '/settings' as never : `/(parent)/${route}` as never)}>
            <View style={[styles.menuIcon, { backgroundColor: colors.primaryBg }]}><Ionicons name={icon} size={20} color={colors.accent} /></View>
            <View style={styles.menuCopy}><Text style={[styles.menuText, { color: colors.text }]}>{label}</Text><Text style={[styles.menuDescription, { color: colors.textMuted }]}>{description}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity activeOpacity={0.72} style={[styles.signOut, { borderColor: colors.border }]} onPress={() => void logout()}><Ionicons name="log-out-outline" size={19} color={colors.error} /><Text style={[styles.signOutText, { color: colors.error }]}>Sign out</Text></TouchableOpacity>
    </ScreenShell>
  );
}

function Detail({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) { const colors = useThemeColors(); return <View style={styles.detail}><Ionicons name={icon} size={17} color={colors.accent} /><View style={styles.detailCopy}><Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text><Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>{value}</Text></View></View>; }
function formatClass(className: string, sectionName: string) { return sectionName && sectionName !== 'Whole Class' ? `${className} · ${sectionName}` : className; }

const styles = StyleSheet.create({
  parentCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: Spacing.ms, borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.ms },
  parentAvatar: { width: 46, height: 46, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  parentCopy: { flex: 1, minWidth: 0 },
  parentLabel: { fontFamily: Typography.fontFamilyBold, fontSize: 9, letterSpacing: 0.9 },
  parentName: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md, marginTop: 2 },
  parentEmail: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 },
  status: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontFamily: Typography.fontFamilyBold, fontSize: 9, letterSpacing: 0.5 },
  record: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md },
  recordHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordTitle: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md },
  roll: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.xs },
  details: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md },
  detail: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailCopy: { flex: 1, minWidth: 0 },
  detailLabel: { fontFamily: Typography.fontFamily, fontSize: 10 },
  detailValue: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.xs, marginTop: 2 },
  sectionLabel: { fontFamily: Typography.fontFamilyBold, fontSize: 10, letterSpacing: 1, marginTop: Spacing.xs },
  menuCard: { borderWidth: 1, borderRadius: Radius.lg, overflow: 'hidden' },
  menu: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Spacing.ms, paddingHorizontal: Spacing.ms },
  menuIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1 },
  menuText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  menuDescription: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 2 },
  signOut: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md },
  signOutText: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
});
