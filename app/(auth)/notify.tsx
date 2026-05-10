import { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';
import {
  requestNotificationPermission,
  scheduleDailyReminder,
  describeTriggerForUser,
} from '@/lib/notifications';

export default function NotifyScreen() {
  const {
    nickname,
    tonePref,
    triggerTimes,
    suggestedNotificationHour,
    setNotificationsEnabled,
    completeStep,
    finish,
    isComplete,
  } = useOnboardingStore();

  const hour = suggestedNotificationHour ?? 21; // 9pm if no signal
  const primaryTrigger = triggerTimes[0];
  const suggestion = describeTriggerForUser(primaryTrigger, hour);

  useEffect(() => {
    track('notify_viewed');
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      try {
        await scheduleDailyReminder({ hour, nickname, tonePref });
        await setNotificationsEnabled(true);
        track('notify_granted', { hour });
      } catch (err: any) {
        track('notify_failed', { error: err?.message });
      }
    } else {
      track('notify_denied');
    }
    await leave();
  };

  const handleSkip = async () => {
    track('notify_skipped');
    await leave();
  };

  const leave = async () => {
    await completeStep(14);
    if (!isComplete) await finish();
    router.replace('/(tabs)/home');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text variant="h1" style={styles.headline}>
            One last thing. Want me to check in?
          </Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            I'll send a quiet hi at the time you said it usually hits. No pressure.
          </Text>
          {suggestion ? (
            <Text variant="caption" color={Colors.primary} style={styles.suggestion}>
              {suggestion}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Button title="Yes please" onPress={handleEnable} />
          <Pressable onPress={handleSkip} style={styles.secondary}>
            <Text variant="body" color={Colors.gray}>Maybe later</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.base,
  },
  headline: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  suggestion: { textAlign: 'center', marginTop: Spacing.sm },
  footer: {
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  secondary: { padding: Spacing.sm },
});
