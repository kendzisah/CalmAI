import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('calmai.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

async function runMigrations(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS onboarding (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      completed_step INTEGER NOT NULL DEFAULT 0,
      selected_mood TEXT,
      selected_context TEXT,
      relief_tag TEXT,
      is_complete INTEGER NOT NULL DEFAULT 0,
      nickname TEXT,
      loud_categories TEXT NOT NULL DEFAULT '[]',
      trigger_times TEXT NOT NULL DEFAULT '[]',
      coping_prefs TEXT NOT NULL DEFAULT '[]',
      tone_pref TEXT,
      suggested_notification_hour INTEGER,
      notifications_enabled INTEGER NOT NULL DEFAULT 0,
      relief_gratitude_text TEXT,
      email_is_relay INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS mood_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      mood TEXT NOT NULL,
      intensity INTEGER NOT NULL DEFAULT 3,
      context TEXT,
      source TEXT NOT NULL DEFAULT 'check_in',
      synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      prompt_text TEXT,
      entry_text TEXT NOT NULL,
      mood_tags TEXT NOT NULL DEFAULT '[]',
      is_ai_prompt INTEGER NOT NULL DEFAULT 0,
      synced INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      mood_at_start TEXT,
      mood_at_end TEXT,
      message_count INTEGER NOT NULL DEFAULT 0,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES chat_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS breathing_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      technique TEXT NOT NULL DEFAULT 'box',
      duration_seconds INTEGER NOT NULL DEFAULT 0,
      cycles_completed INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_mood_entries_created ON mood_entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_created ON journal_entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_table ON sync_queue(table_name);

    INSERT OR IGNORE INTO onboarding (id, completed_step, is_complete) VALUES (1, 0, 0);
  `);

  await migrateOnboardingV2(database);
}

async function migrateOnboardingV2(database: SQLite.SQLiteDatabase) {
  const result = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= 1) return;

  const additions: Array<[string, string]> = [
    ['nickname', 'TEXT'],
    ['loud_categories', "TEXT NOT NULL DEFAULT '[]'"],
    ['trigger_times', "TEXT NOT NULL DEFAULT '[]'"],
    ['coping_prefs', "TEXT NOT NULL DEFAULT '[]'"],
    ['tone_pref', 'TEXT'],
    ['suggested_notification_hour', 'INTEGER'],
    ['notifications_enabled', 'INTEGER NOT NULL DEFAULT 0'],
    ['relief_gratitude_text', 'TEXT'],
    ['email_is_relay', 'INTEGER NOT NULL DEFAULT 0'],
  ];

  for (const [name, def] of additions) {
    try {
      await database.execAsync(`ALTER TABLE onboarding ADD COLUMN ${name} ${def};`);
    } catch {
      // Column already exists (fresh CREATE TABLE included it) — safe to ignore.
    }
  }

  await database.execAsync('PRAGMA user_version = 1;');
}

/**
 * Wipes every user-data table on the local device. Called on sign-out and on
 * any auth-change that swaps the active user identity, so a different account
 * can never see the previous user's chats / moods / journal entries.
 *
 * The schema itself is preserved — we only DELETE rows. The `onboarding` row
 * is reset back to its default state (id=1 always exists per the migration
 * INSERT OR IGNORE). Pending sync_queue items are dropped because they belong
 * to the user who just left.
 */
export async function clearAllUserData(): Promise<void> {
  const database = await getDatabase();
  // daily_prompts is created lazily inside journalStore — ensure it exists
  // before the DELETE so this helper is safe to call even on a fresh install.
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_prompts (
      date TEXT PRIMARY KEY,
      prompt_text TEXT NOT NULL,
      mood TEXT,
      created_at TEXT NOT NULL
    );
    DELETE FROM chat_messages;
    DELETE FROM chat_sessions;
    DELETE FROM mood_entries;
    DELETE FROM journal_entries;
    DELETE FROM breathing_sessions;
    DELETE FROM sync_queue;
    DELETE FROM daily_prompts;
    UPDATE onboarding
       SET completed_step = 0,
           selected_mood = NULL,
           selected_context = NULL,
           relief_tag = NULL,
           is_complete = 0,
           nickname = NULL,
           loud_categories = '[]',
           trigger_times = '[]',
           coping_prefs = '[]',
           tone_pref = NULL,
           suggested_notification_hour = NULL,
           notifications_enabled = 0,
           relief_gratitude_text = NULL,
           email_is_relay = 0
     WHERE id = 1;
  `);
}

// Helper to generate UUIDs
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
