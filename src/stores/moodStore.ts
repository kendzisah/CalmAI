import { create } from 'zustand';
import { getDatabase, generateId } from '@/lib/database';
import type { MoodType, MoodEntry, MoodSource, MoodTrendPoint } from '@/types/mood';

interface MoodState {
  currentMood: MoodType | null;
  todayCheckedIn: boolean;
  monthlyCount: number;
  recentEntries: MoodEntry[];
  trendData: MoodTrendPoint[];

  loadRecent: () => Promise<void>;
  checkIn: (mood: MoodType, intensity?: number, context?: string, source?: MoodSource) => Promise<void>;
  getMonthlyCount: () => Promise<number>;
  getTrendData: (days: number) => Promise<MoodTrendPoint[]>;
  reset: () => void;
}

export const useMoodStore = create<MoodState>((set, get) => ({
  currentMood: null,
  todayCheckedIn: false,
  monthlyCount: 0,
  recentEntries: [],
  trendData: [],

  loadRecent: async () => {
    const db = await getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const entries = await db.getAllAsync<{
      id: string;
      user_id: string | null;
      mood: string;
      intensity: number;
      context: string | null;
      source: string;
      synced: number;
      created_at: string;
    }>('SELECT * FROM mood_entries ORDER BY created_at DESC LIMIT 30');

    const mapped: MoodEntry[] = entries.map((e) => ({
      id: e.id,
      userId: e.user_id || undefined,
      mood: e.mood as MoodType,
      intensity: e.intensity as 1 | 2 | 3 | 4 | 5,
      context: e.context || undefined,
      source: e.source as MoodSource,
      synced: e.synced === 1,
      createdAt: e.created_at,
    }));

    const todayEntry = mapped.find((e) => e.createdAt.startsWith(today));
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM mood_entries WHERE created_at >= ?',
      monthStart.toISOString()
    );

    set({
      recentEntries: mapped,
      currentMood: todayEntry?.mood || null,
      todayCheckedIn: !!todayEntry,
      monthlyCount: monthCount?.count || 0,
    });
  },

  checkIn: async (mood, intensity = 3, context, source = 'check_in') => {
    const db = await getDatabase();
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO mood_entries (id, mood, intensity, context, source, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, mood, intensity, context || null, source, now
    );

    // Enqueue for sync
    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
      'mood_entries', id, 'INSERT', JSON.stringify({ id, mood, intensity, context, source, created_at: now })
    );

    set({ currentMood: mood, todayCheckedIn: true });
    await get().loadRecent();
  },

  getMonthlyCount: async () => {
    const db = await getDatabase();
    const monthStart = new Date();
    monthStart.setDate(1);
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM mood_entries WHERE created_at >= ?',
      monthStart.toISOString()
    );
    const count = result?.count || 0;
    set({ monthlyCount: count });
    return count;
  },

  getTrendData: async (days: number) => {
    const db = await getDatabase();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await db.getAllAsync<{
      mood: string;
      intensity: number;
      created_at: string;
    }>(
      'SELECT mood, intensity, created_at FROM mood_entries WHERE created_at >= ? ORDER BY created_at ASC',
      since.toISOString()
    );

    const trendData: MoodTrendPoint[] = entries.map((e) => ({
      date: e.created_at.split('T')[0],
      mood: e.mood as MoodType,
      intensity: e.intensity,
    }));

    set({ trendData });
    return trendData;
  },

  reset: () => {
    set({
      currentMood: null,
      todayCheckedIn: false,
      monthlyCount: 0,
      recentEntries: [],
      trendData: [],
    });
  },
}));
