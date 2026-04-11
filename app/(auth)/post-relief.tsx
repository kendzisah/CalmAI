import { StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground } from '@/components/ui';
import { PostReliefCheck } from '@/components/onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Spacing } from '@/lib/constants';
import type { ReliefTag } from '@/types/user';

export default function PostReliefScreen() {
  const { setReliefTag, completeStep } = useOnboardingStore();

  const handleSelect = async (tag: ReliefTag) => {
    await setReliefTag(tag);
    await completeStep(5);
    router.push('/(auth)/sign-in');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <PostReliefCheck onSelect={handleSelect} />
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
});
