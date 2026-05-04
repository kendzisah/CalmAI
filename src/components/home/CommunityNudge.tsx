import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

export function CommunityNudge() {
  return (
    <View style={styles.container}>
      <Text variant="small" color={Colors.gray} style={styles.text}>
        You're not alone in this — others are on their healing journey, too
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
