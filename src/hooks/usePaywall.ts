import { useCallback } from 'react';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

// Subscription-only product. Pro tier (paid or in active trial via RevenueCat)
// is required for chat and journal. Both guards route non-Pro callers to the
// paywall before any send or save.
export function usePaywall() {
  const tier = useSubscriptionStore((s) => s.tier);
  const isPro = tier === 'pro';

  const guardChat = useCallback(async (): Promise<boolean> => {
    if (!isPro) {
      router.push('/paywall');
      return false;
    }
    return true;
  }, [isPro]);

  const guardJournal = useCallback(async (): Promise<boolean> => {
    if (!isPro) {
      router.push('/paywall');
      return false;
    }
    return true;
  }, [isPro]);

  return {
    tier,
    isPro,
    canChat: isPro,
    canJournal: isPro,
    shouldShowPaywall: !isPro,
    guardChat,
    guardJournal,
  };
}
