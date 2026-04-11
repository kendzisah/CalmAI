// Layer 1: Client-side regex crisis detection
// Shows 988 banner immediately, does NOT block the message from being sent

const CRISIS_PATTERNS = [
  /\b(kill\s*(my)?self|suicide|suicidal)\b/i,
  /\b(want\s+to\s+die|wanna\s+die|ready\s+to\s+die)\b/i,
  /\b(end\s+(my\s+)?life|ending\s+(my\s+)?life)\b/i,
  /\b(self[\s-]?harm|cut(ting)?\s*(my)?self|hurt(ing)?\s*(my)?self)\b/i,
  /\bno\s+(reason|point)\s+(to|in)\s+(live|living|go\s+on)\b/i,
  /\b(better\s+off\s+(dead|without\s+me))\b/i,
  /\b(nobody\s+would\s+(miss|care|notice))\b/i,
  /\b(don'?t\s+want\s+to\s+(be\s+here|exist|wake\s+up))\b/i,
  /\b(overdose|OD)\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

export const CRISIS_MESSAGE = 'If you\'re in crisis, you\'re not alone. Call or text 988 (Suicide & Crisis Lifeline) for free, confidential support 24/7.';
export const CRISIS_PHONE = '988';
