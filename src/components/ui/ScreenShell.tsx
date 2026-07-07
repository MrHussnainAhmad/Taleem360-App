import React from 'react';
import {
  ScrollView,
  RefreshControlProps,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
  headerHeight?: number;
  contentStyle?: ViewStyle;
  sheetStyle?: ViewStyle;
  noSheetPadding?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  headerScrollable?: boolean;
};

export function ScreenShell({
  title,
  subtitle,
  eyebrow,
  icon,
  actions,
  children,
  scrollable = true,
  headerHeight,
  contentStyle,
  sheetStyle,
  noSheetPadding = false,
  refreshControl,
  headerScrollable = false,
}: ScreenShellProps) {
  const isDark = useColorScheme() === 'dark';
  const themeColors = isDark ? Colors.dark : Colors.light;
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 600;
  const safeTopPadding = Math.max(insets.top - Spacing.sm, 0);
  const resolvedHeaderHeight = (headerHeight ?? (isTablet ? 160 : 140)) + insets.top;

  const sheet = (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          paddingHorizontal: noSheetPadding ? 0 : isTablet ? Spacing.lg : Spacing.md,
          paddingTop: noSheetPadding ? 0 : Spacing.lg,
        },
        isTablet && styles.tabletSheet,
        sheetStyle,
      ]}
    >
      {children}
    </View>
  );

  const header = (
      <LinearGradient
        colors={[themeColors.headerGrad1, themeColors.headerGrad2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { height: resolvedHeaderHeight, paddingTop: safeTopPadding }]}
      >
        <View style={[styles.headerInner, isTablet && styles.tabletInner]}>
          <View style={styles.headerTextWrap}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <View style={styles.titleRow}>
              {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
              <View style={styles.titleTextWrap}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={2}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          {actions ? <View style={styles.actions}>{actions}</View> : null}
        </View>
      </LinearGradient>
  );

  if (headerScrollable && scrollable) {
    return (
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView
          style={styles.scrollableHeaderScroll}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {header}
          <View style={styles.scrollableHeaderSheetWrap}>{sheet}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {header}
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {sheet}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, contentStyle]}>{sheet}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerInner: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  tabletInner: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 920,
    paddingHorizontal: Spacing.lg,
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  titleTextWrap: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamilyBold,
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontFamily: Typography.fontFamily,
    fontSize: Typography.size.md,
    lineHeight: 21,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scroll: {
    flex: 1,
    marginTop: -Radius.xl,
  },
  scrollableHeaderScroll: {
    flex: 1,
  },
  scrollableHeaderSheetWrap: {
    marginTop: -Radius.xl,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  staticContent: {
    flex: 1,
    marginTop: -Radius.xl,
  },
  sheet: {
    flex: 1,
    minHeight: 420,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  tabletSheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 920,
  },
});
