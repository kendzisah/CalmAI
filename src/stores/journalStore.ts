import { create } from 'zustand';
import { getDatabase, generateId } from '@/lib/database';
import type { JournalEntry, JournalPrompt } from '@/types/journal';
import type { MoodType } from '@/types/mood';

interface JournalState {
  entries: JournalEntry[];
  currentPrompt: JournalPrompt | null;
  todayEntry: JournalEntry | null;
  lifetimeCount: number;
  hasRefreshedPrompt: boolean;

  loadEntries: () => Promise<void>;
  loadTodayEntry: () => Promise<JournalEntry | null>;
  saveEntry: (entryText: string, moodTags: MoodType[], promptText?: string, isAiPrompt?: boolean) => Promise<JournalEntry>;
  updateTodayEntry: (entryText: string, moodTags: MoodType[]) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  setPrompt: (prompt: JournalPrompt) => void;
  setHasRefreshedPrompt: (val: boolean) => void;
  getLifetimeCount: () => Promise<number>;
  getDailyPrompt: () => Promise<JournalPrompt | null>;
  saveDailyPrompt: (prompt: JournalPrompt) => Promise<void>;
}

const FALLBACK_PROMPTS = [
  'What made you feel safe today?',
  'What is one thing you are grateful for right now?',
  'What would you tell your past self about today?',
  'What is something small that brought you joy today?',
  'What is one boundary you set (or wish you had) recently?',
  'What are you looking forward to tomorrow?',
  'What emotion are you carrying right now? Where do you feel it in your body?',
  'Who made you feel seen recently? What did they do?',
  'What does your ideal morning routine actually look like?',
  'What is one thing you did today that future you will thank you for?',
];

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  currentPrompt: null,
  todayEntry: null,
  lifetimeCount: 0,
  hasRefreshedPrompt: false,

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

  loadTodayEntry: async () => {
    const db = await getDatabase();
    const today = getToday();
    const row = await db.getFirstAsync<{
      id: string;
      user_id: string | null;
      prompt_text: string | null;
      entry_text: string;
      mood_tags: string;
      is_ai_prompt: number;
      synced: number;
      created_at: string;
      updated_at: string;
    }>("SELECT * FROM journal_entries WHERE created_at LIKE ? || '%' ORDER BY created_at DESC LIMIT 1", today);

    if (row) {
      const entry: JournalEntry = {
        id: row.id,
        userId: row.user_id || undefined,
        promptText: row.prompt_text || undefined,
        entryText: row.entry_text,
        moodTags: JSON.parse(row.mood_tags),
        isAiPrompt: row.is_ai_prompt === 1,
        synced: row.synced === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      set({ todayEntry: entry });
      return entry;
    }
    set({ todayEntry: null });
    return null;
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
      todayEntry: entry,
      lifetimeCount: state.lifetimeCount + 1,
    }));

    return entry;
  },

  updateTodayEntry: async (entryText, moodTags) => {
    const { todayEntry } = get();
    if (!todayEntry) return;

    const db = await getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE journal_entries SET entry_text = ?, mood_tags = ?, updated_at = ?, synced = 0 WHERE id = ?',
      entryText, JSON.stringify(moodTags), now, todayEntry.id
    );

    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
      'journal_entries', todayEntry.id, 'INSERT',
      JSON.stringify({
        id: todayEntry.id,
        prompt_text: todayEntry.promptText || null,
        entry_text: entryText,
        mood_tags: moodTags,
        is_ai_prompt: todayEntry.isAiPrompt,
        created_at: todayEntry.createdAt,
        updated_at: now,
      })
    );

    const updated = { ...todayEntry, entryText, moodTags, updatedAt: now, synced: false };
    set((state) => ({
      todayEntry: updated,
      entries: state.entries.map((e) => e.id === todayEntry.id ? updated : e),
    }));
  },

  deleteEntry: async (id: string) => {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM journal_entries WHERE id = ?', id);

    // Queue deletion for Supabase sync
    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
      'journal_entries', id, 'DELETE', JSON.stringify({ id })
    );

    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
      todayEntry: state.todayEntry?.id === id ? null : state.todayEntry,
      lifetimeCount: state.lifetimeCount - 1,
    }));
  },

  setPrompt: (prompt: JournalPrompt) => {
    set({ currentPrompt: prompt });
  },

  setHasRefreshedPrompt: (val: boolean) => {
    set({ hasRefreshedPrompt: val });
  },

  // Get the saved daily prompt for today (stored in SQLite)
  getDailyPrompt: async () => {
    const db = await getDatabase();
    const today = getToday();

    // Check if we have a daily_prompts table, create if not
    await db.runAsync(
      'CREATE TABLE IF NOT EXISTS daily_prompts (date TEXT PRIMARY KEY, prompt_text TEXT NOT NULL, mood TEXT, created_at TEXT NOT NULL)'
    );

    const row = await db.getFirstAsync<{ prompt_text: string; mood: string | null }>(
      'SELECT prompt_text, mood FROM daily_prompts WHERE date = ?', today
    );

    if (row) {
      const prompt: JournalPrompt = {
        text: row.prompt_text,
        mood: (row.mood as MoodType) || undefined,
        generatedAt: today,
      };
      set({ currentPrompt: prompt, hasRefreshedPrompt: false });
      return prompt;
    }
    return null;
  },

  // Save today's prompt so it persists all day
  saveDailyPrompt: async (prompt: JournalPrompt) => {
    const db = await getDatabase();
    const today = getToday();

    await db.runAsync(
      'CREATE TABLE IF NOT EXISTS daily_prompts (date TEXT PRIMARY KEY, prompt_text TEXT NOT NULL, mood TEXT, created_at TEXT NOT NULL)'
    );

    await db.runAsync(
      'INSERT OR REPLACE INTO daily_prompts (date, prompt_text, mood, created_at) VALUES (?, ?, ?, ?)',
      today, prompt.text, prompt.mood || null, new Date().toISOString()
    );

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
