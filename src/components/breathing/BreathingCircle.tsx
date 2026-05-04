import { StyleSheet, Animated } from 'react-native';
import { Shadows } from '@/lib/constants';

interface Props {
  scale: Animated.Value;
}

const CIRCLE_SIZE = 200;

export function BreathingCircle({ scale }: Props) {
  return <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />;
}

const styles = StyleSheet.create({
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    ...Shadows.md,
  },
});
