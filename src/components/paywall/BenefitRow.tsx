import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  text: string;
}

function PurpleCheckIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z"
        fill={Colors.primary}
      />
    </Svg>
  );
}

export function BenefitRow({ text }: Props) {
  return (
    <View style={styles.row}>
      <PurpleCheckIcon />
      <Text variant="body" style={styles.text}>
        {text}
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
    marginLeft: Spacing.md,
    flex: 1,
  },
});
