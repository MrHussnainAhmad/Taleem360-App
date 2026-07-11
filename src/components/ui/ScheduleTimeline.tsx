import { useThemeColors } from '@/context/ThemePreferencesContext';
import React from 'react';
import { StyleSheet, Text, useColorScheme, View, ViewStyle } from 'react-native';
import { Radius, Spacing, Typography } from '@/constants/theme';

type ScheduleTone = 'default' | 'info' | 'success' | 'warning' | 'error';

export type ScheduleTimelineItem = {
  id: string;
  marker: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  tone?: ScheduleTone;
};

type ScheduleTimelineProps = {
  items: ScheduleTimelineItem[];
  style?: ViewStyle;
};

export function ScheduleTimeline({ items, style }: ScheduleTimelineProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = useThemeColors();

  const getToneColor = (tone: ScheduleTone = 'default') => {
    if (tone === 'success') return themeColors.success;
    if (tone === 'warning') return themeColors.warning;
    if (tone === 'error') return themeColors.error;
    if (tone === 'info') return themeColors.info;
    return themeColors.accent;
  };

  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => {
        const toneColor = getToneColor(item.tone);
        const isLast = index === items.length - 1;
        
        // Split marker (e.g. "08:00\n09:00") into start and end times
        const times = item.marker.split('\n');
        const startTime = times[0];
        const endTime = times[1] || '';

        // Generate soft background and border based on tone
        const cardBgColor = isDark ? `${toneColor}1A` : `${toneColor}10`; // 10% opacity
        const cardBorderColor = isDark ? `${toneColor}33` : `${toneColor}20`; // 20% opacity

        return (
          <View key={item.id} style={styles.row}>
            {/* Left Column (Times) */}
            <View style={styles.timeColumn}>
              <Text style={[styles.timeStart, { color: themeColors.text }]} numberOfLines={1}>
                {startTime}
              </Text>
              {endTime ? (
                <Text style={[styles.timeEnd, { color: themeColors.textMuted }]} numberOfLines={1}>
                  {endTime}
                </Text>
              ) : null}
            </View>

            {/* Middle Rail */}
            <View style={styles.railColumn}>
              <View style={[styles.ring, { borderColor: toneColor, backgroundColor: themeColors.background }]}>
                <View style={[styles.innerDot, { backgroundColor: toneColor }]} />
              </View>
              {!isLast ? <View style={[styles.rail, { backgroundColor: themeColors.border }]} /> : null}
            </View>

            {/* Right Column (Card Content) */}
            <View style={[styles.cardContainer, isLast && styles.lastCardContainer]}>
              <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: cardBorderColor }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.title, { color: themeColors.text }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.badge ? (
                    <View style={[styles.badge, { backgroundColor: themeColors.surface, borderColor: toneColor }]}>
                      <Text style={[styles.badgeText, { color: toneColor }]} numberOfLines={1}>
                        {item.badge}
                      </Text>
                    </View>
                  ) : null}
                </View>
                
                {item.subtitle ? (
                  <Text style={[styles.subtitle, { color: themeColors.text }]} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
                
                {item.meta ? (
                  <Text style={[styles.meta, { color: themeColors.textMuted }]} numberOfLines={1}>
                    {item.meta}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
  },
  timeColumn: {
    width: 60,
    paddingTop: Spacing.sm,
    alignItems: 'flex-end',
    paddingRight: Spacing.sm,
  },
  timeStart: {
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.sm,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  timeEnd: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  railColumn: {
    width: 24,
    alignItems: 'center',
    paddingTop: Spacing.sm + 2,
  },
  ring: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  rail: {
    flex: 1,
    width: 2,
    marginTop: -7, // Pull up under the ring
    marginBottom: -10, // Extend down into next row's padding
    zIndex: 1,
  },
  cardContainer: {
    flex: 1,
    paddingLeft: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  lastCardContainer: {
    paddingBottom: Spacing.xs,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.base,
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  meta: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    lineHeight: 16,
  },
  badge: {
    maxWidth: 90,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
