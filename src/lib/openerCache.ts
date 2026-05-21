import { getDatabase } from './database';

/**
 * Cache of one chat opener per calendar day. Prevents re-running the AI call
 * every time the user re-opens the chat tab within a day.
 *
 * Key is the local calendar date (YYYY-MM-DD). Source is 'ai' or 'static'
 * so we can later analyze fallback rates without re-querying logs.
 */

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export async function getCachedOpener(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ opener: string }>(
    'SELECT opener FROM opener_cache WHERE date = ?',
    todayKey()
  );
  return row?.opener ?? null;
}

export async function setCachedOpener(opener: string, source: 'ai' | 'static'): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO opener_cache (date, opener, source, created_at) VALUES (?, ?, ?, datetime(\'now\'))',
    todayKey(),
    opener,
    source
  );
}
