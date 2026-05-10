import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Easing, Platform } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/lib/constants';

interface Props {
  userMessage: string;
  aiMessage: string;
  /** Small line shown under the AI bubble (e.g. "Sarah · just now"). */
  timestampLabel?: string;
  /** Date pill at the top of the thread. */
  dateLabel?: string;
}

export function ChatMockup({
  userMessage,
  aiMessage,
  timestampLabel,
  dateLabel = 'Today 11:47 PM',
}: Props) {
  const [showAi, setShowAi] = useState(false);
  const aiOpacity = useRef(new Animated.Value(0)).current;
  const aiTranslate = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    // Show typing for ~1.2s, then swap to AI bubble with a soft fade-in.
    const timeout = setTimeout(() => {
      setShowAi(true);
      Animated.parallel([
        Animated.timing(aiOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(aiTranslate, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.frame}>
      <ChatHeader />

      <View style={styles.thread}>
        <View style={styles.datePillWrap}>
          <Text variant="small" color={Colors.gray} style={styles.datePillText}>
            {dateLabel}
          </Text>
        </View>

        {/* User message */}
        <View style={[styles.row, styles.userRow]}>
          <View style={[styles.bubble, styles.userBubble]}>
            <Text variant="body" style={styles.userText}>
              {userMessage}
            </Text>
            <BubbleTail side="right" color="#E9E9EB" />
          </View>
        </View>
        <Text variant="small" color={Colors.gray} style={styles.readReceipt}>
          Read · 11:47 PM
        </Text>

        {/* Typing → AI reply swap */}
        {!showAi ? (
          <View style={[styles.row, styles.aiRow]}>
            <View style={styles.aiAvatarSmall}>
              <CalmAIMark size={14} />
            </View>
            <View style={styles.typingBubble}>
              <TypingDot delay={0} />
              <TypingDot delay={150} />
              <TypingDot delay={300} />
            </View>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.row,
              styles.aiRow,
              {
                opacity: aiOpacity,
                transform: [{ translateY: aiTranslate }],
              },
            ]}
          >
            <View style={styles.aiAvatarSmall}>
              <CalmAIMark size={14} />
            </View>
            <View style={[styles.bubble, styles.aiBubble]}>
              <Text variant="body" style={styles.aiText}>
                {aiMessage}
              </Text>
              <BubbleTail side="left" color={Colors.lavenderLight} />
            </View>
          </Animated.View>
        )}

        {timestampLabel && showAi ? (
          <Animated.Text
            style={[
              styles.threadFooter,
              {
                color: Colors.gray,
                opacity: aiOpacity,
              },
            ]}
          >
            {timestampLabel}
          </Animated.Text>
        ) : null}
      </View>
    </View>
  );
}

function ChatHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.headerCenter}>
        <View style={styles.headerAvatar}>
          <CalmAIMark size={24} />
        </View>
        <View style={styles.headerTextWrap}>
          <View style={styles.headerNameRow}>
            <Text variant="bodyMedium" color={Colors.primaryDark}>CalmAI</Text>
            <View style={styles.activeDot} />
          </View>
          <Text variant="small" color={Colors.gray}>Active now</Text>
        </View>
      </View>
    </View>
  );
}

function CalmAIMark({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={Colors.primary} />
      <Path
        d="M8 13c1.5 1.8 4 2.4 5.6 1.6 1.4-.7 2.4-2.6 2.4-4.6"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function TypingDot({ delay }: { delay: number }) {
  const dot = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 350, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[styles.typingDot, { opacity: dot }]} />;
}

function BubbleTail({ side, color }: { side: 'left' | 'right'; color: string }) {
  // Approximates the iMessage tail at the bubble's bottom corner.
  const positionStyle = side === 'right' ? styles.tailRight : styles.tailLeft;
  return (
    <View style={[styles.tail, positionStyle, { backgroundColor: color }]} />
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FAFAFB',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    alignSelf: 'center',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { gap: 2 },
  headerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.sageGreen,
  },
  thread: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
    gap: Spacing.xs,
    minHeight: 240,
  },
  datePillWrap: {
    alignSelf: 'center',
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  datePillText: {
    letterSpacing: 0.3,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    gap: 6,
  },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { alignItems: 'flex-end' },
  aiAvatarSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: 22,
    position: 'relative',
  },
  userBubble: {
    backgroundColor: '#E9E9EB',
    borderBottomRightRadius: 6,
  },
  userText: {
    color: '#1A1A1A',
    fontSize: 15,
    lineHeight: 20,
  },
  aiBubble: {
    backgroundColor: Colors.lavenderLight,
    borderBottomLeftRadius: 6,
  },
  aiText: {
    color: Colors.primaryDark,
    fontSize: 15,
    lineHeight: 21,
  },
  tail: {
    position: 'absolute',
    width: 14,
    height: 14,
    bottom: -1,
    borderRadius: 4,
    transform: [{ rotate: '45deg' }],
  },
  tailRight: {
    right: -3,
  },
  tailLeft: {
    left: -3,
  },
  readReceipt: {
    alignSelf: 'flex-end',
    paddingRight: Spacing.xs,
    marginTop: 2,
    marginBottom: Spacing.xs,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  typingBubble: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Colors.lavenderLight,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primaryDark,
  },
  threadFooter: {
    alignSelf: 'flex-end',
    paddingRight: Spacing.xs,
    marginTop: Spacing.xs,
    fontSize: 11,
  },
});
