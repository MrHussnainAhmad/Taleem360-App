export const Colors = {
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#14171F',
    textMuted: '#5B6472',
    border: '#E4E8EF',
    borderHover: '#C9D1DE',
    accent: '#2F6FED',
    primary: '#2F6FED',
    accentHover: '#1E4FA0',
    accentMuted: '#FFFFFF',
    primaryBg: '#FFFFFF',
    success: '#1F8A5C',
    successBg: '#FFFFFF',
    warning: '#C08A2E',
    warningBg: '#FFFFFF',
    error: '#D0453A',
    errorBg: '#FFFFFF',
    info: '#2F6FED',
    infoBg: '#FFFFFF',
    textSecondary: '#5B6472',
    backgroundSelected: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    headerGrad1: '#0F2A5C',
    headerGrad2: '#1E4FA0',
  },
  dark: {
    background: '#202225', // Even lighter dark
    surface: '#2B2D31',    // Even lighter surface
    text: '#F2F4F8',
    textMuted: '#A8B0BE',
    border: '#3F4147',     // Adjusted border for contrast
    borderHover: '#4F545C',
    accent: '#6EA0FF',
    primary: '#6EA0FF',
    accentHover: '#8BB4FF',
    accentMuted: '#1B2A4A',
    primaryBg: '#1B2A4A',
    success: '#4CC58E',
    successBg: '#123B2A',
    warning: '#E0AF5B',
    warningBg: '#3C2D14',
    error: '#EF6A5F',
    errorBg: '#421C1A',
    info: '#6EA0FF',
    infoBg: '#1B2A4A',
    textSecondary: '#A8B0BE',
    backgroundSelected: '#1B2A4A',
    backgroundElement: '#262B36',
    headerGrad1: '#0F2A5C',
    headerGrad2: '#1E4FA0',
  }
};

// Kept separate from Colors so the existing Default theme remains unchanged.
export const GlassColors = {
  light: {
    background: 'rgba(238, 245, 255, 0.34)',
    surface: 'rgba(255, 255, 255, 0.12)',
    text: '#000000',
    textMuted: '#1A1A1A',
    border: 'rgba(255, 255, 255, 0.25)',
    borderHover: 'rgba(255, 255, 255, 0.40)',
    accent: '#3978F6',
    primary: '#3978F6',
    accentHover: '#245BC4',
    accentMuted: 'rgba(225, 236, 255, 0.62)',
    primaryBg: 'rgba(225, 236, 255, 0.62)',
    success: '#167A55',
    successBg: 'rgba(218, 247, 234, 0.62)',
    warning: '#A86E14',
    warningBg: 'rgba(255, 239, 204, 0.62)',
    error: '#C63D45',
    errorBg: 'rgba(255, 224, 228, 0.62)',
    info: '#3978F6',
    infoBg: 'rgba(225, 236, 255, 0.62)',
    textSecondary: '#1A1A1A',
    backgroundSelected: 'rgba(225, 236, 255, 0.72)',
    backgroundElement: 'rgba(255, 255, 255, 0.46)',
    headerGrad1: 'rgba(43, 91, 181, 0.92)',
    headerGrad2: 'rgba(79, 132, 236, 0.82)',
  },
  dark: {
    background: 'rgba(8, 16, 34, 0.48)',
    surface: 'rgba(20, 20, 20, 0.35)',
    text: '#F4F7FF',
    textMuted: '#B3C0D5',
    border: 'rgba(255, 255, 255, 0.25)',
    borderHover: 'rgba(255, 255, 255, 0.35)',
    accent: '#83AEFF',
    primary: '#83AEFF',
    accentHover: '#A7C5FF',
    accentMuted: 'rgba(57, 103, 185, 0.28)',
    primaryBg: 'rgba(57, 103, 185, 0.28)',
    success: '#69D6A6',
    successBg: 'rgba(30, 112, 77, 0.28)',
    warning: '#F0C16D',
    warningBg: 'rgba(126, 88, 24, 0.28)',
    error: '#FF817A',
    errorBg: 'rgba(133, 48, 48, 0.28)',
    info: '#83AEFF',
    infoBg: 'rgba(57, 103, 185, 0.28)',
    textSecondary: '#B3C0D5',
    backgroundSelected: 'rgba(57, 103, 185, 0.34)',
    backgroundElement: 'rgba(34, 50, 79, 0.58)',
    headerGrad1: 'rgba(19, 46, 94, 0.94)',
    headerGrad2: 'rgba(42, 82, 154, 0.86)',
  },
};

export const Typography = {
  fontFamily: 'Inter_400Regular',
  fontFamilyMedium: 'Inter_500Medium',
  fontFamilySemiBold: 'Inter_600SemiBold',
  fontFamilyBold: 'Inter_700Bold',
  
  size: {
    xs: 12,
    sm: 14,
    md: 15,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
};

export const Spacing = {
  half: 2,
  xs: 4,
  two: 8,
  sm: 8,
  three: 12,
  ms: 12,
  four: 16,
  md: 16,
  ml: 20,
  five: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 14,
  lg: 18,
  xl: 20,
  glass: 20,
  glassNav: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  }
};

export const Fonts = {
  mono: 'monospace',
};

export type ThemeColor = keyof typeof Colors.light;
