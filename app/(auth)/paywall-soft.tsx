import { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { GradientBackground, Text, Button } from '@/components/ui';
import { ChatMockup } from '@/components/onboarding/ChatMockup';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { track } from '@/lib/analytics';

// Vent / reply pairs that read like real late-night texts.
// Each AI reply is written in three tone variants — picked at render time
// from the user's tonePref selection in onboarding (Screen 08).
//
// Tone rules (from spec §3 Screen 11):
// - real      → drop soft openers, get to the question fast
// - gentle    → validate first, soft question second (default)
// - read_room → match the user's energy; short user → short CalmAI
import type { TonePref } from '@/types/user';

const CONVERSATIONS: Array<{
  user: string;
  ai: Record<TonePref, string>;
}> = [
  {
    user: "i had a panic attack at lunch and i don't even know why",
    ai: {
      real:
        "you don't always need a why — bodies fire off before the mind catches up. did it pass on its own, or are you still riding it out?",
      gentle:
        "those are the worst — your body just goes off without context. did it pass, or are you still in it?",
      read_room:
        "panic without a reason is its own kind of awful. i'm here. are you still feeling it, or did it ease up?",
    },
  },
  {
    user: "my boss said something today and i can't stop replaying it",
    ai: {
      real:
        "the replay is your brain trying to find the comeback you didn't get to make. what did she actually say? let's pull it apart.",
      gentle:
        "okay. what did she say? let's take it apart together.",
      read_room:
        "ugh, the replay loop. tell me what she said — sometimes saying it out loud takes some of the charge out.",
    },
  },
  {
    user: "i can't sleep. it's almost 2 and i'm just lying here",
    ai: {
      real:
        "lying there is its own kind of work — your nervous system isn't off, it's just stuck. what's keeping your brain on tonight?",
      gentle:
        "yeah. 2am has its own logic. what's looping right now?",
      read_room:
        "2am with no off-switch is brutal. i'm up too. what's running through your head?",
    },
  },
  {
    user: "i think i'm being too much again",
    ai: {
      real:
        "let's not take that one as fact yet. whose voice is that — yours, or someone you've been around today?",
      gentle:
        "to who? did someone say that, or are you saying it about yourself?",
      read_room:
        "that thought hits hard. is it coming from you tonight, or did someone hand it to you today?",
    },
  },
  {
    user: "today was just a lot. i don't even know how to start",
    ai: {
      real:
        "you don't have to start clean. name the loudest moment from today and we'll work outward from there.",
      gentle:
        "you don't have to start at the beginning. just give me one thing.",
      read_room:
        "those days. don't worry about starting at the start — what's the part that's still buzzing in your chest?",
    },
  },
];

const BENEFITS = [
  'Unlimited late-night talks — whenever it hits',
  'A space that learns your tone, not the other way around',
  'Quiet check-ins at the time you said it usually starts',
  'Journal prompts shaped from what you actually share',
];

export default function PaywallSoftScreen() {
  const { completeStep, nickname, tonePref } = useOnboardingStore();
  const [showBenefits, setShowBenefits] = useState(false);

  const conversation = useMemo(
    () => CONVERSATIONS[Math.floor(Math.random() * CONVERSATIONS.length)],
    []
  );
  const tone: TonePref = tonePref ?? 'gentle';
  const aiMessage = conversation.ai[tone];

  useEffect(() => {
    track('paywall_soft_viewed', { tone, conversation_user: conversation.user });
  }, [tone, conversation.user]);

  const handleStart = async () => {
    track('paywall_soft_primary_tapped', { tone, conversation_user: conversation.user });
    await completeStep(12);
    router.push('/paywall');
  };

  const handleBenefits = () => {
    track('paywall_soft_benefits_tapped');
    setShowBenefits(true);
  };

  const timestampLabel = nickname ? `${nickname} · just now` : 'You · just now';

  return (
    <GradientBackground variant="onboarding">
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.eyebrowRow}>
              <Sparkle />
              <Text variant="label" color={Colors.primary} style={styles.eyebrow}>
                3 Days Free
              </Text>
              <Sparkle />
            </View>
            <Text variant="h1" style={styles.headline}>
              First 3 days{'\n'}are on me.
            </Text>
            <Text variant="body" color={Colors.gray} style={styles.subtitle}>
              Try CalmAI free for 3 days. No charge today.
            </Text>
          </View>

          <ChatMockup
            userMessage={conversation.user}
            aiMessage={aiMessage}
            timestampLabel={timestampLabel}
          />

          <View style={styles.trustStrip}>
            <TrustChip icon="check" label="No charge today" />
            <TrustChip icon="cancel" label="Cancel anytime" />
            <TrustChip icon="lock" label="Private & encrypted" />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button title="Start my 3 days" onPress={handleStart} />
          <Pressable onPress={handleBenefits} style={styles.secondary}>
            <Text variant="body" color={Colors.primary} style={styles.secondaryText}>
              What's included?
            </Text>
          </Pressable>
        </View>

        <BenefitsSheet visible={showBenefits} onClose={() => setShowBenefits(false)} />
      </SafeAreaView>
    </GradientBackground>
  );
}

function Sparkle() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"
        fill={Colors.primary}
        opacity={0.85}
      />
    </Svg>
  );
}

function TrustChip({ icon, label }: { icon: 'check' | 'cancel' | 'lock'; label: string }) {
  return (
    <View style={styles.trustChip}>
      <View style={styles.trustIcon}>
        <TrustIcon name={icon} />
      </View>
      <Text variant="small" color={Colors.primaryDark} style={styles.trustLabel}>
        {label}
      </Text>
    </View>
  );
}

function TrustIcon({ name }: { name: 'check' | 'cancel' | 'lock' }) {
  if (name === 'check') {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5 12.5l4 4L19 7"
          stroke={Colors.sageGreen}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (name === 'cancel') {
    return (
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0z"
          stroke={Colors.primary}
          strokeWidth={1.6}
        />
        <Path
          d="M12 7v5l3 2"
          stroke={Colors.primary}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 11V8a6 6 0 1 1 12 0v3"
        stroke={Colors.primary}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Path
        d="M5 11h14v9H5z"
        stroke={Colors.primary}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BenefitsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => { /* swallow */ }}>
          <View style={styles.sheetHandle} />
          <Text variant="h2" style={styles.sheetTitle}>What's included</Text>
          {BENEFITS.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <View style={styles.benefitBullet}>
                <Sparkle />
              </View>
              <Text variant="body" style={styles.benefitText}>{b}</Text>
            </View>
          ))}
          <Button title="Got it" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  header: { gap: Spacing.sm, alignItems: 'center' },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(124, 92, 191, 0.1)',
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 11,
    letterSpacing: 1,
  },
  headline: {
    textAlign: 'center',
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: { textAlign: 'center' },
  trustStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.grayLavender,
  },
  trustIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'stretch',
    backgroundColor: 'transparent',
  },
  secondary: {
    padding: Spacing.sm,
    alignSelf: 'center',
  },
  secondaryText: {
    textDecorationLine: 'underline',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayLavender,
    marginBottom: Spacing.sm,
  },
  sheetTitle: { textAlign: 'center' },
  benefitRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  benefitBullet: {
    paddingTop: 4,
  },
  benefitText: { flex: 1 },
});
