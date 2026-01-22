
export const palette = {
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    text: '#0F172A',
    textMuted: '#475569',
    textDim: '#94A3B8',
    primary: '#0D9488', // Deep Teal
    primaryHover: '#0F766E',
    primarySoft: '#CCFBF1',
    secondary: '#D97706',
    secondaryHover: '#B45309',
    secondarySoft: '#FEF3C7',
    border: 'rgba(15, 23, 42, 0.08)',
  },
  dark: {
    bg: '#020617',
    surface: '#0F172A',
    surfaceElevated: '#1E293B',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textDim: '#64748B',
    primary: '#22D3EE', // Bright Cyan for high visibility
    primaryHover: '#67E8F9',
    primarySoft: 'rgba(34, 211, 238, 0.15)',
    secondary: '#FBBF24',
    secondaryHover: '#FCD34D',
    secondarySoft: 'rgba(251, 191, 36, 0.15)',
    border: 'rgba(241, 245, 249, 0.12)',
  }
};

export type ThemeMode = 'light' | 'dark';
