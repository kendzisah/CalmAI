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

export interface OnboardingData {
  completedStep: number;
  selectedMood?: string;
  selectedContext?: ContextTag;
  reliefTag?: ReliefTag;
  isComplete: boolean;
}
