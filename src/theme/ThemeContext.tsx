import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { themes, type Theme, type ThemeName, type ThemePreference } from './colors';

interface ThemeContextValue {
  /** The resolved color tokens to use right now (already accounts for preference + system). */
  theme: Theme;
  /** The active theme name — useful when you need to branch on theme (rare). */
  themeName: ThemeName;
  /** What the user picked: 'system' / 'light' / 'dark' */
  preference: ThemePreference;
  /** Update the user preference. Persists across app restarts. */
  setPreference: (next: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ProviderProps {
  children: ReactNode;
  /**
   * Force the subtree to render in a specific theme regardless of the user's
   * preference. Used to keep brand-defining screens (onboarding, paywall,
   * breathing/grounding modals) always light because their lavender/cream
   * gradients don't invert well.
   */
  force?: ThemeName;
}

export function ThemeProvider({ children, force }: ProviderProps) {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((s) => s.preference);
  const setPreference = useThemeStore((s) => s.setPreference);
  const hydrate = useThemeStore((s) => s.hydrate);

  // Hydrate the persisted preference once on mount.
  useEffect(() => {
    if (!force) hydrate();
  }, [hydrate, force]);

  const value = useMemo<ThemeContextValue>(() => {
    const themeName: ThemeName = force
      ? force
      : preference === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : preference;

    return {
      theme: themes[themeName],
      themeName,
      preference,
      setPreference,
    };
  }, [preference, systemScheme, setPreference, force]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Read the current theme. Re-renders when the theme changes (system
 * appearance flip OR user toggle). Use anywhere inside ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

/**
 * Convenience: just the color tokens, when you don't need the metadata.
 */
export function useThemeColors(): Theme {
  return useTheme().theme;
}
