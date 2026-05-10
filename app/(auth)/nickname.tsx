import { useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GradientBackground, Text, Button, Input } from '@/components/ui';
import { ProgressDots } from '@/components/onboarding/ProgressDots';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing } from '@/lib/constants';
import { track } from '@/lib/analytics';

const RESERVED = new Set(['admin', 'moderator', 'calmai', 'mod', 'support']);
const VALID_PATTERN = /^[a-zA-Z0-9-]+$/;

export default function NicknameScreen() {
  const { setNickname, completeStep } = useOnboardingStore();
  const [value, setValue] = useState('');

  useEffect(() => {
    track('onboarding_nickname_viewed');
  }, []);

  const trimmed = value.trim();
  const isValid =
    trimmed.length >= 1 &&
    trimmed.length <= 20 &&
    VALID_PATTERN.test(trimmed) &&
    !RESERVED.has(trimmed.toLowerCase());

  const handleContinue = async () => {
    if (!isValid) return;
    await setNickname(trimmed);
    track('onboarding_nickname_submitted', { nickname_length: trimmed.length });
    await completeStep(4);
    router.push('/(auth)/loud');
  };

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <View style={styles.progressWrap}>
            <ProgressDots current={1} total={5} />
          </View>

          <View style={styles.center}>
            <Text variant="h1" style={styles.headline}>
              What should I call you?
            </Text>
            <Text variant="body" color={Colors.gray} style={styles.subtitle}>
              Stays anonymous. Never shared.
            </Text>

            <Input
              placeholder="e.g., Sarah, SJ, you"
              value={value}
              onChangeText={setValue}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={20}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          <View style={styles.footer}>
            <Button title="Let's go" onPress={handleContinue} disabled={!isValid} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.lg },
  flex: { flex: 1 },
  progressWrap: { alignItems: 'center', paddingTop: Spacing.lg },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.base,
  },
  headline: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  input: {
    marginTop: Spacing.base,
    backgroundColor: Colors.surface,
    textAlign: 'center',
    fontSize: 18,
  },
  footer: {
    paddingBottom: Spacing.xl,
    alignItems: 'stretch',
  },
});
