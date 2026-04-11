import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Colors, Radius, Spacing } from '@/lib/constants';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  backgroundColor?: string;
  selectedBackgroundColor?: string;
  textColor?: string;
  selectedTextColor?: string;
  size?: 'small' | 'medium';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Chip({
  label,
  selected = false,
  onPress,
  backgroundColor = Colors.grayLavender,
  selectedBackgroundColor = Colors.primary,
  textColor = Colors.primaryDark,
  selectedTextColor = '#FFFFFF',
  size = 'medium',
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        size === 'small' && styles.small,
        { backgroundColor: selected ? selectedBackgroundColor : backgroundColor },
        animatedStyle,
      ]}
    >
      <Text
        variant={size === 'small' ? 'small' : 'caption'}
        color={selected ? selectedTextColor : textColor}
        style={styles.text}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  small: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  text: {
    textAlign: 'center',
  },
});
