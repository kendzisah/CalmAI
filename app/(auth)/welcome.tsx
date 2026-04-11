import { router } from 'expo-router';
import { GradientBackground } from '@/components/ui';
import { WelcomeBreath } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function WelcomeScreen() {
  const { completeStep } = useOnboardingStore();

  const handleReady = async () => {
    await completeStep(1);
    router.push('/(auth)/mood-check');
  };

  return (
    <GradientBackground variant="onboarding">
      <WelcomeBreath onReady={handleReady} />
    </GradientBackground>
  );
}
