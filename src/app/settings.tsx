import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, useColorScheme, Appearance, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { apiClient } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { registerForPushNotificationsWithResult } from '@/utils/notifications';

type SettingsLink = {
  title: string;
  icon: string;
  color: string;
  href: '/privacy-policy' | '/terms-conditions' | '/about-app' | '/about-developer';
  noBorder?: boolean;
};

export default function SettingsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const { brand, refreshBrand } = useAuth();
  const insets = useSafeAreaInsets();

  const [testNotifications, setTestNotifications] = useState(false);
  const [announcementNotifications, setAnnouncementNotifications] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [savingPreference, setSavingPreference] = useState<'test' | 'announcement' | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  
  useEffect(() => {
    // Optionally refresh brand in background to keep it up to date
    refreshBrand();
    loadPushPreferences();
  }, []);

  const loadPushPreferences = async () => {
    try {
      const preferences = await apiClient('/api/me/push-preferences');
      setTestNotifications(Boolean(preferences.testNotifications));
      setAnnouncementNotifications(Boolean(preferences.announcementNotifications));
    } catch (error: any) {
      console.warn('Failed to load push preferences', error);
    } finally {
      setPreferencesLoading(false);
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

  const updatePushPreference = async (key: 'test' | 'announcement', nextValue: boolean) => {
    const previousTest = testNotifications;
    const previousAnnouncement = announcementNotifications;
    setSavingPreference(key);

    if (key === 'test') setTestNotifications(nextValue);
    else setAnnouncementNotifications(nextValue);

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
      setTestNotifications(previousTest);
      setAnnouncementNotifications(previousAnnouncement);
      Alert.alert('Could not update setting', error.message || 'Please try again.');
    } finally {
      setSavingPreference(null);
    }
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    setAppearanceOpen(false);
    if (mode === 'system') {
      Appearance.setColorScheme(null);
    } else {
      Appearance.setColorScheme(mode);
    }
  };

  const aboutLinks: SettingsLink[] = [
    { title: 'Privacy Policy', icon: 'shield-checkmark', color: '#8b5cf6', href: '/privacy-policy' },
    { title: 'Terms & Conditions', icon: 'document-text', color: '#10b981', href: '/terms-conditions' },
    { title: 'About App', icon: 'information-circle', color: '#3b82f6', href: '/about-app' },
    { title: 'About Developer', icon: 'code-slash', color: '#f59e0b', href: '/about-developer', noBorder: true },
  ];

  const themeOptions: Array<{ label: string; value: 'light' | 'dark' | 'system'; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Light', value: 'light', icon: 'sunny-outline' },
    { label: 'Dark', value: 'dark', icon: 'moon-outline' },
    { label: 'System', value: 'system', icon: 'phone-portrait-outline' },
  ];

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionTitle, { color: themeColors.textMuted }]}>{title}</Text>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView style={styles.scrollContent} contentContainerStyle={{ paddingBottom: Spacing.xxl * 2 }}>
        
        {/* Header Navigation */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top - Spacing.sm, 0) }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <BlurView intensity={isDark ? 30 : 60} tint={isDark ? "dark" : "light"} style={styles.backButtonBlur}>
              <Ionicons name="arrow-back" size={22} color={themeColors.text} />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Brand Banner */}
        {brand && (
          <View style={styles.brandContainer}>
            <View style={styles.brandLogoWrapper}>
              <View style={[styles.brandLogoRing, { borderColor: themeColors.border }]}>
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
            <View style={[styles.roleBadge, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Text style={[styles.roleText, { color: themeColors.accent }]}>{brand.role || 'Member'}</Text>
            </View>
          </View>
        )}

        {/* Settings Content */}
        <View style={styles.content}>
          {renderSectionHeader('App Preferences')}
          
          <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            
            {/* Theme Toggle */}
            <TouchableOpacity 
              style={[styles.row, { borderBottomWidth: 1, borderBottomColor: themeColors.border }]}
              onPress={() => setAppearanceOpen((open) => !open)}
              activeOpacity={0.7}
            >
              <View style={styles.rowContent}>
                <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  <Ionicons name="color-palette" size={18} color={themeColors.accent} />
                </View>
                <Text style={[styles.rowText, { color: themeColors.text }]}>Appearance</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: themeColors.textMuted, marginRight: Spacing.sm, fontFamily: Typography.fontFamilyMedium }}>
                  {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                </Text>
                <Ionicons name={appearanceOpen ? 'chevron-up' : 'chevron-down'} size={18} color={themeColors.textMuted} />
              </View>
            </TouchableOpacity>
            {appearanceOpen && (
              <View style={[styles.dropdown, { borderBottomColor: themeColors.border }]}>
                {themeOptions.map((option) => {
                  const selected = themeMode === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        { borderColor: themeColors.border },
                        selected && { borderColor: themeColors.accent },
                      ]}
                      onPress={() => handleThemeChange(option.value)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.dropdownOptionLeft}>
                        <View style={[styles.dropdownIcon, { borderColor: themeColors.border }]}>
                          <Ionicons name={option.icon} size={16} color={selected ? themeColors.accent : themeColors.textMuted} />
                        </View>
                        <Text style={[
                          styles.dropdownText,
                          { color: selected ? themeColors.accent : themeColors.text },
                          selected && { fontFamily: Typography.fontFamilySemiBold },
                        ]}>
                          {option.label}
                        </Text>
                      </View>
                      {selected ? <Ionicons name="checkmark-circle" size={18} color={themeColors.accent} /> : null}
                    </TouchableOpacity>
                  );
                })}
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
                  disabled={preferencesLoading || savingPreference !== null}
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
                disabled={preferencesLoading || savingPreference !== null}
                trackColor={{ false: themeColors.border, true: themeColors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {renderSectionHeader('About & Legal')}
          
          <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            {aboutLinks.map((item) => (
              <TouchableOpacity 
                key={item.title}
                style={[styles.row, !item.noBorder && { borderBottomWidth: 1, borderBottomColor: themeColors.border }]} 
                onPress={() => router.push(item.href)}
                activeOpacity={0.7}
              >
                <View style={styles.rowContent}>
                  <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={[styles.rowText, { color: themeColors.text }]}>{item.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>

        </View>

        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: themeColors.textMuted }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    marginBottom: Spacing.lg,
  },
  brandLogoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    padding: 3,
    backgroundColor: '#fff', // Or dynamic based on theme, but white frames logos well usually
  },
  brandLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  brandLogoPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
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
    fontSize: Typography.size.xxl,
    textAlign: 'center',
    letterSpacing: -0.5,
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
    letterSpacing: 1,
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
    letterSpacing: 1,
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
    letterSpacing: 0.5,
  }
});
