import { Pressable, View, StyleSheet } from 'react-native';
import { Card, Text } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';

interface Props {
  name: string;
  price: string;
  period: string;
  savings?: string;
  selected: boolean;
  onSelect: () => void;
}

export function PlanCard({ name, price, period, savings, selected, onSelect }: Props) {
  return (
    <Pressable onPress={onSelect}>
      <Card
        variant="elevated"
        style={[
          styles.card,
          selected && styles.selectedCard,
        ]}
      >
        <View style={styles.header}>
          <View style={styles.radioOuter}>
            {selected && <View style={styles.radioInner} />}
          </View>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text variant="bodyMedium">{name}</Text>
              {savings ? (
                <View style={styles.badge}>
                  <Text variant="small" color={Colors.primaryDark} style={styles.badgeText}>
                    Best value
                  </Text>
                </View>
              ) : null}
            </View>
            <Text variant="body">
              <Text variant="h2" style={styles.price}>{price}</Text>
              <Text variant="caption">/{period}</Text>
            </Text>
            {savings ? (
              <Text variant="caption" color={Colors.sageGreen}>
                Save {savings}
              </Text>
            ) : null}
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.base,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.sageGreen,
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  badgeText: {
    fontWeight: '600',
  },
  price: {
    fontSize: 22,
  },
});
