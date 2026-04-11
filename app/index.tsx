import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors } from '@/lib/constants';

export default function Index() {
  const { isComplete, isLoaded, load, completedStep } = useOnboardingStore();

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (isComplete) {
      router.replace('/(tabs)/home');
    } else if (completedStep > 0) {
      // Resume from last completed step
      const steps = ['welcome', 'mood-check', 'context', 'relief', 'post-relief', 'sign-in'];
      const resumeStep = steps[completedStep] || 'welcome';
      router.replace(`/(auth)/${resumeStep}`);
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
