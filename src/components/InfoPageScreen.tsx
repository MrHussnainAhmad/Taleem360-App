import { useThemeColors } from '@/context/ThemePreferencesContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { InfoPage } from '@/constants/info-pages';
import { ScreenShell } from '@/components/ui/ScreenShell';

type InfoPageScreenProps = {
  page: InfoPage;
};

export function InfoPageScreen({ page }: InfoPageScreenProps) {
  const router = useRouter();
  const themeColors = useThemeColors();

  return (
    <ScreenShell
      title={page.title}
      subtitle={page.subtitle}
      eyebrow={page.eyebrow}
      icon={<Ionicons name={page.icon} size={22} color="#FFFFFF" />}
      actions={
        <TouchableOpacity style={styles.headerActionButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      }
    >
      <View style={styles.content}>
        {page.sections.map((section) => (
          <View key={section.heading} style={[styles.section, { borderBottomColor: themeColors.border }]}>
            <View style={[styles.sectionMarker, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Ionicons name="checkmark" size={14} color={themeColors.accent} />
            </View>
            <View style={styles.sectionBody}>
              <Text style={[styles.heading, { color: themeColors.text }]}>{section.heading}</Text>
              <Text style={[styles.body, { color: themeColors.textMuted }]}>{section.body}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
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
  content: {
    paddingBottom: Spacing.xl,
  },
  section: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionMarker: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    borderWidth: 1,
  },
  sectionBody: {
    flex: 1,
  },
  heading: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.base,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  body: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    lineHeight: 22,
  },
});
