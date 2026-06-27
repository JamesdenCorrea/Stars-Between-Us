// Stars Between Us — Theme
// Inspired by Sora's Kingdom Hearts outfit: Black, Yellow, Red

export const Colors = {
  // Core palette
  black: '#0D0D0D',
  darkPanel: '#1A1A1A',
  surface: '#242424',
  surfaceLight: '#2E2E2E',

  // Sora yellow — primary accent
  yellow: '#FFD700',
  yellowDim: '#CCAC00',
  yellowGlow: 'rgba(255, 215, 0, 0.15)',
  yellowBorder: 'rgba(255, 215, 0, 0.4)',

  // Sora red — secondary accent / danger
  red: '#CC1A1A',
  redDim: '#A01414',
  redGlow: 'rgba(204, 26, 26, 0.15)',

  // Text
  textPrimary: '#F5F0E8',
  textSecondary: '#A89F8C',
  textMuted: '#5A5248',

  // Semantic
  success: '#4CAF50',
  error: '#CC1A1A',
  border: '#2E2E2E',
  borderAccent: 'rgba(255, 215, 0, 0.3)',
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,

  // Font weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,

  // Line heights
  tight: 1.15,
  normal: 1.4,
  relaxed: 1.6,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const Radius = {
  sm: 6,
  md: 12,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const Shadow = {
  yellow: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  red: {
    shadowColor: '#CC1A1A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
};
