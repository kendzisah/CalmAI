import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';

export default function PreframeTwoScreen() {
  const { completeStep } = useOnboardingStore();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track('onboarding_preframe2_viewed');
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleNext = async () => {
    track('onboarding_preframe2_cta_tapped');
    await completeStep(3);
    router.push('/(auth)/nickname');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.center, { opacity: fade }]}>
          <Text variant="h1" style={styles.headline}>
            I'm not a therapist. I'm the friend who's read all the books.
          </Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            Trained in CBT. Built for texting. Designed for you.
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          <Button title="Sounds like my vibe" onPress={handleNext} />
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
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.base,
  },
  headline: {
    textAlign: 'center',
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    textAlign: 'center',
  },
  footer: {
    paddingBottom: Spacing.xl,
  },
});
