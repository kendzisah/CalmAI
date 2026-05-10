import { useRef } from 'react';
import { Pressable, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { Radius, Spacing } from '@/lib/constants';
import { useThemeColors } from '@/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'pill';

interface Props {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled = false, style }: Props) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  // Primary stays branded — same lavender in both themes. Secondary/ghost
  // borrow the themed primary color so they stay readable on dark surfaces.
  const containerStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: colors.primary, borderRadius: Radius.md }
      : variant === 'secondary'
      ? { backgroundColor: 'transparent', borderRadius: Radius.md, borderWidth: 1.5, borderColor: colors.primary }
      : variant === 'pill'
      ? { backgroundColor: colors.primary, borderRadius: Radius.pill, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base }
      : { backgroundColor: 'transparent' }; // ghost

  const textColor: TextStyle['color'] =
    variant === 'primary' || variant === 'pill' ? '#FFFFFF' : colors.primary;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.base,
          containerStyle,
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text
          variant="bodyMedium"
          color={textColor}
          style={[styles.text, variant === 'pill' ? styles.pillText : null]}
        >
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    textAlign: 'center',
  },
  pillText: {
    fontSize: 14,
  },
});
