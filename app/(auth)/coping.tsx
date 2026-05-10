import { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { MultiSelectChips } from '@/components/onboarding/MultiSelectChips';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';
import { COPING_PREF_LABELS } from '@/types/user';
import type { CopingPref } from '@/types/user';

const OPTIONS: { value: CopingPref; label: string }[] = (
  Object.keys(COPING_PREF_LABELS) as CopingPref[]
).map((value) => ({ value, label: COPING_PREF_LABELS[value] }));

export default function CopingScreen() {
  const { setCopingPrefs, completeStep } = useOnboardingStore();
  const [selected, setSelected] = useState<CopingPref[]>([]);

  useEffect(() => {
    track('onboarding_coping_viewed');
  }, []);

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await setCopingPrefs(selected);
    track('onboarding_coping_submitted', { selected });
    await completeStep(7);
    router.push('/(auth)/tone');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <View style={styles.progressWrap}>
          <ProgressDots current={4} total={5} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text variant="h1" style={styles.headline}>
              When you're spiraling, what helps?
            </Text>
            <Text variant="body" color={Colors.gray} style={styles.subtitle}>
              This trains me. Pick all that work — or "I don't know yet" is honest too.
            </Text>
          </View>

          <MultiSelectChips
            options={OPTIONS}
            selected={selected}
            onChange={setSelected}
          />
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
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
