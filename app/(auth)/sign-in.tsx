import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text, Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing, Radius } from '@/lib/constants';

export default function SignInScreen() {
  const { completeStep, finish } = useOnboardingStore();

  const handleAppleSignIn = async () => {
    // TODO: Implement Apple Sign-In via Supabase
    await completeStep(6);
    await finish();
    router.replace('/(tabs)/home');
  };

  const handleGoogleSignIn = async () => {
    // TODO: Implement Google Sign-In via Supabase
    await completeStep(6);
    await finish();
    router.replace('/(tabs)/home');
  };

  const handleEmailSignIn = async () => {
    // TODO: Show email/password form
    await completeStep(6);
    await finish();
    router.replace('/(tabs)/home');
  };

  const handleSkip = async () => {
    // TODO: Create anonymous Supabase user
    await completeStep(6);
    await finish();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="h1" style={styles.title}>Save your progress</Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            So you can pick up right where you left off.
          </Text>
        </View>

        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <Pressable style={[styles.socialButton, styles.appleButton]} onPress={handleAppleSignIn}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </Svg>
              <Text variant="bodyMedium" style={{ color: '#FFFFFF' }}>Continue with Apple</Text>
            </Pressable>
          )}

          <Pressable style={[styles.socialButton, styles.googleButton]} onPress={handleGoogleSignIn}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </Svg>
            <Text variant="bodyMedium" color={Colors.primaryDark}>Continue with Google</Text>
          </Pressable>

          <Pressable style={[styles.socialButton, styles.emailButton]} onPress={handleEmailSignIn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect x="2" y="4" width="20" height="16" rx="2" stroke={Colors.primary} strokeWidth={2} />
              <Path d="M2 4l10 8 10-8" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text variant="bodyMedium" color={Colors.primary}>Sign up with email</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleSkip} style={styles.skipButton}>
          <Text variant="body" color={Colors.gray}>Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  buttons: {
    gap: Spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  appleButton: {
    backgroundColor: '#000000',
  },
  googleButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  skipButton: {
    alignSelf: 'center',
    padding: Spacing.sm,
  },
});
