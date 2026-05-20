import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Animated, Easing, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { GradientBackground, Text, Button } from '@/components/ui';
import { Colors, Spacing, Radius, Shadows } from '@/lib/constants';
import { ThemeProvider } from '@/theme';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useJournalStore } from '@/stores/journalStore';
import { useAuthStore } from '@/stores/authStore';
import { track } from '@/lib/analytics';
import { playChime } from '@/lib/audio';

type Plan = 'monthly' | 'annual';

// Apple's Standard EULA — required Terms of Use link for App Store apps offering
// auto-renewing subscriptions, unless we supply a custom EULA. Using Apple's
// standard EULA keeps us compliant without maintaining our own terms doc.
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const PRIVACY_URL = 'https://calm-ai.pages.dev/privacy';

function openExternal(url: string) {
  Linking.openURL(url).catch(() => {
    // Swallow — surfacing an error here interrupts the paywall flow.
  });
}

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const { offerings, isLoading, purchaseMonthly, purchaseAnnual, restorePurchases } = useSubscription();
  const { completeStep, isComplete, finish, nickname } = useOnboardingStore();
  const { saveEntry } = useJournalStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const annualPkg = offerings.annual;
  const monthlyPkg = offerings.monthly;

  const annualPrice = annualPkg?.product.priceString ?? '$79.99';
  const monthlyPrice = monthlyPkg?.product.priceString ?? '$9.99';

  const monthlyNumeric = monthlyPkg?.product.price ?? 9.99;
  const annualNumeric = annualPkg?.product.price ?? 79.99;
  const monthlyEquivalent = (annualNumeric / 12).toFixed(2);
  const savingsPercent = Math.max(
    0,
    Math.round((1 - annualNumeric / (monthlyNumeric * 12)) * 100)
  );

  const selectedPkg = selectedPlan === 'annual' ? annualPkg : monthlyPkg;
  const introPrice = selectedPkg?.product.introPrice;
  const trialDays = introPrice?.periodUnit === 'DAY' ? introPrice.periodNumberOfUnits : 3;

  // Soft pulsing glow on the hero circle.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const heroScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.04] });
  const heroOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0.95] });

  useEffect(() => {
    track('paywall_pricing_viewed');
  }, []);

  const handleSelect = (plan: Plan) => {
    if (selectedPlan === plan) return;
    Haptics.selectionAsync();
    setSelectedPlan(plan);
    track(plan === 'annual' ? 'paywall_yearly_selected' : 'paywall_monthly_selected');
  };

  const handlePurchase = async () => {
    track('paywall_purchase_attempted', {
      plan: selectedPlan,
      price: selectedPlan === 'annual' ? annualNumeric : monthlyNumeric,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (selectedPlan === 'annual') {
        await purchaseAnnual();
      } else {
        await purchaseMonthly();
      }
      track('paywall_purchase_succeeded', { plan: selectedPlan });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      playChime('paywall_success');

      // Settings-initiated upgrade: onboarding is already complete, so just
      // dismiss the modal back to wherever they came from. Don't push them
      // into /(auth)/notify — they've been past that screen once already and
      // landing on it again from inside the tabs would feel broken.
      if (isComplete) {
        router.back();
        return;
      }

      // Onboarding flow — finalize the funnel and continue to the notify step.
      if (isAuthenticated) {
        try {
          await saveEntry('Started my CalmAI journey 🌿', [], undefined, false);
        } catch {
          // Journal save is decorative — don't block paywall completion.
        }
      }
      await completeStep(13);
      await finish();
      router.replace('/(auth)/notify');
    } catch (err: any) {
      if (err?.userCancelled) {
        track('paywall_dismissed', { step: 'pricing' });
      } else {
        track('paywall_purchase_failed', { error_code: err?.code ?? err?.message });
      }
    }
  };

  const handleClose = () => {
    track('paywall_dismissed', { step: 'pricing' });
    router.back();
  };

  return (
    // Force light theme regardless of user preference — paywall's lavender/cream
    // gradient is brand-defining and shouldn't invert.
    <ThemeProvider force="light">
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <Pressable style={styles.closeButton} onPress={handleClose} hitSlop={16}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.gray} strokeWidth={2.2} strokeLinecap="round" />
          </Svg>
        </Pressable>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.hero}>
            <Animated.View
              style={[
                styles.heroGlow,
                { transform: [{ scale: heroScale }], opacity: heroOpacity },
              ]}
            />
            <View style={styles.heroCircle}>
              <Svg width={64} height={64} viewBox="0 0 24 24" fill="none">
                <Circle cx="12" cy="12" r="10" fill={Colors.primary} />
                <Path
                  d="M8 13c1.5 1.8 4 2.4 5.6 1.6 1.4-.7 2.4-2.6 2.4-4.6"
                  stroke="#FFFFFF"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>
          </View>

          <View style={styles.eyebrowRow}>
            <Sparkle />
            <Text variant="label" color={Colors.primary} style={styles.eyebrow}>
              {trialDays}-Day Free Trial
            </Text>
            <Sparkle />
          </View>

          <Text variant="h1" style={styles.title}>
            {nickname ? `${nickname}, you're` : "You're"} ready{'\n'}for this.
          </Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            Start free. No charge today.
          </Text>

          {/* What you get */}
          <View style={styles.featureGrid}>
            <FeatureCell icon="chat" label={`Unlimited\nlate-night talks`} />
            <FeatureCell icon="tone" label={`A tone that\nmatches yours`} />
            <FeatureCell icon="bell" label={`Quiet check-ins\nwhen it hits`} />
            <FeatureCell icon="journal" label={`Journal &\nweekly insights`} />
          </View>

          {/* Timeline */}
          <View style={styles.timelineCard}>
            <Text variant="label" color={Colors.gray} style={styles.timelineHeader}>
              How the trial works
            </Text>
            <TimelineRow
              icon="sparkle"
              label="Today"
              description="Full access. Talk as much as you want."
              accent={Colors.primary}
              isFirst
            />
            <TimelineRow
              icon="bell"
              label={`Day ${Math.max(trialDays - 1, 2)}`}
              description="A quiet reminder lands so you can decide."
              accent={Colors.lavenderLight}
            />
            <TimelineRow
              icon="receipt"
              label={`Day ${trialDays}`}
              description="If it's working, full access continues. If not, cancel anytime."
              accent={Colors.grayLavender}
              isLast
            />
          </View>

          {/* Plan cards */}
          <View style={styles.plans}>
            <PlanCard
              selected={selectedPlan === 'annual'}
              badge={savingsPercent > 0 ? 'Most Popular' : undefined}
              title="Yearly"
              price={annualPrice}
              period="/yr"
              footnote={`Just $${monthlyEquivalent}/mo`}
              savingsLabel={savingsPercent > 0 ? `Save ${savingsPercent}%` : undefined}
              onPress={() => handleSelect('annual')}
            />
            <PlanCard
              selected={selectedPlan === 'monthly'}
              title="Monthly"
              price={monthlyPrice}
              period="/mo"
              onPress={() => handleSelect('monthly')}
            />
          </View>

          {/* Trust strip */}
          <View style={styles.trustStrip}>
            <TrustChip icon="check" label="Cancel anytime" />
            <TrustChip icon="lock" label="No charge today" />
          </View>
        </ScrollView>

        {/* Sticky footer CTA */}
        <View style={styles.footer}>
          <Button
            title={isLoading ? 'Processing…' : `Start my ${trialDays}-day free trial`}
            onPress={handlePurchase}
            disabled={isLoading}
          />
          <View style={styles.footerLinks}>
            <Pressable onPress={restorePurchases} disabled={isLoading} hitSlop={8}>
              <Text variant="small" color={Colors.gray} style={styles.footerLink}>
                Restore purchases
              </Text>
            </Pressable>
            <View style={styles.footerSeparator} />
            <Pressable onPress={() => openExternal(TERMS_URL)} hitSlop={8}>
              <Text variant="small" color={Colors.gray} style={styles.footerLink}>
                Terms of Use
              </Text>
            </Pressable>
            <View style={styles.footerSeparator} />
            <Pressable onPress={() => openExternal(PRIVACY_URL)} hitSlop={8}>
              <Text variant="small" color={Colors.gray} style={styles.footerLink}>
                Privacy Policy
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
    </ThemeProvider>
  );
}

