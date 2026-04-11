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

      if (item.operation === 'INSERT') {
        const { error } = await supabase
          .from(item.table_name)
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          console.warn(`Sync failed for ${item.table_name}/${item.record_id}:`, error.message);
          continue;
        }
      }

      // Mark record as synced in the source table
      await db.runAsync(
        `UPDATE ${item.table_name} SET synced = 1 WHERE id = ?`,
        item.record_id
      );

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
  const tables = ['mood_entries', 'journal_entries'] as const;

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
