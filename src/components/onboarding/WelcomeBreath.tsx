import { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  onReady: () => void;
}

export function WelcomeBreath({ onReady }: Props) {
  const circleScale = useSharedValue(0.6);
  const textOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    // Inhale: 0.6 → 1.0 over 4s
    circleScale.value = withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) });

    // Hold 1s, then exhale: 1.0 → 0.6 over 4s
    circleScale.value = withSequence(
      withTiming(1.0, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      withDelay(1000, withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) })),
    );

    // "Take a breath with me" fades in after 3s
    textOpacity.value = withDelay(3000, withTiming(1, { duration: 800 }));

    // "Tap when you're ready" fades in after animation completes (~9s)
    ctaOpacity.value = withDelay(9000, withTiming(1, { duration: 600 }));
  }, []);

  const circleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const ctaAnimatedStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
  }));

  return (
    <Pressable style={styles.container} onPress={onReady}>
      <View style={styles.content}>
        <Animated.View style={[styles.circle, circleAnimatedStyle]} />

        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <Text variant="h2" color={Colors.primaryDark} style={styles.breathText}>
            Take a breath with me.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ctaContainer, ctaAnimatedStyle]}>
          <Text variant="body" color={Colors.gray} style={styles.ctaText}>
            Tap when you're ready
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.xxl,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  textContainer: {
    alignItems: 'center',
  },
  breathText: {
    textAlign: 'center',
  },
  ctaContainer: {
    marginTop: Spacing.lg,
  },
  ctaText: {
    textAlign: 'center',
  },
});
