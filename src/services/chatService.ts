import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/stores/chatStore';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

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
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        message,
        ...options,
      }),
    });

    store.setStreaming(false);

    if (response.status === 402) {
      throw new Error('PAYWALL');
    }

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.type === 'crisis') {
      await store.addAssistantMessage(data.content);
    } else if (data.content) {
      await store.addAssistantMessage(data.content);
      fetchSmartReplies(data.content);
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
        'apikey': SUPABASE_ANON_KEY,
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
        'apikey': SUPABASE_ANON_KEY,
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
