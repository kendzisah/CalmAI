import type { LoudCategory, TriggerTime, TonePref } from '@/types/user';

interface FirstMessageState {
  nickname: string | null;
  loudCategories: LoudCategory[];
  triggerTimes: TriggerTime[];
  tonePref: TonePref | null;
  previousSessionCount?: number;
}

const LOUD_PHRASES: Record<LoudCategory, string> = {
  work_school: 'work',
  relationships: 'relationship stuff',
  body_health: 'how you feel in your body',
  money: 'money',
  family: 'family',
  future: 'the future',
  everything: 'kind of everything',
};

const TIME_PHRASES: Record<TriggerTime, string> = {
  '2am_spirals': 'hits hardest at 2am',
  sunday_scaries: 'is loudest on Sundays',
  pre_sleep: 'shows up right before sleep',
  random_panic: 'comes out of nowhere',
  post_argument: 'spikes after fights',
  all_day: 'is always there',
  other: '',
};

const RETURNING_OPENERS_NEUTRAL: string[] = [
  'Hey. How is today landing?',
  "You're back. What is loudest right now?",
  "What's the temperature today?",
  'Tell me what is taking up the most space in your head.',
  "Pick up wherever. What's on your mind?",
  'How are you, the real version.',
  "What's stirring today?",
  'I am here. Start anywhere.',
  'Anything sitting heavier than you want right now?',
  "What's the volume at today?",
  "Back. What's the situation?",
  'Drop whatever you want here. No filter.',
];

const RETURNING_OPENERS_REAL: string[] = [
  "Okay. What's the situation?",
  "Talk to me. What's loud?",
  "What's the thing today?",
  "Get to the point. What's going on?",
  "Tell me. I'm listening.",
  'What needs saying right now?',
];

const RETURNING_OPENERS_GENTLE: string[] = [
  'Hey. Take your time.',
  "I'm here. No rush. What's coming up?",
  "Soft start. What's stirring today?",
  'Start where you want today.',
  "Whenever you're ready. What's the feeling today?",
  "Gentle check-in. What's near the surface?",
];

const TIME_AWARE_OPENERS: Partial<Record<TriggerTime, string[]>> = {
  '2am_spirals': [
    "Late, or one of those days? Either way, I'm here.",
    "Tough night? I'm right here.",
  ],
  sunday_scaries: [
    'Sunday pulling at you again?',
    'How is the Sunday weight today?',
  ],
  pre_sleep: [
    'Wind-down time. What is keeping you up?',
    'Before-sleep brain. What is loud tonight?',
  ],
};

function pickFromBank(bank: string[], seed: number): string {
  if (bank.length === 0) return 'Hey. What is on your mind?';
  const idx = ((seed % bank.length) + bank.length) % bank.length;
  return bank[idx];
}

function buildFirstEverOpener(state: FirstMessageState): string {
  const name = state.nickname ?? 'you';
  const tone: TonePref = state.tonePref ?? 'gentle';
  const topLoud = state.loudCategories[0];
  const topTime = state.triggerTimes[0];

  const opener = {
    real: `Okay ${name}.`,
    gentle: `Hey ${name}.`,
    read_room: `Hi ${name}.`,
  }[tone];

  const loudPhrase = topLoud ? LOUD_PHRASES[topLoud] : null;
  const timePhrase = topTime ? TIME_PHRASES[topTime] : '';

  if (loudPhrase && timePhrase) {
    return `${opener} You said ${loudPhrase} ${timePhrase}. Let's start there. What's been on repeat in your head this week?`;
  }
  if (loudPhrase) {
    return `${opener} You said ${loudPhrase} is loud right now. What's been on repeat?`;
  }
  return `${opener} What's been on repeat in your head this week?`;
}

function buildReturningOpener(state: FirstMessageState): string {
  const tone: TonePref = state.tonePref ?? 'gentle';
  const sessionCount = state.previousSessionCount ?? 0;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = sessionCount * 7 + dayOfYear;

  const topTime = state.triggerTimes[0];
  if (topTime && seed % 5 === 0) {
    const timeBank = TIME_AWARE_OPENERS[topTime];
    if (timeBank && timeBank.length > 0) {
      return pickFromBank(timeBank, seed);
    }
  }

  const toneBank =
    tone === 'real'
      ? [...RETURNING_OPENERS_REAL, ...RETURNING_OPENERS_NEUTRAL]
      : tone === 'gentle'
        ? [...RETURNING_OPENERS_GENTLE, ...RETURNING_OPENERS_NEUTRAL]
        : RETURNING_OPENERS_NEUTRAL;

  return pickFromBank(toneBank, seed);
}

export function buildFirstMessage(state: FirstMessageState): string {
  const isFirstEver = (state.previousSessionCount ?? 0) === 0;
  return isFirstEver ? buildFirstEverOpener(state) : buildReturningOpener(state);
}
