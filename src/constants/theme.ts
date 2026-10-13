export const Colors = {
  light: {
    background: '#F8F9F6', surface: '#FFFFFF', text: '#202422', textMuted: '#656B67',
    border: '#DCE0D9', borderHover: '#9CA593', accent: '#3C5930', primary: '#3C5930',
    accentHover: '#2C4223', accentMuted: '#E8F2C7', primaryBg: '#E8F2C7',
    success: '#28704D', successBg: '#E8F3EC', warning: '#916215', warningBg: '#FBF1D9',
    error: '#B44545', errorBg: '#FBECEC', info: '#39688B', infoBg: '#EAF1F7',
    textSecondary: '#626D66', backgroundSelected: '#E8F0E9', backgroundElement: '#EDF1ED',
    headerGrad1: '#243E32', headerGrad2: '#243E32',
  },
  dark: {
    background: '#181A18', surface: '#252825', text: '#F2F4EE', textMuted: '#B4BBB0',
    border: '#37423B', borderHover: '#64766A', accent: '#438562', primary: '#438562',
    accentHover: '#50966F', accentMuted: '#2A3C30', primaryBg: '#2A3C30',
    success: '#94D3AB', successBg: '#263F30', warning: '#E6C37B', warningBg: '#413822',
    error: '#F0A09A', errorBg: '#442C2B', info: '#A1C7E2', infoBg: '#293A46',
    textSecondary: '#ADB9B0', backgroundSelected: '#2A3C30', backgroundElement: '#2B332E',
    headerGrad1: '#202C25', headerGrad2: '#202C25',
  },
};

export const GlassColors = {
  light: {
    ...Colors.light,
    background: '#EEF3F4', surface: 'rgba(255,255,255,0.86)', text: '#253338', textMuted: '#5B6B70',
    border: '#CFDDE0', borderHover: '#A2BCC3', accent: '#2F697B', primary: '#2F697B',
    accentHover: '#225363', accentMuted: '#E3EEF1', primaryBg: '#E3EEF1',
    backgroundSelected: '#E3EEF1', backgroundElement: '#E7EFF0',
    headerGrad1: '#DCE9EC', headerGrad2: '#DCE9EC',
  },
  dark: {
    ...Colors.dark,
    background: '#191E20', surface: 'rgba(40,49,53,0.9)', text: '#EEF3F4', textMuted: '#B3C2C6',
    border: '#3B4B51', borderHover: '#697E86', accent: '#437E91', primary: '#437E91',
    accentHover: '#528EA0', accentMuted: '#2A414A', primaryBg: '#2A414A',
    backgroundSelected: '#2A414A', backgroundElement: '#2B373C',
    headerGrad1: '#27383F', headerGrad2: '#27383F',
  },
};

export const Typography = {
  fontFamily: 'Inter_400Regular', fontFamilyMedium: 'Inter_500Medium',
  fontFamilySemiBold: 'Inter_600SemiBold', fontFamilyBold: 'Inter_700Bold',
  fontFamilyDisplay: 'BricolageGrotesque_600SemiBold',
  size: { xs: 12, sm: 14, md: 15, base: 16, lg: 20, xl: 24, xxl: 32 },
};
export const Spacing = {
  half: 2, xs: 4, two: 8, sm: 8, three: 12, ms: 12, four: 16, md: 16,
  ml: 20, five: 20, lg: 24, xl: 32, xxl: 48,
};
export const Radius = { sm: 4, md: 6, lg: 8, xl: 8, glass: 8, glassNav: 8, full: 9999 };
export const Shadows = {
  sm: { shadowColor: '#17231B', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.025, shadowRadius: 2, elevation: 0 },
  md: { shadowColor: '#17231B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  none: { shadowColor: 'transparent', shadowOpacity: 0, elevation: 0 },
};
export const Fonts = { mono: 'monospace' };
export type ThemeColor = keyof typeof Colors.light;
