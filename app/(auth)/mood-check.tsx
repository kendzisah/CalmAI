import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { MoodGrid } from '@/components/mood';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useMoodStore } from '@/stores/moodStore';
import { Colors, Spacing } from '@/lib/constants';
import type { MoodType } from '@/types/mood';

export default function MoodCheckScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodType | undefined>();
  const { setMood, completeStep } = useOnboardingStore();
  const { checkIn } = useMoodStore();
  const buttonOpacity = useRef(new Animated.Value(0)).current;
  const buttonTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (selectedMood) {
      Animated.parallel([
        Animated.timing(buttonOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(buttonTranslate, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      buttonOpacity.setValue(0);
      buttonTranslate.setValue(12);
    }
  }, [selectedMood]);

  const handleContinue = async () => {
    if (selectedMood) {
      await setMood(selectedMood);
      await checkIn(selectedMood, 3, undefined, 'check_in');
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
            Real talk — how{'\n'}are you doing?
          </Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            No wrong answers here
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
            <Animated.View style={{ opacity: buttonOpacity, transform: [{ translateY: buttonTranslate }] }}>
              <Button
                title="Continue"
                onPress={handleContinue}
              />
            </Animated.View>
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
