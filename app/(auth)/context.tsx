import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { ContextOptions } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import type { ContextTag } from '@/types/user';
import type { MoodTier } from '@/types/mood';
import { MOOD_TIERS } from '@/types/mood';

export default function ContextScreen() {
  const [selectedContext, setSelectedContext] = useState<ContextTag | undefined>();
  const { setContext, completeStep, selectedMood } = useOnboardingStore();
  const moodTier: MoodTier = selectedMood ? MOOD_TIERS[selectedMood] : 'high_anxiety';
  const scrollRef = useRef<ScrollView>(null);
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (selectedContext) {
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(buttonTranslate, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
      // Scroll to bottom so the selected option isn't hidden
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } else {
      buttonOpacity.setValue(0);
      buttonTranslate.setValue(12);
    }
  }, [selectedContext]);

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
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ContextOptions
            moodTier={moodTier}
            selectedContext={selectedContext}
            onSelectContext={setSelectedContext}
          />

          {/* Footer inside scroll so it doesn't cover options */}
          <View style={styles.footer}>
            {selectedContext && (
              <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonTranslate }] }}>
                <Button title="Continue" onPress={handleContinue} />
              </Animated.View>
            )}
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text variant="body" color={Colors.gray}>Skip for now</Text>
            </Pressable>
          </View>
        </ScrollView>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  skipButton: {
    padding: Spacing.sm,
  },
});
