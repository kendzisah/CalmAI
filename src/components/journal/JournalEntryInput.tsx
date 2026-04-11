import { StyleSheet, View } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing } from '@/lib/constants';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
}

export function JournalEntryInput({ value, onChangeText }: Props) {
  return (
    <View>
      <Input
        multiline
        value={value}
        onChangeText={onChangeText}
        placeholder="Start typing your heart out..."
        style={styles.input}
      />
      <View style={styles.indicator}>
        <View style={styles.dot} />
        <Text variant="caption" color={Colors.primary}>
          Deep listening active
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 160,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
