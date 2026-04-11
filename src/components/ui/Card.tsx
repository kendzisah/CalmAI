import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/lib/constants';

interface Props extends ViewProps {
  variant?: 'default' | 'elevated';
}

export function Card({ variant = 'default', style, children, ...props }: Props) {
  return (
    <View
      style={[
        styles.base,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
  },
});
