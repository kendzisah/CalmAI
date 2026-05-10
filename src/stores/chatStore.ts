import { create } from 'zustand';
import { getDatabase, generateId } from '@/lib/database';
import type { ChatMessage, ChatSession } from '@/types/chat';

interface ChatState {
  messages: ChatMessage[];
  currentSession: ChatSession | null;
  isStreaming: boolean;
  streamingContent: string;
  quickReplies: string[];
  weeklySessionCount: number;

  loadSession: (sessionId: string) => Promise<void>;
  startSession: (moodAtStart?: string) => Promise<string>;
  addUserMessage: (content: string) => Promise<ChatMessage>;
  addAssistantMessage: (content: string) => Promise<ChatMessage>;
  setStreaming: (streaming: boolean) => void;
  appendStreamToken: (token: string) => void;
  finalizeStream: () => Promise<ChatMessage | null>;
  setQuickReplies: (replies: string[]) => void;
  endSession: (moodAtEnd?: string) => Promise<void>;
  getWeeklySessionCount: () => Promise<number>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentSession: null,
  isStreaming: false,
  streamingContent: '',
  quickReplies: [],
  weeklySessionCount: 0,

  loadSession: async (sessionId: string) => {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      session_id: string;
      role: string;
      content: string;
      created_at: string;
    }>('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC', sessionId);

    const messages: ChatMessage[] = rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      role: r.role as 'user' | 'assistant',
      content: r.content,
      createdAt: r.created_at,
    }));

    set({ messages });
  },

  startSession: async (moodAtStart?: string) => {
    const db = await getDatabase();

    // Check for a recent session from today that we can resume
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.getFirstAsync<{
      id: string;
      mood_at_start: string | null;
      message_count: number;
      started_at: string;
      ended_at: string | null;
    }>(
      "SELECT * FROM chat_sessions WHERE started_at LIKE ? || '%' AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1",
      today
    );

    if (existing) {
      const session: ChatSession = {
        id: existing.id,
        moodAtStart: existing.mood_at_start as any,
        messageCount: existing.message_count,
        startedAt: existing.started_at,
      };

      // Load messages for this session
      const rows = await db.getAllAsync<{
        id: string;
        session_id: string;
        role: string;
        content: string;
        created_at: string;
      }>('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC', existing.id);

      const messages: ChatMessage[] = rows.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        role: r.role as 'user' | 'assistant',
        content: r.content,
        createdAt: r.created_at,
      }));

      set({ currentSession: session, messages, quickReplies: [] });
      return existing.id;
    }

    // No existing session — create a new one
    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO chat_sessions (id, mood_at_start, started_at) VALUES (?, ?, ?)',
      id, moodAtStart || null, now
    );

    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
      'chat_sessions', id, 'INSERT', JSON.stringify({ id, mood_at_start: moodAtStart || null, message_count: 0, started_at: now })
    );

    const session: ChatSession = {
      id,
      moodAtStart: moodAtStart as any,
      messageCount: 0,
      startedAt: now,
    };

    set({ currentSession: session, messages: [], quickReplies: [] });
    return id;
  },

  addUserMessage: async (content: string) => {
    const db = await getDatabase();
    const { currentSession } = get();
    if (!currentSession) throw new Error('No active session');

    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
      id, currentSession.id, 'user', content, now
    );

    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
      'chat_messages', id, 'INSERT', JSON.stringify({ id, session_id: currentSession.id, role: 'user', content, created_at: now })
    );

    await db.runAsync(
      'UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = ?',
      currentSession.id
    );

    const message: ChatMessage = {
      id,
      sessionId: currentSession.id,
      role: 'user',
      content,
      createdAt: now,
    };

    set((state) => ({
      messages: [...state.messages, message],
      currentSession: state.currentSession
        ? { ...state.currentSession, messageCount: state.currentSession.messageCount + 1 }
        : null,
    }));

    return message;
  },

  addAssistantMessage: async (content: string) => {
    const db = await getDatabase();
    const { currentSession } = get();
    if (!currentSession) throw new Error('No active session');

    const id = generateId();
    const now = new Date().toISOString();

    await db.runAsync(
      'INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
      id, currentSession.id, 'assistant', content, now
    );

    await db.runAsync(
      'INSERT INTO sync_queue (table_name, record_id, operation, payload) VALUES (?, ?, ?, ?)',
      'chat_messages', id, 'INSERT', JSON.stringify({ id, session_id: currentSession.id, role: 'assistant', content, created_at: now })
    );

    await db.runAsync(
      'UPDATE chat_sessions SET message_count = message_count + 1 WHERE id = ?',
      currentSession.id
    );

    const message: ChatMessage = {
      id,
      sessionId: currentSession.id,
      role: 'assistant',
      content,
      createdAt: now,
    };

    set((state) => ({
      messages: [...state.messages, message],
      currentSession: state.currentSession
        ? { ...state.currentSession, messageCount: state.currentSession.messageCount + 1 }
        : null,
    }));

    return message;
  },

  setStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming, streamingContent: streaming ? '' : get().streamingContent });
  },

  appendStreamToken: (token: string) => {
    set((state) => ({ streamingContent: state.streamingContent + token }));
  },

  finalizeStream: async () => {
    const { streamingContent } = get();
    if (!streamingContent) return null;

    const message = await get().addAssistantMessage(streamingContent);
    set({ isStreaming: false, streamingContent: '' });
    return message;
  },

  setQuickReplies: (replies: string[]) => {
    set({ quickReplies: replies });
  },

  endSession: async (moodAtEnd?: string) => {
    const db = await getDatabase();
    const { currentSession } = get();
    if (!currentSession) return;

    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE chat_sessions SET mood_at_end = ?, ended_at = ? WHERE id = ?',
      moodAtEnd || null, now, currentSession.id
    );

    set({ currentSession: null });
  },

  getWeeklySessionCount: async () => {
    const db = await getDatabase();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM chat_sessions WHERE started_at >= ?',
      weekAgo.toISOString()
    );

    const count = result?.count || 0;
    set({ weeklySessionCount: count });
    return count;
  },

  reset: () => {
    set({
      messages: [],
      currentSession: null,
      isStreaming: false,
      streamingContent: '',
      quickReplies: [],
      weeklySessionCount: 0,
    });
  },
}));
