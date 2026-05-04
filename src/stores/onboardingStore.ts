import { create } from 'zustand';
import { getDatabase } from '@/lib/database';
import type { MoodType } from '@/types/mood';
import type { ContextTag, ReliefTag } from '@/types/user';

interface OnboardingState {
  completedStep: number;
  selectedMood?: MoodType;
  selectedContext?: ContextTag;
  reliefTag?: ReliefTag;
  isComplete: boolean;
  isLoaded: boolean;

  load: () => Promise<void>;
  setMood: (mood: MoodType) => Promise<void>;
  setContext: (context: ContextTag) => Promise<void>;
  setReliefTag: (tag: ReliefTag) => Promise<void>;
  completeStep: (step: number) => Promise<void>;
  finish: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  completedStep: 0,
  selectedMood: undefined,
  selectedContext: undefined,
  reliefTag: undefined,
  isComplete: false,
  isLoaded: false,

  load: async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      completed_step: number;
      selected_mood: string | null;
      selected_context: string | null;
      relief_tag: string | null;
      is_complete: number;
    }>('SELECT * FROM onboarding WHERE id = 1');

    if (row) {
      set({
        completedStep: row.completed_step,
        selectedMood: (row.selected_mood as MoodType) || undefined,
        selectedContext: (row.selected_context as ContextTag) || undefined,
        reliefTag: (row.relief_tag as ReliefTag) || undefined,
        isComplete: row.is_complete === 1,
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }
  },

  setMood: async (mood: MoodType) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET selected_mood = ? WHERE id = 1', mood);
    set({ selectedMood: mood });
  },

  setContext: async (context: ContextTag) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET selected_context = ? WHERE id = 1', context);
    set({ selectedContext: context });
  },

  setReliefTag: async (tag: ReliefTag) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET relief_tag = ? WHERE id = 1', tag);
    set({ reliefTag: tag });
  },

  completeStep: async (step: number) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET completed_step = ? WHERE id = 1', step);
    set({ completedStep: step });
  },

  finish: async () => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET is_complete = 1 WHERE id = 1');
    set({ isComplete: true });
  },

  reset: async () => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET completed_step = 0, selected_mood = NULL, selected_context = NULL, relief_tag = NULL, is_complete = 0 WHERE id = 1');
    set({
      completedStep: 0,
      selectedMood: undefined,
      selectedContext: undefined,
      reliefTag: undefined,
      isComplete: false,
    });
  },
}));
