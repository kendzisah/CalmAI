import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/lib/constants';
import { Text } from '@/components/ui';

interface Props {
  current: number;
  total: number;
}

export function ProgressDots({ current, total }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.dotRow}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i < current;
          return (
            <View
              key={i}
              style={[styles.dot, filled ? styles.dotFilled : styles.dotEmpty]}
            />
          );
        })}
      </View>
      <Text variant="small" color={Colors.gray}>
        {current} of {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 24,
    height: 4,
    borderRadius: 2,
  },
  dotFilled: {
    backgroundColor: Colors.primary,
  },
  dotEmpty: {
    backgroundColor: Colors.grayLavender,
  },
});
