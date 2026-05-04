import { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Share, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Notifications from 'expo-notifications';
import { Text, Card } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useMoodStore } from '@/stores/moodStore';
import { useJournalStore } from '@/stores/journalStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { supabase } from '@/lib/supabase';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ icon, title, subtitle, onPress, destructive }: SettingsRowProps) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <View style={styles.settingsIcon}>{icon}</View>
      <View style={styles.settingsText}>
        <Text variant="bodyMedium" color={destructive ? Colors.error : undefined}>{title}</Text>
        {subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={Colors.gray} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { tier, isPro } = useSubscription();
  const { email, isAnonymous, isAuthenticated, signOut, signInWithEmail, migrateAnonymousAccount } = useAuth();
  const { recentEntries: moodEntries } = useMoodStore();
  const { entries: journalEntries } = useJournalStore();
  const { reset: resetOnboarding } = useOnboardingStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Account Migration ---
  const [showMigration, setShowMigration] = useState(false);
  const [migrationEmail, setMigrationEmail] = useState('');
  const [migrationPassword, setMigrationPassword] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSignInMode, setIsSignInMode] = useState(false);

  const handleMigrateAccount = useCallback(async () => {
    if (!migrationEmail.trim() || !migrationPassword.trim()) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    if (!isSignInMode && migrationPassword.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters.');
      return;
    }
    try {
      setIsMigrating(true);
      if (isSignInMode) {
        await signOut();
        await signInWithEmail(migrationEmail.trim(), migrationPassword);
      } else {
        await migrateAnonymousAccount(migrationEmail.trim(), migrationPassword);
      }
      setShowMigration(false);
      setMigrationEmail('');
      setMigrationPassword('');
      setIsSignInMode(false);
      Alert.alert(
        isSignInMode ? 'Signed In' : 'Account Created',
        isSignInMode ? 'Welcome back!' : 'Your data and subscription have been saved to your new account.'
      );
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Please check your credentials and try again.');
    } finally {
      setIsMigrating(false);
    }
  }, [migrationEmail, migrationPassword, isSignInMode, migrateAnonymousAccount, signOut, signInWithEmail]);

  // --- Account ---
  const handleAccountPress = useCallback(() => {
    if (!isAuthenticated || isAnonymous) {
      setShowMigration(true);
    } else {
      Alert.alert(
        'Account',
        `Signed in as ${email}`,
        [{ text: 'OK' }]
      );
    }
  }, [isAuthenticated, isAnonymous, email]);

  // --- Subscription ---
  const handleSubscriptionPress = useCallback(() => {
    if (isPro) {
      Alert.alert('Pro Plan', "You have full access to everything. Manage your subscription in your device's Settings > Subscriptions.");
    } else {
      router.push('/paywall');
    }
  }, [isPro]);

  // --- Notifications ---
  const handleNotificationsPress = useCallback(async () => {
    if (notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
      Alert.alert('Notifications Off', 'Daily check-in reminders have been turned off.');
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Enable notifications in your device Settings to get daily reminders.');
        return;
      }
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'How are you doing today?',
          body: 'Take a sec to check in with yourself.',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });
      setNotificationsEnabled(true);
      Alert.alert('Notifications On', "You'll get a gentle nudge at 9:00 AM each day.");
    }
  }, [notificationsEnabled]);

  // --- Appearance ---
  const handleAppearancePress = useCallback(() => {
    Alert.alert(
      'Appearance',
      'Dark mode is coming soon. CalmAI currently follows your system theme.',
      [{ text: 'OK' }]
    );
  }, []);

  // --- Export Data ---
  const handleExportData = useCallback(async () => {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        moodEntries: moodEntries.map(e => ({
          mood: e.mood,
          intensity: e.intensity,
          source: e.source,
          createdAt: e.createdAt,
        })),
        journalEntries: journalEntries.map(e => ({
          promptText: e.promptText,
          entryText: e.entryText,
          moodTags: e.moodTags,
          createdAt: e.createdAt,
        })),
      };

      const json = JSON.stringify(exportData, null, 2);

      await Share.share({
        message: json,
        title: 'CalmAI Data Export',
      });
    } catch {
      Alert.alert('Export Failed', 'Something went wrong. Please try again.');
    }
  }, [moodEntries, journalEntries]);

  // --- Delete Account ---
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and all your data — mood entries, journal entries, chat history, everything. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  }, []);

  const confirmDeleteAccount = useCallback(async () => {
    try {
      setIsDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
        const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
        await fetch(`${url}/functions/v1/delete-account`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
        });
      }
      await signOut();
      await resetOnboarding();
      router.replace('/(auth)/welcome');
    } catch {
      Alert.alert('Deletion Failed', 'Something went wrong. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
    }
  }, [signOut, resetOnboarding]);

  // --- Sign Out ---
  const handleSignOut = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: async () => {
            await signOut();
            await resetOnboarding();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  }, [signOut]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="h1">Settings</Text>

        {/* Subscription Card */}
        {isPro ? (
          <Card variant="elevated" style={[styles.subCard, { backgroundColor: Colors.primary }]}>
            <Text variant="label" color="rgba(255,255,255,0.7)">Pro Plan</Text>
            <Text variant="h2" style={{ color: '#FFFFFF' }}>You're all set</Text>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Unlimited access to everything</Text>
          </Card>
        ) : (
          <Pressable onPress={() => router.push('/paywall')}>
            <Card variant="elevated" style={styles.subCard}>
              <Text variant="label" color={Colors.primary}>Free Plan</Text>
              <Text variant="h2">Upgrade to Pro</Text>
              <Text variant="caption">Unlimited convos, journaling, and weekly insights</Text>
            </Card>
          </Pressable>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text variant="label" color={Colors.gray} style={styles.sectionTitle}>Account</Text>
          <Card>
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Account"
              subtitle={email || (isAnonymous ? 'Guest account' : 'Not signed in')}
              onPress={handleAccountPress}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" stroke={Colors.primary} strokeWidth={2} /><Path d="M7 11V7a5 5 0 0110 0v4" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Subscription"
              subtitle={isPro ? 'Pro plan' : 'Free plan'}
              onPress={handleSubscriptionPress}
            />
          </Card>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text variant="label" color={Colors.gray} style={styles.sectionTitle}>Preferences</Text>
          <Card>
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Notifications"
              subtitle={notificationsEnabled ? 'Daily check-in at 9:00 AM' : 'Off'}
              onPress={handleNotificationsPress}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="5" stroke={Colors.primary} strokeWidth={2} /><Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Appearance"
              subtitle="System default"
              onPress={handleAppearancePress}
            />
          </Card>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text variant="label" color={Colors.gray} style={styles.sectionTitle}>Your Data</Text>
          <Card>
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
              title="Export My Data"
              subtitle="Download your mood and journal data"
              onPress={handleExportData}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={Colors.error} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Delete Account"
              subtitle={isDeleting ? 'Deleting...' : 'Permanently remove all your data'}
              onPress={handleDeleteAccount}
              destructive
            />
          </Card>
        </View>

        {/* Sign Out */}
        {isAuthenticated && (
          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text variant="bodyMedium" color={Colors.error}>Sign Out</Text>
          </Pressable>
        )}

        {/* Legal */}
        <View style={styles.legal}>
          <Text variant="caption" style={styles.legalText}>
            CalmAI is your wellness companion, not a therapist.{'\n'}
            If you're in crisis, call or text 988.
          </Text>
          <Text variant="small" color={Colors.gray}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Account Migration Modal */}
      <Modal visible={showMigration} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text variant="h2">{isSignInMode ? 'Welcome Back' : 'Create Your Account'}</Text>
            <Text variant="body" color={Colors.gray}>
              {isSignInMode
                ? 'Sign in to access your existing account.'
                : 'Your data and subscription will be saved to your new account.'}
            </Text>
            <View style={styles.migrationForm}>
              <TextInput
                style={styles.migrationInput}
                placeholder="Email"
                placeholderTextColor={Colors.gray}
                value={migrationEmail}
                onChangeText={setMigrationEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.migrationInput}
                placeholder={isSignInMode ? 'Password' : 'Password (min 6 characters)'}
                placeholderTextColor={Colors.gray}
                value={migrationPassword}
                onChangeText={setMigrationPassword}
                secureTextEntry
              />
              <Pressable
                style={[styles.migrationButton, isMigrating && { opacity: 0.6 }]}
                onPress={handleMigrateAccount}
                disabled={isMigrating}
              >
                <Text variant="bodyMedium" style={{ color: '#FFFFFF' }}>
                  {isMigrating ? 'Working...' : (isSignInMode ? 'Sign In' : 'Create Account')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsSignInMode(!isSignInMode)}
                style={styles.migrationToggle}
              >
                <Text variant="body" color={Colors.primary}>
                  {isSignInMode ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
                </Text>
              </Pressable>
              <Pressable
                style={styles.migrationCancel}
                onPress={() => { setShowMigration(false); setIsSignInMode(false); }}
              >
                <Text variant="body" color={Colors.gray}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  subCard: {
    backgroundColor: '#F5F0FF',
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    marginLeft: Spacing.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  settingsIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 44,
  },
  signOutButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
  },
  legal: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  legalText: {
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  migrationForm: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  migrationInput: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.primaryDark,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  migrationButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  migrationToggle: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  migrationCancel: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
});
