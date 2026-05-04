import { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Text, Button } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { useSubscription } from '@/hooks/useSubscription';

type Plan = 'monthly' | 'annual';

const BENEFITS = [
  'Unlimited convos with your AI companion, whenever you need',
  'Unlimited journal entries with personalized prompts',
  'Weekly mood insights so you can actually track your growth',
];

export default function PaywallScreen() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const { offerings, isLoading, purchaseMonthly, purchaseAnnual, restorePurchases } = useSubscription();

  const annualPkg = offerings.annual;
  const monthlyPkg = offerings.monthly;

  // Use dynamic prices from RevenueCat, fall back to display prices
  const annualPrice = annualPkg?.product.priceString || '$69.99';
  const annualPeriod = '/year';
  const monthlyPrice = monthlyPkg?.product.priceString || '$9.99';
  const monthlyPeriod = '/month';

  // Calculate savings if both prices available
  const monthlyNumeric = monthlyPkg?.product.price ?? 9.99;
  const annualNumeric = annualPkg?.product.price ?? 69.99;
  const monthlyEquivalent = (annualNumeric / 12).toFixed(2);
  const savingsPercent = Math.round((1 - annualNumeric / (monthlyNumeric * 12)) * 100);

  const handlePurchase = async () => {
    try {
      if (selectedPlan === 'annual') {
        await purchaseAnnual();
      } else {
        await purchaseMonthly();
      }
      router.back();
    } catch {
      // Error handled inside useSubscription
    }
  };

  // Check if the selected package has a free trial
  const selectedPkg = selectedPlan === 'annual' ? annualPkg : monthlyPkg;
  const hasIntroOffer = selectedPkg?.product.introPrice != null;
  const ctaText = hasIntroOffer
    ? `Start ${selectedPkg!.product.introPrice!.periodNumberOfUnits}-${selectedPkg!.product.introPrice!.periodUnit === 'DAY' ? 'Day' : 'Week'} Free Trial`
    : 'Subscribe Now';

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.gray} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="4" stroke={Colors.primary} strokeWidth={2} />
              <Circle cx="12" cy="12" r="9" stroke={Colors.primary} strokeWidth={2} />
            </Svg>
          </View>
          <Text variant="h1" style={styles.title}>Level Up Your Calm</Text>
          <Text variant="body" color={Colors.gray} style={styles.subtitle}>
            Your companion is ready whenever you are
          </Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          {BENEFITS.map((benefit, i) => (
            <View key={i} style={styles.benefitRow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M5 13l4 4L19 7" stroke={Colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text variant="body" style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Plan Cards */}
        <View style={styles.plans}>
          {/* Annual */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <View style={styles.planBadge}>
              <Text variant="small" style={{ color: '#FFFFFF', fontFamily: 'Inter-SemiBold' }}>
                Best value
              </Text>
            </View>
            <Text variant="bodyMedium">Annual</Text>
            <View style={styles.priceRow}>
              <Text variant="h1">{annualPrice}</Text>
              <Text variant="caption">{annualPeriod}</Text>
            </View>
            {savingsPercent > 0 && (
              <Text variant="small" color={Colors.sageGreen}>
                Save {savingsPercent}% — ${monthlyEquivalent}/month
              </Text>
            )}
          </Pressable>

          {/* Monthly */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <Text variant="bodyMedium">Monthly</Text>
            <View style={styles.priceRow}>
              <Text variant="h1">{monthlyPrice}</Text>
              <Text variant="caption">{monthlyPeriod}</Text>
            </View>
          </Pressable>
        </View>

        {/* CTA */}
        <Button
          title={isLoading ? 'Processing...' : ctaText}
          onPress={handlePurchase}
          disabled={isLoading}
        />

        {/* Footer */}
        <Text variant="caption" style={styles.footer}>
          No strings attached. Cancel whenever.
        </Text>

        <Pressable onPress={restorePurchases} disabled={isLoading}>
          <Text variant="small" color={Colors.primary} style={styles.restore}>
            Restore purchases
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: Spacing.base,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.lavenderLight + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  benefits: {
    gap: Spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  benefitText: {
    flex: 1,
  },
  plans: {
    gap: Spacing.md,
  },
  planCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: Spacing.xs,
  },
  planCardSelected: {
    borderColor: Colors.primary,
  },
  planBadge: {
    backgroundColor: Colors.sageGreen,
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.xs,
  },
  footer: {
    textAlign: 'center',
  },
  restore: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
