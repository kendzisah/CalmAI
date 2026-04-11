import { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { MoodGrid } from '@/components/mood';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import type { MoodType } from '@/types/mood';

export default function MoodCheckScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>();
  const { setMood, completeStep } = useOnboardingStore();

  const handleContinue = async () => {
    if (selectedMood) {
      await setMood(selectedMood);
    }
    await completeStep(2);
    router.push('/(auth)/context');
  };

  const handleSkip = async () => {
    // Default to anxious when skipped
    await setMood('anxious');
    await completeStep(2);
    router.push('/(auth)/context');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="h1" style={styles.title}>
            How are you feeling{'\n'}right now?
          </Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            There's no wrong answer
          </Text>
        </View>

        <View style={styles.gridContainer}>
          <MoodGrid
            selectedMood={selectedMood}
            onSelectMood={setSelectedMood}
          />
        </View>

        <View style={styles.footer}>
          {selectedMood && (
            <Button
              title="Continue"
              onPress={handleContinue}
            />
          )}
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text variant="body" color={Colors.gray}>
              Skip for now
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    gap: Spacing.base,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  skipButton: {
    padding: Spacing.sm,
  },
});
