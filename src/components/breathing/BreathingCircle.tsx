import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { Shadows } from '@/lib/constants';

interface Props {
  scale: SharedValue<number>;
}

const CIRCLE_SIZE = 200;

export function BreathingCircle({ scale }: Props) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.circle, animatedStyle]} />;
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
