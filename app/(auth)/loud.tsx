import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { MultiSelectChips } from '@/components/onboarding/MultiSelectChips';
import { MoodGrid } from '@/components/mood';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useMoodStore } from '@/stores/moodStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';
import { LOUD_CATEGORY_LABELS } from '@/types/user';
import type { LoudCategory } from '@/types/user';
import type { MoodType } from '@/types/mood';

const CATEGORIES: { value: LoudCategory; label: string }[] = (
  Object.keys(LOUD_CATEGORY_LABELS) as LoudCategory[]
).map((value) => ({ value, label: LOUD_CATEGORY_LABELS[value] }));

export default function LoudScreen() {
  const { setLoudCategories, setMood, completeStep } = useOnboardingStore();
  const { checkIn } = useMoodStore();
  const [selected, setSelected] = useState<LoudCategory[]>([]);
  const [showVibe, setShowVibe] = useState(false);
  const [vibeMood, setVibeMood] = useState<MoodType | undefined>();

  useEffect(() => {
    track('onboarding_loud_viewed');
  }, []);

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await setLoudCategories(selected);
    if (vibeMood) {
      await setMood(vibeMood);
      await checkIn(vibeMood, 3, undefined, 'check_in');
    }
    track('onboarding_loud_submitted', { selected, vibe_mood: vibeMood });
    await completeStep(5);
    router.push('/(auth)/timing');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <View style={styles.progressWrap}>
          <ProgressDots current={2} total={5} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text variant="h1" style={styles.headline}>
              What's been the loudest thing in your head lately?
            </Text>
            <Text variant="body" color={Colors.gray} style={styles.subtitle}>
              Pick as many as fit. I'll learn the rest.
            </Text>
          </View>

          <MultiSelectChips
            options={CATEGORIES}
            selected={selected}
            onChange={setSelected}
          />

          <Pressable onPress={() => setShowVibe((v) => !v)} style={styles.vibeToggle}>
            <Text variant="body" color={Colors.primary}>
              {showVibe ? '— Hide vibe word' : '+ Add a vibe word if you want'}
            </Text>
          </Pressable>

          {showVibe && (
            <View style={styles.vibeWrap}>
              <MoodGrid
                selectedMood={vibeMood}
                onSelectMood={setVibeMood}
                bubbleSize={48}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Continue" onPress={handleContinue} disabled={selected.length === 0} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressWrap: { alignItems: 'center', paddingTop: Spacing.lg },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  header: { gap: Spacing.sm, alignItems: 'center' },
  headline: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  vibeToggle: {
    alignSelf: 'center',
    padding: Spacing.sm,
  },
  vibeWrap: {
    paddingTop: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
