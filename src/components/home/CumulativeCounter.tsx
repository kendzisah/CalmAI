import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  count: number;
}

function CheckmarkIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
        fill={Colors.primary}
      />
    </Svg>
  );
}

export function CumulativeCounter({ count }: Props) {
  return (
    <View style={styles.row}>
      <CheckmarkIcon />
      <Text variant="bodyMedium" color={Colors.primaryDark} style={styles.text}>
        You've checked in {count} {count === 1 ? 'time' : 'times'} this month
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  text: {
    marginLeft: Spacing.sm,
  },
});
