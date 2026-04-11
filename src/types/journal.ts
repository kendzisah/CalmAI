import type { MoodType } from './mood';

export interface JournalEntry {
  id: string;
  userId?: string;
  promptText?: string;
  entryText: string;
  moodTags: MoodType[];
  isAiPrompt: boolean;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JournalPrompt {
  text: string;
  mood?: MoodType;
  generatedAt: string;
}
