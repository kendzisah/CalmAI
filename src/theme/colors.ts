// Theme-aware color tokens. Brand colors (lavender, sage, blush, etc.) stay
// constant across themes. Surface, text, and border roles flip between
// light and dark variants.
//
// Onboarding, paywall, and the breathing/grounding modals deliberately
// continue to use the static `Colors` export from `src/lib/constants.ts` —
// the lavender/cream gradient is core to the brand and shouldn't invert.
// Only the main app tabs (home, chat, journal, profile) consume this theme.

// Brand colors — same in both themes
const BRAND = {
  primary: '#7C5CBF',          // lavender
  primaryDark: '#2D1B4E',      // deep aubergine — used as ink ON LIGHT
  lavenderLight: '#C4B5FD',
  blushPink: '#F2C4CE',
  sageGreen: '#A8C5A0',
  cream: '#FFF8F0',
  success: '#A8D5BA',
  error: '#E57373',
} as const;

export interface Theme {
  // Brand
  primary: string;
  primaryDark: string;
  lavenderLight: string;
  blushPink: string;
  sageGreen: string;
  cream: string;
  success: string;
  error: string;
  // Surfaces
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  // Text
  text: string;
  textMuted: string;
  textInverse: string;
  // Borders
  border: string;
  borderMuted: string;
  // Chat
  aiBubbleBg: string;
  userBubbleBg: string;
  userBubbleBgFlat: string;
  // Compatibility aliases
  gray: string;
  grayLavender: string;
  // Status bar style ('light' or 'dark' from expo-status-bar)
  statusBarStyle: 'light' | 'dark';
}

export const lightTheme: Theme = {
  ...BRAND,

  // Surfaces
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F7',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#2D1B4E',             // primaryDark on light
  textMuted: '#6B7280',
  textInverse: '#FFFFFF',      // on top of primary buttons

  // Borders / dividers
  border: '#E5E7EB',
  borderMuted: '#F0F0F0',

  // Chat-specific bubble backgrounds
  aiBubbleBg: '#C4B5FD',       // lavenderLight
  userBubbleBg: '#FFFFFF',
  userBubbleBgFlat: '#E9E9EB', // for iMessage-style mockups

  // Compatibility aliases — code that referenced Colors.gray / Colors.grayLavender
  // will resolve through the theme without churn
  gray: '#6B7280',
  grayLavender: '#E0D4F5',

  // Status bar
  statusBarStyle: 'dark',
};

export const darkTheme: Theme = {
  ...BRAND,

  // Surfaces — deep neutral with a faint purple tint to keep the brand feel
  background: '#0F0E14',
  surface: '#1C1B22',
  surfaceMuted: '#252430',
  surfaceElevated: '#2A2934',

  // Text
  text: '#F5F0FF',             // soft white-lavender
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',      // primary buttons stay white text on lavender

  // Borders
  border: '#2D2C36',
  borderMuted: '#1F1E26',

  // Chat bubbles — invert the relationship: AI is darker accent, user is lighter
  aiBubbleBg: '#3D2F5F',       // dark variant of lavender bubble
  userBubbleBg: '#252430',
  userBubbleBgFlat: '#2A2934',

  // Aliases — gray gets lighter so it stays readable on dark
  gray: '#9CA3AF',
  grayLavender: '#2D2C36',

  statusBarStyle: 'light',
};

export type ThemeName = 'light' | 'dark';
export type ThemePreference = 'system' | 'light' | 'dark';

export const themes: Record<ThemeName, Theme> = {
  light: lightTheme,
  dark: darkTheme,
};
