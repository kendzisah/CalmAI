import { useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
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
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.base,
          size === 'small' && styles.small,
          { backgroundColor: selected ? selectedBackgroundColor : backgroundColor },
        ]}
      >
        <Text
          variant={size === 'small' ? 'small' : 'caption'}
          color={selected ? selectedTextColor : textColor}
          style={styles.text}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
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
