import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Card, Text, Button } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  checkedIn: boolean;
  onCheckIn: () => void;
}

function CheckmarkIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
        fill={Colors.sageGreen}
      />
    </Svg>
  );
}

export function DailyCheckInCard({ checkedIn, onCheckIn }: Props) {
  return (
    <Card variant="elevated" style={styles.card}>
      {checkedIn ? (
        <View style={styles.completedRow}>
          <CheckmarkIcon />
          <Text variant="bodyMedium" color={Colors.sageGreen} style={styles.completedText}>
            You checked in today
          </Text>
        </View>
      ) : (
        <>
          <Text variant="h2" style={styles.title}>
            Take a moment to check in
          </Text>
          <Text variant="caption" style={styles.subtitle}>
            How are you feeling right now?
          </Text>
          <Button title="Check In" onPress={onCheckIn} style={styles.button} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.base,
  },
  button: {
    alignSelf: 'flex-start',
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    marginLeft: Spacing.sm,
  },
});
