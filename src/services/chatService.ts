// Use expo/fetch for the streaming endpoint — Expo SDK 54+ ships a fetch
// implementation with proper response.body streaming on iOS/Android.
// Standard React Native fetch buffers the entire response before resolving,
// which would defeat SSE.
import { fetch as expoFetch } from 'expo/fetch';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/stores/chatStore';
import { track, captureException } from '@/lib/analytics';

function categorizeNetworkError(err: any): string {
  const msg = String(err?.message ?? '');
  if (err?.response?.status >= 500) return `http_${err.response.status}`;
  if (msg.includes('Network') || msg.includes('fetch failed')) return 'network';
  if (msg.includes('timeout') || msg.includes('Timeout')) return 'timeout';
  if (msg.includes('Abort')) return 'aborted';
  return 'unknown';
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

interface SendOptions {
  isFirstConversation?: boolean;
  nickname?: string;
  loudCategories?: string[];
  triggerTimes?: string[];
  copingPrefs?: string[];
  tonePref?: string;
  onboardingMood?: string;
  onboardingContext?: string;
  reliefTag?: string;
}

export async function sendChatMessage(
  sessionId: string,
  message: string,
  options?: SendOptions
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const store = useChatStore.getState();
  store.setStreaming(true);

  const sendTime = Date.now();

  let response: Response;
  try {
    response = (await expoFetch(`${SUPABASE_URL}/functions/v1/chat-completion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, message, ...options }),
    })) as unknown as Response;
  } catch (err) {
    store.setStreaming(false);
    track('chat_response_failed', {
      error_category: categorizeNetworkError(err),
      latency_ms: Date.now() - sendTime,
    });
    captureException(err, { feature: 'chat' });
    throw err;
  }

  if (response.status === 402) {
    store.setStreaming(false);
    throw new Error('PAYWALL');
  }

  if (!response.ok) {
    store.setStreaming(false);
    track('chat_response_failed', {
      error_category: `http_${response.status}`,
      latency_ms: Date.now() - sendTime,
    });
    const err = new Error(`Chat API error: ${response.status}`);
    captureException(err, { feature: 'chat' });
    throw err;
  }

  const contentType = response.headers.get('Content-Type') ?? '';

  // Streaming SSE path — proxy token deltas into the store as they arrive.
  if (contentType.includes('text/event-stream')) {
    try {
      const finalContent = await consumeSseStream(response, sendTime);
      if (finalContent) {
        fetchSmartReplies(finalContent);
      }
    } catch (err) {
      store.setStreaming(false);
      track('chat_response_failed', {
        error_category: categorizeNetworkError(err),
        latency_ms: Date.now() - sendTime,
      });
      captureException(err, { feature: 'chat' });
      throw err;
    }
    return;
  }

  // Non-streaming JSON path — used for crisis responses, validation errors,
  // OpenAI fallback message, etc.
  try {
    const data = await response.json();
    store.setStreaming(false);
    if (data.type === 'crisis') {
      await store.addAssistantMessage(data.content);
    } else if (data.content) {
      await store.addAssistantMessage(data.content);
      fetchSmartReplies(data.content);
    }
    track('chat_response_complete', { latency_ms: Date.now() - sendTime });
  } catch (err) {
    store.setStreaming(false);
    track('chat_response_failed', {
      error_category: categorizeNetworkError(err),
      latency_ms: Date.now() - sendTime,
    });
    captureException(err, { feature: 'chat' });
    throw err;
  }
}

/**
 * Reads the SSE stream, dispatches token deltas to the store as they arrive,
 * and finalizes the message when the `done` event is received. Returns the
 * full assembled content (or null if the stream ended without a done event).
 */
async function consumeSseStream(response: Response, sendTime: number): Promise<string | null> {
  const store = useChatStore.getState();
  const body = response.body;
  if (!body) {
    store.setStreaming(false);
    return null;
  }

  const reader = (body as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalContent: string | null = null;
  let crisisContent: string | null = null;
  let streamError: string | null = null;
  let firstTokenFired = false;
  let tokenCount = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line (\n\n). Anything after the
      // last \n\n is a partial frame — keep it in the buffer for the next
      // iteration to complete.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const dataLines = frame
          .split('\n')
          .filter((l) => l.startsWith('data: '));

        for (const line of dataLines) {
          const raw = line.slice(6).trim();
          if (!raw) continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'token' && typeof evt.data === 'string') {
              if (!firstTokenFired) {
                firstTokenFired = true;
                track('chat_first_token_received', { latency_ms: Date.now() - sendTime });
              }
              tokenCount += 1;
              store.appendStreamToken(evt.data);
            } else if (evt.type === 'done') {
              finalContent = typeof evt.content === 'string' ? evt.content : null;
            } else if (evt.type === 'crisis') {
              crisisContent = typeof evt.content === 'string' ? evt.content : null;
            } else if (evt.type === 'error') {
              streamError = typeof evt.message === 'string' ? evt.message : 'Stream error';
            }
          } catch {
            // Malformed frame — skip silently rather than fail the whole stream.
          }
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // ignore
    }
  }

  if (streamError) {
    store.setStreaming(false);
    throw new Error(streamError);
  }

  // Crisis events bypass the streaming bubble — render them as a plain message.
  if (crisisContent) {
    store.setStreaming(false);
    await store.addAssistantMessage(crisisContent);
    track('chat_response_complete', { latency_ms: Date.now() - sendTime, token_count: tokenCount });
    return crisisContent;
  }

  // Done event arrived — finalize the streamed bubble into a real message.
  // finalizeStream uses whatever was accumulated via appendStreamToken,
  // which should already match `finalContent`. If for some reason the
  // accumulated buffer is empty but the server sent content, fall back
  // to addAssistantMessage so we don't lose the reply.
  const accumulated = useChatStore.getState().streamingContent;
  if (accumulated) {
    await store.finalizeStream();
    track('chat_response_complete', { latency_ms: Date.now() - sendTime, token_count: tokenCount });
    return finalContent ?? accumulated;
  }

  if (finalContent) {
    store.setStreaming(false);
    await store.addAssistantMessage(finalContent);
    track('chat_response_complete', { latency_ms: Date.now() - sendTime, token_count: tokenCount });
    return finalContent;
  }

  store.setStreaming(false);
  return null;
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

interface OpenerOptions {
  nickname?: string;
  loudCategories?: string[];
  triggerTimes?: string[];
  copingPrefs?: string[];
  tonePref?: string;
}

/**
 * Asks the chat-opener edge function for an AI-generated opener for today.
 * Pro-only on the server. Returns null on any non-OK response, on missing
 * auth, or on transport failure. Callers should fall back to the static
 * opener bank when null comes back.
 */
export async function fetchAiOpener(options: OpenerOptions): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-opener`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const opener = typeof data?.opener === 'string' ? data.opener.trim() : '';
    return opener || null;
  } catch {
    return null;
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
