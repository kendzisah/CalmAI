import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'calmai.breathingAudio.muted';

interface BreathingAudioState {
  muted: boolean;
  hydrated: boolean;
  setMuted: (muted: boolean) => Promise<void>;
  toggle: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useBreathingAudioStore = create<BreathingAudioState>((set, get) => ({
  muted: false,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      set({ muted: raw === '1', hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  setMuted: async (muted) => {
    set({ muted });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
    } catch {
      // Silent — mute remains in memory for the session.
    }
  },

  toggle: async () => {
    await get().setMuted(!get().muted);
  },
}));
