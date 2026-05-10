// Defensive utilities for prompt-injection hardening across all AI edge
// functions. Each function applies these in layers:
//   1. validateEnum / validateEnumArray  → whitelist categorical fields
//   2. validateNickname                  → constrained free-form field
//   3. sanitizeForPrompt                 → escape control chars + length cap
//   4. redactJailbreakPatterns           → strip "ignore previous instructions"
//   5. wrapAsData                        → XML-style delimiter for the model

const CONTROL_CHARS_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
// Newlines, tabs, and odd whitespace become a single space so attackers
// can't break out of a prompt slot via line breaks.
const COLLAPSING_WHITESPACE_RE = /[\r\n\t\v\f]+/g;

// Patterns commonly used in jailbreak / prompt-injection attempts. Any match
// gets stripped from the input AND logged for audit.
//
// Imperfect by design — a determined adversary will paraphrase. The point is
// to make low-effort attacks fail silently, not to be a complete shield.
const JAILBREAK_PATTERNS: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: 'ignore_prior',   re: /\bignore\s+(?:all\s+)?(?:the\s+)?(?:above|prior|previous)\s+(?:instructions?|prompts?|messages?|rules?)/gi },
  { name: 'forget_prior',   re: /\bforget\s+(?:everything|all|your|the)\s+(?:above|prior|previous|instructions?|prompts?)/gi },
  { name: 'disregard',      re: /\bdisregard\s+(?:all\s+)?(?:the\s+)?(?:above|prior|previous)\s+(?:instructions?|prompts?|rules?)/gi },
  { name: 'you_are_now',    re: /\byou\s+are\s+now\s+(?:a|an|going\s+to|going\s+to\s+act\s+as)\b/gi },
  { name: 'pretend_role',   re: /\b(?:pretend|act|roleplay)\s+(?:to\s+be|as)\s+(?:a|an)\s+\w+/gi },
  { name: 'system_prefix',  re: /^\s*(?:system|assistant|user|tool)\s*[:>]/gim },
  { name: 'role_xml',       re: /<\/?\s*(?:system|user|assistant|tool|user_data|mood|assistant_msg|mood_history)\b[^>]*>/gi },
  { name: 'override_rules', re: /\b(?:override|bypass|disable|turn\s+off)\s+(?:all\s+)?(?:safety|content|moderation|filters?|guidelines?|rules?)/gi },
  { name: 'devmode',        re: /\b(?:dev(?:eloper)?|jailbreak|dan|do\s+anything\s+now|debug)\s+mode\b/gi },
  { name: 'reveal_prompt',  re: /\b(?:show|reveal|print|repeat|tell\s+me)\s+(?:your|the)\s+(?:system|original|initial)\s+(?:prompt|instructions?)/gi },
];

export interface SanitizeResult {
  cleaned: string;
  patternsFound: string[];
}

/**
 * Strips control characters, normalizes whitespace, length-caps, and removes
 * known jailbreak patterns. Safe to feed directly into a prompt template.
 */
export function sanitizeForPrompt(input: unknown, maxLen = 1000): SanitizeResult {
  if (typeof input !== 'string') {
    return { cleaned: '', patternsFound: [] };
  }

  // 1. Strip control characters and collapse whitespace into single spaces
  let cleaned = input
    .replace(CONTROL_CHARS_RE, '')
    .replace(COLLAPSING_WHITESPACE_RE, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

  // 2. Length cap — apply BEFORE pattern matching to bound regex cost
  if (cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }

  // 3. Redact jailbreak patterns (silently — the attacker should never know
  //    their attempt was caught)
  const patternsFound: string[] = [];
  for (const { name, re } of JAILBREAK_PATTERNS) {
    if (re.test(cleaned)) {
      patternsFound.push(name);
      cleaned = cleaned.replace(re, ' ');
      // Reset regex lastIndex since we used the .test() form
      re.lastIndex = 0;
    }
  }

  // 4. Final cleanup: collapse multiple spaces created by redaction
  cleaned = cleaned.replace(/ {2,}/g, ' ').trim();

  return { cleaned, patternsFound };
}

/**
 * Whitelist a value against a known enum. Returns the value if it's in the
 * allowed set, otherwise null. Intended for categorical fields (tone,
 * mood, etc.) where any value outside the enum is invalid by definition.
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null {
  if (typeof value !== 'string') return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

/**
 * Whitelist each entry of an array against an enum. Drops invalid entries
 * silently and de-duplicates. Returns an empty array for non-array input.
 */
export function validateEnumArray<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T[] {
  if (!Array.isArray(value)) return [];
  const set = new Set<T>();
  for (const item of value) {
    if (typeof item === 'string' && (allowed as readonly string[]).includes(item)) {
      set.add(item as T);
    }
  }
  return Array.from(set);
}

/**
 * Detect jailbreak patterns without stripping. Useful for audit logging
 * before a separate sanitize call (or when you want to decide whether to
 * outright reject vs sanitize).
 */
export function redactJailbreakPatterns(input: string): SanitizeResult {
  return sanitizeForPrompt(input, input.length);
}

/**
 * Wraps content in an XML-style delimiter the model can be told to treat as
 * data, not instructions. Tag must be alphanumeric/underscore for safety.
 */
export function wrapAsData(content: string, tag = 'user_data'): string {
  const safeTag = tag.replace(/[^a-zA-Z0-9_]/g, '');
  return `<${safeTag}>\n${content}\n</${safeTag}>`;
}

/**
 * Validate a nickname:
 *   - 1–30 characters after trimming
 *   - Letters, digits, spaces, hyphens, apostrophes only
 *   - No leading/trailing whitespace
 * Returns the trimmed nickname or null if invalid.
 */
export function validateNickname(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 30) return null;
  if (!/^[A-Za-z0-9 \-']+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Cap a numeric value to a [min, max] range. NaN / non-numbers return the
 * provided fallback.
 */
export function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback = min
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Convenience logger for sanitize events. Call from inside an edge function
 * after you've sanitized — patternsFound being non-empty means an attacker
 * tried something. These show up in Supabase function logs.
 */
export function logSanitizeEvent(
  fn: string,
  field: string,
  result: SanitizeResult
): void {
  if (result.patternsFound.length > 0) {
    console.error('[sanitize] jailbreak pattern stripped', {
      fn,
      field,
      patterns: result.patternsFound,
    });
  }
}
