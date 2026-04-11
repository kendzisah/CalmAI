import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  promptText: string;
}

function SparkleIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 0C8 0 9.5 5 10.5 6.5C11.5 8 16 8 16 8C16 8 11.5 8 10.5 9.5C9.5 11 8 16 8 16C8 16 6.5 11 5.5 9.5C4.5 8 0 8 0 8C0 8 4.5 8 5.5 6.5C6.5 5 8 0 8 0Z"
        fill={Colors.primary}
      />
    </Svg>
  );
}

export function PromptCard({ promptText }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.overlay} />
      <View style={styles.labelRow}>
        <SparkleIcon />
        <Text variant="label" color={Colors.primary} style={styles.label}>
          GENTLE PROMPT
        </Text>
      </View>
      <Text variant="body" style={styles.promptText}>
        {promptText}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.lavenderLight,
    opacity: 0.15,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    zIndex: 1,
  },
  label: {
    zIndex: 1,
  },
  promptText: {
    fontStyle: 'italic',
    lineHeight: 26,
    zIndex: 1,
  },
});
