import { View, StyleSheet, ViewProps } from 'react-native';
import { Radius, Shadows, Spacing } from '@/lib/constants';
import { useThemeColors } from '@/theme';

interface Props extends ViewProps {
  variant?: 'default' | 'elevated';
}

export function Card({ variant = 'default', style, children, ...props }: Props) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.base,
        { backgroundColor: colors.surface },
        variant === 'elevated' ? Shadows.md : Shadows.sm,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
});
