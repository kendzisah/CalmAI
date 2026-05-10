import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { configurePurchases } from '@/lib/purchases';
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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
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
    }
  }, [fontsLoaded]);

  // RevenueCat initialization (no-op + warn if key is missing).
  useEffect(() => {
    configurePurchases(process.env.EXPO_PUBLIC_REVENUECAT_KEY);
  }, []);

  // Sync queue processing on app foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        processSyncQueue().catch(() => {});
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    // Also sync on initial load
    processSyncQueue().catch(() => {});
    return () => sub.remove();
  }, []);

  // When the user taps the daily reminder notification (whether the app was
  // backgrounded or fully closed), open the chat tab so they land on the
  // conversation surface — that's the call-to-action of the reminder copy.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.replace('/(tabs)/chat');
    });

    // Cold-start case: the app was launched from a tap on the notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) router.replace('/(tabs)/chat');
    });

    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
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
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
            </Stack>
            {/* Default to dark status text — correct for the light onboarding,
                paywall, and breathing screens. The (tabs) layout overrides this
                with a theme-aware StatusBar so dark-mode tabs get light status. */}
            <StatusBar style="dark" />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
