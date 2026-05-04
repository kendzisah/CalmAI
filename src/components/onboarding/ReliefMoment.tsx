import { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, Input, Button } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';
import type { MoodType, MoodTier } from '@/types/mood';

interface Props {
  mood: MoodType;
  moodTier: MoodTier;
  onComplete: () => void;
  onGratitudeEntry?: (text: string) => void;
}

const LOW_ENERGY_MESSAGES: Partial<Record<MoodType, string>> = {
  sad: "Hey. I see you, and I'm glad you're here. Sadness hits different when you're carrying it alone. You don't have to do that anymore.",
  irritable: "Totally valid. When everything is too much, of course you're on edge. You don't have to mask it right now. Let's just take a breath.",
  lonely: "You showed up, and that takes guts. I'm here with you, and trust me — so many others get exactly what you're feeling.",
  numb: "Feeling nothing? That's its own kind of exhausting. You don't have to force anything right now. Just being here is enough.",
};

export function ReliefMoment({ mood, moodTier, onComplete, onGratitudeEntry }: Props) {
  if (moodTier === 'high_anxiety') {
    return <MiniBreathingExercise onComplete={onComplete} />;
  }
  if (moodTier === 'low_energy') {
    return <TypewriterMessage mood={mood} onComplete={onComplete} />;
  }
  return <GratitudeMoment onComplete={onComplete} onEntry={onGratitudeEntry} />;
}

// --- High Anxiety: 30-second mini breathing (2 cycles) ---
function MiniBreathingExercise({ onComplete }: { onComplete: () => void }) {
  const [cycle, setCycle] = useState(1);
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'hold2'>('inhale');
  const [countdown, setCountdown] = useState(4);
  const circleScale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const phases: Array<{ phase: string; duration: number; scale: number }> = [
      { phase: 'inhale', duration: 4000, scale: 1.0 },
      { phase: 'hold', duration: 4000, scale: 1.0 },
      { phase: 'exhale', duration: 4000, scale: 0.6 },
      { phase: 'hold2', duration: 4000, scale: 0.6 },
    ];

    let currentPhase = 0;
    let currentCycle = 1;

    const runPhase = () => {
      if (currentCycle > 2) {
        onComplete();
        return;
      }

      const p = phases[currentPhase];
      setPhase(p.phase as any);
      setCountdown(4);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Animated.timing(circleScale, {
        toValue: p.scale,
        duration: p.duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();

      // Countdown
      let count = 4;
      const countInterval = setInterval(() => {
        count--;
        if (count >= 1) setCountdown(count);
      }, 1000);

      setTimeout(() => {
        clearInterval(countInterval);
        currentPhase++;
        if (currentPhase >= phases.length) {
          currentPhase = 0;
          currentCycle++;
          setCycle(currentCycle);
        }
        runPhase();
      }, p.duration);
    };

    runPhase();
  }, []);

  const phaseLabel = phase === 'inhale' ? 'Inhale...' : phase === 'exhale' ? 'Exhale...' : 'Hold...';

  return (
    <View style={styles.breathContainer}>
      <Animated.View style={[styles.breathCircle, { transform: [{ scale: circleScale }] }]}>
        <Text variant="h2" color={Colors.primaryDark}>{phaseLabel}</Text>
        <Text variant="h1" color={Colors.primaryDark}>{countdown}</Text>
      </Animated.View>
      <Text variant="caption" style={styles.cycleText}>{cycle} of 2</Text>
    </View>
  );
}

// --- Low Energy: Typewriter AI message ---
function TypewriterMessage({ mood, onComplete }: { mood: MoodType; onComplete: () => void }) {
  const message = LOW_ENERGY_MESSAGES[mood] || LOW_ENERGY_MESSAGES.sad!;
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayText(message.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        // Auto-advance after a pause
        setTimeout(onComplete, 3000);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <View style={styles.messageContainer}>
      <View style={styles.aiBubble}>
        <Text variant="body" color={Colors.primaryDark} style={styles.messageText}>
          {displayText}
        </Text>
      </View>
      <Text variant="caption" style={styles.senderLabel}>CalmAI</Text>
    </View>
  );
}

// --- Positive: Gratitude micro-moment ---
function GratitudeMoment({ onComplete, onEntry }: { onComplete: () => void; onEntry?: (text: string) => void }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onEntry?.(text.trim());
    }
    onComplete();
  };

  return (
    <View style={styles.gratitudeContainer}>
      <Text variant="h2" style={styles.gratitudeTitle}>Hold onto this feeling.</Text>
      <Text variant="body" color={Colors.gray} style={styles.gratitudeSubtext}>
        What's one thing that hit different today (in a good way)?
      </Text>
      <Input
        placeholder="A warm cup of coffee... a text from a friend..."
        value={text}
        onChangeText={setText}
        style={styles.gratitudeInput}
      />
      <Button
        title={text.trim() ? 'Save & Continue' : 'Skip'}
        onPress={handleSubmit}
        variant={text.trim() ? 'primary' : 'ghost'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  breathContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  breathCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  cycleText: {
    textAlign: 'center',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  aiBubble: {
    backgroundColor: Colors.lavenderLight,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: Spacing.base,
    maxWidth: '85%',
  },
  messageText: {
    lineHeight: 26,
  },
  senderLabel: {
    marginLeft: Spacing.sm,
  },
  gratitudeContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  gratitudeTitle: {
    textAlign: 'center',
  },
  gratitudeSubtext: {
    textAlign: 'center',
  },
  gratitudeInput: {
    minHeight: 48,
  },
});
