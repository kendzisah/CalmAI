import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { Colors, MoodColors, Spacing } from '@/lib/constants';
import { MOOD_LABELS } from '@/types/mood';
import type { JournalEntry } from '@/types/journal';

interface Props {
  entries: JournalEntry[];
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function truncate(text: string, maxLength: number): string {
  const firstLine = text.split('\n')[0];
  if (firstLine.length <= maxLength) return firstLine;
  return firstLine.slice(0, maxLength).trimEnd() + '...';
}

function EntryRow({ entry }: { entry: JournalEntry }) {
  return (
    <View style={styles.row}>
      <Text variant="caption">{formatDate(entry.createdAt)}</Text>
      <Text variant="body" style={styles.preview} numberOfLines={1}>
        {truncate(entry.entryText, 60)}
      </Text>
      {entry.moodTags.length > 0 && (
        <View style={styles.tags}>
          {entry.moodTags.map((mood) => (
            <Chip
              key={mood}
              label={MOOD_LABELS[mood]}
              selected={false}
              backgroundColor={MoodColors[mood] + '40'}
              size="small"
            />
          ))}
        </View>
      )}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

export function EntryList({ entries }: Props) {
  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <EntryRow entry={item} />}
      ItemSeparatorComponent={Separator}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: Spacing.sm,
  },
  row: {
    paddingVertical: Spacing.base,
    gap: Spacing.xs,
  },
  preview: {
    marginTop: Spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.grayLavender,
    opacity: 0.5,
  },
});
