import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Platform, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';
import { Text, Button } from '@/components/ui';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { track, identify } from '@/lib/analytics';

const RELAY_DOMAIN = '@privaterelay.appleid.com';

export default function SignInScreen() {
  const { completeStep, setEmailIsRelay } = useOnboardingStore();
  const { signInWithApple, signInWithEmail, signUpWithEmail } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    track('signin_viewed');
  }, []);

  const completeSignIn = async (method: 'apple' | 'email') => {
    const { data: { session } } = await supabase.auth.getSession();
    const userEmail = session?.user?.email ?? '';
    const isRelay = userEmail.endsWith(RELAY_DOMAIN);

    if (isRelay) await setEmailIsRelay(true);

    if (session?.user?.id) identify(session.user.id, { signin_method: method, email_is_relay: isRelay });

    track('signin_completed', { method, email_is_relay: isRelay });
    await completeStep(11);
    router.replace('/(auth)/paywall-soft');
  };

  const handleAppleSignIn = async () => {
    track('signin_method_selected', { method: 'apple' });
    try {
      setIsLoading(true);
      await signInWithApple();
      await completeSignIn('apple');
    } catch (err: any) {
      track('signin_failed', { method: 'apple', error: err?.code ?? err?.message });
      Alert.alert('Sign In Failed', err.message || 'Could not sign in with Apple. Please try another method.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    track('signin_method_selected', { method: 'email', mode: isSignUpMode ? 'signup' : 'signin' });
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    if (passwordInput.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setIsLoading(true);

      if (isSignUpMode) {
        await signUpWithEmail(emailInput.trim(), passwordInput);
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await completeSignIn('email');
        } else {
          Alert.alert(
            'Check Your Email',
            'We sent you a confirmation link. Tap it and then come back to sign in.',
            [{ text: 'OK' }]
          );
        }
      } else {
        await signInWithEmail(emailInput.trim(), passwordInput);
        await completeSignIn('email');
      }
    } catch (err: any) {
      // Diagnostic — surface the full error shape so we can identify the actual cause
      // of "Auth session missing!" and similar opaque messages. Remove once the bug
      // is resolved.
      console.error(
        '[email auth] Full error object:',
        JSON.stringify(
          {
            name: err?.name,
            code: err?.code,
            status: err?.status,
            statusCode: err?.statusCode,
            message: err?.message,
            stack: err?.stack,
          },
          null,
          2
        )
      );
      track('signin_failed', { method: 'email', error: err?.code ?? err?.message });
      Alert.alert(
        isSignUpMode ? 'Sign Up Failed' : 'Sign In Failed',
        err.message || 'Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text variant="h1" style={styles.title}>Save your progress.</Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            You've shared a lot. Let's make sure none of it disappears.
          </Text>
        </View>

        <View style={styles.buttons}>
          {Platform.OS === 'ios' && (
            <Pressable style={[styles.socialButton, styles.appleButton]} onPress={handleAppleSignIn} disabled={isLoading}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="#FFFFFF">
                <Path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </Svg>
              <Text variant="bodyMedium" style={{ color: '#FFFFFF' }}>Continue with Apple</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.socialButton, styles.emailButton]}
            onPress={() => { setShowEmailForm(!showEmailForm); setIsSignUpMode(true); }}
            disabled={isLoading}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect x="2" y="4" width="20" height="16" rx="2" stroke={Colors.primary} strokeWidth={2} />
              <Path d="M2 4l10 8 10-8" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text variant="bodyMedium" color={Colors.primary}>
              {isSignUpMode ? 'Sign up with email' : 'Sign in with email'}
            </Text>
          </Pressable>

          {showEmailForm && (
            <View style={styles.emailForm}>
              <TextInput
                style={styles.emailInput}
                placeholder="Email"
                placeholderTextColor={Colors.gray}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.emailInput}
                placeholder="Password"
                placeholderTextColor={Colors.gray}
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry
              />
              <Button
                title={isLoading ? 'Working...' : (isSignUpMode ? 'Create Account' : 'Sign In')}
                onPress={handleEmailSubmit}
                disabled={isLoading}
              />
              <Pressable
                onPress={() => setIsSignUpMode(!isSignUpMode)}
                style={styles.toggleMode}
              >
                <Text variant="body" color={Colors.primary}>
                  {isSignUpMode ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <Text variant="small" color={Colors.gray} style={styles.legal}>
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
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
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center' },
  buttons: { gap: Spacing.md },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  appleButton: { backgroundColor: '#000000' },
  emailButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  emailForm: { gap: Spacing.sm },
  toggleMode: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  emailInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.primaryDark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legal: {
    textAlign: 'center',
  },
});
