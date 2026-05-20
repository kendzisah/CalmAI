import { useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button } from '@/components/ui';
import { ChatMockup } from '@/components/onboarding/ChatMockup';
import { TestimonialPull } from '@/components/onboarding/TestimonialPull';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';
import { MOCKUPS, selectMockup } from '@/data/proofMockups';
import { pickTestimonial } from '@/data/testimonials';
import type { TonePref } from '@/types/user';

export default function ProofScreen() {
  const {
    nickname,
    loudCategories,
    triggerTimes,
    tonePref,
    completeStep,
  } = useOnboardingStore();

  const mockupId = useMemo(
    () => selectMockup({ loudCategories, triggerTimes }),
    [loudCategories, triggerTimes]
  );
  const tone: TonePref = tonePref ?? 'gentle';
  const mockup = MOCKUPS[mockupId];
  const testimonial = useMemo(() => pickTestimonial(), []);

  const displayName = nickname ?? 'you';

  useEffect(() => {
    track('onboarding_proof_viewed', {
      mockup_id: mockupId,
      tone_used: tone,
      testimonial_id: testimonial.id,
    });
  }, [mockupId, tone, testimonial.id]);

  const handleNext = async () => {
    track('onboarding_proof_cta_tapped', {
      mockup_id: mockupId,
      tone_used: tone,
      testimonial_id: testimonial.id,
    });
    await completeStep(10);
    router.push('/(auth)/sign-in');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="caption" color={Colors.primaryDark} style={styles.eyebrow}>
            Here's what tonight could look like —
          </Text>

          <ChatMockup
            userMessage={mockup.user}
            aiMessage={mockup.responses[tone]}
            timestampLabel={`${displayName} · just now`}
          />

          <TestimonialPull testimonial={testimonial} />
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Try it free" onPress={handleNext} />
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.base,
  },
  eyebrow: {
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
