import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, View, Text, StyleSheet, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, TouchableOpacity, useWindowDimensions, useColorScheme } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GlassCard } from '@/components/ui/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  glassPressIn,
  glassPressOut,
  LOGIN_BG_COLORS_LIGHT,
  LOGIN_BG_COLORS_DARK,
} from '@/constants/glassStyles';

type Tab = 'STUDENT' | 'STAFF';

const roleMeta: Record<Tab, { label: string; helper: string; icon: keyof typeof Ionicons.glyphMap }> = {
  STUDENT: {
    label: 'Student',
    helper: 'Use your roll number or email.',
    icon: 'school-outline',
  },
  STAFF: {
    label: 'Staff',
    helper: 'Use your staff email or username.',
    icon: 'briefcase-outline',
  },
};

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [activeTab, setActiveTab] = useState<Tab>('STUDENT');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [institutionPortalOpen, setInstitutionPortalOpen] = useState(false);
  const [switchWidth, setSwitchWidth] = useState(0);
  const roleProgress = useRef(new Animated.Value(0)).current;
  const submitScale = useRef(new Animated.Value(1)).current;

  const activeRole = roleMeta[activeTab];

  useEffect(() => {
    Animated.timing(roleProgress, {
      toValue: activeTab === 'STAFF' ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, roleProgress]);

  const indicatorTranslate = roleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, switchWidth / 2],
  });

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      setError('Please enter your credentials');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await apiClient('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername, password, roleHint: activeTab, returnTokens: true }),
      });

      const role = data.role as Tab;
      if (!data.accessToken || !data.refreshToken) {
        throw new Error('Login token missing');
      }

      await login(role, data.accessToken, data.refreshToken);

      if (data.mustChangePassword) {
        router.replace({ pathname: '/force-password-change', params: { role } });
      } else if (role === 'STUDENT') {
        router.replace('/(student)');
      } else if (role === 'STAFF') {
        router.replace('/(staff)');
      } else {
        setError('Unauthorized role.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const bgColors = isDark ? LOGIN_BG_COLORS_DARK : LOGIN_BG_COLORS_LIGHT;

  const openInstitutionPortal = () => {
    setInstitutionPortalOpen(false);
    void Linking.openURL('https://lms-two-iota-69.vercel.app/login');
  };

  const loginContent = (
    <View style={[styles.contentWrapper, isTablet && styles.tabletContentWrapper]}>
      <View style={styles.loginContent}>
        <View style={styles.cardHeader}>
          <View style={[
            styles.brandMark,
            { borderColor: themeColors.border },
            isGlass && { borderColor: 'rgba(255,255,255,0.30)', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)' },
          ]}>
            <Ionicons name="school-outline" size={24} color={isGlass ? themeColors.text : themeColors.accent} />
          </View>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>Welcome back</Text>
          <Text style={[styles.cardSubtitle, { color: themeColors.textMuted }]}>{activeRole.helper}</Text>
        </View>

        <View
          style={[
            styles.roleSwitch,
            { borderColor: themeColors.border, backgroundColor: themeColors.surface },
            isGlass && {
              borderColor: 'rgba(255,255,255,0.25)',
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
            },
          ]}
          onLayout={(event) => setSwitchWidth(event.nativeEvent.layout.width)}
        >
          {switchWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.roleSwitchIndicator,
                {
                  width: switchWidth / 2 - 6,
                  backgroundColor: themeColors.accent,
                  transform: [{ translateX: indicatorTranslate }],
                },
              ]}
            />
          )}
          {(['STUDENT', 'STAFF'] as Tab[]).map((tab) => {
            const selected = activeTab === tab;
            const meta = roleMeta[tab];
            return (
              <TouchableOpacity
                key={tab}
                style={styles.roleSwitchOption}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.82}
              >
                <Ionicons
                  name={meta.icon}
                  size={16}
                  color={selected ? '#FFFFFF' : themeColors.textMuted}
                />
                <Text
                  style={[
                    styles.roleSwitchText,
                    { color: selected ? '#FFFFFF' : themeColors.textMuted },
                    selected && { fontFamily: Typography.fontFamilySemiBold },
                  ]}
                >
                  {meta.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.form}>
          <Input
            label="Email or Username"
            placeholder="name@example.com"
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
            autoCapitalize="none"
          />

          <Input
            label="Password"
            placeholder="Enter password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: themeColors.errorBg, borderColor: themeColors.error }]}>
              <Ionicons name="alert-circle" size={16} color={themeColors.error} />
              <Text style={[styles.error, { color: themeColors.error }]}>{error}</Text>
            </View>
          ) : null}
          
          <Animated.View style={{ transform: [{ scale: submitScale }] }}>
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.submitButton}
              textStyle={{ fontFamily: Typography.fontFamilySemiBold }}
              {...(isGlass ? {
                onPressIn: () => glassPressIn(submitScale),
                onPressOut: () => glassPressOut(submitScale),
              } : {})}
            />
          </Animated.View>

          <TouchableOpacity
            style={styles.institutionLink}
            onPress={() => setInstitutionPortalOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open the institution administrator portal information"
          >
            <Ionicons name="business-outline" size={14} color={themeColors.textMuted} />
            <Text style={[styles.institutionLinkText, { color: themeColors.textMuted }]}>
              Institution administrator?
            </Text>
            <Ionicons name="chevron-forward" size={14} color={themeColors.textMuted} />
          </TouchableOpacity>

          <Modal
            visible={institutionPortalOpen}
            transparent
            animationType="slide"
            onRequestClose={() => setInstitutionPortalOpen(false)}
          >
            <Pressable
              style={[
                styles.portalOverlay,
                isGlass && styles.portalOverlayGlass,
                isSimple && styles.portalOverlaySimple,
              ]}
              onPress={() => setInstitutionPortalOpen(false)}
            >
              <Pressable
                style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}
                onPress={(event) => event.stopPropagation()}
              >
                {isGlass ? (
                  <GlassCard
                    padding={Spacing.lg}
                    style={{
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                      paddingBottom: Math.max(insets.bottom, Spacing.xl),
                    }}
                  >
                    <View style={styles.portalSheetHeader}>
                      <View style={[
                        styles.portalSheetIcon,
                        { backgroundColor: themeColors.primaryBg },
                        styles.portalSheetIconGlass,
                      ]}>
                        <Ionicons name="business-outline" size={20} color={themeColors.accent} />
                      </View>
                      <TouchableOpacity
                        style={styles.portalCloseButton}
                        onPress={() => setInstitutionPortalOpen(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                      >
                        <Ionicons name="close" size={21} color={themeColors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.portalSheetTitle, { color: themeColors.text }]}>Institution portal</Text>
                    <Text style={[styles.portalSheetText, { color: themeColors.textMuted }]}>
                      For institution owners and administrators. Students and staff should sign in using credentials provided by their institution.
                    </Text>
                    <Button
                      title="Continue to portal"
                      onPress={openInstitutionPortal}
                      style={styles.portalPrimaryButton}
                    />
                  </GlassCard>
                ) : (
                  <View
                    style={[
                      styles.portalSheet,
                      isSimple && styles.portalSheetSimple,
                      {
                        backgroundColor: themeColors.surface,
                        borderColor: themeColors.border,
                        paddingBottom: Math.max(insets.bottom, Spacing.xl),
                      },
                    ]}
                  >
                    <View style={styles.portalSheetHeader}>
                      <View style={[
                        styles.portalSheetIcon,
                        { backgroundColor: themeColors.primaryBg },
                        isSimple && styles.portalSheetIconSimple,
                      ]}>
                        <Ionicons name="business-outline" size={20} color={themeColors.accent} />
                      </View>
                      <TouchableOpacity
                        style={styles.portalCloseButton}
                        onPress={() => setInstitutionPortalOpen(false)}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                      >
                        <Ionicons name="close" size={21} color={themeColors.textMuted} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.portalSheetTitle, { color: themeColors.text }]}>Institution portal</Text>
                    <Text style={[styles.portalSheetText, { color: themeColors.textMuted }]}>
                      For institution owners and administrators. Students and staff should sign in using credentials provided by their institution.
                    </Text>
                    <Button
                      title="Continue to portal"
                      onPress={openInstitutionPortal}
                      style={isSimple
                        ? { ...styles.portalPrimaryButton, ...styles.portalPrimaryButtonSimple }
                        : styles.portalPrimaryButton}
                    />
                  </View>
                )}
              </Pressable>
            </Pressable>
          </Modal>

        </View>
      </View>
    </View>
  );

  // ── Simple variant ────────────────────────────────────
  if (isSimple) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={[
            styles.loginRoot,
            {
              backgroundColor: themeColors.background,
              paddingTop: Math.max(insets.top, Spacing.lg),
              paddingBottom: Math.max(insets.bottom, Spacing.lg),
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.loginScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.contentWrapper, isTablet && styles.tabletContentWrapper]}>
              <View
                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderRadius: 12, padding: Spacing.lg }}
              >
                {loginContent}
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Glass variant ────────────────────────────────────
  if (isGlass) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={bgColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.loginRoot,
            {
              paddingTop: Math.max(insets.top, Spacing.lg),
              paddingBottom: Math.max(insets.bottom, Spacing.lg),
            },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.loginScrollContent}
          >
            <View style={[styles.contentWrapper, isTablet && styles.tabletContentWrapper]}>
              <GlassCard padding={Spacing.lg}>
                {loginContent}
              </GlassCard>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  // ── Default variant (unchanged) ──────────────────────
  return (
    <KeyboardAvoidingView 
      style={styles.keyboardRoot}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View
        style={[
          styles.loginRoot,
          {
            backgroundColor: themeColors.background,
            paddingTop: Math.max(insets.top, Spacing.lg),
            paddingBottom: Math.max(insets.bottom, Spacing.lg),
          },
        ]}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.loginScrollContent}
        >
          {loginContent}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardRoot: {
    flex: 1,
  },
  loginRoot: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  loginScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  tabletContentWrapper: {
    maxWidth: 430,
  },
  authSheet: {
    justifyContent: 'center',
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  },
  loginContent: {
    width: '100%',
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandMark: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
  roleSwitch: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 3,
    marginBottom: Spacing.lg,
    minHeight: 44,
    overflow: 'hidden',
  },
  roleSwitchIndicator: {
    position: 'absolute',
    left: 3,
    top: 3,
    bottom: 3,
    borderRadius: Radius.full,
  },
  roleSwitchOption: {
    flex: 1,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    zIndex: 1,
  },
  roleSwitchText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  form: {
    gap: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  error: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  submitButton: {
    marginTop: Spacing.md,
    height: 44,
  },
  institutionLink: {
    marginTop: Spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  institutionLinkText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
  },
  portalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(12, 18, 28, 0.46)',
  },
  portalOverlayGlass: {
    backgroundColor: 'rgba(6, 12, 24, 0.30)',
  },
  portalOverlaySimple: {
    backgroundColor: 'rgba(0, 0, 0, 0.32)',
  },
  portalSheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    overflow: 'hidden',
  },
  portalSheetGlass: {
    borderTopLeftRadius: Radius.glassNav,
    borderTopRightRadius: Radius.glassNav,
    borderWidth: 1,
  },
  portalSheetSimple: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
  },
  portalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  portalSheetIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalSheetIconGlass: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  portalSheetIconSimple: {
    borderRadius: Radius.sm,
  },
  portalCloseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalSheetTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.sm,
  },
  portalSheetText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 21,
  },
  portalPrimaryButton: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  portalPrimaryButtonSimple: {
    borderRadius: Radius.sm,
  },
});
