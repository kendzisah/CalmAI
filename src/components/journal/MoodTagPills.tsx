import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/ui/Chip';
import { Spacing } from '@/lib/constants';
import { MoodColors } from '@/lib/constants';
import { MOOD_TYPES, MOOD_LABELS } from '@/types/mood';
import type { MoodType } from '@/types/mood';

interface Props {
  selectedTags: MoodType[];
  onToggleTag: (mood: MoodType) => void;
}

export function MoodTagPills({ selectedTags, onToggleTag }: Props) {
  return (
    <View style={styles.container}>
      {MOOD_TYPES.map((mood) => (
        <View key={mood} style={styles.pill}>
          <Chip
            label={MOOD_LABELS[mood]}
            selected={selectedTags.includes(mood)}
            onPress={() => onToggleTag(mood)}
            backgroundColor={MoodColors[mood] + '40'}
            selectedBackgroundColor={MoodColors[mood]}
            size="small"
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pill: {
    marginBottom: Spacing.xs,
  },
});
