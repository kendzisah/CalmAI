import { useRef } from 'react';
import { Pressable, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/lib/constants';
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
        disabled={disabled}
        style={[
          styles.base,
          variantContainerStyles[variant],
          disabled && styles.disabled,
          style,
        ]}
      >
        <Text
          variant="bodyMedium"
          style={[styles.text, variantTextStyles[variant]]}
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
});

const variantContainerStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pill: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
});

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: '#FFFFFF' },
  secondary: { color: Colors.primary },
  ghost: { color: Colors.primary },
  pill: { color: '#FFFFFF', fontSize: 14 },
};
