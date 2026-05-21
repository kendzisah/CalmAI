import { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text, Button } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { ThemeProvider } from '@/theme';
import { useEffect } from 'react';
import { track } from '@/lib/analytics';

const STEPS = [
  { count: 5, sense: 'SEE', prompt: 'Look around. What are 5 things you can see?', icon: 'eye' },
  { count: 4, sense: 'TOUCH', prompt: 'What are 4 things you can physically feel right now?', icon: 'hand' },
  { count: 3, sense: 'HEAR', prompt: 'Pause and listen. What are 3 sounds you notice?', icon: 'ear' },
  { count: 2, sense: 'SMELL', prompt: 'Take a breath in. What are 2 things you can smell?', icon: 'nose' },
  { count: 1, sense: 'TASTE', prompt: 'Last one. What is 1 thing you can taste?', icon: 'taste' },
] as const;

// Public export wraps the screen body in a forced-light ThemeProvider —
// the grounding flow uses light surfaces / cards that don't invert well.
export default function GroundScreen() {
  return (
    <ThemeProvider force="light">
      <GroundScreenInner />
    </ThemeProvider>
  );
}

function GroundScreenInner() {
  const [stepIndex, setStepIndex] = useState(0);
  const [inputs, setInputs] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    track('ground_started');
  }, []);

  useEffect(() => {
    if (isComplete) track('ground_completed', { steps_completed: STEPS.length });
  }, [isComplete]);

  const step = STEPS[stepIndex];

  const handleAddItem = () => {
    const text = currentInput.trim();
    if (!text) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newInputs = [...inputs, text];
    setInputs(newInputs);
    setCurrentInput('');

    if (newInputs.length >= step.count) {
      // Move to next step
      if (stepIndex < STEPS.length - 1) {
        Animated.sequence([
          Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
          setStepIndex(stepIndex + 1);
          setInputs([]);
        }, 200);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsComplete(true);
      }
    }
  };

  if (isComplete) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.sageGreen }]}>
        <View style={styles.completeContent}>
          <Text variant="h1" style={{ textAlign: 'center', color: Colors.primaryDark }}>
            You're here.{'\n'}You're present.
          </Text>
          <Text variant="body" style={{ textAlign: 'center', color: Colors.primaryDark, opacity: 0.7 }}>
            You just reconnected with all five senses. That's a flex.
          </Text>
          <Pressable style={styles.doneButton} onPress={() => router.back()}>
            <Text variant="bodyMedium" color={Colors.primaryDark}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const remaining = step.count - inputs.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeButton}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.gray} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </Pressable>
          <Text variant="bodyMedium">5-4-3-2-1 Grounding</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Progress dots */}
        <View style={styles.progressRow}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < stepIndex && styles.progressDotDone,
                i === stepIndex && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        {/* Scrollable body so the input can rise above the keyboard
            without clipping the count circle / prompt above it */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
              {/* Count circle */}
              <View style={styles.countCircle}>
                <Text variant="h1" style={{ fontSize: 48 }} color={Colors.primary}>{remaining}</Text>
                <Text variant="label" color={Colors.primary}>{step.sense}</Text>
              </View>

              {/* Prompt */}
              <Text variant="body" color={Colors.gray} style={styles.prompt}>
                {step.prompt}
              </Text>

              {/* Entered items */}
              <View style={styles.itemsContainer}>
                {inputs.map((item, i) => (
                  <View key={i} style={styles.itemPill}>
                    <Text variant="caption" color={Colors.primaryDark}>{item}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </ScrollView>

        {/* Input pinned to the bottom — KeyboardAvoidingView lifts this above
            the keyboard so the user can always see what they're typing. */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder={`What can you ${step.sense.toLowerCase()}?`}
            placeholderTextColor={Colors.gray}
            value={currentInput}
            onChangeText={setCurrentInput}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
            blurOnSubmit={false}
            autoFocus
          />
          <Button title="Add" variant="pill" onPress={handleAddItem} disabled={!currentInput.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  progressDotDone: {
    backgroundColor: Colors.sageGreen,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    width: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  countCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.lavenderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 40,
  },
  itemPill: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.lavenderLight,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.base,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EAEAEA',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.primaryDark,
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
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
});
