// CalmAI Design System Tokens
// Source: CalmAI_App_Spec.docx Section 12

export const Colors = {
  primary: '#7C5CBF',
  primaryDark: '#2D1B4E',
  lavenderLight: '#C4B5FD',
  blushPink: '#F2C4CE',
  sageGreen: '#A8C5A0',
  cream: '#FFF8F0',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  gray: '#6B7280',
  grayLavender: '#E0D4F5',
  success: '#A8D5BA',
  error: '#E57373',
} as const;

export const MoodColors: Record<string, string> = {
  anxious: '#C4B5FD',
  overwhelmed: '#F2C4CE',
  stressed: '#E8C5A0',
  restless: '#D4C090',
  sad: '#A0B8D4',
  irritable: '#D4A0A0',
  lonely: '#B8A0D4',
  numb: '#B8B8C8',
  calm: '#A8C5A0',
  hopeful: '#C5D4A0',
  happy: '#F0D4A0',
  grateful: '#C5E0C0',
};

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'Inter-Bold' },
  h2: { fontSize: 22, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold' },
  body: { fontSize: 16, fontWeight: '400' as const, fontFamily: 'Inter-Regular', lineHeight: 24 },
  bodyMedium: { fontSize: 16, fontWeight: '500' as const, fontFamily: 'Inter-Medium' },
  caption: { fontSize: 13, fontWeight: '400' as const, fontFamily: 'Inter-Regular', color: Colors.gray },
  label: { fontSize: 12, fontWeight: '600' as const, fontFamily: 'Inter-SemiBold', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  small: { fontSize: 11, fontWeight: '400' as const, fontFamily: 'Inter-Regular' },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

export const Gradients = {
  onboarding: {
    colors: [Colors.lavenderLight, Colors.cream],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
  breathing: {
    colors: [Colors.primary, '#5A3D9E'],
    start: { x: 0.5, y: 0 },
    end: { x: 0.5, y: 1 },
  },
} as const;

// Breathing exercise timing (in seconds)
export const BreathingConfig = {
  inhale: 4,
  hold1: 4,
  exhale: 4,
  hold2: 4,
  defaultCycles: 4,
  miniCycles: 2, // for onboarding relief
} as const;
