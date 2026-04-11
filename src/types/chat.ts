import type { MoodType } from './mood';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId?: string;
  moodAtStart?: MoodType;
  moodAtEnd?: MoodType;
  messageCount: number;
  startedAt: string;
  endedAt?: string;
}

export interface SSEEvent {
  type: 'token' | 'done' | 'error' | 'crisis';
  data: string;
}

export interface SmartReply {
  text: string;
}
