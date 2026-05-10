import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { Typography } from '@/lib/constants';
import { useThemeColors } from '@/theme';

type TextVariant = 'h1' | 'h2' | 'body' | 'bodyMedium' | 'caption' | 'label' | 'small';

interface Props extends TextProps {
  variant?: TextVariant;
  /** Override the default themed color. If set, takes precedence over the theme. */
  color?: string;
}

export function Text({ variant = 'body', color, style, ...props }: Props) {
  const colors = useThemeColors();
  // Caption defaults to muted (matches the original behavior baked into
  // Typography.caption). Everything else uses primary text ink.
  const themedDefault = variant === 'caption' ? colors.textMuted : colors.text;

  return (
    <RNText
      style={[
        // Variant typography first — some variants (caption) have a hardcoded
        // color in Typography that we DO NOT want to win.
        variantStyles[variant],
        // Themed color comes AFTER the variant so it overrides any hardcoded
        // color baked into Typography.X.
        { color: themedDefault },
        // Caller-provided color overrides the theme default.
        color ? { color } : undefined,
        // Caller-provided style is the final say.
        style,
      ]}
      {...props}
    />
  );
}

// Strip the color out of Typography.caption — we set color dynamically based
// on theme above. Other variants don't have a color in Typography, so their
// raw values are fine to pass through.
const { color: _captionColorBaked, ...captionWithoutColor } = Typography.caption as {
  color?: string;
  [key: string]: unknown;
};

const variantStyles = StyleSheet.create({
  h1: Typography.h1,
  h2: Typography.h2,
  body: Typography.body,
  bodyMedium: Typography.bodyMedium,
  caption: captionWithoutColor,
  label: Typography.label,
  small: Typography.small,
});
