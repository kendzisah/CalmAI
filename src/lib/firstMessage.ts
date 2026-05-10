import type { LoudCategory, TriggerTime, TonePref } from '@/types/user';

interface FirstMessageState {
  nickname: string | null;
  loudCategories: LoudCategory[];
  triggerTimes: TriggerTime[];
  tonePref: TonePref | null;
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
  all_day: 'is just always there',
  other: '',
};

export function buildFirstMessage(state: FirstMessageState): string {
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
