import { getDatabase } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface SyncQueueItem {
  id: number;
  table_name: string;
  record_id: string;
  operation: string;
  payload: string;
  created_at: string;
}

export async function processSyncQueue(): Promise<number> {
  const { userId, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !userId) return 0;

  const db = await getDatabase();
  const items = await db.getAllAsync<SyncQueueItem>(
    'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50'
  );

  if (items.length === 0) return 0;

  let synced = 0;

  for (const item of items) {
    try {
      const payload = JSON.parse(item.payload);
      payload.user_id = userId;

      if (item.operation === 'DELETE') {
        const { error } = await supabase
          .from(item.table_name)
          .delete()
          .eq('id', item.record_id);

        if (error) {
          console.warn(`Sync delete failed for ${item.table_name}/${item.record_id}:`, error.message);
          continue;
        }
      } else {
        const { error } = await supabase
          .from(item.table_name)
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          console.warn(`Sync failed for ${item.table_name}/${item.record_id}:`, error.message);
          continue;
        }

        // Mark record as synced in the source table
        await db.runAsync(
          `UPDATE ${item.table_name} SET synced = 1 WHERE id = ?`,
          item.record_id
        );
      }

      // Remove from sync queue
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', item.id);
      synced++;
    } catch (err) {
      console.warn(`Sync error for item ${item.id}:`, err);
    }
  }

  return synced;
}

export async function fullSync(): Promise<void> {
  const { userId, isAuthenticated } = useAuthStore.getState();
  if (!isAuthenticated || !userId) return;

  // Process any pending queue items first
  await processSyncQueue();

  // Then sync all unsynced records
  const db = await getDatabase();
  const tables = ['mood_entries', 'journal_entries', 'chat_sessions', 'chat_messages', 'breathing_sessions'] as const;

  for (const table of tables) {
    const unsynced = await db.getAllAsync<{ id: string }>(
      `SELECT id FROM ${table} WHERE synced = 0`
    );

    for (const record of unsynced) {
      const fullRecord = await db.getFirstAsync(
        `SELECT * FROM ${table} WHERE id = ?`,
        record.id
      );

      if (fullRecord) {
        const payload = { ...fullRecord, user_id: userId };
        const { error } = await supabase
          .from(table)
          .upsert(payload as any, { onConflict: 'id' });

        if (!error) {
          await db.runAsync(
            `UPDATE ${table} SET synced = 1 WHERE id = ?`,
            record.id
          );
        }
      }
    }
  }
}

export async function restoreFromCloud(): Promise<void> {
  const { userId, isAuthenticated, isAnonymous } = useAuthStore.getState();
  if (!isAuthenticated || !userId || isAnonymous) return;

  const db = await getDatabase();

  // Only restore if local DB is empty (fresh install or new device)
  const localCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM mood_entries'
  );
  if ((localCount?.count || 0) > 0) return;

  // Restore mood entries
  const { data: moods } = await supabase
    .from('mood_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (moods) {
    for (const m of moods) {
      await db.runAsync(
        'INSERT OR IGNORE INTO mood_entries (id, user_id, mood, intensity, context, source, synced, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
        m.id, m.user_id, m.mood, m.intensity, m.context, m.source, m.created_at
      );
    }
  }

  // Restore journal entries
  const { data: journals } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (journals) {
    for (const j of journals) {
      await db.runAsync(
        'INSERT OR IGNORE INTO journal_entries (id, user_id, prompt_text, entry_text, mood_tags, is_ai_prompt, synced, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
        j.id, j.user_id, j.prompt_text, j.entry_text, JSON.stringify(j.mood_tags), j.is_ai_prompt ? 1 : 0, j.created_at, j.updated_at || j.created_at
      );
    }
  }

  // Restore chat sessions and messages
  const { data: sessions } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(20);

  if (sessions) {
    for (const s of sessions) {
      await db.runAsync(
        'INSERT OR IGNORE INTO chat_sessions (id, user_id, mood_at_start, mood_at_end, message_count, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        s.id, s.user_id, s.mood_at_start, s.mood_at_end, s.message_count, s.started_at, s.ended_at
      );

      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', s.id)
        .order('created_at', { ascending: true });

      if (msgs) {
        for (const m of msgs) {
          await db.runAsync(
            'INSERT OR IGNORE INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
            m.id, m.session_id, m.role, m.content, m.created_at
          );
        }
      }
    }
  }
}
