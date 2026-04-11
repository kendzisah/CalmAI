import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { ContextOptions } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import type { ContextTag } from '@/types/user';
import type { MoodTier } from '@/types/mood';

export default function ContextScreen() {
  const [selectedContext, setSelectedContext] = useState<ContextTag | undefined>();
  const { setContext, completeStep } = useOnboardingStore();
  // TODO: Read from onboardingStore. Default to high_anxiety if mood was skipped.
  const moodTier: MoodTier = 'high_anxiety';

  const handleContinue = async () => {
    if (selectedContext) {
      await setContext(selectedContext);
    }
    await completeStep(3);
    router.push('/(auth)/relief');
  };

  const handleSkip = async () => {
    await setContext('skip' as ContextTag);
    await completeStep(3);
    router.push('/(auth)/relief');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ContextOptions
            moodTier={moodTier}
            selectedContext={selectedContext}
            onSelectContext={setSelectedContext}
          />
        </ScrollView>

        <View style={styles.footer}>
          {selectedContext && (
            <Button title="Continue" onPress={handleContinue} />
          )}
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text variant="body" color={Colors.gray}>Skip for now</Text>
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
  scrollContent: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
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
