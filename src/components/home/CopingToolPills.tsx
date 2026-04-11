import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function BreatheIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"
        fill="#FFFFFF"
        opacity={0.9}
      />
    </Svg>
  );
}

function GroundIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm-6-6v-5c0-3.07 1.63-5.64 4.5-6.32V4c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v.68C16.37 5.36 18 7.92 18 11v5l2 2H4l2-2z"
        fill="#FFFFFF"
        opacity={0.9}
      />
    </Svg>
  );
}

function ReframeIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z"
        fill="#FFFFFF"
        opacity={0.9}
      />
    </Svg>
  );
}

interface PillProps {
  label: string;
  color: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function Pill({ label, color, icon, onPress }: PillProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[styles.pill, { backgroundColor: color }, animatedStyle]}
    >
      {icon}
      <Text variant="bodyMedium" color="#FFFFFF" style={styles.pillLabel}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

export function CopingToolPills() {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pill
        label="Breathe"
        color={Colors.primary}
        icon={<BreatheIcon />}
        onPress={() => router.push('/breathe')}
      />
      <Pill
        label="Ground"
        color={Colors.sageGreen}
        icon={<GroundIcon />}
        onPress={() => router.push('/ground')}
      />
      <Pill
        label="Reframe"
        color={Colors.blushPink}
        icon={<ReframeIcon />}
        onPress={() => router.push('/chat?mode=reframe')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    gap: Spacing.xs,
  },
  pillLabel: {
    fontSize: 14,
  },
});
