import type { LoudCategory, TriggerTime, TonePref } from '@/types/user';

export type MockupId =
  | 'work_sunday' | 'work_2am' | 'work_general'
  | 'rel_postfight' | 'rel_general'
  | 'body_sleep' | 'body_general'
  | 'money_general'
  | 'family_panic' | 'family_general'
  | 'future_general'
  | 'everything_general';

export interface ProofMockup {
  id: MockupId;
  user: string;
  responses: Record<TonePref, string>;
}

// Tone variants per spec §3 Screen 11:
// - real      → drop soft openers, get to the question fast, no validation padding
// - gentle    → full validation first, soft question second (default tone shown in spec)
// - read_room → match user-message energy: short user → short CalmAI; emotional → match emotion before pivoting

export const MOCKUPS: Record<MockupId, ProofMockup> = {
  work_sunday: {
    id: 'work_sunday',
    user: "It's Sunday night and I'm already dreading Monday.",
    responses: {
      real:
        "Sunday-night dread is your body forecasting the week. It's data, not destiny. What's the part of Monday that's loudest right now?",
      gentle:
        "Yeah. Sunday-night dread is real — your body knows what's coming. You don't have to fix it tonight. What's the part of Monday that's loudest in your head right now?",
      read_room:
        "Ugh. Sunday-night dread is the worst. What's the loudest part?",
    },
  },
  work_2am: {
    id: 'work_2am',
    user: "It's 2am and I keep replaying that meeting.",
    responses: {
      real:
        "Your brain at 2am is a worse boss than your actual one. Walk me through the moment you keep going back to. We can take it apart.",
      gentle:
        "I'm with you. Your brain at 2am is a worse boss than your actual one. Walk me through the moment you keep going back to. We can take it apart together.",
      read_room:
        "2am replay loop. I see it. Which moment is on repeat?",
    },
  },
  work_general: {
    id: 'work_general',
    user: "I can't tell if I'm bad at my job or if I just hate it.",
    responses: {
      real:
        "Different problems, different fixes. Tell me what happened today that has you asking that question.",
      gentle:
        "Both can be true and neither has to define you tonight. Tell me what happened today that has you asking that question.",
      read_room:
        "That's a heavy question. What happened today?",
    },
  },
  rel_postfight: {
    id: 'rel_postfight',
    user: "We had another fight and I don't know what it was even about.",
    responses: {
      real:
        "When the fight stops being about the thing and starts being about the pattern — that's the worst kind. What was the moment it shifted?",
      gentle:
        "That's the worst kind — when the fight stops being about the thing and starts being about the pattern. What was the moment it shifted? Sometimes naming that helps more than rehashing the words.",
      read_room:
        "Another one. I'm sorry. What was the moment it tipped?",
    },
  },
  rel_general: {
    id: 'rel_general',
    user: "I think I'm the problem in this relationship.",
    responses: {
      real:
        "Before we touch that — is that what you actually believe, or what someone has been telling you?",
      gentle:
        "Okay. That's a heavy thought to carry alone. Before we touch it: are you sure that's what you actually believe, or what someone has been telling you?",
      read_room:
        "Heavy. Is that your voice or someone else's?",
    },
  },
  body_sleep: {
    id: 'body_sleep',
    user: "I can't sleep. My chest feels weird and I'm convinced something's wrong.",
    responses: {
      real:
        "Anxiety in the body is real, and it's still anxiety. Want a 90-second grounding? You can keep typing while we go.",
      gentle:
        "Anxiety in the body is real, and it's still anxiety. Your chest is doing what your brain told it to do at 11pm. Want to try a 90-second grounding while we talk? You can keep typing.",
      read_room:
        "Chest stuff at night is the worst. Want to try grounding while we talk?",
    },
  },
  body_general: {
    id: 'body_general',
    user: "I keep checking symptoms online and it's making it worse.",
    responses: {
      real:
        "The internet doesn't know you. I do, a little, so far. What set off the checking tonight?",
      gentle:
        "Yeah. The internet doesn't know you. I do — a little, so far. What set off the checking tonight?",
      read_room:
        "WebMD spiral. Been there. What kicked it off?",
    },
  },
  money_general: {
    id: 'money_general',
    user: "I checked my bank account and now I can't focus on anything else.",
    responses: {
      real:
        "You're not bad with money. You're scared, which is a reasonable response to feeling out of control. What's the smallest thing that would make tonight easier?",
      gentle:
        "Money brain is brutal because it doesn't turn off — it just changes channels. You're not bad with money. You're scared, which is a reasonable response to feeling out of control. What's the smallest thing that would make tonight easier?",
      read_room:
        "Bank-account dread is its own thing. What would make tonight easier?",
    },
  },
  family_panic: {
    id: 'family_panic',
    user: "My mom called and now I'm shaking and I don't know why.",
    responses: {
      real:
        "Bodies remember things words don't. You don't have to know why it shook you. Want to talk it through, or be distracted from it?",
      gentle:
        "Bodies remember things words don't. Whatever she said — even if it sounded fine — landed somewhere. You don't have to know why it shook you. Tell me what would help right now: talking it through, or being distracted from it?",
      read_room:
        "Shaking after a parent call is real. Talk it through, or distract?",
    },
  },
  family_general: {
    id: 'family_general',
    user: "I love them but I dread every visit.",
    responses: {
      real:
        "That's not a contradiction — that's loving complicated people. Which part of the visit do you dread most?",
      gentle:
        "That's not a contradiction. That's just what loving complicated people feels like. What's the part of the visit you dread most?",
      read_room:
        "Same. Which part is the worst?",
    },
  },
  future_general: {
    id: 'future_general',
    user: "I'm 27 and I feel like I'm running out of time.",
    responses: {
      real:
        "Twenty-seven. The made-up deadline. Whose voice is that, in your head?",
      gentle:
        "Twenty-seven. The made-up deadline. Whose voice is that, in your head? Yours, or someone else's?",
      read_room:
        "The 27 thing. Whose voice is that?",
    },
  },
  everything_general: {
    id: 'everything_general',
    user: "It's just everything right now and I can't pick one thing.",
    responses: {
      real:
        "Then we don't pick. Tell me what today felt like — no need to organize it.",
      gentle:
        "Then we don't have to. Sometimes the spiral is the air, not the room. Just tell me what today felt like — no need to organize it.",
      read_room:
        "Yeah. Just tell me what today felt like.",
    },
  },
};

export interface MockupSelectorState {
  loudCategories: LoudCategory[];
  triggerTimes: TriggerTime[];
}

export function selectMockup(state: MockupSelectorState): MockupId {
  const loud = state.loudCategories[0];
  const time = state.triggerTimes[0];

  // Highest-relevance combos first
  if (loud === 'work_school' && time === 'sunday_scaries') return 'work_sunday';
  if (loud === 'work_school' && time === '2am_spirals') return 'work_2am';
  if (loud === 'relationships' && time === 'post_argument') return 'rel_postfight';
  if (loud === 'body_health' && time === 'pre_sleep') return 'body_sleep';

  // Loud-category fallbacks
  if (loud === 'work_school') return 'work_general';
  if (loud === 'relationships') return 'rel_general';
  if (loud === 'body_health') return 'body_general';
  if (loud === 'money') return 'money_general';
  if (loud === 'family') return time === 'random_panic' ? 'family_panic' : 'family_general';
  if (loud === 'future') return 'future_general';

  return 'everything_general';
}
