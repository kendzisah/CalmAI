import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Purchases from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { restoreFromCloud } from '@/services/syncService';

export function useAuth() {
  const { userId, email, isAnonymous, isAuthenticated, setUser, setAnonymous, signOut: clearAuth } = useAuthStore();

  useEffect(() => {
    const onUserAuthenticated = async (userId: string, isAnon: boolean) => {
      try {
        await Purchases.logIn(userId);
      } catch {
        // Non-critical — purchases still work on-device
      }
      if (!isAnon) {
        restoreFromCloud().catch(() => {});
      }
    };

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const isAnon = !session.user.email;
        if (isAnon) {
          setAnonymous(session.user.id);
        } else {
          setUser(session.user.id, session.user.email || null, false);
        }
        onUserAuthenticated(session.user.id, isAnon);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const isAnon = !session.user.email;
        if (isAnon) {
          setAnonymous(session.user.id);
        } else {
          setUser(session.user.id, session.user.email || null, false);
        }
        onUserAuthenticated(session.user.id, isAnon);
      } else {
        clearAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  const signInAnonymously = useCallback(async () => {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }, []);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    const nonce = Math.random().toString(36).substring(2, 15);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) throw new Error('No identity token from Apple');

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce,
    });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // Google Sign-In requires @react-native-google-signin/google-signin
    // and a Google Cloud OAuth client ID. For now, fall back to OAuth redirect.
    // This will work in development builds with deep linking configured.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'calmai://auth/callback',
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuth();
  }, [clearAuth]);

  const migrateAnonymousAccount = useCallback(async (email: string, password: string) => {
    // Convert anonymous user to a real account
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) throw error;

    // Re-link RevenueCat so subscriptions follow the account
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user.id, session.user.email || null, false);
      try {
        await Purchases.logIn(session.user.id);
      } catch {
        // Non-critical
      }
    }
  }, [setUser]);

  return {
    userId,
    email,
    isAnonymous,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signInAnonymously,
    signInWithApple,
    signInWithGoogle,
    signOut,
    migrateAnonymousAccount,
  };
}
