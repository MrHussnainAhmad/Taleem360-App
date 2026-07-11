import { useThemeColors } from '@/context/ThemePreferencesContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Radius, Spacing, Typography } from '@/constants/theme';

export default function ProfileSuggestionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = params.role === 'STAFF' ? 'STAFF' : 'STUDENT';
  const themeColors = useThemeColors();
  const homeRoute = role === 'STAFF' ? '/(staff)' : '/(student)';
  const profileRoute = role === 'STAFF' ? '/(staff)/profile' : '/(student)/profile';

  return (
    <ScreenShell
      title="Complete Profile"
      subtitle="Keep your account details accurate for school records."
      eyebrow="Optional step"
      icon={<Ionicons name="person-circle-outline" color="#FFFFFF" size={22} />}
      scrollable={false}
      sheetStyle={styles.sheet}
    >
      <View style={styles.contentWrapper}>
        <Card noPadding style={styles.card}>
          <View style={styles.cardContent}>
            <View style={[styles.iconBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Ionicons name="id-card-outline" size={30} color={themeColors.accent} />
            </View>
            <Text style={[styles.title, { color: themeColors.text }]}>Update your profile?</Text>
            <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
              You can review your name, contact details, and profile photo now, or skip and update it later from Profile.
            </Text>

            <View style={styles.actions}>
              <Button title="Update Profile" onPress={() => router.replace(profileRoute)} />
              <Button title="Skip for Now" variant="ghost" onPress={() => router.replace(homeRoute)} />
            </View>
          </View>
        </Card>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sheet: {
    justifyContent: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  card: {
    marginBottom: 0,
  },
  cardContent: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
