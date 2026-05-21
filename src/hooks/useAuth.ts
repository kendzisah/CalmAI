import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { safePurchasesLogIn } from '@/lib/purchases';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { restoreFromCloud } from '@/services/syncService';
import { resetLocalUserData } from '@/services/resetService';
import { identify, reset as resetAnalytics, track, captureException } from '@/lib/analytics';

// Tracks the last user ID we saw an auth event for, so we can detect when a
// session arrives for a different account and wipe local data before that
// account's screens get a chance to read stale rows from SQLite.
const LAST_USER_ID_KEY = 'calmai.lastUserId';

export function useAuth() {
  const { userId, email, isAnonymous, isAuthenticated, setUser, setAnonymous, signOut: clearAuth } = useAuthStore();

  useEffect(() => {
    // Side effects (RevenueCat login, cloud restore) are deferred to the next
    // event-loop tick so the AsyncStorage session write triggered by signUp /
    // signInWithPassword has time to flush before any consumer queries it.
    // Without this, race conditions between the SIGNED_IN listener and the
    // pending storage write surface as opaque "Auth session missing!" errors.
    const onUserAuthenticated = (uid: string, isAnon: boolean) => {
      setTimeout(async () => {
        await safePurchasesLogIn(uid);
        // Tie AppsFlyer's anonymous events (collected during onboarding before
        // sign-in) to this Customer User ID. AF auto-stitches retroactively.
        // Only non-PII traits — never nickname/email.
        identify(uid, { is_anonymous: isAnon });
        if (!isAnon) {
          const restoreStart = Date.now();
          restoreFromCloud()
            .then(() => track('cloud_restore_succeeded', { latency_ms: Date.now() - restoreStart }))
            .catch((e) => {
              track('cloud_restore_failed', {
                error: e?.message?.slice(0, 80),
                latency_ms: Date.now() - restoreStart,
              });
              captureException(e, { feature: 'cloud_restore' });
            });
        }
      }, 0);
    };

    // If a session arrives for a user that differs from the last one we saw,
    // the previous account's data is still sitting in SQLite. Wipe it before
    // the tabs get a chance to render — this is the safety net for any path
    // that swaps users without a full signOut() in between.
    const handleSession = async (uid: string) => {
      const lastUserId = await AsyncStorage.getItem(LAST_USER_ID_KEY);
      if (lastUserId && lastUserId !== uid) {
        await resetLocalUserData();
      }
      await AsyncStorage.setItem(LAST_USER_ID_KEY, uid);
    };

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[useAuth] initial getSession ->', session ? 'session' : 'no session');
      if (session?.user) {
        const isAnon = !session.user.email;
        await handleSession(session.user.id);
        if (isAnon) {
          setAnonymous(session.user.id);
        } else {
          setUser(session.user.id, session.user.email || null, false);
        }
        onUserAuthenticated(session.user.id, isAnon);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] onAuthStateChange ->', event, '| session?', !!session);
      if (session?.user) {
        const isAnon = !session.user.email;
        await handleSession(session.user.id);
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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        track('signin_failed_detailed', {
          method: 'email',
          error_code: (error as any)?.code,
          error_message: error?.message?.slice(0, 80),
        });
        throw error;
      }
    } catch (err: any) {
      track('signin_failed_detailed', {
        method: 'email',
        error_code: err?.code,
        error_message: err?.message?.slice(0, 80),
      });
      throw err;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        track('signin_failed_detailed', {
          method: 'email',
          error_code: (error as any)?.code,
          error_message: error?.message?.slice(0, 80),
        });
        throw error;
      }
    } catch (err: any) {
      track('signin_failed_detailed', {
        method: 'email',
        error_code: err?.code,
        error_message: err?.message?.slice(0, 80),
      });
      throw err;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    const nonce = Math.random().toString(36).substring(2, 15);
    const hashedNonce = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      nonce
    );

    let credential: AppleAuthentication.AppleAuthenticationCredential;
    try {
      credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
    } catch (err: any) {
      track('signin_failed_detailed', {
        method: 'apple',
        stage: 'apple_credential',
        error_code: err?.code,
        error_message: err?.message?.slice(0, 80),
      });
      throw err;
    }

    if (!credential.identityToken) throw new Error('No identity token from Apple');

    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce,
      });
      if (error) {
        track('signin_failed_detailed', {
          method: 'apple',
          stage: 'supabase_token_exchange',
          error_code: (error as any)?.code,
          error_message: error?.message?.slice(0, 80),
        });
        throw error;
      }
    } catch (err: any) {
      track('signin_failed_detailed', {
        method: 'apple',
        stage: 'supabase_token_exchange',
        error_code: err?.code,
        error_message: err?.message?.slice(0, 80),
      });
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    // Wipe local state BEFORE clearing the Supabase session — once the session
    // is gone, the auth listener fires with `session: null` and nothing in the
    // app can authenticate to flush anything anyway. Clearing first means the
    // next user (whoever they are) starts on a clean device.
    await resetLocalUserData();
    await AsyncStorage.removeItem(LAST_USER_ID_KEY);
    resetAnalytics();
    await supabase.auth.signOut();
    clearAuth();
  }, [clearAuth]);

  // Used by profile.tsx for legacy anonymous accounts created before the
  // onboarding required sign-in upfront. New users no longer hit this path,
  // but existing anonymous users still need a way to upgrade to a real account.
  const migrateAnonymousAccount = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) throw error;

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user.id, session.user.email || null, false);
      await safePurchasesLogIn(session.user.id);
    }
  }, [setUser]);

  return {
    userId,
    email,
    isAnonymous,
    isAuthenticated,
    signInWithEmail,
    signUpWithEmail,
    signInWithApple,
    signOut,
    migrateAnonymousAccount,
  };
}
