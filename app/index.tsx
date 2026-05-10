import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors } from '@/lib/constants';

// Index 0 unused; aligns to onboarding step numbering.
const STEP_TO_ROUTE: (string | null)[] = [
  null,
  'welcome',     // 1
  'preframe-1',  // 2
  'preframe-2',  // 3
  'nickname',    // 4
  'loud',        // 5
  'timing',      // 6
  'coping',      // 7
  'tone',        // 8
  'confirm',     // 9
  'proof',       // 10
  'sign-in',     // 11
  'paywall-soft',// 12
  'notify',      // 14 (Step B paywall lives at /paywall, not in (auth))
];

export default function Index() {
  const { isComplete, isLoaded, load, completedStep } = useOnboardingStore();

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isComplete) {
      router.replace('/(tabs)/home');
      return;
    }

    if (completedStep > 0) {
      const nextStep = Math.min(completedStep + 1, STEP_TO_ROUTE.length - 1);
      const route = STEP_TO_ROUTE[nextStep] ?? 'welcome';
      router.replace(`/(auth)/${route}` as never);
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [isLoaded, isComplete, completedStep]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}
