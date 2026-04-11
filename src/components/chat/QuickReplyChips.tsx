import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from '@/components/ui';
import { Spacing } from '@/lib/constants';

const DEFAULT_CHIPS = [
  "I'm anxious",
  'I need to vent',
  'Help me calm down',
  'Just talk',
];

interface Props {
  chips?: string[];
  onSelect: (chip: string) => void;
}

export function QuickReplyChips({ chips = DEFAULT_CHIPS, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {chips.map((chip) => (
        <Chip
          key={chip}
          label={chip}
          onPress={() => onSelect(chip)}
          size="medium"
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
});
