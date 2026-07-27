import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography, Spacing, Radius } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CardListSkeleton } from '@/components/ui/Skeleton';
import { apiClient } from '@/utils/api';

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: 'OPEN' | 'WORKING' | 'RESOLVED' | 'FORWARDED';
  isForwarded: boolean;
  platformStatus: string | null;
  createdAt: string;
};

export default function HelpdeskScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/api/tickets');
      setTickets(res.tickets || []);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load tickets.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please enter a title and description.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient('/api/tickets', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      fetchTickets();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenShell
      title="Helpdesk"
      subtitle="Create Ticket if app is not working..."
      headerHeight={88}
      actions={
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      }
    >
      <ScrollView contentContainerStyle={[styles.content, isTablet && styles.tabletContent]}>
        {!isCreating && (
          <Button 
            title="Create New Ticket"
            icon={<Ionicons name="add" size={20} color="#fff" />}
            onPress={() => setIsCreating(true)}
            style={{ marginBottom: Spacing.lg }}
          />
        )}

        {isCreating && (
          <Card style={{ marginBottom: Spacing.xl }}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: themeColors.text }]}>New Support Request</Text>
              <TouchableOpacity onPress={() => setIsCreating(false)}>
                <Ionicons name="close" size={24} color={themeColors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: themeColors.text }]}>Title</Text>
            <TextInput
              style={[styles.input, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
              placeholder="E.g., Cannot access timetable"
              placeholderTextColor={themeColors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: themeColors.text, marginTop: Spacing.md }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.surface }]}
              placeholder="Provide details about your issue..."
              placeholderTextColor={themeColors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Button 
              title={submitting ? "Submitting..." : "Submit Request"}
              onPress={handleSubmit}
              disabled={submitting}
              style={{ marginTop: Spacing.lg }}
            />
          </Card>
        )}

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Your Tickets</Text>

        {loading ? (
          <CardListSkeleton rows={3} />
        ) : tickets.length === 0 ? (
          <Card style={styles.emptyState}>
            <Ionicons name="ticket-outline" size={48} color={themeColors.textMuted} style={{ marginBottom: Spacing.md }} />
            <Text style={[styles.emptyText, { color: themeColors.text }]}>No tickets yet</Text>
            <Text style={[styles.emptySubText, { color: themeColors.textMuted }]}>If you have any issues, create a ticket to let your institution know.</Text>
          </Card>
        ) : (
          <View style={styles.ticketList}>
            {tickets.map((ticket) => (
              <Card key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={[styles.ticketTitle, { color: themeColors.text }]} numberOfLines={1}>{ticket.title}</Text>
                  
                  {ticket.status === 'OPEN' && <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}><Text style={[styles.badgeText, { color: '#1D4ED8' }]}>OPEN</Text></View>}
                  {ticket.status === 'WORKING' && <View style={[styles.badge, { backgroundColor: '#FEF3C7' }]}><Text style={[styles.badgeText, { color: '#B45309' }]}>WORKING</Text></View>}
                  {ticket.status === 'RESOLVED' && <View style={[styles.badge, { backgroundColor: '#D1FAE5' }]}><Text style={[styles.badgeText, { color: '#047857' }]}>RESOLVED</Text></View>}
                  {ticket.isForwarded && <View style={[styles.badge, { backgroundColor: '#EDE9FE' }]}><Text style={[styles.badgeText, { color: '#6D28D9' }]}>ESCALATED</Text></View>}
                </View>
                <Text style={[styles.ticketDate, { color: themeColors.textMuted }]}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                <Text style={[styles.ticketDescription, { color: themeColors.text }]} numberOfLines={3}>{ticket.description}</Text>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
  tabletContent: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: Spacing.xl,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  sectionTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.md,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
  },
  label: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.base,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  emptyText: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.lg,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptySubText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
  ticketList: {
    gap: Spacing.md,
  },
  ticketCard: {
    padding: Spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  ticketTitle: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.base,
    flex: 1,
  },
  ticketDate: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginBottom: Spacing.sm,
  },
  ticketDescription: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 10,
  }
});
