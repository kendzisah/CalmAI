import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { Spacing } from '@/lib/constants';
import { type BreathingPhase, PHASE_LABELS } from '@/types/breathing';

interface Props {
  phase: BreathingPhase;
  countdown: number;
}

export function PhaseLabel({ phase, countdown }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="h2" color="#FFFFFF" style={styles.phaseText}>
        {PHASE_LABELS[phase]}
      </Text>
      <Text variant="h1" color="#FFFFFF" style={styles.countdown}>
        {countdown}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  phaseText: {
    marginBottom: Spacing.sm,
  },
  countdown: {
    fontSize: 48,
  },
});
