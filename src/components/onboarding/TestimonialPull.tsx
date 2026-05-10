import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';
import type { Testimonial } from '@/data/testimonials';

interface Props {
  testimonial: Testimonial;
}

export function TestimonialPull({ testimonial }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="body" color={Colors.primaryDark} style={styles.quote}>
        "{testimonial.quote}"
      </Text>
      <Text variant="caption" color={Colors.gray} style={styles.attribution}>
        — {testimonial.name}, {testimonial.age} · {testimonial.city}   ★★★★★
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  quote: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  attribution: {
    textAlign: 'center',
  },
});
