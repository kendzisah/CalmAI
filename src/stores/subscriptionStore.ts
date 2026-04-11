import { create } from 'zustand';
import { FreeLimits } from '@/lib/constants';
import type { SubscriptionTier } from '@/types/user';

interface SubscriptionState {
  tier: SubscriptionTier;
  weeklyAiSessions: number;
  lifetimeJournalEntries: number;

  setTier: (tier: SubscriptionTier) => void;
  setUsage: (weeklyAiSessions: number, lifetimeJournalEntries: number) => void;
  canChat: () => boolean;
  canJournal: () => boolean;
  shouldShowPaywall: () => { show: boolean; reason?: string };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',
  weeklyAiSessions: 0,
  lifetimeJournalEntries: 0,

  setTier: (tier) => set({ tier }),

  setUsage: (weeklyAiSessions, lifetimeJournalEntries) =>
    set({ weeklyAiSessions, lifetimeJournalEntries }),

  canChat: () => {
    const { tier, weeklyAiSessions } = get();
    if (tier === 'pro') return true;
    return weeklyAiSessions < FreeLimits.aiSessionsPerWeek;
  },

  canJournal: () => {
    const { tier, lifetimeJournalEntries } = get();
    if (tier === 'pro') return true;
    return lifetimeJournalEntries < FreeLimits.journalEntriesLifetime;
  },

  shouldShowPaywall: () => {
    const { tier, weeklyAiSessions, lifetimeJournalEntries } = get();
    if (tier === 'pro') return { show: false };

    if (weeklyAiSessions >= FreeLimits.aiSessionsPerWeek) {
      return { show: true, reason: 'You\'ve used all 3 free AI sessions this week' };
    }
    if (lifetimeJournalEntries >= FreeLimits.journalEntriesLifetime) {
      return { show: true, reason: 'You\'ve reached the free journal entry limit' };
    }
    return { show: false };
  },
}));
