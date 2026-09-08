import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import { apiClient } from '@/utils/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { Radius, Spacing, Typography } from '@/constants/theme';

type ParentLoginResponse = { role: 'PARENT'; accessToken?: string; refreshToken?: string; mustChangePassword?: boolean };

export default function ParentLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { isGlass } = useThemePreferences();
  const { login } = useAuth();
  const [institutionUsername, setInstitutionUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const institution = institutionUsername.trim().toLowerCase();
    const guardianEmail = email.trim().toLowerCase();
    if (!institution || !guardianEmail || !password) {
      setError('Institution username, guardian email, and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await apiClient('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ institutionUsername: institution, emailOrUsername: guardianEmail, password, roleHint: 'PARENT', returnTokens: true }),
      }) as ParentLoginResponse;
      if (data.role !== 'PARENT' || !data.accessToken || !data.refreshToken) throw new Error('Parent login token missing');
      await login('PARENT', data.accessToken, data.refreshToken);
      if (data.mustChangePassword) router.replace({ pathname: '/force-password-change', params: { role: 'PARENT' } });
      else router.replace('/(parent)' as never);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  }

  const form = <View style={styles.form}>
    <View style={styles.header}>
      <View style={[styles.icon, { backgroundColor: colors.primaryBg, borderColor: colors.border }]}><Ionicons name="people-outline" size={25} color={colors.accent} /></View>
      <Text style={[styles.title, { color: colors.text }]}>Parent login</Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>Use the institution username and guardian credentials sent by your child&apos;s institution.</Text>
    </View>
    <Input label="Institution Username" placeholder="school-username" value={institutionUsername} onChangeText={(value) => setInstitutionUsername(value.toLowerCase())} autoCapitalize="none" autoCorrect={false} />
    <Input label="Guardian Email" placeholder="parent@example.com" value={email} onChangeText={(value) => setEmail(value.toLowerCase())} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
    <Input label="Password" placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry />
    {error ? <View style={[styles.error, { backgroundColor: colors.errorBg, borderColor: colors.error }]}><Ionicons name="alert-circle" size={17} color={colors.error} /><Text style={[styles.errorText, { color: colors.error }]}>{error}</Text></View> : null}
    <Button title="Sign In as Parent" loading={loading} onPress={handleLogin} style={styles.submit} />
    <TouchableOpacity style={styles.back} onPress={() => router.back()} accessibilityRole="button"><Ionicons name="arrow-back" size={16} color={colors.textMuted} /><Text style={[styles.backText, { color: colors.textMuted }]}>Back to student or staff login</Text></TouchableOpacity>
  </View>;

  return <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}><View style={styles.content}>{isGlass ? <GlassCard padding={Spacing.lg}>{form}</GlassCard> : <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{form}</View>}</View></ScrollView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, scroll: { flexGrow: 1, justifyContent: 'center', padding: Spacing.lg }, content: { width: '100%', maxWidth: 420, alignSelf: 'center' }, card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg }, form: { gap: Spacing.md }, header: { alignItems: 'center', marginBottom: Spacing.sm }, icon: { width: 56, height: 56, borderRadius: Radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md }, title: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xl }, subtitle: { marginTop: Spacing.xs, textAlign: 'center', fontFamily: Typography.fontFamily, fontSize: Typography.size.sm, lineHeight: 20 }, error: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm }, errorText: { flex: 1, fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.sm }, submit: { marginTop: Spacing.xs }, back: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, padding: Spacing.sm }, backText: { fontFamily: Typography.fontFamilyMedium, fontSize: Typography.size.xs } });