// ----------------- Sub-components -----------------

function PlanCard({
  selected,
  badge,
  title,
  price,
  period,
  footnote,
  savingsLabel,
  onPress,
}: {
  selected: boolean;
  badge?: string;
  title: string;
  price: string;
  period: string;
  footnote?: string;
  savingsLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.planCardWrap}>
      {badge ? (
        <View style={styles.planBadge}>
          <Text variant="small" style={styles.planBadgeText}>{badge}</Text>
        </View>
      ) : null}
      <View
        style={[
          styles.planCard,
          selected ? styles.planCardSelected : styles.planCardIdle,
        ]}
      >
        <View style={styles.planHeaderRow}>
          <View style={[styles.planRadio, selected && styles.planRadioSelected]}>
            {selected ? (
              <View style={styles.planRadioInner} />
            ) : null}
          </View>
          <Text variant="bodyMedium" color={Colors.primaryDark} style={styles.planTitle}>
            {title}
          </Text>
          {savingsLabel ? (
            <View style={styles.savingsChip}>
              <Text variant="small" style={styles.savingsChipText}>{savingsLabel}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.priceRow}>
          <Text variant="h1" color={Colors.primaryDark} style={styles.priceText}>
            {price}
          </Text>
          <Text variant="body" color={Colors.gray}>{period}</Text>
        </View>
        {footnote ? (
          <Text variant="small" color={Colors.sageGreen} style={styles.planFootnote}>
            {footnote}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function FeatureCell({ icon, label }: { icon: 'chat' | 'tone' | 'bell' | 'journal'; label: string }) {
  return (
    <View style={styles.featureCell}>
      <View style={styles.featureIcon}>
        <FeatureIcon name={icon} />
      </View>
      <Text variant="small" color={Colors.primaryDark} style={styles.featureLabel}>
        {label}
      </Text>
    </View>
  );
}

function FeatureIcon({ name }: { name: 'chat' | 'tone' | 'bell' | 'journal' }) {
  const stroke = Colors.primary;
  if (name === 'chat') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
      </Svg>
    );
  }
  if (name === 'tone') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (name === 'bell') {
    return (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
        <Path d="M10 20a2 2 0 0 0 4 0" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4h11l3 3v13H5z" stroke={stroke} strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M9 9h6M9 13h6M9 17h4" stroke={stroke} strokeWidth={1.7} strokeLinecap="round" />
    </Svg>
  );
}

function TimelineRow({
  icon,
  label,
  description,
  accent,
  isFirst,
  isLast,
}: {
  icon: 'sparkle' | 'bell' | 'receipt';
  label: string;
  description: string;
  accent: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineCol}>
        <View style={[styles.timelineIcon, { backgroundColor: accent + '33', borderColor: accent }]}>
          <TimelineIcon name={icon} color={accent} />
        </View>
        {!isLast ? <View style={styles.timelineLine} /> : null}
      </View>
      <View style={[styles.timelineText, isFirst && { paddingTop: 0 }]}>
        <Text variant="bodyMedium" color={Colors.primaryDark}>{label}</Text>
        <Text variant="caption">{description}</Text>
      </View>
    </View>
  );
}

function TimelineIcon({ name, color }: { name: 'sparkle' | 'bell' | 'receipt'; color: string }) {
  if (name === 'sparkle') {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" fill={color} />
      </Svg>
    );
  }
  if (name === 'bell') {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        <Path d="M10 20a2 2 0 0 0 4 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  }
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 8h6M9 12h6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function Sparkle() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" fill={Colors.primary} opacity={0.85} />
    </Svg>
  );
}

function TrustChip({ icon, label }: { icon: 'check' | 'lock'; label: string }) {
  return (
    <View style={styles.trustChip}>
      {icon === 'check' ? (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12.5l4 4L19 7" stroke={Colors.sageGreen} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      ) : (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
          <Path d="M6 11V8a6 6 0 1 1 12 0v3" stroke={Colors.primary} strokeWidth={1.8} strokeLinecap="round" />
          <Path d="M5 11h14v9H5z" stroke={Colors.primary} strokeWidth={1.8} strokeLinejoin="round" />
        </Svg>
      )}
      <Text variant="small" color={Colors.primaryDark} style={styles.trustChipLabel}>
        {label}
      </Text>
    </View>
  );
}

// ----------------- Styles -----------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  closeButton: {
    alignSelf: 'flex-end',
    margin: Spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },

  // Hero
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    height: 110,
  },
  heroGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.lavenderLight,
  },
  heroCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },

  // Eyebrow + title
  eyebrowRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(124, 92, 191, 0.10)',
  },
  eyebrow: { fontSize: 11, letterSpacing: 1.1 },
  title: {
    textAlign: 'center',
    fontSize: 30,
    lineHeight: 36,
  },
  subtitle: { textAlign: 'center' },

  // Feature grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  featureCell: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm + 2,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 92, 191, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { flex: 1, lineHeight: 16 },

  // Timeline
  timelineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  timelineHeader: {
    paddingBottom: Spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  timelineCol: {
    alignItems: 'center',
    width: 32,
  },
  timelineIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 20,
    backgroundColor: Colors.grayLavender,
    marginTop: 4,
  },
  timelineText: {
    flex: 1,
    gap: 2,
    paddingBottom: Spacing.sm,
  },

  // Plans
  plans: {
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  planCardWrap: {
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    left: Spacing.lg,
    zIndex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderWidth: 2,
    gap: Spacing.xs,
  },
  planCardIdle: {
    borderColor: 'transparent',
    opacity: 0.85,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    ...Shadows.md,
  },
  planHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.8,
    borderColor: Colors.grayLavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    borderColor: Colors.primary,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  planTitle: { flex: 1 },
  savingsChip: {
    backgroundColor: Colors.sageGreen,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.pill,
  },
  savingsChipText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
    paddingLeft: 30,
  },
  priceText: {
    fontSize: 28,
    lineHeight: 32,
  },
  planFootnote: {
    paddingLeft: 30,
  },

  // Trust strip
  trustStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingTop: Spacing.xs,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.grayLavender,
  },
  trustChipLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },

  // Sticky footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 248, 240, 0.92)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(124, 92, 191, 0.15)',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  footerLink: { textDecorationLine: 'underline' },
  footerSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.gray,
  },
});
