import { useThemeColors, useThemePreferences } from '@/context/ThemePreferencesContext';
import React from 'react';
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
  const themeColors = useThemeColors();
  const { isGlass, isSimple } = useThemePreferences();
  const isDark = themeColors.background === '#0f172a'; // Simple check based on background or use useColorScheme
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 600;
  const safeTopPadding = Math.max(insets.top - Spacing.sm, 0);
  const resolvedHeaderHeight = (headerHeight ?? (isTablet ? 160 : 140)) + insets.top;

  const bgColors = isDark ? SETTINGS_BG_COLORS_DARK : SETTINGS_BG_COLORS_LIGHT;

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
    <View style={[styles.headerInner, isTablet && styles.tabletInner]}>
      <View style={styles.headerTextWrap}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: subtextColor }]}>{eyebrow}</Text> : null}
        <View style={styles.titleRow}>
          {icon ? <View style={[styles.iconWrap, { backgroundColor: iconWrapBg }]}>{icon}</View> : null}
          <View style={styles.titleTextWrap}>
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, { color: subtextColor }]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
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
          {actions ? <View style={styles.actions}>{actions}</View> : null}
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
          style={[styles.scroll, { marginTop: sheetMarginTop }]}
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
