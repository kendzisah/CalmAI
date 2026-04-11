import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text, Card, Input, Button, Chip } from '@/components/ui';
import { Colors, Spacing, Radius, MoodColors } from '@/lib/constants';
import { MOOD_TYPES, MOOD_LABELS, MoodType } from '@/types/mood';
import { useJournalStore, getRandomPrompt } from '@/stores/journalStore';
import { usePaywall } from '@/hooks/usePaywall';

const MOOD_TAG_SUBSET: MoodType[] = ['anxious', 'calm', 'overwhelmed', 'grateful'];

export default function JournalScreen() {
  const [entryText, setEntryText] = useState('');
  const [selectedTags, setSelectedTags] = useState<MoodType[]>([]);
  const { saveEntry, currentPrompt, setPrompt, loadEntries } = useJournalStore();
  const { guardJournal } = usePaywall();

  useEffect(() => {
    loadEntries();
    if (!currentPrompt) {
      setPrompt(getRandomPrompt());
    }
  }, []);

  const toggleTag = (mood: MoodType) => {
    setSelectedTags((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.avatarCircle}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth={2} />
                <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth={2} />
              </Svg>
            </View>
            <Text variant="small" color={Colors.gray}>CalmAI</Text>
          </View>
          <Text variant="h1">Daily Reflection</Text>
          <Text variant="body" color={Colors.gray}>
            Take a moment to center yourself and capture your thoughts.
          </Text>
        </View>

        {/* Gentle Prompt Card */}
        <Card style={styles.promptCard}>
          <View style={styles.promptLabel}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill={Colors.primary} />
            </Svg>
            <Text variant="label" color={Colors.primary}>Gentle Prompt</Text>
          </View>
          <Text variant="h2" style={styles.promptText}>
            {`"${currentPrompt?.text || 'What made you feel safe today?'}"`}
          </Text>
        </Card>

        {/* Entry Area */}
        <View style={styles.entryArea}>
          <Input
            multiline
            placeholder="Start typing your heart out..."
            value={entryText}
            onChangeText={setEntryText}
            style={styles.entryInput}
          />
          <View style={styles.listeningRow}>
            <View style={styles.listeningDot} />
            <Text variant="small" color={Colors.gray}>Deep listening active...</Text>
          </View>
        </View>

        {/* Mood Tags */}
        <View style={styles.tagsSection}>
          <Text variant="label" color={Colors.gray}>How are you feeling?</Text>
          <View style={styles.tagsRow}>
            {MOOD_TAG_SUBSET.map((mood) => (
              <Chip
                key={mood}
                label={MOOD_LABELS[mood]}
                selected={selectedTags.includes(mood)}
                backgroundColor={MoodColors[mood]}
                selectedBackgroundColor={MoodColors[mood]}
                textColor={Colors.primaryDark}
                selectedTextColor={Colors.primaryDark}
                onPress={() => toggleTag(mood)}
              />
            ))}
          </View>
        </View>

        {/* Save Button */}
        <Button
          title="Save Reflection"
          onPress={async () => {
            if (!entryText.trim()) return;
            const allowed = await guardJournal();
            if (!allowed) return;
            await saveEntry(entryText, selectedTags, currentPrompt?.text, !!currentPrompt);
            setEntryText('');
            setSelectedTags([]);
            setPrompt(getRandomPrompt());
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptCard: {
    backgroundColor: '#F5F0FF',
    gap: Spacing.sm,
  },
  promptLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  promptText: {
    fontStyle: 'italic',
  },
  entryArea: {
    gap: Spacing.sm,
  },
  entryInput: {
    minHeight: 140,
    backgroundColor: Colors.blushPink + '30',
  },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  listeningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  tagsSection: {
    gap: Spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
