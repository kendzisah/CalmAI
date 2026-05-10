import { clearAllUserData } from '@/lib/database';
import { useChatStore } from '@/stores/chatStore';
import { useMoodStore } from '@/stores/moodStore';
import { useJournalStore } from '@/stores/journalStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

/**
 * Wipes the device of every trace of the previously signed-in user — local
 * SQLite tables AND the in-memory Zustand stores hydrated from them. Called
 * from sign-out and from the auth listener whenever the active user identity
 * changes, so a different account can never see the previous user's data.
 *
 * Order matters: Zustand state is reset BEFORE the SQL wipe so any in-flight
 * reads see empty state immediately and don't race a partially-cleared DB.
 */
export async function resetLocalUserData(): Promise<void> {
  useChatStore.getState().reset();
  useMoodStore.getState().reset();
  useJournalStore.getState().reset();
  // onboardingStore.reset() also writes to SQLite, but that's harmless — the
  // subsequent clearAllUserData wipe will leave the same end state.
  await useOnboardingStore.getState().reset();
  await clearAllUserData();
}
