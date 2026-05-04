import { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  onReady: () => void;
}

export function WelcomeBreath({ onReady }: Props) {
  const circleScale = useRef(new Animated.Value(0.6)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Inhale then exhale
    Animated.sequence([
      Animated.timing(circleScale, { toValue: 1.0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(circleScale, { toValue: 0.6, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start();

    // "Take a breath with me" fades in after 3s
    Animated.sequence([
      Animated.delay(3000),
      Animated.timing(textOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start();

    // "Tap when you're ready" fades in after ~9s
    Animated.sequence([
      Animated.delay(9000),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Pressable style={styles.container} onPress={onReady}>
      <View style={styles.content}>
        <Animated.View style={[styles.circle, { transform: [{ scale: circleScale }] }]} />

        <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
          <Text variant="h2" color={Colors.primaryDark} style={styles.breathText}>
            Breathe with me for a sec.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ctaContainer, { opacity: ctaOpacity }]}>
          <Text variant="body" color={Colors.gray} style={styles.ctaText}>
            Tap anywhere when you're ready
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
