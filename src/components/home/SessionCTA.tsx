import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Text, Button } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';

interface Props {
  title: string;
  details: string;
  onResume: () => void;
}

export function SessionCTA({ title, details, onResume }: Props) {
  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.accentContainer}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.accent}
        />
      </View>
      <View style={styles.content}>
        <Text variant="label" color={Colors.primary} style={styles.label}>
          Continue Your Journey
        </Text>
        <Text variant="h2" style={styles.title}>
          {title}
        </Text>
        <Text variant="caption" style={styles.details}>
          {details}
        </Text>
        <Button title="Resume Journey" onPress={onResume} variant="pill" style={styles.button} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 0,
  },
  accentContainer: {
    width: 6,
  },
  accent: {
    flex: 1,
    borderTopLeftRadius: Radius.lg,
    borderBottomLeftRadius: Radius.lg,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  details: {
    marginBottom: Spacing.md,
  },
  button: {
    alignSelf: 'flex-start',
  },
});
