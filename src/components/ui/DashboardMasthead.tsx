import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors, useThemePreferences, useResolvedColorScheme } from '@/context/ThemePreferencesContext';
import { Typography } from '@/constants/theme';
import { apiClient, BASE_URL } from '@/utils/api';

type Props = { role: 'student' | 'staff'; firstName: string };
type Profile = { name?: string; profilePictureUrl?: string | null; className?: string; sectionName?: string; campusName?: string };

export function DashboardMasthead({ role, firstName }: Props) {
  const colors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const dark = useResolvedColorScheme() === 'dark';
  const accent = isSimple ? '#F2B8CD' : isGlass ? '#A5E8F0' : '#D9F279';
  const headingColor = dark ? '#F8F9F5' : '#202422';
  const { brand } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    apiClient(`/api/${role}/profile`).then((data) => {
      if (active) setProfile(data.profile ?? null);
    }).catch(() => { /* A missing portrait must not block the dashboard. */ });
    return () => { active = false; };
  }, [role]));
  const photo = profile?.profilePictureUrl;
  const uri = photo ? (/^https?:\/\//i.test(photo) ? photo : `${BASE_URL}/${photo.replace(/^\/+/, '')}`) : undefined;
  useEffect(() => setImageFailed(false), [uri]);
  const name = profile?.name || firstName;
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const detail = role === 'student'
    ? [profile?.className, profile?.sectionName].filter(Boolean).join(' / ')
    : profile?.campusName;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.toolbar}>
        <View style={styles.brand}>
          <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={2}>{brand?.name || 'Nisaab360'}</Text>
          <View style={styles.portalRow}>
            <View style={[styles.portalMark, { backgroundColor: colors.accent }]} />
            <Text style={[styles.portal, { color: colors.textMuted }]}>{role === 'student' ? 'Student workspace' : 'Teacher workspace'}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={[styles.action, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.identity}>
        <View style={styles.identityText}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>Welcome back,</Text>
          <Text style={[styles.name, { color: headingColor, fontFamily: isSimple ? Typography.fontFamilyBold : Typography.fontFamilyDisplay }]}>{name}</Text>
          {detail ? <Text style={[styles.detail, { color: colors.textMuted }]}>{detail}</Text> : null}
        </View>
        <View style={styles.portraitWrap}>
          <View accessibilityLabel={`${name}'s profile picture`} style={[styles.avatar, { backgroundColor: accent, borderColor: colors.text }]}>
            {uri && !imageFailed ? <Image source={{ uri }} style={styles.image} onError={() => setImageFailed(true)} /> : <Text style={[styles.initials, { color: '#202422' }]}>{initials}</Text>}
          </View>
          <View style={[styles.portraitStamp, { backgroundColor: accent, borderColor: colors.background }]}>
            <Ionicons name={role === 'student' ? 'school-outline' : 'briefcase-outline'} size={18} color="#202422" />
          </View>
        </View>
      </View>
      <View style={styles.dateline}>
        <Text style={[styles.today, { color: colors.text }]}>Your day at a glance</Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>{new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 24, paddingTop: 20, borderBottomWidth: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  brand: { flex: 1, minWidth: 0 },
  brandName: { fontFamily: Typography.fontFamilyBold, fontSize: 15 },
  portalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  portalMark: { width: 6, height: 6 },
  portal: { fontFamily: Typography.fontFamily, fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingTop: 36, paddingBottom: 30 },
  portraitWrap: { width: 86, height: 110, flexShrink: 0 },
  avatar: { width: 86, height: 102, borderTopLeftRadius: 43, borderTopRightRadius: 43, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  portraitStamp: { position: 'absolute', bottom: 0, right: -6, width: 32, height: 32, borderRadius: 16, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  initials: { fontFamily: Typography.fontFamilyDisplay, fontSize: 30 },
  identityText: { flex: 1, minWidth: 0 },
  greeting: { fontFamily: Typography.fontFamily, fontSize: 14, marginBottom: 6 },
  name: { fontFamily: Typography.fontFamilyDisplay, fontSize: 32, lineHeight: 36, flexShrink: 1 },
  detail: { fontFamily: Typography.fontFamilyMedium, fontSize: 12, marginTop: 6 },
  dateline: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', paddingBottom: 16 },
  today: { fontFamily: Typography.fontFamilySemiBold, fontSize: 12 },
  date: { fontFamily: Typography.fontFamily, fontSize: 12 },
});
