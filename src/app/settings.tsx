import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { apiClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { registerForPushNotificationsWithResult } from '@/utils/notifications';
import { useThemeColors, useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
import Slider from '@react-native-community/slider';
import { AppearancePicker } from '@/components/ui/AppearancePicker';
import { Card } from '@/components/ui/Card';
import { useParentHardwareBack } from '@/components/parent/ParentBackButton';
import {
  SETTINGS_BG_COLORS_LIGHT,
  SETTINGS_BG_COLORS_DARK,
} from '@/constants/glassStyles';

export default function SettingsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const themeColors = useThemeColors();
  const { isGlass, glassIntensity, setGlassIntensity } = useThemePreferences();
  const { brand, user } = useAuth();
  const insets = useSafeAreaInsets();
  useParentHardwareBack(user?.role === 'PARENT' ? '/(parent)/account' : null);

  const [testNotifications, setTestNotifications] = useState(true);
  const [announcementNotifications, setAnnouncementNotifications] = useState(true);
  const preferenceTouched = useRef({ test: false, announcement: false });
  const preferenceRequestIds = useRef({ test: 0, announcement: 0 });
  const preferenceQueues = useRef<Record<'test' | 'announcement', Promise<void>>>({
    test: Promise.resolve(),
    announcement: Promise.resolve(),
  });
  
  useEffect(() => {
    // Push preferences only — brand is already restored from Auth storage.
    loadPushPreferences();
  }, []);

  const loadPushPreferences = async () => {
    try {
      const preferences = await apiClient('/api/me/push-preferences');
      if (!preferenceTouched.current.test) {
        setTestNotifications(preferences.testNotifications !== false);
      }
      if (!preferenceTouched.current.announcement) {
        setAnnouncementNotifications(preferences.announcementNotifications !== false);
      }
    } catch (error: any) {
      console.warn('Failed to load push preferences', error);
    }
  };

  const ensurePushToken = async () => {
    const result = await registerForPushNotificationsWithResult();
    if (!result.ok) {
      Alert.alert('Notifications not enabled', result.reason || 'Could not register this device for push notifications.');
      return false;
    }
    return true;
  };

  const updatePushPreference = (key: 'test' | 'announcement', nextValue: boolean) => {
    const previousTest = testNotifications;
    const previousAnnouncement = announcementNotifications;
    const requestId = ++preferenceRequestIds.current[key];
    preferenceTouched.current[key] = true;

    if (key === 'test') setTestNotifications(nextValue);
    else setAnnouncementNotifications(nextValue);

    preferenceQueues.current[key] = preferenceQueues.current[key].then(async () => {
      try {
        if (nextValue) {
          const tokenReady = await ensurePushToken();
          if (!tokenReady) throw new Error('Push notifications are not enabled on this device.');
        }

        await apiClient('/api/me/push-preferences', {
          method: 'PATCH',
          body: JSON.stringify(
            key === 'test'
              ? { testNotifications: nextValue }
              : { announcementNotifications: nextValue }
          ),
        });
      } catch (error: any) {
        // Only roll back if this is still the user's latest choice for this switch.
        if (preferenceRequestIds.current[key] === requestId) {
          if (key === 'test') setTestNotifications(previousTest);
          else setAnnouncementNotifications(previousAnnouncement);
          Alert.alert('Could not update setting', error.message || 'Please try again.');
        }
      }
    });
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>{title}</Text>
  );

  const bgColors = isDark ? SETTINGS_BG_COLORS_DARK : SETTINGS_BG_COLORS_LIGHT;

  const content = (
    <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: Spacing.xxl * 2, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
      
      {/* Header Navigation */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top - Spacing.sm, 0) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace((user?.role === 'STAFF' ? '/(staff)' : user?.role === 'PARENT' ? '/(parent)/account' : '/(student)') as never)}>
          <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.backButtonBlur}>
            <Ionicons name="arrow-back" size={22} color={themeColors.text} />
          </BlurView>
        </TouchableOpacity>
      </View>

      <Text style={[styles.pageTitle, { color: themeColors.text }]}>Settings</Text>
      {/* Brand Banner */}
      {brand && (
        <View style={styles.brandContainer}>
          <View style={styles.brandLogoWrapper}>
            <View style={[
              styles.brandLogoRing,
              { borderColor: themeColors.border },
              isGlass && { borderColor: 'rgba(255,255,255,0.30)', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.18)' },
            ]}>
              {brand.logoKey ? (
                <Image 
                  source={{ uri: brand.logoKey }} 
                  style={styles.brandLogo} 
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.brandLogoPlaceholder, { backgroundColor: themeColors.accent }]}>
                  <Text style={styles.brandLogoText}>{brand.name.charAt(0)}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.brandName, { color: themeColors.text }]}>{brand.name}</Text>
          <View style={[
            styles.roleBadge,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            isGlass && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)' },
          ]}>
            <Text style={[styles.roleText, { color: themeColors.textMuted }]}>{brand.role || 'Member'}</Text>
          </View>
        </View>
      )}

      {/* Settings Content */}
      <View style={styles.content}>
        {renderSectionHeader('App Preferences')}
        
        <Card noPadding style={{ overflow: 'hidden', marginBottom: Spacing.md }}>
            <AppearancePicker />

            {/* Glass Density Slider */}
            {isGlass && (
              <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm }}>
                  <View style={styles.rowContent}>
                    <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                      <Ionicons name="water-outline" size={18} color={themeColors.accent} />
                    </View>
                    <Text style={[styles.rowText, { color: themeColors.text }]}>Glass Density</Text>
                  </View>
                  <Text style={[styles.rowText, { color: themeColors.textMuted, fontSize: Typography.size.sm }]}>
                    {Math.round(glassIntensity * 100)}%
                  </Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0.2}
                  maximumValue={3.0}
                  value={glassIntensity}
                  onSlidingComplete={(val) => void setGlassIntensity(val)}
                  minimumTrackTintColor={themeColors.accent}
                  maximumTrackTintColor={themeColors.borderHover}
                  thumbTintColor={themeColors.accent}
                />
              </View>
            )}

            {/* Notifications */}
            {brand?.role === 'STUDENT' && (
              <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}>
                <View style={styles.rowContent}>
                  <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Ionicons name="notifications" size={18} color={themeColors.accent} />
                  </View>
                  <Text style={[styles.rowText, { color: themeColors.text }]}>Test Alerts</Text>
                </View>
                <Switch 
                  value={testNotifications} 
                  onValueChange={(value) => updatePushPreference('test', value)}
                  trackColor={{ false: themeColors.border, true: themeColors.accent }}
                  thumbColor="#fff"
                />
              </View>
            )}

            <View style={styles.row}>
              <View style={styles.rowContent}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <Ionicons name="megaphone" size={18} color={themeColors.success} />
                </View>
                <Text style={[styles.rowText, { color: themeColors.text }]}>Announcements</Text>
              </View>
              <Switch 
                value={announcementNotifications} 
                onValueChange={(value) => updatePushPreference('announcement', value)}
                trackColor={{ false: themeColors.border, true: themeColors.accent }}
                thumbColor="#fff"
              />
            </View>
        </Card>

        {renderSectionHeader('Support')}
        
        <Card noPadding style={{ overflow: 'hidden', marginBottom: Spacing.lg }}>
          <TouchableOpacity 
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/helpdesk')}
            activeOpacity={0.5}
          >
            <View style={styles.rowContent}>
              <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                <Ionicons name="ticket" size={18} color={themeColors.accent} />
              </View>
              <Text style={[styles.rowText, { color: themeColors.text }]}>Helpdesk</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
        </Card>

        {renderSectionHeader('About & Legal')}
        <Card noPadding style={{ overflow: 'hidden' }}>
            <TouchableOpacity 
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}
              onPress={() => router.push('/about-app')}
              activeOpacity={0.5}
            >
              <View style={styles.rowContent}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <Ionicons name="information-circle" size={18} color={themeColors.accent} />
                </View>
                <Text style={[styles.rowText, { color: themeColors.text }]}>About App</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}
              onPress={() => router.push('/about-developer')}
              activeOpacity={0.5}
            >
              <View style={styles.rowContent}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <Ionicons name="code-slash" size={18} color={themeColors.accent} />
                </View>
                <Text style={[styles.rowText, { color: themeColors.text }]}>About Developer</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}
              onPress={() => router.push('/privacy-policy')}
              activeOpacity={0.5}
            >
              <View style={styles.rowContent}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <Ionicons name="shield-checkmark" size={18} color={themeColors.accent} />
                </View>
                <Text style={[styles.rowText, { color: themeColors.text }]}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.row, { borderBottomWidth: 0 }]}
              onPress={() => router.push('/terms-conditions')}
              activeOpacity={0.5}
            >
              <View style={styles.rowContent}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <Ionicons name="document-text" size={18} color={themeColors.accent} />
                </View>
                <Text style={[styles.rowText, { color: themeColors.text }]}>Terms & Conditions</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>
        </Card>

      </View>

      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: themeColors.textMuted }]}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );

  // ── Glass variant: gradient background ───────────────
  if (isGlass) {
    return (
      <LinearGradient
        colors={bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {content}
      </LinearGradient>
    );
  }

  // ── Default variant ──────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: { fontFamily: Typography.fontFamilyDisplay, fontSize: 28, paddingHorizontal: 24, marginBottom: 8 },
  scrollContent: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  backButtonBlur: {
    padding: Spacing.sm,
    borderRadius: 20,
  },
  brandContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  brandLogoWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0,
    shadowRadius: 12,
    elevation: 0,
    marginBottom: Spacing.sm,
  },
  brandLogoRing: {
    width: 56,
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    padding: 3,
    backgroundColor: '#fff', // Or dynamic based on theme, but white frames logos well usually
  },
  brandLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  brandLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 40,
    color: '#FFFFFF',
  },
  brandName: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    textAlign: 'center',
    letterSpacing: 0,
  },
  roleBadge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  roleText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginLeft: Spacing.sm,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
  },
  rowText: {
    flexShrink: 1,
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.base,
  },
  dropdown: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  dropdownOption: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dropdownIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  themeSelector: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    padding: 2,
  },
  themeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md - 2,
  },
  themeOptionText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  versionText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    letterSpacing: 0,
  }
});
