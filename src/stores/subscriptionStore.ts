import { create } from 'zustand';
import type { SubscriptionTier } from '@/types/user';

// CalmAI is subscription-only. Active Pro tier (paid or in trial via RevenueCat)
// is the sole gate. Free users have no read or write access to chat or journal.
interface SubscriptionState {
  tier: SubscriptionTier;

  setTier: (tier: SubscriptionTier) => void;
  canChat: () => boolean;
  canJournal: () => boolean;
  shouldShowPaywall: () => { show: boolean; reason?: string };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  tier: 'free',

  setTier: (tier) => set({ tier }),

  canChat: () => get().tier === 'pro',
  canJournal: () => get().tier === 'pro',

  shouldShowPaywall: () => {
    const isPro = get().tier === 'pro';
    if (isPro) return { show: false };
    return { show: true, reason: 'CalmAI requires an active subscription.' };
  },
}));
