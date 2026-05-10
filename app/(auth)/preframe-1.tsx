import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';

export default function PreframeOneScreen() {
  const { completeStep } = useOnboardingStore();
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    track('onboarding_preframe1_viewed');
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const handleNext = async () => {
    track('onboarding_preframe1_cta_tapped');
    await completeStep(2);
    router.push('/(auth)/preframe-2');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.center, { opacity: fade }]}>
          <View style={styles.thread}>
            <View style={[styles.threadDot, { backgroundColor: Colors.lavenderLight }]} />
            <View style={styles.threadLine} />
            <View style={[styles.threadDot, { backgroundColor: Colors.sageGreen }]} />
            <View style={styles.threadLine} />
            <View style={[styles.threadDot, { backgroundColor: Colors.blushPink }]} />
          </View>

          <Text variant="h1" style={styles.headline}>
            Anxiety isn't a diagnosis. It's a Tuesday.
          </Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            We won't pathologize what's normal.
          </Text>
        </Animated.View>

        <View style={styles.footer}>
          <Button title="Tell me more" onPress={handleNext} />
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
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  threadDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  threadLine: {
    width: 32,
    height: 2,
    backgroundColor: Colors.grayLavender,
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
