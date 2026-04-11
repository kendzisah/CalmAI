import { useCallback } from 'react';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useChatStore } from '@/stores/chatStore';
import { useJournalStore } from '@/stores/journalStore';

export function usePaywall() {
  const { tier, canChat, canJournal, shouldShowPaywall } = useSubscriptionStore();
  const { getWeeklySessionCount } = useChatStore();
  const { getLifetimeCount } = useJournalStore();

  const refreshUsage = useCallback(async () => {
    const weeklyCount = await getWeeklySessionCount();
    const journalCount = await getLifetimeCount();
    useSubscriptionStore.getState().setUsage(weeklyCount, journalCount);
  }, [getWeeklySessionCount, getLifetimeCount]);

  const guardChat = useCallback(async (): Promise<boolean> => {
    await refreshUsage();
    if (!canChat()) {
      router.push('/paywall');
      return false;
    }
    return true;
  }, [refreshUsage, canChat]);

  const guardJournal = useCallback(async (): Promise<boolean> => {
    await refreshUsage();
    if (!canJournal()) {
      router.push('/paywall');
      return false;
    }
    return true;
  }, [refreshUsage, canJournal]);

  return {
    tier,
    isPro: tier === 'pro',
    canChat: canChat(),
    canJournal: canJournal(),
    shouldShowPaywall: shouldShowPaywall(),
    guardChat,
    guardJournal,
    refreshUsage,
  };
}
