import { View, StyleSheet } from 'react-native';
import { MoodBubble } from './MoodBubble';
import { MOOD_TYPES, MoodType } from '@/types/mood';
import { Spacing } from '@/lib/constants';

interface Props {
  selectedMood?: MoodType;
  onSelectMood: (mood: MoodType) => void;
  bubbleSize?: number;
}

export function MoodGrid({ selectedMood, onSelectMood, bubbleSize = 56 }: Props) {
  // 3x4 grid: 4 moods per row, 3 rows
  const rows = [
    MOOD_TYPES.slice(0, 4),   // High-Anxiety: anxious, overwhelmed, stressed, restless
    MOOD_TYPES.slice(4, 8),   // Low-Energy: sad, irritable, lonely, numb
    MOOD_TYPES.slice(8, 12),  // Positive: calm, hopeful, happy, grateful
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((mood) => (
            <MoodBubble
              key={mood}
              mood={mood}
              selected={selectedMood === mood}
              onSelect={onSelectMood}
              size={bubbleSize}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: Spacing.md,
  },
});
