import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import type { TonePref, TriggerTime } from '@/types/user';

interface RegisterParams {
  hour: number;        // 0..23 in the user's local timezone
  nickname: string | null;
  tonePref: TonePref | null;
}

/**
 * Configures how notifications behave when one arrives. Without this, foreground
 * notifications on iOS are silently swallowed (the system assumes you are
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

export async function getNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
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

function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

async function fetchExpoPushToken(): Promise<string | null> {
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    return tokenResponse.data ?? null;
  } catch {
    return null;
  }
}

/**
 * Registers the device for server-driven daily push notifications.
 *
 * Captures the Expo push token and the device timezone, writes both onto
 * the user's row in public.users along with the chosen hour. The Supabase
 * cron job 'daily-openers' uses these to deliver one push per day at the
 * user's local hour.
 *
 * Returns false if permission was denied or the token call failed.
 */
export async function registerForServerPush({ hour }: RegisterParams): Promise<boolean> {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // Android needs a notification channel before push will surface a banner.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily check-in',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
    });
  }

  const token = await fetchExpoPushToken();
  if (!token) return false;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    // No authed user. The token will be persisted on next sign-in if the
    // caller re-runs registration after auth completes.
    return false;
  }

  const timezone = deviceTimezone();

  const { error } = await supabase
    .from('users')
    .update({
      expo_push_token: token,
      timezone,
      notification_hour: hour,
      notifications_enabled: true,
    })
    .eq('id', session.user.id);

  return !error;
}

/**
 * Disables server-driven daily push for the current user. Clears the
 * notification_hour flag and toggles notifications_enabled off. The cron
 * job filters on notifications_enabled, so the user stops receiving pushes
 * immediately on the next hourly tick.
 */
export async function unregisterFromServerPush(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  await supabase
    .from('users')
    .update({
      notifications_enabled: false,
    })
    .eq('id', session.user.id);
}

export function describeTriggerForUser(trigger: TriggerTime | null | undefined, hour: number): string | null {
  if (trigger === '2am_spirals') return `Suggested: ${formatHour(hour)}, when 2am spirals usually start.`;
  if (trigger === 'pre_sleep') return `Suggested: ${formatHour(hour)}, right before you wind down.`;
  if (trigger === 'sunday_scaries') return `Suggested: ${formatHour(hour)}, before Sunday hits.`;
  if (trigger === 'post_argument') return `Suggested: ${formatHour(hour)}, when the day catches up.`;
  return null;
}

function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const period = hour < 12 ? 'am' : 'pm';
  return `${h}${period}`;
}
