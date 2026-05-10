export type SubscriptionTier = 'free' | 'pro';

export interface UserProfile {
  id: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ContextTag =
  | 'acute_crisis'
  | 'situational_stress'
  | 'generalized_anxiety'
  | 'insomnia_rumination'
  | 'companionship'
  | 'persistent_low_mood'
  | 'event_triggered'
  | 'isolation'
  | 'unclear_trigger'
  | 'seeking_change'
  | 'maintenance'
  | 'habit_building'
  | 'preventive_care'
  | 'exploration'
  | 'referral'
  | 'skip';

export type ReliefTag = 'relief_positive' | 'relief_neutral' | 'relief_not_yet';

export type LoudCategory =
  | 'work_school'
  | 'relationships'
  | 'body_health'
  | 'money'
  | 'family'
  | 'future'
  | 'everything';

export type TriggerTime =
  | '2am_spirals'
  | 'sunday_scaries'
  | 'pre_sleep'
  | 'random_panic'
  | 'post_argument'
  | 'all_day'
  | 'other';

export type CopingPref = 'talk' | 'write' | 'distract' | 'logic' | 'validate' | 'unsure';

export type TonePref = 'real' | 'gentle' | 'read_room';

export const LOUD_CATEGORY_LABELS: Record<LoudCategory, string> = {
  work_school: 'Work / school',
  relationships: 'Relationships',
  body_health: 'Body & health',
  money: 'Money',
  family: 'Family',
  future: 'The future',
  everything: 'Just everything',
};

export const TRIGGER_TIME_LABELS: Record<TriggerTime, string> = {
  '2am_spirals': '2am spirals',
  sunday_scaries: 'Sunday scaries',
  pre_sleep: 'Right before sleep',
  random_panic: 'Random panic',
  post_argument: 'After a fight',
  all_day: 'All day every day',
  other: 'Other / not sure',
};

export const COPING_PREF_LABELS: Record<CopingPref, string> = {
  talk: 'Talking it out',
  write: 'Writing it down',
  distract: 'Distraction',
  logic: 'Numbers and logic',
  validate: 'Just being heard',
  unsure: "I don't know yet",
};

export interface OnboardingData {
  completedStep: number;
  selectedMood?: string;
  selectedContext?: ContextTag;
  reliefTag?: ReliefTag;
  nickname?: string | null;
  loudCategories?: LoudCategory[];
  triggerTimes?: TriggerTime[];
  copingPrefs?: CopingPref[];
  tonePref?: TonePref | null;
  suggestedNotificationHour?: number | null;
  notificationsEnabled?: boolean;
  reliefGratitudeText?: string | null;
  emailIsRelay?: boolean;
  isComplete: boolean;
}
