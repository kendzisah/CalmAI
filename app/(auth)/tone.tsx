import { useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { GradientBackground, Text } from '@/components/ui';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { track } from '@/lib/analytics';
import type { TonePref } from '@/types/user';

const OPTIONS: { value: TonePref; title: string; subtitle: string }[] = [
  { value: 'real',      title: 'Be real with me', subtitle: 'Direct. No padding.' },
  { value: 'gentle',    title: 'Be gentle',       subtitle: 'Soft landing. Always.' },
  { value: 'read_room', title: 'Read the room',   subtitle: 'Match my energy.' },
];

export default function ToneScreen() {
  const { setTonePref, completeStep } = useOnboardingStore();

  useEffect(() => {
    track('onboarding_tone_viewed');
  }, []);

  const handleSelect = async (value: TonePref) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setTonePref(value);
    track('onboarding_tone_submitted', { selected: value });
    await completeStep(8);
    router.push('/(auth)/confirm');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <View style={styles.progressWrap}>
          <ProgressDots current={5} total={5} />
        </View>

        <View style={styles.header}>
          <Text variant="h1" style={styles.headline}>
            Can I be honest with you, or do you want me soft?
          </Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            You can change this anytime.
          </Text>
        </View>

        <View style={styles.options}>
          {OPTIONS.map((opt) => (
            <ToneOption key={opt.value} option={opt} onSelect={handleSelect} />
          ))}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

function ToneOption({
  option,
  onSelect,
}: {
  option: { value: TonePref; title: string; subtitle: string };
  onSelect: (v: TonePref) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        onPress={() => onSelect(option.value)}
        style={styles.card}
      >
        <Text variant="h2">{option.title}</Text>
        <Text variant="body" color={Colors.gray}>{option.subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  progressWrap: { alignItems: 'center', paddingTop: Spacing.lg },
  header: {
    gap: Spacing.sm,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headline: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  options: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
});
