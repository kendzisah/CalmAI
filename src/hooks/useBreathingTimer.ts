import { useEffect, useRef } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useBreathingStore } from '@/stores/breathingStore';
import { PHASE_ORDER } from '@/types/breathing';
import { BreathingConfig } from '@/lib/constants';

export function useBreathingTimer() {
  const {
    phase, countdown, cycle, totalCycles,
    isPaused, isActive, isComplete, technique,
    start, pause, resume, reset,
    setPhase, setCountdown, setCycle, complete,
  } = useBreathingStore();

  const circleScale = useSharedValue(0.6);
  const phaseTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (!isActive || isPaused || isComplete) return;

    const phaseDurations = {
      inhale: { ms: BreathingConfig.inhale * 1000, scale: 1.0 },
      hold1: { ms: BreathingConfig.hold1 * 1000, scale: 1.0 },
      exhale: { ms: BreathingConfig.exhale * 1000, scale: 0.6 },
      hold2: { ms: BreathingConfig.hold2 * 1000, scale: 0.6 },
    };

    const config = phaseDurations[phase];

    // Haptic on phase change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate circle
    circleScale.value = withTiming(config.scale, {
      duration: config.ms,
      easing: Easing.inOut(Easing.ease),
    });

    // Countdown
    let count = 4;
    setCountdown(4);
    countdownRef.current = setInterval(() => {
      count--;
      if (count >= 1) setCountdown(count);
    }, 1000);

    // Phase transition
    phaseTimerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);

      const currentIndex = PHASE_ORDER.indexOf(phase);
      const nextIndex = currentIndex + 1;

      if (nextIndex >= PHASE_ORDER.length) {
        if (cycle >= totalCycles) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          complete();
        } else {
          setCycle(cycle + 1);
          setPhase('inhale');
        }
      } else {
        setPhase(PHASE_ORDER[nextIndex]);
      }
    }, config.ms);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (phaseTimerRef.current) clearTimeout(phaseTimerRef.current);
    };
  }, [phase, cycle, isPaused, isActive, isComplete]);

  // Progress calculation
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  const cycleProgress = (phaseIndex * 4 + (4 - countdown)) / 16;
  const totalProgress = ((cycle - 1) + cycleProgress) / totalCycles;

  return {
    phase, countdown, cycle, totalCycles,
    isPaused, isActive, isComplete, technique,
    circleScale, totalProgress,
    start, pause, resume, reset,
  };
}
