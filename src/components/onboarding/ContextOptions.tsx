import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Chip } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';
import type { MoodTier } from '@/types/mood';
import type { ContextTag } from '@/types/user';

interface ContextOption {
  label: string;
  tag: ContextTag;
}

const CONTEXT_OPTIONS: Record<MoodTier, { subtext: string; options: ContextOption[] }> = {
  high_anxiety: {
    subtext: 'Knowing a bit more helps me support you better.',
    options: [
      { label: "I'm having a hard moment right now", tag: 'acute_crisis' },
      { label: 'Work / school is stressing me out', tag: 'situational_stress' },
      { label: "I can't stop worrying", tag: 'generalized_anxiety' },
      { label: "I'm having trouble sleeping", tag: 'insomnia_rumination' },
      { label: 'I just need someone to talk to', tag: 'companionship' },
      { label: "I'd rather not say", tag: 'skip' },
    ],
  },
  low_energy: {
    subtext: "You don't have to explain everything. Just a little helps.",
    options: [
      { label: "I've been feeling this way for a while", tag: 'persistent_low_mood' },
      { label: 'Something happened today', tag: 'event_triggered' },
      { label: 'I feel disconnected from people', tag: 'isolation' },
      { label: "I don't really know why I feel this way", tag: 'unclear_trigger' },
      { label: 'I just want to feel something different', tag: 'seeking_change' },
      { label: "I'd rather not say", tag: 'skip' },
    ],
  },
  positive: {
    subtext: "Love that you're here. Let's make the most of this moment.",
    options: [
      { label: 'I want to keep this feeling going', tag: 'maintenance' },
      { label: "I'm building better habits", tag: 'habit_building' },
      { label: 'I want to prepare for harder days', tag: 'preventive_care' },
      { label: "I'm curious what this app does", tag: 'exploration' },
      { label: 'Someone recommended CalmAI to me', tag: 'referral' },
      { label: "I'd rather not say", tag: 'skip' },
    ],
  },
};

interface Props {
  moodTier: MoodTier;
  selectedContext?: ContextTag;
  onSelectContext: (tag: ContextTag) => void;
}

export function ContextOptions({ moodTier, selectedContext, onSelectContext }: Props) {
  const config = CONTEXT_OPTIONS[moodTier];

  return (
    <View style={styles.container}>
      <Text variant="h1" style={styles.question}>
        What brings you to CalmAI?
      </Text>
      <Text variant="body" color={Colors.gray} style={styles.subtext}>
        {config.subtext}
      </Text>

      <View style={styles.options}>
        {config.options.map((option) => (
          <Pressable
            key={option.tag}
            style={[
              styles.option,
              selectedContext === option.tag && styles.optionSelected,
            ]}
            onPress={() => onSelectContext(option.tag)}
          >
            <Text
              variant="body"
              color={selectedContext === option.tag ? Colors.primary : Colors.primaryDark}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  question: {
    textAlign: 'center',
  },
  subtext: {
    textAlign: 'center',
  },
  options: {
    gap: Spacing.md,
    marginTop: Spacing.base,
  },
  option: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.base,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F5F0FF',
  },
});
