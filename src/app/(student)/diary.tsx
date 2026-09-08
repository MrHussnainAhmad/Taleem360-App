import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiClient } from "@/utils/api";
import { useThemeColors } from "@/context/ThemePreferencesContext";
import { Radius, Spacing, Typography } from "@/constants/theme";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { Card } from "@/components/ui/Card";
import { SkeletonList } from "@/components/ui/Skeleton";

type DiaryEntry = {
  id: number;
  content: string;
  date: string;
  subjectName: string | null;
  staffName: string | null;
};
const today = () => new Date().toISOString().slice(0, 10);

export default function DiaryScreen() {
  const colors = useThemeColors();
  const [date, setDate] = useState(today);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      setEntries(
        await apiClient(`/api/student/diary?date=${encodeURIComponent(date)}`),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not load the diary.",
      );
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return (
    <ScreenShell
      title="Daily Diary"
      subtitle="Homework and classwork for the selected day."
      eyebrow="Learning"
      icon={<Ionicons name="book-outline" size={22} color="#FFF" />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        />
      }
    >
      <TextInput
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        keyboardType="numbers-and-punctuation"
        style={[
          styles.date,
          {
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      />
      {loading && !refreshing ? (
        <SkeletonList rows={3} />
      ) : error ? (
        <Card>
          <Text style={[styles.message, { color: colors.error }]}>{error}</Text>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            No diary was recorded for this date.
          </Text>
        </Card>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id} title={entry.subjectName || "Class update"}>
            <Text style={[styles.teacher, { color: colors.textMuted }]}>
              {entry.staffName
                ? `Teacher: ${entry.staffName}`
                : "Institution diary"}
            </Text>
            <Text style={[styles.content, { color: colors.text }]}>
              {entry.content}
            </Text>
          </Card>
        ))
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  date: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: Typography.fontFamilyMedium,
  },
  teacher: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.xs,
    marginBottom: Spacing.sm,
  },
  content: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
    lineHeight: 21,
  },
  message: {
    textAlign: "center",
    paddingVertical: Spacing.lg,
    fontFamily: Typography.fontFamily,
  },
});
