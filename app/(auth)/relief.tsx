import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui';
import { ReliefMoment } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useJournalStore } from '@/stores/journalStore';
import { Spacing } from '@/lib/constants';
import { MOOD_TIERS } from '@/types/mood';
import type { MoodType, MoodTier } from '@/types/mood';

export default function ReliefScreen() {
  const { completeStep, selectedMood } = useOnboardingStore();
  const { saveEntry } = useJournalStore();

  const mood: MoodType = selectedMood || 'anxious';
  const moodTier: MoodTier = MOOD_TIERS[mood];

  const handleComplete = async () => {
    await completeStep(4);
    router.push('/(auth)/post-relief');
  };

  const handleGratitudeEntry = async (text: string) => {
    await saveEntry(text, [mood], 'What is one thing that made today good?', false);
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <ReliefMoment
          mood={mood}
          moodTier={moodTier}
          onComplete={handleComplete}
          onGratitudeEntry={handleGratitudeEntry}
        />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
});
