import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';
import { playChime } from '@/lib/audio';

export default function ConfirmScreen() {
  const { nickname, completeStep } = useOnboardingStore();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track('onboarding_confirm_viewed');
    playChime('relief');
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const headline = nickname
    ? `Got it, ${nickname}. I've got you.`
    : "Got it. I've got you.";

  const handleNext = async () => {
    track('onboarding_confirm_cta_tapped');
    await completeStep(9);
    router.push('/(auth)/proof');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.center, { opacity: fade }]}>
          <Text variant="h1" style={styles.headline}>{headline}</Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            Based on what you shared, I'm built for you. Let me show you why.
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          <Button title="Show me" onPress={handleNext} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.base,
  },
  headline: { textAlign: 'center', fontSize: 30, lineHeight: 38 },
  subtitle: { textAlign: 'center' },
  footer: { paddingBottom: Spacing.xl },
});
