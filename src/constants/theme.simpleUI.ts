import { Colors } from './theme';

export const SimpleColors = {
  light: {
    ...Colors.light,
    background: '#FAFAFA', surface: '#FFFFFF', text: '#29282C', textMuted: '#6C6870',
    border: '#DFDCE1', borderHover: '#B5ADB8', accent: '#774457', primary: '#774457',
    accentHover: '#603445', accentMuted: '#F3EAEF', primaryBg: '#F3EAEF',
    backgroundSelected: '#F3EAEF', backgroundElement: '#F0EDF1', textSecondary: '#6C6870',
    headerGrad1: '#FFFFFF', headerGrad2: '#FFFFFF',
  },
  dark: {
    ...Colors.dark,
    background: '#1B191C', surface: '#272428', text: '#F4F0F3', textMuted: '#BDB3BE',
    border: '#423A43', borderHover: '#796A79', accent: '#9C6078', primary: '#9C6078',
    accentHover: '#AD7089', accentMuted: '#402E38', primaryBg: '#402E38',
    backgroundSelected: '#402E38', backgroundElement: '#322D33', textSecondary: '#BDB3BE',
    headerGrad1: '#272428', headerGrad2: '#272428',
  },
};
