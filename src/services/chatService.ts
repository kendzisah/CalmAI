import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/stores/chatStore';
import type { SSEEvent } from '@/types/chat';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export async function sendChatMessage(
  sessionId: string,
  message: string,
  options?: {
    isFirstConversation?: boolean;
    onboardingMood?: string;
    onboardingContext?: string;
    reliefTag?: string;
  }
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const store = useChatStore.getState();
  store.setStreaming(true);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        message,
        ...options,
      }),
    });

    if (response.status === 402) {
      store.setStreaming(false);
      throw new Error('PAYWALL');
    }

    if (!response.ok) {
      store.setStreaming(false);
      throw new Error(`Chat API error: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      // SSE streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

        for (const line of lines) {
          try {
            const event: SSEEvent = JSON.parse(line.replace('data: ', ''));

            if (event.type === 'token') {
              store.appendStreamToken(event.data);
            } else if (event.type === 'done') {
              await store.finalizeStream();
              // Fetch smart replies
              fetchSmartReplies(event.data);
            } else if (event.type === 'crisis') {
              store.setStreaming(false);
              await store.addAssistantMessage(event.data);
            } else if (event.type === 'error') {
              store.setStreaming(false);
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }
    } else {
      // JSON response (crisis or fallback)
      const data = await response.json();
      store.setStreaming(false);
      if (data.content) {
        await store.addAssistantMessage(data.content);
      }
    }
  } catch (err) {
    store.setStreaming(false);
    throw err;
  }
}

async function fetchSmartReplies(lastAssistantMessage: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/smart-replies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lastAssistantMessage }),
    });

    if (response.ok) {
      const { replies } = await response.json();
      useChatStore.getState().setQuickReplies(replies || []);
    }
  } catch {
    // Non-critical — silently fail
  }
}

export async function fetchJournalPrompt(mood?: string): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return '';

    const response = await fetch(`${SUPABASE_URL}/functions/v1/journal-prompt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mood }),
    });

    if (response.ok) {
      const { prompt } = await response.json();
      return prompt;
    }
  } catch {
    // Fall back to local prompts
  }
  return '';
}
