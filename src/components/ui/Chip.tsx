import { useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { Radius, Spacing } from '@/lib/constants';
import { useThemeColors } from '@/theme';
import { Text } from './Text';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Override the unselected background. Defaults to theme grayLavender. */
  backgroundColor?: string;
  /** Override the selected background. Defaults to theme primary. */
  selectedBackgroundColor?: string;
  /** Override the unselected text color. Defaults to theme text. */
  textColor?: string;
  /** Override the selected text color. Defaults to white. */
  selectedTextColor?: string;
  size?: 'small' | 'medium';
}

export function Chip({
  label,
  selected = false,
  onPress,
  backgroundColor,
  selectedBackgroundColor,
  textColor,
  selectedTextColor,
  size = 'medium',
}: Props) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const bg = selected
    ? selectedBackgroundColor ?? colors.primary
    : backgroundColor ?? colors.grayLavender;

  const fg = selected
    ? selectedTextColor ?? '#FFFFFF'
    : textColor ?? colors.text;

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
          { backgroundColor: bg },
        ]}
      >
        <Text variant={size === 'small' ? 'small' : 'caption'} color={fg} style={styles.text}>
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
