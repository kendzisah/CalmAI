import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/lib/constants';

type TextVariant = 'h1' | 'h2' | 'body' | 'bodyMedium' | 'caption' | 'label' | 'small';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function Text({ variant = 'body', color, style, ...props }: Props) {
  return (
    <RNText
      style={[
        styles.base,
        variantStyles[variant],
        color ? { color } : undefined,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.primaryDark,
  },
});

const variantStyles = StyleSheet.create({
  h1: Typography.h1,
  h2: Typography.h2,
  body: Typography.body,
  bodyMedium: Typography.bodyMedium,
  caption: Typography.caption,
  label: Typography.label,
  small: Typography.small,
});
