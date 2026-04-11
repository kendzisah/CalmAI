export const MOOD_TYPES = [
  'anxious', 'overwhelmed', 'stressed', 'restless',
  'sad', 'irritable', 'lonely', 'numb',
  'calm', 'hopeful', 'happy', 'grateful',
] as const;

export type MoodType = typeof MOOD_TYPES[number];

export type MoodTier = 'high_anxiety' | 'low_energy' | 'positive';

export const MOOD_TIERS: Record<MoodType, MoodTier> = {
  anxious: 'high_anxiety',
  overwhelmed: 'high_anxiety',
  stressed: 'high_anxiety',
  restless: 'high_anxiety',
  sad: 'low_energy',
  irritable: 'low_energy',
  lonely: 'low_energy',
  numb: 'low_energy',
  calm: 'positive',
  hopeful: 'positive',
  happy: 'positive',
  grateful: 'positive',
};

export const MOOD_LABELS: Record<MoodType, string> = {
  anxious: 'Anxious',
  overwhelmed: 'Overwhelmed',
  stressed: 'Stressed',
  restless: 'Restless',
  sad: 'Sad',
  irritable: 'Irritable',
  lonely: 'Lonely',
  numb: 'Numb',
  calm: 'Calm',
  hopeful: 'Hopeful',
  happy: 'Happy',
  grateful: 'Grateful',
};

export type MoodSource = 'check_in' | 'journal' | 'post_exercise';

export interface MoodEntry {
  id: string;
  userId?: string;
  mood: MoodType;
  intensity: 1 | 2 | 3 | 4 | 5;
  context?: string;
  source: MoodSource;
  synced: boolean;
  createdAt: string;
}

export interface MoodTrendPoint {
  date: string;
  mood: MoodType;
  intensity: number;
}
