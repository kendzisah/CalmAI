import * as Notifications from 'expo-notifications';
import type { TonePref, TriggerTime } from '@/types/user';

interface ScheduleParams {
  hour: number;        // 0..23
  nickname: string | null;
  tonePref: TonePref | null;
}

const REMINDER_IDENTIFIER = 'calmai-daily-reminder';

/**
 * Configures how notifications behave when one arrives. Without this, foreground
 * notifications on iOS are silently swallowed (the system assumes you're
 * already showing the relevant content). Call once at app boot.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Returns whether the user has granted notification permission, without
 * prompting if not. Use this on screens that need to show the current state
 * (e.g. profile toggle).
 */
export async function getNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
}

function reminderText(nickname: string | null, tone: TonePref): string {
  const name = nickname ?? 'you';
  if (tone === 'real') return `Hey ${name}. Checking in. What's loud right now?`;
  if (tone === 'read_room') return `Hey ${name}. Up to you tonight.`;
  return `Hi ${name}. No pressure. I'm here if you want to talk.`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowSound: false,
      allowBadge: false,
    },
  });
  return result.granted;
}

export async function scheduleDailyReminder({ hour, nickname, tonePref }: ScheduleParams): Promise<void> {
  await cancelDailyReminder();

  const tone: TonePref = tonePref ?? 'gentle';

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: 'CalmAI',
      body: reminderText(nickname, tone),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  } catch {
    // No existing reminder to cancel — ignore.
  }
}

export function describeTriggerForUser(trigger: TriggerTime | null | undefined, hour: number): string | null {
  if (trigger === '2am_spirals') return `Suggested: ${formatHour(hour)} — when 2am spirals usually start.`;
  if (trigger === 'pre_sleep') return `Suggested: ${formatHour(hour)} — right before you wind down.`;
  if (trigger === 'sunday_scaries') return `Suggested: ${formatHour(hour)} — before Sunday hits.`;
  if (trigger === 'post_argument') return `Suggested: ${formatHour(hour)} — when the day catches up.`;
  return null;
}

function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? 'am' : 'pm';
  return `${h}${period}`;
}
