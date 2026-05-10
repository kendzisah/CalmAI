import { useRef } from 'react';
import { Pressable, StyleSheet, View, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/ui';
import { MoodColors, Colors, Spacing } from '@/lib/constants';
import { useThemeColors } from '@/theme';
import type { MoodType } from '@/types/mood';
import { MOOD_LABELS } from '@/types/mood';

interface Props {
  mood: MoodType;
  selected: boolean;
  onSelect: (mood: MoodType) => void;
  size?: number;
}

export function MoodBubble({ mood, selected, onSelect, size = 56 }: Props) {
  const colors = useThemeColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.15, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
    onSelect(mood);
  };

  // Mood pastel backgrounds stay constant — they're brand-tinted accents.
  // Falls back to the theme's grayLavender (different in dark mode).
  const bgColor = MoodColors[mood] || colors.grayLavender;

  return (
    <View style={styles.wrapper}>
      <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={handlePress}>
        <View
          style={[
            styles.bubble,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor,
            },
            selected && {
              borderWidth: 2.5,
              borderColor: colors.primary,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 6,
            },
          ]}
        >
          <MoodIcon mood={mood} size={size * 0.45} />
        </View>
      </Pressable>
      </Animated.View>
      <Text
        variant="small"
        style={styles.label}
        color={selected ? colors.text : colors.textMuted}
      >
        {MOOD_LABELS[mood].toUpperCase()}
      </Text>
    </View>
  );
}

function MoodIcon({ mood, size }: { mood: MoodType; size: number }) {
  const color = Colors.primaryDark;
  // Simplified mood icons — each represents the emotional state
  switch (mood) {
    case 'anxious':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M9 10v7M15 10v7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M10 20h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M8 3l-1-1.5M16 3l1-1.5M12 2V0.5" stroke={color} strokeWidth={1} strokeLinecap="round" />
        </Svg>
      );
    case 'overwhelmed':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="7" r="3" fill={color} />
          <Path d="M10 11c0 0-2.5 4-2.5 9M14 11c0 0 2.5 4 2.5 9" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M8 16h8M9 19h6" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );
    case 'stressed':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M12 10v5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M7 12l5 2 5-2" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M9 17l-2 5M15 17l2 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      );
    case 'restless':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M10 10l-3 8M14 10l3 8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M6 12l4-1M18 12l-4-1" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M8 20h8" stroke={color} strokeWidth={1.2} strokeLinecap="round" strokeDasharray="3 2" />
        </Svg>
      );
    case 'sad':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M9 10c0 0-1 6 3 8M15 10c0 0 1 6-3 8" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M7 14l5 3M17 14l-5 3" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );
    case 'irritable':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M12 10v5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M6 11l5 2M18 11l-5 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M9 17l-1 4M15 17l1 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      );
    case 'lonely':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M12 10v6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M9 17l-1 4M15 17l1 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Circle cx="12" cy="22" r="2" stroke={color} strokeWidth={1} fill="none" />
        </Svg>
      );
    case 'numb':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} opacity={0.6} />
          <Path d="M12 10v8" stroke={color} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
          <Path d="M8 20h8" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
        </Svg>
      );
    case 'calm':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M12 10v5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M7 13l5 2 5-2" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M9 17l-2 5M15 17l2 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Circle cx="12" cy="23" r="2" stroke={color} strokeWidth={1} fill="none" />
        </Svg>
      );
    case 'hopeful':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M12 10v5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M8 12l4 3 4-3" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M10 18h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M12 20v2" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );
    case 'happy':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M12 10v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M6 11l6 3 6-3" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M9 16l-2 5M15 16l2 5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
      );
    case 'grateful':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="6" r="3" fill={color} />
          <Path d="M12 10v4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M7 12l5 3 5-3" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M10 18l-1 4M14 18l1 4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M12 16l-2 2 2 2 2-2-2-2z" fill={color} opacity={0.3} />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={1.5} />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bubble: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: 'Inter-SemiBold',
  },
});
