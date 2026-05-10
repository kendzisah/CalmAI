import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';
import { playChime } from '@/lib/audio';

export default function WelcomeScreen() {
  const { completeStep } = useOnboardingStore();
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const subOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track('onboarding_hero_viewed');
    playChime('hero');

    Animated.sequence([
      Animated.timing(wordmarkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(headlineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(subOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleReady = async () => {
    track('onboarding_hero_cta_tapped');
    await completeStep(1);
    router.push('/(auth)/preframe-1');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.wordmark, { opacity: wordmarkOpacity }]}>
          <Text variant="label" color={Colors.primary}>CalmAI</Text>
        </Animated.View>

        <View style={styles.center}>
          <Animated.View style={{ opacity: headlineOpacity }}>
            <Text variant="h1" style={styles.headline}>
              Hey. I'm CalmAI. Whatever you're carrying, set it down here.
            </Text>
          </Animated.View>
          <Animated.View style={{ opacity: subOpacity }}>
            <Text variant="body" color={Colors.gray} style={styles.subtitle}>
              For women who need somewhere safe to think out loud.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { opacity: ctaOpacity }]}>
          <Button title="I'm Ready" onPress={handleReady} />
        </Animated.View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  wordmark: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.base,
  },
  headline: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    textAlign: 'center',
  },
  footer: {
    paddingBottom: Spacing.xl,
  },
});
