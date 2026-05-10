import { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Spacing } from '@/lib/constants';
import { useThemeColors } from '@/theme';

const DOT_SIZE = 8;
const DOT_COUNT = 3;
const STAGGER_DELAY = 300;

function Dot({ index, color }: { index: number; color: string }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    const timeout = setTimeout(() => animation.start(), index * STAGGER_DELAY);
    return () => { clearTimeout(timeout); animation.stop(); };
  }, [index, opacity]);

  return <Animated.View style={[styles.dot, { opacity, backgroundColor: color }]} />;
}

export function TypingIndicator() {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <View style={[styles.bubble, { backgroundColor: colors.aiBubbleBg }]}>
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <Dot key={i} index={i} color={colors.text} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
  },
  bubble: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
