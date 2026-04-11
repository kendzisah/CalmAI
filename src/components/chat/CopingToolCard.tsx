import { Pressable, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { Colors, Spacing, Radius, Shadows } from '@/lib/constants';
import { Text } from '@/components/ui';

interface Props {
  title: string;
  duration: string;
  category: string;
}

function BreathingIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <SvgCircle cx={12} cy={12} r={9} stroke={Colors.primary} strokeWidth={2} />
      <Path
        d="M12 8V12L14.5 14.5"
        stroke={Colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CopingToolCard({ title, duration, category }: Props) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.wrapper}
      onPress={() => router.push('/breathe')}
    >
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.iconContainer}>
          <BreathingIcon />
        </View>
        <View style={styles.content}>
          <Text variant="bodyMedium" color={Colors.primaryDark}>
            {title}
          </Text>
          <View style={styles.meta}>
            <View style={styles.pill}>
              <Text variant="small" color={Colors.primary}>
                {duration}
              </Text>
            </View>
            <Text variant="caption" color={Colors.gray}>
              {category}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
  },
  iconContainer: {
    marginLeft: Spacing.sm,
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pill: {
    backgroundColor: Colors.grayLavender,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
});
