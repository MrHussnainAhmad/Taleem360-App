import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/theme';
import { useThemeColors } from '@/context/ThemePreferencesContext';

type Lesson = {
  startTime: string;
  endTime: string;
  subjectName?: string | null;
  teacherName?: string | null;
  className?: string | null;
  sectionName?: string | null;
};

function formatTime(value: string) {
  const [hour, minute] = value.split(':');
  if (!hour || !minute) return value;
  const h = Number(hour);
  return `${h % 12 || 12}:${minute} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function DashboardSchedule({ lessons }: { lessons: Lesson[] }) {
  const colors = useThemeColors();
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.text }]}>{"Today's Classes"}</Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>{lessons.length} scheduled</Text>
      </View>
      {lessons.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
          {lessons.map((lesson, index) => (
            <View key={`${lesson.startTime}-${index}`} style={[styles.lesson, { borderColor: colors.border }]}>
              <View style={[styles.timeRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.marker, { backgroundColor: index % 2 ? colors.warning : colors.accent }]} />
                <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}</Text>
              </View>
              <Text style={[styles.subject, { color: colors.text }]} numberOfLines={2}>{lesson.subjectName || 'Class'}</Text>
              <Text style={[styles.detail, { color: colors.textMuted }]} numberOfLines={2}>{lesson.teacherName || [lesson.className, lesson.sectionName].filter(Boolean).join(' / ') || 'Class not assigned'}</Text>
            </View>
          ))}
        </ScrollView>
      ) : <Text style={[styles.empty, { color: colors.textMuted }]}>No classes scheduled for today.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingTop: 8, paddingBottom: 8 },
  heading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 18 },
  title: { fontFamily: Typography.fontFamilyDisplay, fontSize: 20 },
  count: { fontFamily: Typography.fontFamilyMedium, fontSize: 11 },
  track: { gap: 20, paddingBottom: 8 },
  lesson: { width: 240, borderRightWidth: 1, paddingRight: 20 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, paddingBottom: 12, marginBottom: 14 },
  marker: { width: 7, height: 7, borderRadius: 4 },
  time: { fontFamily: Typography.fontFamilyMedium, fontSize: 11 },
  subject: { fontFamily: Typography.fontFamilySemiBold, fontSize: 17, lineHeight: 23, minHeight: 46 },
  detail: { fontFamily: Typography.fontFamily, fontSize: 12, lineHeight: 18, marginTop: 3 },
  empty: { fontFamily: Typography.fontFamily, fontSize: 13, paddingVertical: 16 },
});
