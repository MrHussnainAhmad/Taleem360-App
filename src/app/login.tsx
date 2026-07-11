import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, View, Text, StyleSheet, KeyboardAvoidingView, Platform, Linking, TouchableOpacity, useWindowDimensions, useColorScheme } from 'react-native';
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
            onPress={() => Linking.openURL('https://lms-two-iota-69.vercel.app/login')}
          >
            <Text style={[styles.institutionLinkText, { color: themeColors.accent }]}>
              Login/Register as Institution?
            </Text>
          </TouchableOpacity>
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
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centerContainer}>
              <View
                style={[
                  styles.glassCard,
                  { backgroundColor: themeColors.surface, borderColor: themeColors.border, borderWidth: 1, borderRadius: 12 }
                ]}
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
    marginTop: Spacing.md,
    alignItems: 'center',
    padding: Spacing.xs,
  },
  institutionLinkText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
});
