import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';
import type { ReliefTag } from '@/types/user';

interface Props {
  onSelect: (tag: ReliefTag) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const OPTIONS: Array<{
  tag: ReliefTag;
  label: string;
  color: string;
  icon: 'check' | 'neutral' | 'heart';
  response: string;
}> = [
  {
    tag: 'relief_positive',
    label: 'A little better',
    color: Colors.sageGreen,
    icon: 'check',
    response: "That's what we're here for.",
  },
  {
    tag: 'relief_neutral',
    label: 'About the same',
    color: '#E5E7EB',
    icon: 'neutral',
    response: "That's okay. This takes time.",
  },
  {
    tag: 'relief_not_yet',
    label: "Not yet, and that's okay",
    color: Colors.cream,
    icon: 'heart',
    response: 'You showed up, and that counts for a lot.',
  },
];

function OptionIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const color = Colors.primaryDark;
  switch (icon) {
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 13l4 4L19 7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'neutral':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}

export function PostReliefCheck({ onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="h1" style={styles.question}>
        How do you feel now?
      </Text>

      <View style={styles.options}>
        {OPTIONS.map((option) => (
          <ReliefOption
            key={option.tag}
            option={option}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(option.tag);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function ReliefOption({
  option,
  onPress,
}: {
  option: (typeof OPTIONS)[number];
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[styles.option, { backgroundColor: option.color }, animatedStyle]}
    >
      <OptionIcon icon={option.icon} />
      <Text variant="bodyMedium" color={Colors.primaryDark}>
        {option.label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  question: {
    textAlign: 'center',
  },
  options: {
    width: '100%',
    gap: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radius.md,
  },
});
