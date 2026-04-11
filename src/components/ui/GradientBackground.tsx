import { StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gradients } from '@/lib/constants';

interface Props extends ViewProps {
  variant?: 'onboarding' | 'breathing';
}

export function GradientBackground({ variant = 'onboarding', style, children, ...props }: Props) {
  const gradient = Gradients[variant];

  return (
    <LinearGradient
      colors={gradient.colors as [string, string]}
      start={gradient.start}
      end={gradient.end}
      style={[styles.container, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
