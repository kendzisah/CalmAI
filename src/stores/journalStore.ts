import { create } from 'zustand';
import { getDatabase, generateId } from '@/lib/database';
import type { JournalEntry, JournalPrompt } from '@/types/journal';
import type { MoodType } from '@/types/mood';

interface JournalState {
  entries: JournalEntry[];
  currentPrompt: JournalPrompt | null;
  lifetimeCount: number;

  loadEntries: () => Promise<void>;
  saveEntry: (entryText: string, moodTags: MoodType[], promptText?: string, isAiPrompt?: boolean) => Promise<JournalEntry>;
  deleteEntry: (id: string) => Promise<void>;
  setPrompt: (prompt: JournalPrompt) => void;
  getLifetimeCount: () => Promise<number>;
}

const FALLBACK_PROMPTS = [
  'What made you feel safe today?',
  'What is one thing you are grateful for right now?',
  'Describe a moment today when you felt at peace.',
  'What would you tell your past self about today?',
  'What is something small that brought you joy today?',
  'How did you show kindness to yourself today?',
  'What are you looking forward to tomorrow?',
  'What emotion are you carrying right now? Where do you feel it?',
  'Write about a person who made you smile recently.',
  'What would your ideal peaceful morning look like?',
];

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  currentPrompt: null,
  lifetimeCount: 0,

  loadEntries: async () => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      user_id: string | null;
      prompt_text: string | null;
      entry_text: string;
      mood_tags: string;
      is_ai_prompt: number;
      synced: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM journal_entries ORDER BY created_at DESC LIMIT 50');

    const entries: JournalEntry[] = rows.map((r) => ({
      id: r.id,
      userId: r.user_id || undefined,
      promptText: r.prompt_text || undefined,
      entryText: r.entry_text,
      moodTags: JSON.parse(r.mood_tags),
      isAiPrompt: r.is_ai_prompt === 1,
      synced: r.synced === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries'
    );

    set({ entries, lifetimeCount: countResult?.count || 0 });
  },

  saveEntry: async (entryText, moodTags, promptText, isAiPrompt = false) => {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO journal_entries (id, prompt_text, entry_text, mood_tags, is_ai_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, promptText || null, entryText, JSON.stringify(moodTags), isAiPrompt ? 1 : 0, now, now
    );

    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
      'journal_entries', id, 'INSERT', JSON.stringify({ id, prompt_text: promptText, entry_text: entryText, mood_tags: moodTags, is_ai_prompt: isAiPrompt, created_at: now })
    );

    const entry: JournalEntry = {
      id,
      promptText,
      entryText,
      moodTags,
      isAiPrompt,
      synced: false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      entries: [entry, ...state.entries],
      lifetimeCount: state.lifetimeCount + 1,
    }));

    return entry;
  },

  deleteEntry: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', id);
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      lifetimeCount: state.lifetimeCount - 1,
    }));
  },

  setPrompt: (prompt: JournalPrompt) => {
    set({ currentPrompt: prompt });
  },

  getLifetimeCount: async () => {
    const db = await getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM journal_entries'
    );
    const count = result?.count || 0;
    set({ lifetimeCount: count });
    return count;
  },
}));

export function getRandomPrompt(): JournalPrompt {
  const text = FALLBACK_PROMPTS[Math.floor(Math.random() * FALLBACK_PROMPTS.length)];
  return { text, generatedAt: new Date().toISOString() };
}
