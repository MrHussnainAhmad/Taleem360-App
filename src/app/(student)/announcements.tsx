import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '@/utils/api';
import { Typography, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonList } from '@/components/ui/Skeleton';

export default function AnnouncementsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(student)');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const data = await apiClient('/api/announcements/notifications');
      setAnnouncements(data.announcements || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };

  return (
    <ScreenShell
      title="Announcements"
      subtitle="Institution updates and exam notices."
      eyebrow="Inbox"
      icon={<Ionicons name="megaphone-outline" size={22} color="#FFFFFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {loading && !refreshing ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: themeColors.textMuted }}>No announcements to display.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {announcements.map((ann) => {
            const dateStr = ann.createdAtIso ? new Date(ann.createdAtIso).toLocaleString() : '';
            return (
              <TouchableOpacity 
                key={ann.id} 
                activeOpacity={0.7}
                onPress={() => router.push({
                  pathname: '/(student)/announcement/[id]',
                  params: {
                    id: ann.id,
                    title: ann.title,
                    content: ann.content,
                    senderRole: ann.senderRole,
                    createdAtIso: ann.createdAtIso
                  }
                })}
              >
                <Card style={styles.card}>
                  <View style={styles.header}>
                    <Text style={[styles.cardTitle, { color: themeColors.text }]}>{ann.title}</Text>
                    <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>
                      {dateStr}
                    </Text>
                  </View>
                  <Text style={[styles.content, { color: themeColors.text }]} numberOfLines={3}>{ann.content}</Text>
                  <Text style={[styles.sender, { color: themeColors.textMuted }]}>
                    From: {ann.senderRole.replace('_', ' ')}
                  </Text>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.xl,
    marginBottom: Spacing.lg,
  },
  center: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.md,
  },
  list: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  card: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.md,
    flex: 1,
    marginRight: Spacing.md,
  },
  content: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  sender: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
