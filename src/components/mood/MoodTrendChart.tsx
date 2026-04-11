import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Text } from '@/components/ui';
import { Colors, Spacing, Shadows } from '@/lib/constants';
import type { MoodTrendPoint } from '@/types/mood';

interface Props {
  data: MoodTrendPoint[];
  days?: 7 | 14 | 30;
  width?: number;
  height?: number;
}

// Map mood to a 1-5 numeric scale for charting
const moodToValue: Record<string, number> = {
  anxious: 1.5, overwhelmed: 1, stressed: 2, restless: 1.8,
  sad: 1.2, irritable: 1.5, lonely: 1.3, numb: 1,
  calm: 4, hopeful: 4.5, happy: 5, grateful: 4.8,
};

export function MoodTrendChart({ data, days = 7, width = 300, height = 120 }: Props) {
  const padding = { top: 10, bottom: 10, left: 10, right: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (data.length < 2) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text variant="caption" style={styles.emptyText}>
          Check in a few more times to see your trend
        </Text>
      </View>
    );
  }

  const points = data.slice(-days).map((d, i, arr) => ({
    x: padding.left + (i / (arr.length - 1)) * chartW,
    y: padding.top + chartH - ((moodToValue[d.mood] || 3) / 5) * chartH,
  }));

  // Create smooth curve path
  const linePath = points.reduce((path, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + point.x) / 2;
    return `${path} C ${cpx} ${prev.y} ${cpx} ${point.y} ${point.x} ${point.y}`;
  }, '');

  // Fill path (closed)
  const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.lavenderLight} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={Colors.lavenderLight} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={fillPath} fill="url(#fill)" />
        <Path d={linePath} stroke={Colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={Colors.primary} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
