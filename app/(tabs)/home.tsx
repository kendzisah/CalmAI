import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Button, Chip } from '@/components/ui';
import { MoodTrendChart } from '@/components/mood';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { useThemeColors } from '@/theme';
import { useMoodStore } from '@/stores/moodStore';
import { MoodGrid } from '@/components/mood';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useChatStore } from '@/stores/chatStore';
import { getGreeting } from '@/utils/dateHelpers';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const colors = useThemeColors();
  const { currentMood, todayCheckedIn, monthlyCount, recentEntries, loadRecent, checkIn, getTrendData, trendData } = useMoodStore();
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedCheckInMood, setSelectedCheckInMood] = useState<import('@/types/mood').MoodType | undefined>();
  const { selectedMood: onboardingMood, nickname } = useOnboardingStore();
  const { currentSession, messages } = useChatStore();
  const [weeklyInsight, setWeeklyInsight] = useState<string | null>(null);

  useEffect(() => {
    loadRecent();
    getTrendData(7);
    fetchWeeklyInsight();
  }, []);

  const fetchWeeklyInsight = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      const res = await fetch(`${url}/functions/v1/weekly-insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insight) setWeeklyInsight(data.insight);
      }
    } catch {
      // Non-critical
    }
  };

  const isFirstVisit = recentEntries.length === 0;
  const greeting = isFirstVisit && onboardingMood
    ? `Welcome, let's ease that ${onboardingMood}`
    : getGreeting();

  const hasActiveSession = currentSession && messages.length > 0;
  const lastAiMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1">{greeting},{'\n'}{nickname || 'you'}</Text>
          <Text variant="body" color={colors.textMuted}>
            Let's check in with yourself today
          </Text>
        </View>

        {/* Daily Check-In Card */}
        <Card>
          {todayCheckedIn ? (
            <View style={styles.checkInRow}>
              <Text variant="bodyMedium">You showed up today</Text>
            </View>
          ) : showCheckIn ? (
            <View style={styles.checkInExpanded}>
              <Text variant="bodyMedium">How are you really doing?</Text>
              <MoodGrid
                selectedMood={selectedCheckInMood}
                onSelectMood={async (mood) => {
                  setSelectedCheckInMood(mood);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  await checkIn(mood, 3, undefined, 'check_in');
                  setShowCheckIn(false);
                  setSelectedCheckInMood(undefined);
                  getTrendData(7);
                }}
              />
            </View>
          ) : (
            <View style={styles.checkInRow}>
              <Text variant="bodyMedium">How are you really doing?</Text>
              <Button title="Check In" variant="pill" onPress={() => setShowCheckIn(true)} />
            </View>
          )}
        </Card>

        {/* Coping Tool Pills — keep brand-tinted backgrounds in both themes;
            text always uses brand-dark for legibility on those pastel chips. */}
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

        {/* Weekly Insight */}
        {weeklyInsight && (
          <Card style={{ backgroundColor: colors.surfaceMuted, gap: Spacing.sm }}>
            <Text variant="label" color={colors.primary}>Weekly Insight</Text>
            <Text variant="body">{weeklyInsight}</Text>
          </Card>
        )}

        {/* Cumulative Counter */}
        <View style={styles.counterRow}>
          <Text variant="body">
            You've checked in {monthlyCount} times this month
          </Text>
        </View>

        {/* Community Nudge */}
        <Text variant="caption" style={styles.nudge}>
          You're not alone in this — others are on their healing journey, too
        </Text>

        {/* Session CTA — only show if there's an active session */}
        {hasActiveSession && lastAiMessage && (
          <Card variant="elevated" style={[styles.sessionCard, { backgroundColor: colors.primary }]}>
            <Text variant="label" color="rgba(255,255,255,0.7)">Continue Conversation</Text>
            <Text variant="bodyMedium" style={styles.sessionPreview} numberOfLines={2}>
              {lastAiMessage.content}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/chat')}
              style={styles.sessionButton}
            >
              <Text variant="bodyMedium" color={colors.primary}>Continue</Text>
            </Pressable>
          </Card>
        )}

        {/* Quick start CTA if no active session */}
        {!hasActiveSession && (
          <Card variant="elevated" style={[styles.sessionCard, { backgroundColor: colors.primary }]}>
            <Text variant="label" color="rgba(255,255,255,0.7)">Talk to CalmAI</Text>
            <Text variant="h2" style={styles.sessionTitle}>
              Need to{'\n'}Talk It Out?
            </Text>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
              No judgment, just a safe space
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/chat')}
              style={styles.sessionButton}
            >
              <Text variant="bodyMedium" color={colors.primary}>Start Chatting</Text>
            </Pressable>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  checkInExpanded: {
    gap: Spacing.md,
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
    gap: Spacing.sm,
  },
  sessionTitle: {
    color: '#FFFFFF',
  },
  sessionPreview: {
    color: '#FFFFFF',
  },
  sessionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
});
