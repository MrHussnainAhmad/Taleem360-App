import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, RefreshControlProps, StyleSheet, Text, useWindowDimensions, View, ViewStyle,  } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { SETTINGS_BG_COLORS_LIGHT, SETTINGS_BG_COLORS_DARK } from '@/constants/glassStyles';
import { GlassCard } from './GlassCard';

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
  headerScrollable = false,
  glassBackgroundColors,
}: ScreenShellProps) {
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isDark = themeColors.background === '#0f172a'; // Simple check based on background or use useColorScheme
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 600;
  const scrollOffset = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disarmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshArmedRef = useRef(false);
  const [refreshArmed, setRefreshArmed] = useState(false);
  const safeTopPadding = Math.max(insets.top - Spacing.sm, 0);
  const resolvedHeaderHeight = (headerHeight ?? (isTablet ? (compactHeader ? 136 : 160) : (compactHeader ? 116 : 140))) + insets.top;

  const bgColors = glassBackgroundColors ?? (isDark ? SETTINGS_BG_COLORS_DARK : SETTINGS_BG_COLORS_LIGHT);

  const clearRefreshHold = () => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const clearDisarmTimer = () => {
    if (disarmTimer.current) {
      clearTimeout(disarmTimer.current);
      disarmTimer.current = null;
    }
  };

  const disarmRefresh = () => {
    refreshArmedRef.current = false;
    setRefreshArmed(false);
  };

  const startRefreshHold = () => {
    if (!refreshControl || scrollOffset.current > 0 || refreshArmedRef.current) return;
    clearRefreshHold();
    clearDisarmTimer();
    holdTimer.current = setTimeout(() => {
      refreshArmedRef.current = true;
      setRefreshArmed(true);
    }, 2000);
  };

  const finishRefreshHold = () => {
    clearRefreshHold();
    clearDisarmTimer();
    // Let the native refresh gesture complete before disarming it.
    disarmTimer.current = setTimeout(disarmRefresh, 150);
  };

  useEffect(() => () => {
    clearRefreshHold();
    clearDisarmTimer();
  }, []);

  const guardedRefreshControl = refreshControl
    ? React.cloneElement(refreshControl, {
        enabled: refreshArmed,
        onRefresh: () => {
          if (refreshArmedRef.current) refreshControl.props.onRefresh?.();
        },
      })
    : undefined;

  const sheet = (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: isGlass || isSimple ? 'transparent' : themeColors.surface,
          borderColor: isGlass ? 'transparent' : themeColors.border,
          shadowOpacity: isGlass || isSimple ? 0 : undefined,
          elevation: isGlass || isSimple ? 0 : undefined,
          borderTopLeftRadius: isSimple ? 0 : Radius.xl,
          borderTopRightRadius: isSimple ? 0 : Radius.xl,
          borderWidth: isSimple ? 0 : 1,
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

  const textColor = isGlass ? themeColors.text : '#FFFFFF';
  const subtextColor = isGlass ? themeColors.textMuted : 'rgba(255,255,255,0.78)';
  const iconWrapBg = isGlass && !isDark ? 'rgba(20, 23, 31, 0.08)' : 'rgba(255,255,255,0.16)';

  const headerContent = (
    <View style={[styles.headerInner, isTablet && styles.tabletInner, (headerPaddingBottom !== undefined || compactHeader) && { paddingBottom: headerPaddingBottom ?? Spacing.md }]}>
      <View style={styles.headerTextWrap}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: subtextColor }]}>{eyebrow}</Text> : null}
        <View style={styles.titleRow}>
          {icon ? <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }, compactHeader && styles.compactIconWrap]}>{icon}</View> : null}
          <View style={styles.titleTextWrap}>
            <Text style={[styles.title, { color: textColor }, compactHeader && styles.compactTitle]} numberOfLines={1}>
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
            isSimple && [styles.simpleActions, { backgroundColor: themeColors.accent }],
            isGlass && styles.glassActions,
          ]}
        >
          {actions}
        </View>
      ) : null}
    </View>
  );

  let header;
  if (isSimple) {
    header = (
      <View style={[
        styles.simpleHeader, 
        { paddingTop: safeTopPadding, backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }
      ]}>
        <View style={[styles.simpleHeaderInner, isTablet && styles.tabletInner]}>
          <Text style={[styles.simpleTitle, { color: themeColors.text }]} numberOfLines={1}>
            {title}
          </Text>
          {actions ? <View style={[styles.actions, styles.simpleActions, { backgroundColor: themeColors.accent }]}>{actions}</View> : null}
        </View>
      </View>
    );
  } else if (isGlass) {
    header = (
      <GlassCard
        padding={0}
        contentStyle={{ flex: 1 }}
        style={[
          styles.header, 
          { 
            height: resolvedHeaderHeight, 
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
        style={[styles.header, { height: resolvedHeaderHeight, paddingTop: safeTopPadding, zIndex: 10 }]}
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
  const sheetMarginTop = isSimple ? 0 : -Radius.xl;

  if (headerScrollable && scrollable) {
    return (
      <View style={styles.container}>
        {renderBackground()}
        <ScrollView
          style={styles.scrollableHeaderScroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={guardedRefreshControl}
          scrollEventThrottle={16}
          onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }}
          onTouchStart={startRefreshHold}
          onTouchEnd={finishRefreshHold}
          onTouchCancel={finishRefreshHold}
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
          style={[styles.scroll, { marginTop: sheetMarginTop }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }, contentStyle]}
          showsVerticalScrollIndicator={false}
          refreshControl={guardedRefreshControl}
          scrollEventThrottle={16}
          onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }}
          onTouchStart={startRefreshHold}
          onTouchEnd={finishRefreshHold}
          onTouchCancel={finishRefreshHold}
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
    transform: [{ scale: 0.9 }],
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
    marginTop: -Radius.xl, // Keep as-is for scrollableHeader since simple UI won't use headerScrollable logic with large heights anyway, or we'd adjust it. But simple UI disables large headers.
  },
  scrollContent: {
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
  tabletSheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 920,
  },
  simpleHeader: {
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
  },
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
