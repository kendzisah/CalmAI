import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui';
import { ReliefMoment } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Spacing } from '@/lib/constants';
import type { MoodType, MoodTier } from '@/types/mood';

export default function ReliefScreen() {
  const { completeStep } = useOnboardingStore();
  // TODO: Read from onboardingStore
  const mood: MoodType = 'anxious';
  const moodTier: MoodTier = 'high_anxiety';

  const handleComplete = async () => {
    await completeStep(4);
    router.push('/(auth)/post-relief');
  };

  const handleGratitudeEntry = (text: string) => {
    // TODO: Save as first journal entry
    console.log('Gratitude entry:', text);
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
