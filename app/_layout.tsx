import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Purchases from 'react-native-purchases';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { configurePurchases, isPurchasesReady } from '@/lib/purchases';
import { initAppsFlyer, getAppsFlyerUID, setPostHogClient, track, captureException } from '@/lib/analytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { processSyncQueue } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { ThemeProvider } from '@/theme';
import { configureNotificationHandler } from '@/lib/notifications';

// Configure how notifications behave when received — must be set BEFORE any
// notification could fire. Module-scope so it runs once at app boot, not per
// render of the root component.
configureNotificationHandler();

// Capture app start before any heavy work so app_start_complete reflects the
// real time-to-interactive (fonts loaded + splash hidden).
const APP_START_TIME = Date.now();

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// Pulls the live PostHog client out of the React provider and hands it to
// the analytics module so non-React call sites (lib/, hooks/) can capture
// without rewriting to use React hooks.
function PostHogBridge({ children }: { children: React.ReactNode }) {
  const ph = usePostHog();
  useEffect(() => {
    setPostHogClient(ph ?? null);
    return () => setPostHogClient(null);
  }, [ph]);
  return <>{children}</>;
}

function RootLayout() {
  // Initialize auth state globally so it's always available
  useAuth();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      track('app_start_complete', { total_ms: Date.now() - APP_START_TIME });
    }
  }, [fontsLoaded]);

  // RevenueCat initialization (no-op + warn if key is missing).
  useEffect(() => {
    try {
      configurePurchases(process.env.EXPO_PUBLIC_REVENUECAT_KEY);
    } catch (err) {
      captureException(err, { feature: 'purchases_init' });
    }
  }, []);

  // AppsFlyer init + RevenueCat ↔ AppsFlyer link. The $appsflyerId attribute
  // lets RC's server-side AppsFlyer integration post subscription events
  // (renewals, refunds, late conversions) against the same install — which the
  // client-side af_subscribe / af_start_trial in useSubscription.ts can't see
  // once the app is closed.
  useEffect(() => {
    initAppsFlyer(
      process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY,
      process.env.EXPO_PUBLIC_APPSFLYER_APP_ID
    );
    // initSdk is callback-based; give it a tick to populate the UID. If the
    // key isn't set or we're not on iOS, getAppsFlyerUID returns null and the
    // setAttributes call below is skipped.
    const linkTimer = setTimeout(async () => {
      const afUid = await getAppsFlyerUID();
      if (afUid && isPurchasesReady()) {
        try {
          Purchases.setAttributes({ '$appsflyerId': afUid });
        } catch (err) {
          if (__DEV__) console.warn('[analytics] setAttributes failed', err);
          captureException(err, { feature: 'appsflyer_rc_link' });
        }
      }
    }, 1500);
    return () => clearTimeout(linkTimer);
  }, []);

  // Sync queue processing on app foreground + session_started on resume.
  // A foreground after >30s in background counts as a new session for
  // retention math. Short app-switches (Apple/Pay, push interactions) shouldn't
  // inflate D1/D7 numbers.
  useEffect(() => {
    let lastBackgroundedAt: number | null = null;
    const SESSION_GAP_MS = 30_000;

    const handleAppState = (state: AppStateStatus) => {
      if (state === 'background' || state === 'inactive') {
        lastBackgroundedAt = Date.now();
      } else if (state === 'active') {
        if (lastBackgroundedAt !== null) {
          const gap = Date.now() - lastBackgroundedAt;
          if (gap > SESSION_GAP_MS) {
            track('session_started', { away_ms: gap, trigger: 'foreground' });
          }
          lastBackgroundedAt = null;
        }
        processSyncQueue().catch((err) => {
          captureException(err, { feature: 'sync_queue' });
        });
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    // Also sync on initial load
    processSyncQueue().catch((err) => {
      captureException(err, { feature: 'sync_queue_initial' });
    });
    return () => sub.remove();
  }, []);

  // When the user taps the daily reminder notification (whether the app was
  // backgrounded or fully closed), open the chat tab so they land on the
  // conversation surface — that's the call-to-action of the reminder copy.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      track('notification_tapped', { source: 'foreground' });
      router.replace('/(tabs)/chat');
    });

    // Cold-start case: the app was launched from a tap on the notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        track('notification_tapped', { source: 'cold_start' });
        router.replace('/(tabs)/chat');
      }
    });

    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const appTree = (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="breathe"
                  options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name="ground"
                  options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
                />
                <Stack.Screen
                  name="paywall"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'slide_from_bottom',
                    // Disable swipe-down dismissal at the navigator level. The
                    // paywall.tsx screen itself decides whether to render a close
                    // button based on isPro, so a Pro user can still leave via
                    // explicit dismiss; a non-Pro user has no exit.
                    gestureEnabled: false,
                  }}
                />
              </Stack>
              {/* Default to dark status text — correct for the light onboarding,
                  paywall, and breathing screens. The (tabs) layout overrides this
                  with a theme-aware StatusBar so dark-mode tabs get light status. */}
              <StatusBar style="dark" />
            </QueryClientProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );

  // PostHog wraps the entire app so autocapture (taps, screen views) sees
  // every interaction. Without a key, fall through to the bare tree — PostHog
  // is optional infrastructure, not a hard dependency.
  if (!POSTHOG_API_KEY) return appTree;

  return (
    <PostHogProvider
      apiKey={POSTHOG_API_KEY}
      options={{
        host: POSTHOG_HOST,
        // Background/foreground + app-installed/updated events. Free funnel
        // anchors that PostHog auto-emits as $app_opened / $app_backgrounded.
        captureAppLifecycleEvents: true,
        // Persist anonymous distinct_id across launches so onboarding events
        // collected before sign-in stitch to the user when identify() fires.
        enablePersistSessionIdAcrossRestart: true,
      }}
      autocapture={{
        // Tap-target capture is opt-out at the prop level if it gets noisy;
        // for v1 we want everything so feature-interaction questions are
        // answerable without code changes. Lifecycle events are covered by
        // options.captureAppLifecycleEvents above.
        captureTouches: true,
        captureScreens: true,
      }}
    >
      <PostHogBridge>{appTree}</PostHogBridge>
    </PostHogProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootLayout;
