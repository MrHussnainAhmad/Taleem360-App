import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScreenShell } from '@/components/ui/ScreenShell';

export default function AnnouncementDetailScreen() {
  const { title, content, senderRole, createdAtIso } = useLocalSearchParams();
  const router = useRouter();
  const themeColors = useThemeColors();

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(staff)/announcements');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  const dateString = typeof createdAtIso === 'string' ? new Date(createdAtIso).toLocaleString() : '';
  const senderStr = typeof senderRole === 'string' ? senderRole.replace('_', ' ') : '';

  return (
    <ScreenShell
      title="Announcement"
      subtitle={dateString}
      eyebrow={senderStr || 'Inbox'}
      icon={<Ionicons name="megaphone-outline" size={22} color="#FFFFFF" />}
    >
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
          <Text style={{ color: themeColors.textMuted, fontSize: Typography.size.sm, marginTop: Spacing.xs }}>
            {dateString}
          </Text>
        </View>
        <Text style={[styles.content, { color: themeColors.text }]}>{content}</Text>
        <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
          <Text style={[styles.sender, { color: themeColors.textMuted }]}>
            From: {senderStr}
          </Text>
        </View>
      </Card>

      <Button 
        title="Go Back" 
        variant="outline" 
        onPress={() => router.replace('/(staff)/announcements')} 
        style={{ marginTop: Spacing.xl }} 
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    paddingTop: Spacing.xl,
  },
  card: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
  },
  content: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  sender: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
