import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { userId, email, isAnonymous, isAuthenticated, setUser, setAnonymous, signOut: clearAuth } = useAuthStore();

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const isAnon = !session.user.email;
        if (isAnon) {
          setAnonymous(session.user.id);
        } else {
          setUser(session.user.id, session.user.email || null, false);
        }
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
    });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
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
  }, []);

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
