import { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Button, Chip } from '@/components/ui';
import { MoodTrendChart } from '@/components/mood';
import { Colors, Spacing } from '@/lib/constants';
import { useMoodStore } from '@/stores/moodStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useJournalStore } from '@/stores/journalStore';
import { getGreeting } from '@/utils/dateHelpers';

export default function HomeScreen() {
  const { currentMood, todayCheckedIn, monthlyCount, recentEntries, loadRecent, checkIn, getTrendData, trendData } = useMoodStore();
  const { selectedMood: onboardingMood } = useOnboardingStore();
  const { lifetimeCount: journalCount } = useJournalStore();

  useEffect(() => {
    loadRecent();
    getTrendData(7);
  }, []);

  const isFirstVisit = recentEntries.length === 0;
  const greeting = isFirstVisit && onboardingMood
    ? `Welcome, let's ease that ${onboardingMood}`
    : getGreeting();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1">{greeting},{'\n'}you</Text>
          <Text variant="body" color={Colors.gray}>
            How is your sanctuary feeling today?
          </Text>
        </View>

        {/* Daily Check-In Card */}
        <Card style={styles.checkInCard}>
          <View style={styles.checkInRow}>
            <Text variant="bodyMedium">Take a moment to check in</Text>
            <Button title="Check In" variant="pill" onPress={() => {}} />
          </View>
        </Card>

        {/* Coping Tool Pills */}
        <View style={styles.pillRow}>
          <Chip
            label="Breathe"
            backgroundColor={Colors.lavenderLight}
            textColor={Colors.primaryDark}
            onPress={() => router.push('/breathe')}
          />
          <Chip
            label="Ground"
            backgroundColor={Colors.sageGreen}
            textColor={Colors.primaryDark}
            onPress={() => router.push('/ground')}
          />
          <Chip
            label="Reframe"
            backgroundColor={Colors.blushPink}
            textColor={Colors.primaryDark}
            onPress={() => router.push('/(tabs)/chat')}
          />
        </View>

        {/* Mood Trend */}
        <Card>
          <View style={styles.trendHeader}>
            <Text variant="bodyMedium">Mood Trend</Text>
            <Text variant="caption">7 days</Text>
          </View>
          <MoodTrendChart data={trendData.length > 0 ? trendData : []} width={300} height={120} />
        </Card>

        {/* Cumulative Counter */}
        <View style={styles.counterRow}>
          <Text variant="body" color={Colors.primaryDark}>
            You've checked in {monthlyCount} times this month
          </Text>
        </View>

        {/* Community Nudge */}
        <Text variant="caption" style={styles.nudge}>
          14 women are breathing with you right now
        </Text>

        {/* Session CTA */}
        <Card variant="elevated" style={styles.sessionCard}>
          <Text variant="label" color={Colors.gray}>Continue Session</Text>
          <Text variant="h2" style={styles.sessionTitle}>
            Dissolving{'\n'}Morning Anxiety
          </Text>
          <Text variant="caption">12 min - Ambient Rain</Text>
          <Button
            title="Resume Journey"
            onPress={() => router.push('/(tabs)/chat')}
            style={styles.sessionButton}
          />
        </Card>
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
    gap: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  checkInCard: {
    backgroundColor: Colors.surface,
  },
  checkInRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nudge: {
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  sessionTitle: {
    color: '#FFFFFF',
  },
  sessionButton: {
    backgroundColor: '#FFFFFF',
    marginTop: Spacing.sm,
  },
});
