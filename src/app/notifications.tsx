import { useThemeColors } from '@/context/ThemePreferencesContext';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { apiClient } from '@/utils/api';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { SkeletonPage } from '@/components/ui/Skeleton';

type Notification = {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient('/api/me/notifications');
      setNotifications(res.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient('/api/me/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await apiClient('/api/me/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationIds: [id] })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  if (loading && !refreshing) {
    return <SkeletonPage title="Notifications" subtitle="Loading your updates." eyebrow="Inbox" iconName="notifications-outline" rows={5} />;
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <ScreenShell
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread updates.` : 'All caught up.'}
      eyebrow="Inbox"
      icon={<Ionicons name="notifications-outline" size={22} color="#FFFFFF" />}
      actions={
        <>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerActionButton}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markReadButton}>
              <Ionicons name="checkmark-done-outline" size={18} color="#FFFFFF" />
              <Text style={styles.markReadText}>Read</Text>
            </TouchableOpacity>
          ) : null}
        </>
      }
      noSheetPadding
      scrollable={false}
    >
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: Spacing.md }}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Ionicons name="notifications-off-outline" size={48} color={themeColors.textMuted} />
            <Text style={{ marginTop: 16, color: themeColors.textMuted, fontFamily: Typography.fontFamilyMedium }}>
              No notifications yet
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.card,
              { 
                backgroundColor: item.isRead ? themeColors.surface : themeColors.background,
                borderColor: themeColors.border,
                borderWidth: 1,
              }
            ]}
            onPress={() => {
              if (!item.isRead) markAsRead(item.id);
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: themeColors.text }]}>{item.title}</Text>
              {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: Colors.light.error }]} />}
            </View>
            <Text style={[styles.cardMessage, { color: themeColors.textMuted }]}>{item.message}</Text>
            <Text style={[styles.cardTime, { color: themeColors.textMuted }]}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  markReadButton: {
    minHeight: 40,
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  markReadText: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
  },
  title: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
  },
  card: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.base,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  cardMessage: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardTime: {
    fontFamily: Typography.fontFamily,
    fontSize: 12,
  },
});
