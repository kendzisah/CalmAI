// Edge-runtime mirrors of the enum value sets defined in src/types/.
// Keep these in sync with the canonical TypeScript types — the Deno
// runtime can't import from src/, so we duplicate the value lists here.
//
// Canonical sources:
//   - src/types/user.ts  (LoudCategory, TriggerTime, CopingPref, TonePref)
//   - src/types/mood.ts  (MoodType)

export const LOUD_CATEGORIES = [
  'work_school',
  'relationships',
  'body_health',
  'money',
  'family',
  'future',
  'everything',
] as const;

export const TRIGGER_TIMES = [
  '2am_spirals',
  'sunday_scaries',
  'pre_sleep',
  'random_panic',
  'post_argument',
  'all_day',
  'other',
] as const;

export const COPING_PREFS = [
  'talk',
  'write',
  'distract',
  'logic',
  'validate',
  'unsure',
] as const;

export const TONE_PREFS = ['real', 'gentle', 'read_room'] as const;

export const MOOD_TYPES = [
  'anxious',
  'overwhelmed',
  'stressed',
  'restless',
  'sad',
  'irritable',
  'lonely',
  'numb',
  'calm',
  'hopeful',
  'happy',
  'grateful',
] as const;

export type LoudCategory = (typeof LOUD_CATEGORIES)[number];
export type TriggerTime = (typeof TRIGGER_TIMES)[number];
export type CopingPref = (typeof COPING_PREFS)[number];
export type TonePref = (typeof TONE_PREFS)[number];
export type MoodType = (typeof MOOD_TYPES)[number];
