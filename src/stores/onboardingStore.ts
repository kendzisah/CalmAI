import { create } from 'zustand';
import { getDatabase } from '@/lib/database';
import type { MoodType } from '@/types/mood';
import type {
  ContextTag,
  ReliefTag,
  LoudCategory,
  TriggerTime,
  CopingPref,
  TonePref,
} from '@/types/user';

interface OnboardingState {
  completedStep: number;
  selectedMood?: MoodType;
  selectedContext?: ContextTag;
  reliefTag?: ReliefTag;
  isComplete: boolean;
  isLoaded: boolean;

  // v1.3
  nickname: string | null;
  loudCategories: LoudCategory[];
  triggerTimes: TriggerTime[];
  copingPrefs: CopingPref[];
  tonePref: TonePref | null;
  suggestedNotificationHour: number | null;
  notificationsEnabled: boolean;
  reliefGratitudeText: string | null;
  emailIsRelay: boolean;

  load: () => Promise<void>;
  setMood: (mood: MoodType) => Promise<void>;
  setContext: (context: ContextTag) => Promise<void>;
  setReliefTag: (tag: ReliefTag) => Promise<void>;
  completeStep: (step: number) => Promise<void>;
  finish: () => Promise<void>;
  reset: () => Promise<void>;

  setNickname: (value: string | null) => Promise<void>;
  setLoudCategories: (value: LoudCategory[]) => Promise<void>;
  setTriggerTimes: (value: TriggerTime[]) => Promise<void>;
  setCopingPrefs: (value: CopingPref[]) => Promise<void>;
  setTonePref: (value: TonePref) => Promise<void>;
  setSuggestedNotificationHour: (value: number | null) => Promise<void>;
  setNotificationsEnabled: (value: boolean) => Promise<void>;
  setReliefGratitudeText: (value: string | null) => Promise<void>;
  setEmailIsRelay: (value: boolean) => Promise<void>;
}

function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  completedStep: 0,
  selectedMood: undefined,
  selectedContext: undefined,
  reliefTag: undefined,
  isComplete: false,
  isLoaded: false,

  nickname: null,
  loudCategories: [],
  triggerTimes: [],
  copingPrefs: [],
  tonePref: null,
  suggestedNotificationHour: null,
  notificationsEnabled: false,
  reliefGratitudeText: null,
  emailIsRelay: false,

  load: async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{
      completed_step: number;
      selected_mood: string | null;
      selected_context: string | null;
      relief_tag: string | null;
      is_complete: number;
      nickname: string | null;
      loud_categories: string | null;
      trigger_times: string | null;
      coping_prefs: string | null;
      tone_pref: string | null;
      suggested_notification_hour: number | null;
      notifications_enabled: number;
      relief_gratitude_text: string | null;
      email_is_relay: number;
    }>('SELECT * FROM onboarding WHERE id = 1');

    if (row) {
      set({
        completedStep: row.completed_step,
        selectedMood: (row.selected_mood as MoodType) || undefined,
        selectedContext: (row.selected_context as ContextTag) || undefined,
        reliefTag: (row.relief_tag as ReliefTag) || undefined,
        isComplete: row.is_complete === 1,
        nickname: row.nickname,
        loudCategories: parseJsonArray<LoudCategory>(row.loud_categories),
        triggerTimes: parseJsonArray<TriggerTime>(row.trigger_times),
        copingPrefs: parseJsonArray<CopingPref>(row.coping_prefs),
        tonePref: (row.tone_pref as TonePref) || null,
        suggestedNotificationHour: row.suggested_notification_hour,
        notificationsEnabled: row.notifications_enabled === 1,
        reliefGratitudeText: row.relief_gratitude_text,
        emailIsRelay: row.email_is_relay === 1,
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
    await db.runAsync(
      `UPDATE onboarding
       SET completed_step = 0,
           selected_mood = NULL,
           selected_context = NULL,
           relief_tag = NULL,
           is_complete = 0,
           nickname = NULL,
           loud_categories = '[]',
           trigger_times = '[]',
           coping_prefs = '[]',
           tone_pref = NULL,
           suggested_notification_hour = NULL,
           notifications_enabled = 0,
           relief_gratitude_text = NULL,
           email_is_relay = 0
       WHERE id = 1`
    );
    set({
      completedStep: 0,
      selectedMood: undefined,
      selectedContext: undefined,
      reliefTag: undefined,
      isComplete: false,
      nickname: null,
      loudCategories: [],
      triggerTimes: [],
      copingPrefs: [],
      tonePref: null,
      suggestedNotificationHour: null,
      notificationsEnabled: false,
      reliefGratitudeText: null,
      emailIsRelay: false,
    });
  },

  setNickname: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET nickname = ? WHERE id = 1', value);
    set({ nickname: value });
  },

  setLoudCategories: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET loud_categories = ? WHERE id = 1', JSON.stringify(value));
    set({ loudCategories: value });
  },

  setTriggerTimes: async (value) => {
    const db = await getDatabase();
    const hour = value.includes('2am_spirals') || value.includes('pre_sleep') ? 23 : null;
    await db.runAsync(
      'UPDATE onboarding SET trigger_times = ?, suggested_notification_hour = ? WHERE id = 1',
      JSON.stringify(value),
      hour
    );
    set({ triggerTimes: value, suggestedNotificationHour: hour });
  },

  setCopingPrefs: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET coping_prefs = ? WHERE id = 1', JSON.stringify(value));
    set({ copingPrefs: value });
  },

  setTonePref: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET tone_pref = ? WHERE id = 1', value);
    set({ tonePref: value });
  },

  setSuggestedNotificationHour: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET suggested_notification_hour = ? WHERE id = 1', value);
    set({ suggestedNotificationHour: value });
  },

  setNotificationsEnabled: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET notifications_enabled = ? WHERE id = 1', value ? 1 : 0);
    set({ notificationsEnabled: value });
  },

  setReliefGratitudeText: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET relief_gratitude_text = ? WHERE id = 1', value);
    set({ reliefGratitudeText: value });
  },

  setEmailIsRelay: async (value) => {
    const db = await getDatabase();
    await db.runAsync('UPDATE onboarding SET email_is_relay = ? WHERE id = 1', value ? 1 : 0);
    set({ emailIsRelay: value });
  },
}));
