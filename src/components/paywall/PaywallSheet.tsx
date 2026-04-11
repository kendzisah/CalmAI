import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';
import { BenefitRow } from './BenefitRow';
import { PlanCard } from './PlanCard';

type Plan = 'monthly' | 'annual';

interface Props {
  onPurchase: (plan: Plan) => void;
  onDismiss: () => void;
}

const BENEFITS = [
  'Unlimited AI therapy sessions',
  'Full mood trends & journal insights',
  'Premium guided breathing & grounding exercises',
];

export function PaywallSheet({ onPurchase, onDismiss }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" style={styles.title}>
          Unlock Your Calm
        </Text>
        <Text variant="body" color={Colors.gray} style={styles.subtitle}>
          Get full access to everything CalmAI has to offer.
        </Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <BenefitRow key={benefit} text={benefit} />
        ))}
      </View>

      <View style={styles.plans}>
        <PlanCard
          name="Annual"
          price="$69.99"
          period="yr"
          savings="42%"
          selected={selectedPlan === 'annual'}
          onSelect={() => setSelectedPlan('annual')}
        />
        <PlanCard
          name="Monthly"
          price="$9.99"
          period="mo"
          selected={selectedPlan === 'monthly'}
          onSelect={() => setSelectedPlan('monthly')}
        />
      </View>

      <Button
        title="Start 7-Day Free Trial"
        onPress={() => onPurchase(selectedPlan)}
        style={styles.cta}
      />

      <Text variant="caption" style={styles.footer}>
        No commitment. Cancel anytime.
      </Text>

      <Button
        title="Not now"
        onPress={onDismiss}
        variant="ghost"
        style={styles.dismiss}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  benefits: {
    marginBottom: Spacing.lg,
  },
  plans: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cta: {
    marginBottom: Spacing.md,
  },
  footer: {
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  dismiss: {
    alignSelf: 'center',
  },
});
