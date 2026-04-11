import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Text, Card } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

function SettingsRow({ icon, title, subtitle, onPress }: SettingsRowProps) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <View style={styles.settingsIcon}>{icon}</View>
      <View style={styles.settingsText}>
        <Text variant="bodyMedium">{title}</Text>
        {subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 18l6-6-6-6" stroke={Colors.gray} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="h1">Settings</Text>

        {/* Subscription Card */}
        <Card variant="elevated" style={styles.subCard}>
          <Text variant="label" color={Colors.primary}>Free Plan</Text>
          <Text variant="h2">Upgrade to Pro</Text>
          <Text variant="caption">Unlimited AI conversations, journaling, and weekly insights</Text>
        </Card>

        {/* Account Section */}
        <View style={styles.section}>
          <Text variant="label" color={Colors.gray} style={styles.sectionTitle}>Account</Text>
          <Card>
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Account"
              subtitle="maya@example.com"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Rect x="3" y="11" width="18" height="11" rx="2" stroke={Colors.primary} strokeWidth={2} /><Path d="M7 11V7a5 5 0 0110 0v4" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Subscription"
              subtitle="Free plan"
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
              subtitle="Daily check-in at 9:00 AM"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="5" stroke={Colors.primary} strokeWidth={2} /><Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Appearance"
              subtitle="Light mode"
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
            />
            <View style={styles.divider} />
            <SettingsRow
              icon={<Svg width={20} height={20} viewBox="0 0 24 24" fill="none"><Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={Colors.error} strokeWidth={2} strokeLinecap="round" /></Svg>}
              title="Delete Account"
              subtitle="Permanently remove all your data"
            />
          </Card>
        </View>

        {/* Legal */}
        <View style={styles.legal}>
          <Text variant="caption" style={styles.legalText}>
            CalmAI is a wellness companion, not a therapist.{'\n'}
            For crisis support, call or text 988.
          </Text>
          <Text variant="small" color={Colors.gray}>Version 1.0.0</Text>
        </View>
      </ScrollView>
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
  legal: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  legalText: {
    textAlign: 'center',
  },
});
