// Reusable wrapper around the OpenAI Moderation API. Returns a normalized
// result and never throws — moderation should not be able to block
// legitimate traffic if the API itself has a hiccup.
//
// The Moderation API is free; calling it on small auxiliary fields
// (mood, lastAssistantMessage, etc.) costs nothing.

export interface ModerationResult {
  flagged: boolean;
  categories: string[];
  /** True when the moderation API itself errored — caller decides how to handle */
  apiError: boolean;
}

const MODERATION_URL = 'https://api.openai.com/v1/moderations';

export async function checkModeration(
  text: string,
  openaiKey: string
): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { flagged: false, categories: [], apiError: false };
  }

  try {
    const response = await fetch(MODERATION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });

    if (!response.ok) {
      console.warn('[moderation] non-OK response:', response.status);
      return { flagged: false, categories: [], apiError: true };
    }

    const result = await response.json();
    const r0 = result?.results?.[0];
    if (!r0) {
      return { flagged: false, categories: [], apiError: true };
    }

    const flagged: boolean = Boolean(r0.flagged);
    const categories: string[] = Object.entries(r0.categories || {})
      .filter(([, v]) => v === true)
      .map(([k]) => k);

    return { flagged, categories, apiError: false };
  } catch (err) {
    console.warn('[moderation] fetch failed:', err);
    return { flagged: false, categories: [], apiError: true };
  }
}

/**
 * Convenience: returns true if the text trips any of the listed self-harm
 * categories. Used in chat-completion's crisis branch.
 */
export function isSelfHarmFlagged(result: ModerationResult): boolean {
  return result.categories.some(
    (c) => c === 'self-harm' || c === 'self-harm/intent' || c === 'self-harm/instructions'
  );
}
