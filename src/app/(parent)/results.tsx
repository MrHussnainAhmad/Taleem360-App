import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useParentPortal } from '@/context/ParentPortalContext';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ScreenShell } from '@/components/ui/ScreenShell';
import { Card } from '@/components/ui/Card';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ParentChildSwitcher } from '@/components/parent/ParentChildSwitcher';
import { useParentPortalData } from '@/hooks/useParentPortalData';
import { useThemeColors } from '@/context/ThemePreferencesContext';
import { Spacing, Typography } from '@/constants/theme';
type Data = {
  pagination: { page: number; pages: number; total: number };
  performance: { subject: string; average: number; highest: number; assessments: number }[];
  results: {
    id: number;
    title: string;
    type: string;
    date: string;
    subject: string;
    obtained: number;
    total: number;
  }[];
};
export default function ParentResults() {
  const { selectedStudentId, period, periodAnchor } = useParentPortal();
  return <ResultList key={`${selectedStudentId}:${period}:${periodAnchor}`} />;
}
function ResultList() {
  const [page, setPage] = useState(1),
    [type, setType] = useState('ALL');
  const c = useThemeColors();
  const { data, loading, refreshing, error, reload } = useParentPortalData<Data>(
    'results',
    `&page=${page}&type=${type}`,
  );
  return (
    <ScreenShell
      title="Results"
      subtitle="Published marks and subject performance."
      eyebrow="Academics"
      icon={<Ionicons name="bar-chart-outline" size={22} color="#FFF" />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} />}
    >
      <ParentChildSwitcher />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['ALL', 'DAILY', 'WEEKLY', 'QUIZ', 'MONTHLY', 'MID', 'FINAL'].map((value) => (
          <Button
            key={value}
            title={value}
            variant={type === value ? 'solid' : 'outline'}
            onPress={() => {
              setType(value);
              setPage(1);
            }}
          />
        ))}
      </View>
      {loading ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <Card>
          <Text style={{ color: c.error }}>{error}</Text>
        </Card>
      ) : (
        <>
          <View style={styles.performance}>
            {data?.performance.map((item) => (
              <Card key={item.subject} style={styles.subject}>
                <Text style={[styles.subjectName, { color: c.text }]}>{item.subject}</Text>
                <Text style={[styles.average, { color: c.accent }]}>{Number(item.average) || 0}%</Text>
                <Text style={[styles.meta, { color: c.textMuted }]}>
                  Best {Number(item.highest) || 0}% ? {item.assessments} assessments
                </Text>
              </Card>
            ))}
          </View>
          <Card noPadding>
            {data?.results.length ? (
              data.results.map((row) => (
                <View key={row.id} style={[styles.row, { borderBottomColor: c.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: c.text }]}>{row.title}</Text>
                    <Text style={[styles.meta, { color: c.textMuted }]}>
                      {row.subject} · {row.type} · {row.date}
                    </Text>
                  </View>
                  <Text style={[styles.score, { color: c.accent }]}>
                    {row.obtained}/{row.total}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={[styles.empty, { color: c.textMuted }]}>No published results.</Text>
            )}
          </Card>
          <Text style={{ color: c.text }}>
            Page {data?.pagination.page || page} of {data?.pagination.pages || 1}
          </Text>
          <Button
            title="Previous results"
            disabled={page <= 1 || loading}
            onPress={() => setPage(page - 1)}
          />
          <Button
            title="Next results"
            disabled={page >= (data?.pagination.pages || 1) || loading}
            onPress={() => setPage(page + 1)}
          />
        </>
      )}
    </ScreenShell>
  );
}
const styles = StyleSheet.create({
  performance: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  subject: { width: '48%' },
  subjectName: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  average: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.xl, marginTop: Spacing.sm },
  meta: { fontFamily: Typography.fontFamily, fontSize: Typography.size.xs, marginTop: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.size.sm },
  score: { fontFamily: Typography.fontFamilyBold, fontSize: Typography.size.md },
  empty: { padding: Spacing.xl, textAlign: 'center' },
});
