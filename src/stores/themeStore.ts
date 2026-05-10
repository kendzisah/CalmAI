import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreference } from '@/theme/colors';

const STORAGE_KEY = 'calmai.theme.preference';

interface ThemeState {
  /** What the user picked: 'system' (default), 'light', or 'dark' */
  preference: ThemePreference;
  /** True once we've finished reading from AsyncStorage on app boot */
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setPreference: (next: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: 'system',
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark' || raw === 'system') {
        set({ preference: raw, hydrated: true });
        return;
      }
      set({ hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setPreference: async (next) => {
    set({ preference: next });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Preference still applies in memory; persistence is best-effort.
    }
  },
}));
