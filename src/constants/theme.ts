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
