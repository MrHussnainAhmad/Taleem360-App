import { useThemeColors, useThemePreferences, useResolvedColorScheme as useColorScheme } from '@/context/ThemePreferencesContext';
import React from 'react';
import { ScrollView, RefreshControlProps, StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { SETTINGS_BG_COLORS_LIGHT, SETTINGS_BG_COLORS_DARK } from '@/constants/glassStyles';
import { GlassCard } from './GlassCard';
import { usePortalVisuals } from '@/context/PortalVisualContext';

type ScreenShellProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
  headerHeight?: number;
  headerPaddingBottom?: number;
  compactHeader?: boolean;
  contentStyle?: ViewStyle;
  sheetStyle?: ViewStyle;
  noSheetPadding?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  headerScrollable?: boolean;
  glassBackgroundColors?: [string, string, string];
  masthead?: React.ReactNode;
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
  headerPaddingBottom,
  compactHeader = true,
  contentStyle,
  sheetStyle,
  noSheetPadding = false,
  refreshControl,
  headerScrollable = true,
  glassBackgroundColors,
  masthead,
}: ScreenShellProps) {
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isPortalScreen = usePortalVisuals();
  const isDark = useColorScheme() === 'dark';
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 600;
  const safeTopPadding = insets.top;
  const resolvedHeaderHeight = (headerHeight ?? (isTablet ? (compactHeader ? 136 : 160) : (compactHeader ? 116 : 140))) + insets.top;

  const bgColors = glassBackgroundColors ?? (isDark ? SETTINGS_BG_COLORS_DARK : SETTINGS_BG_COLORS_LIGHT);

  const sheet = (
    <View
      style={[
        styles.sheet,
        !scrollable && { minHeight: 0 },
        isPortalScreen && styles.portalSheet,
        {
          backgroundColor: 'transparent',
          borderColor: isGlass ? 'transparent' : themeColors.border,
          shadowOpacity: isGlass || isSimple ? 0 : undefined,
          elevation: isGlass || isSimple ? 0 : undefined,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
          borderWidth: 0,
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

  const textColor = isGlass || isSimple ? themeColors.text : '#FFFFFF';
  const subtextColor = isGlass || isSimple ? themeColors.textMuted : 'rgba(255,255,255,0.78)';
  const iconWrapBg = isGlass && !isDark ? 'rgba(20, 23, 31, 0.08)' : 'rgba(255,255,255,0.16)';

  const headerContent = (
    <View style={[styles.headerInner, isTablet && styles.tabletInner, (headerPaddingBottom !== undefined || compactHeader) && { paddingBottom: headerPaddingBottom ?? Spacing.md }]}>
      <View style={styles.headerTextWrap}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: subtextColor }]}>{eyebrow}</Text> : null}
        <View style={styles.titleRow}>
          {icon ? <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }, compactHeader && styles.compactIconWrap]}>{icon}</View> : null}
          <View style={styles.titleTextWrap}>
            <Text style={[styles.title, { color: textColor }, compactHeader && styles.compactTitle]}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: subtextColor }, compactHeader && styles.compactSubtitle]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {actions ? (
        <View
          style={[
            styles.actions,
            compactHeader && styles.compactActions,
            (isSimple || isGlass) && [styles.simpleActions, { backgroundColor: themeColors.accent }],
          ]}
        >
          {actions}
        </View>
      ) : null}
    </View>
  );

  let header;
  if (masthead) {
    header = <View style={{ paddingTop: insets.top, backgroundColor: isGlass ? 'transparent' : themeColors.background }}>{masthead}</View>;
  } else if (isPortalScreen) {
    header = (
      <View style={{ paddingTop: safeTopPadding }}>
        <View style={[styles.pageHeading, isTablet && styles.tabletInner]}>
          <View style={[styles.pageRule, { backgroundColor: themeColors.accent }]} />
          <View style={styles.titleTextWrap}>
            {eyebrow ? <Text style={[styles.eyebrow, { color: themeColors.textMuted }]}>{eyebrow}</Text> : null}
            <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
            {subtitle ? <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{subtitle}</Text> : null}
          </View>
          {actions ? <View style={[styles.actions, { backgroundColor: themeColors.headerGrad1, borderRadius: 24, padding: 4 }]}>{actions}</View> : null}
        </View>
      </View>
    );
  } else if (isSimple) {
    header = (
      <View style={[
        styles.simpleHeader, 
        { paddingTop: safeTopPadding, backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }
      ]}>
        {headerContent}
      </View>
    );
  } else if (isGlass) {
    header = (
      <GlassCard
        blur
        padding={0}
        contentStyle={{ flex: 1 }}
        style={[
          styles.header, 
          { 
            minHeight: resolvedHeaderHeight,
            paddingTop: safeTopPadding,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            zIndex: 10,
          }
        ]}
      >
        {headerContent}
      </GlassCard>
    );
  } else {
    header = (
      <LinearGradient
        colors={[themeColors.headerGrad1, themeColors.headerGrad2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { minHeight: resolvedHeaderHeight, paddingTop: safeTopPadding, zIndex: 10 }]}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  const renderBackground = () => {
    if (isGlass) {
      return <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />;
    }
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: themeColors.background }]} />;
  };

  // Add extra padding when glass mode is active because tab bar is absolute (floating)
  const bottomPadding = isGlass ? insets.bottom + 100 : Spacing.xxl;
  const sheetMarginTop = 0;

  if (headerScrollable && scrollable) {
    return (
      <View style={styles.container}>
        {renderBackground()}
        <ScrollView
          style={[styles.scrollableHeaderScroll, { backgroundColor: isGlass ? 'transparent' : themeColors.background }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }, contentStyle]}
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
    <View style={styles.container}>
      {renderBackground()}
      {header}
      {scrollable ? (
        <ScrollView
          style={[styles.scroll, { marginTop: sheetMarginTop, backgroundColor: isGlass ? 'transparent' : themeColors.background }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={refreshControl}
        >
          {sheet}
        </ScrollView>
      ) : (
        <View style={[styles.staticContent, { marginTop: sheetMarginTop }, contentStyle]}>{sheet}</View>
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
    flexGrow: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  tabletInner: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1120,
    paddingHorizontal: Spacing.lg,
  },
  headerTextWrap: {
    flex: 1,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: Typography.fontFamilySemiBold,
    fontSize: Typography.size.xs,
    letterSpacing: 0,
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
    fontFamily: Typography.fontFamilyDisplay,
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
  compactIconWrap: {
    width: 36,
    height: 36,
  },
  compactTitle: {
    fontSize: 24,
    lineHeight: 29,
  },
  compactSubtitle: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  compactActions: {
    flexShrink: 0,
  },
  simpleActions: {
    minHeight: 40,
    padding: 2,
    borderRadius: Radius.full,
  },
  glassActions: {
    minHeight: 40,
    padding: 2,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  scroll: {
    flex: 1,
  },
  scrollableHeaderScroll: {
    flex: 1,
  },
  scrollableHeaderSheetWrap: {
    marginTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  staticContent: {
    flex: 1,
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
  portalSheet: {
    gap: Spacing.md,
  },
  tabletSheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 1120,
  },
  simpleHeader: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
  },
  pageHeading: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 12 },
  pageRule: { width: 4, alignSelf: 'stretch', minHeight: 48 },
  simpleHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  simpleTitle: {
    fontFamily: Typography.fontFamilyBold,
    fontSize: Typography.size.lg,
    flex: 1,
  },
});
