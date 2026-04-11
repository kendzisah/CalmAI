import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  count: number;
}

export function CommunityNudge({ count }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="small" color={Colors.gray} style={styles.text}>
        {count} {count === 1 ? 'woman is' : 'women are'} breathing with you right now
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  text: {
    textAlign: 'center',
    opacity: 0.8,
  },
});
