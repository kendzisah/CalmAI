import { Stack } from 'expo-router';
import { ThemeProvider } from '@/theme';

export default function AuthLayout() {
  // Onboarding always renders in the light theme — its lavender/cream
  // gradient backgrounds are core to the brand and don't invert well.
  // The nested ThemeProvider overrides whatever the user has set globally.
  return (
    <ThemeProvider force="light">
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="preframe-1" />
        <Stack.Screen name="preframe-2" />
        <Stack.Screen name="nickname" />
        <Stack.Screen name="loud" />
        <Stack.Screen name="timing" />
        <Stack.Screen name="coping" />
        <Stack.Screen name="tone" />
        <Stack.Screen name="confirm" />
        <Stack.Screen name="proof" />
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="paywall-soft" />
        <Stack.Screen name="notify" />
      </Stack>
    </ThemeProvider>
  );
}
