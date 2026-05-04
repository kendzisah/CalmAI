import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text, Card, Input, Button, Chip } from '@/components/ui';
import { Colors, Spacing, Radius, MoodColors } from '@/lib/constants';
import { MOOD_LABELS, MoodType } from '@/types/mood';
import { useJournalStore, getRandomPrompt } from '@/stores/journalStore';
import { usePaywall } from '@/hooks/usePaywall';
import { useSubscription } from '@/hooks/useSubscription';
import { fetchJournalPrompt } from '@/services/chatService';
import { useMoodStore } from '@/stores/moodStore';

const MOOD_TAG_SUBSET: MoodType[] = ['anxious', 'calm', 'overwhelmed', 'grateful'];

export default function JournalScreen() {
  const [entryText, setEntryText] = useState('');
  const [selectedTags, setSelectedTags] = useState<MoodType[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const {
    entries, currentPrompt, todayEntry, hasRefreshedPrompt,
    saveEntry, updateTodayEntry, loadEntries, loadTodayEntry,
    setPrompt, saveDailyPrompt, getDailyPrompt, deleteEntry,
    setHasRefreshedPrompt,
  } = useJournalStore();
  const { currentMood } = useMoodStore();
  const { guardJournal } = usePaywall();
  const { isPro } = useSubscription();

  useEffect(() => {
    loadEntries();
    initializeDailyPrompt();
    initializeTodayEntry();
  }, []);

  const initializeTodayEntry = async () => {
    const existing = await loadTodayEntry();
    if (existing) {
      setEntryText(existing.entryText);
      setSelectedTags(existing.moodTags);
    }
  };

  const initializeDailyPrompt = async () => {
    // Check if we already have a prompt saved for today
    const saved = await getDailyPrompt();
    if (saved) return; // Already have today's prompt

    // Generate a new one — seeded by most recent mood
    const mood = currentMood || undefined;
    const aiPrompt = await fetchJournalPrompt(mood);
    const prompt = aiPrompt
      ? { text: aiPrompt, mood, generatedAt: new Date().toISOString() }
      : getRandomPrompt();

    await saveDailyPrompt(prompt);
  };

  const handleRefreshPrompt = async () => {
    if (hasRefreshedPrompt) {
      Alert.alert("One per day", "You've already refreshed today's reflection. A new one will be here tomorrow.");
      return;
    }

    const mood = currentMood || undefined;
    const aiPrompt = await fetchJournalPrompt(mood);
    const prompt = aiPrompt
      ? { text: aiPrompt, mood, generatedAt: new Date().toISOString() }
      : getRandomPrompt();

    await saveDailyPrompt(prompt);
    setHasRefreshedPrompt(true);
  };

  const toggleTag = (mood: MoodType) => {
    setSelectedTags((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleSave = async () => {
    if (!entryText.trim()) return;
    const allowed = await guardJournal();
    if (!allowed) return;

    if (todayEntry) {
      // Update existing entry for today
      await updateTodayEntry(entryText, selectedTags);
    } else {
      // Create new entry
      await saveEntry(entryText, selectedTags, currentPrompt?.text, !!currentPrompt);
    }
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteEntry(id);
          // If we deleted today's entry, clear the form
          if (todayEntry?.id === id) {
            setEntryText('');
            setSelectedTags([]);
          }
        },
      },
    ]);
  };

  const hasTodayEntry = !!todayEntry;

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
          <Text variant="h1">Your Space</Text>
          <Text variant="body" color={Colors.gray}>
            Dump your thoughts here. No filter needed.
          </Text>
        </View>

        {/* Daily Reflection Card */}
        <Card style={styles.promptCard}>
          <View style={styles.promptLabel}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill={Colors.primary} />
            </Svg>
            <Text variant="label" color={Colors.primary}>Today's Reflection</Text>
          </View>
          <Text variant="h2" style={styles.promptText}>
            {`"${currentPrompt?.text || 'What made you feel safe today?'}"`}
          </Text>
          {isPro && !hasRefreshedPrompt && !hasTodayEntry && (
            <Pressable onPress={handleRefreshPrompt} style={styles.refreshButton}>
              <Text variant="small" color={Colors.primary}>Give me a different one</Text>
            </Pressable>
          )}
        </Card>

        {/* Entry Area */}
        <View style={styles.entryArea}>
          <Input
            multiline
            placeholder="Give form to your thoughts..."
            value={entryText}
            onChangeText={setEntryText}
            style={styles.entryInput}
          />
          <View style={styles.listeningRow}>
            <View style={styles.listeningDot} />
            <Text variant="small" color={Colors.gray}>This stays between us</Text>
          </View>
        </View>

        {/* Mood Tags */}
        <View style={styles.tagsSection}>
          <Text variant="label" color={Colors.gray}>Tag your mood</Text>
          <View style={styles.tagsRow}>
            {MOOD_TAG_SUBSET.map((mood) => (
              <Chip
                key={mood}
                label={MOOD_LABELS[mood]}
                selected={selectedTags.includes(mood)}
                backgroundColor={MoodColors[mood] + '40'}
                selectedBackgroundColor={Colors.primary}
                textColor={Colors.primaryDark}
                selectedTextColor="#FFFFFF"
                onPress={() => toggleTag(mood)}
              />
            ))}
          </View>
        </View>

        {/* Save / Update Button */}
        <Button
          title={hasTodayEntry ? 'Update Reflection' : 'Save Reflection'}
          onPress={handleSave}
          disabled={!entryText.trim()}
        />

        {/* Past Entries */}
        {entries.length > 0 && (
          <View style={styles.historySection}>
            <Pressable
              style={styles.historyToggle}
              onPress={() => setShowHistory(!showHistory)}
            >
              <Text variant="bodyMedium">Past Entries</Text>
              <Text variant="caption" color={Colors.primary}>
                {showHistory ? 'Hide' : `Show (${entries.length})`}
              </Text>
            </Pressable>

            {showHistory && entries.map((entry) => (
              <Pressable
                key={entry.id}
                style={styles.historyEntry}
                onLongPress={() => handleDeleteEntry(entry.id)}
              >
                <View style={styles.historyHeader}>
                  <Text variant="small" color={Colors.gray}>
                    {new Date(entry.createdAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </Text>
                  {entry.moodTags.length > 0 && (
                    <View style={styles.historyTags}>
                      {entry.moodTags.map((tag) => (
                        <View key={tag} style={[styles.historyTag, { backgroundColor: MoodColors[tag] || Colors.grayLavender }]}>
                          <Text variant="small" color={Colors.primaryDark}>{MOOD_LABELS[tag]}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                {entry.promptText && (
                  <Text variant="small" color={Colors.gray} style={{ fontStyle: 'italic' }}>
                    "{entry.promptText}"
                  </Text>
                )}
                <Text variant="body" numberOfLines={3}>{entry.entryText}</Text>
              </Pressable>
            ))}
          </View>
        )}
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
  refreshButton: {
    alignSelf: 'flex-end',
    paddingTop: Spacing.xs,
  },
  entryArea: {
    gap: Spacing.sm,
  },
  entryInput: {
    height: 160,
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
  historySection: {
    gap: Spacing.md,
  },
  historyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyEntry: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTags: {
    flexDirection: 'row',
    gap: 4,
  },
  historyTag: {
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
});
