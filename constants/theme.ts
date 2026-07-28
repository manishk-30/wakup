export const Colors = {
  light: {
    background: '#F7F5EF', 
    surface: '#FFFFFF', 
    text: '#0B0B0F', 
    textMuted: '#6B7280', 
    primary: '#6366F1', 
    primaryMuted: '#E0E7FF', 
    danger: '#EF4444',
    success: '#10B981',
    border: '#E5E7EB',
    cardBackground: '#FFFFFF',
    cardRed: '#DC2626',
    cardDark: '#111827',
  },
  dark: {
    background: '#0B0B0F', // Premium dark
    surface: '#1A1A24', 
    text: '#F7F5EF', // Off-white
    textMuted: '#94A3B8', 
    primary: '#6366F1', 
    primaryMuted: '#312E81', 
    danger: '#F87171',
    success: '#34D399',
    border: '#2A2A35',
    cardBackground: '#F7F5EF',
    cardRed: '#DC2626',
    cardDark: '#0B0B0F',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  h1: { fontSize: 48, fontWeight: '800' as const },
  h2: { fontSize: 32, fontWeight: '700' as const },
  h3: { fontSize: 24, fontWeight: '600' as const },
  bodyLarge: { fontSize: 18, fontWeight: '500' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  caption: { fontSize: 14, fontWeight: '500' as const },
};

export const UI = {
  buttonHeight: 56,
};
