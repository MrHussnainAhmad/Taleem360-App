import React from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { useColorScheme } from 'react-native';

export interface Column<T> {
  key: string;
  title: string;
  flex?: number;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  style?: ViewStyle;
}

export function Table<T>({ columns, data, keyExtractor, style }: TableProps<T>) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { borderColor: themeColors.border, backgroundColor: themeColors.surface }, style]}>
      {/* Header */}
      <View style={[styles.headerRow, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        {columns.map((col, index) => (
          <View 
            key={`header-${col.key}-${index}`} 
            style={[styles.cell, col.flex ? { flex: col.flex } : col.width ? { width: col.width } : { flex: 1 }]}
          >
            <Text style={[styles.headerText, { color: themeColors.textMuted }]} numberOfLines={1}>
              {col.title}
            </Text>
          </View>
        ))}
      </View>

      {/* Body */}
      <ScrollView style={styles.body} nestedScrollEnabled>
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No data available</Text>
          </View>
        ) : (
          data.map((item, rowIndex) => (
            <View 
              key={keyExtractor(item, rowIndex)} 
              style={[
                styles.row, 
                { borderBottomColor: themeColors.border },
                rowIndex === data.length - 1 && { borderBottomWidth: 0 } // No border on last item
              ]}
            >
              {columns.map((col, colIndex) => (
                <View 
                  key={`cell-${col.key}-${colIndex}`} 
                  style={[styles.cell, col.flex ? { flex: col.flex } : col.width ? { width: col.width } : { flex: 1 }]}
                >
                  {col.render ? (
                    col.render(item, rowIndex)
                  ) : (
                    <Text style={[styles.cellText, { color: themeColors.text }]} numberOfLines={2}>
                      {String((item as any)[col.key] || '')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: Spacing.ms,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  cell: {
    justifyContent: 'center',
    paddingRight: Spacing.sm,
  },
  headerText: {
    fontFamily: Typography.fontFamilyMedium,
    fontSize: Typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cellText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    fontVariant: ['tabular-nums'],
  },
  body: {
    maxHeight: 400, // Reasonable default max height
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.sm,
  }
});
