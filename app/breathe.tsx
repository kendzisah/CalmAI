import { useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';
import { useBreathingTimer } from '@/hooks/useBreathingTimer';
import { PHASE_LABELS } from '@/types/breathing';
import type { BreathingPhase } from '@/types/breathing';

export default function BreatheScreen() {
  const {
    phase, countdown, cycle, totalCycles,
    isPaused, isActive, isComplete,
    circleScale, totalProgress,
    start, pause, resume, reset,
  } = useBreathingTimer();

  useEffect(() => {
    start(4, 'box');
    return () => reset();
  }, []);

  const circleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));

  const instructions: Record<BreathingPhase, string> = {
    inhale: 'Let the air fill your lungs completely, as the circle grows.',
    hold1: 'Hold gently. Feel the stillness.',
    exhale: 'Release slowly. Let everything go.',
    hold2: 'Rest in the emptiness for a moment.',
  };

  if (isComplete) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.primary }]}>
        <View style={styles.completeContent}>
          <Text variant="h1" style={{ color: '#FFFFFF', textAlign: 'center' }}>
            You just did something{'\n'}really good for yourself.
          </Text>
          <Pressable
            style={styles.doneButton}
            onPress={() => router.back()}
          >
            <Text variant="bodyMedium" color={Colors.primary}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </Pressable>
        <Text variant="bodyMedium" style={{ color: '#FFFFFF' }}>Deep Calm</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Progress Ring + Breathing Circle */}
        <View style={styles.circleContainer}>
          <Svg width={240} height={240} style={styles.progressRing}>
            <SvgCircle
              cx={120} cy={120} r={110}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={4}
              fill="none"
            />
            <SvgCircle
              cx={120} cy={120} r={110}
              stroke={Colors.lavenderLight}
              strokeWidth={4}
              fill="none"
              strokeDasharray={`${2 * Math.PI * 110}`}
              strokeDashoffset={`${2 * Math.PI * 110 * (1 - totalProgress)}`}
              strokeLinecap="round"
              transform="rotate(-90 120 120)"
            />
          </Svg>
          <Animated.View style={[styles.breathCircle, circleAnimStyle]}>
            <Text variant="h2" color={Colors.primaryDark}>
              {PHASE_LABELS[phase]}
            </Text>
            <Text variant="h1" color={Colors.primaryDark}>
              {countdown}
            </Text>
          </Animated.View>
        </View>

        {/* Instruction */}
        <Text variant="body" style={styles.instruction}>
          {instructions[phase]}
        </Text>

        {/* Cycle indicator */}
        <Text variant="caption" style={styles.cycleText}>
          {cycle} of {totalCycles}
        </Text>
      </View>

      {/* Pause Button */}
      <View style={styles.footer}>
        <Pressable
          style={styles.pauseButton}
          onPress={() => isPaused ? resume() : pause()}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="#FFFFFF">
            {isPaused ? (
              <Path d="M5 3l14 9-14 9V3z" />
            ) : (
              <>
                <Path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </>
            )}
          </Svg>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  circleContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
  },
  breathCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  instruction: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  cycleText: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  pauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
  },
  doneButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
});
