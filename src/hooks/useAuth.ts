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
        if (!isAnon) {
          restoreFromCloud().catch((e) =>
            console.warn('[useAuth] restoreFromCloud failed:', e?.message)
          );
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
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

  const signOut = useCallback(async () => {
    // Wipe local state BEFORE clearing the Supabase session — once the session
    // is gone, the auth listener fires with `session: null` and nothing in the
    // app can authenticate to flush anything anyway. Clearing first means the
    // next user (whoever they are) starts on a clean device.
    await resetLocalUserData();
    await AsyncStorage.removeItem(LAST_USER_ID_KEY);
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
