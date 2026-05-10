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
import { TRIGGER_TIME_LABELS } from '@/types/user';
import type { TriggerTime } from '@/types/user';

const OPTIONS: { value: TriggerTime; label: string }[] = (
  Object.keys(TRIGGER_TIME_LABELS) as TriggerTime[]
).map((value) => ({ value, label: TRIGGER_TIME_LABELS[value] }));

export default function TimingScreen() {
  const { setTriggerTimes, completeStep } = useOnboardingStore();
  const [selected, setSelected] = useState<TriggerTime[]>([]);

  useEffect(() => {
    track('onboarding_timing_viewed');
  }, []);

  const handleContinue = async () => {
    if (selected.length === 0) return;
    await setTriggerTimes(selected);
    track('onboarding_timing_submitted', { selected });
    await completeStep(6);
    router.push('/(auth)/coping');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <View style={styles.progressWrap}>
          <ProgressDots current={3} total={5} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text variant="h1" style={styles.headline}>
              When does it usually hit?
            </Text>
            <Text variant="body" color={Colors.gray} style={styles.subtitle}>
              Knowing when helps me know how to show up.
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
