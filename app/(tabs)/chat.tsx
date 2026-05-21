import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text, Chip } from '@/components/ui';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { FindSupportSheet } from '@/components/chat/FindSupportSheet';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { useThemeColors } from '@/theme';
import { useChatStore } from '@/stores/chatStore';
import { usePaywall } from '@/hooks/usePaywall';
import { detectCrisis } from '@/utils/crisisDetection';
import { sendChatMessage, fetchAiOpener } from '@/services/chatService';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import { useSubscription } from '@/hooks/useSubscription';
import { buildFirstMessage } from '@/lib/firstMessage';
import { getCachedOpener, setCachedOpener } from '@/lib/openerCache';
import { track } from '@/lib/analytics';
import type { ChatMessage } from '@/types/chat';

const DEFAULT_CHIPS = ["I'm feeling anxious", "I need to vent", "Help me regulate", "Just talk"];

// Each store slice is read with a selector so the screen only re-renders
// when that specific slice changes. Without selectors, every token append
// during streaming would re-render the entire ChatScreen + FlatList,
// which jams the main thread (we saw 5.9s update latency in logs).
export default function ChatScreen() {
  const colors = useThemeColors();
  const messages = useChatStore((s) => s.messages);
  const currentSession = useChatStore((s) => s.currentSession);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const quickReplies = useChatStore((s) => s.quickReplies);
  const startSession = useChatStore((s) => s.startSession);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addAssistantMessage = useChatStore((s) => s.addAssistantMessage);
  const setQuickReplies = useChatStore((s) => s.setQuickReplies);
  const getLifetimeSessionCount = useChatStore((s) => s.getLifetimeSessionCount);
  const { guardChat } = usePaywall();
  const { isPro } = useSubscription();
  const onboarding = useOnboardingStore();
  const { isAuthenticated, isAnonymous } = useAuthStore();
  const _needsAccount = !isAuthenticated || isAnonymous;
  const [inputText, setInputText] = useState('');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const seededRef = useRef(false);
  // Tracks whether we've already fired crisis_detected for the current session
  // so the event doesn't double-fire if a user keeps sending flagged messages
  // back-to-back. Per-session dedupe matches how the banner persists.
  const crisisFiredRef = useRef(false);

  // Subscription gate. Non-Pro users get pushed to the paywall on mount.
  // Server-side chat-completion also returns 402, so this UI block is the
  // first line of defense and prevents a blank chat from rendering.
  useEffect(() => {
    if (!isPro) {
      router.replace('/paywall');
    }
  }, [isPro]);

  useEffect(() => {
    if (!currentSession) {
      startSession(onboarding.selectedMood);
    }
  }, []);

  // Seed the personalized first message once per session.
  // CalmAI is subscription-only, so every user who reaches the seed path is
  // Pro. Returning users get an AI-generated opener based on recent history,
  // cached once per calendar day. The very first conversation falls back to
  // the static personalized intro in firstMessage.ts because the AI has no
  // prior history to reference yet.
  useEffect(() => {
    if (!currentSession || seededRef.current) return;
    if (messages.length > 0) {
      seededRef.current = true;
      return;
    }
    if (!isPro) return;
    seededRef.current = true;
    (async () => {
      let previousSessionCount = 0;
      try {
        const total = await getLifetimeSessionCount();
        previousSessionCount = Math.max(0, total - 1);
      } catch {
        // Count query failed. Default to first-ever copy.
      }

      const staticOpener = buildFirstMessage({
        nickname: onboarding.nickname,
        loudCategories: onboarding.loudCategories,
        triggerTimes: onboarding.triggerTimes,
        tonePref: onboarding.tonePref,
        previousSessionCount,
      });

      const isFirstEver = previousSessionCount === 0;

      let opener = staticOpener;
      if (!isFirstEver) {
        try {
          const cached = await getCachedOpener();
          if (cached) {
            opener = cached;
          } else {
            const ai = await fetchAiOpener({
              nickname: onboarding.nickname ?? undefined,
              loudCategories: onboarding.loudCategories,
              triggerTimes: onboarding.triggerTimes,
              copingPrefs: onboarding.copingPrefs,
              tonePref: onboarding.tonePref ?? undefined,
            });
            if (ai) {
              opener = ai;
              setCachedOpener(ai, 'ai').catch(() => {});
            } else {
              setCachedOpener(staticOpener, 'static').catch(() => {});
            }
          }
        } catch {
          // AI or cache layer failed. The static opener already covers this path.
        }
      }

      addAssistantMessage(opener).catch(() => {});
      track('chat_first_message_replied');
    })();
  }, [currentSession, messages.length, isPro]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText) return;

    const allowed = await guardChat();
    if (!allowed) return;

    if (detectCrisis(messageText)) {
      setShowCrisisBanner(true);
      // Behavior decision: keep submission flowing. The banner + Find Support
      // sheet is the UI safety net; server-side moderation in
      // supabase/functions/chat-completion is the authoritative gate. Blocking
      // here would mask the user's signal from the model (which is tuned for
      // these messages) and break the experience for false positives.
      if (!crisisFiredRef.current) {
        crisisFiredRef.current = true;
        track('crisis_detected', { message_length: messageText.length });
      }
    }

    setInputText('');
    const isFirst = messages.length <= 1;
    await addUserMessage(messageText);
    // Fires on every send; is_first distinguishes the activation moment from
    // ongoing engagement. PostHog can split daily volume vs first-message rate.
    track('chat_message_sent', {
      is_first: isFirst,
      message_length: messageText.length,
      message_index: messages.length,
    });

    try {
      await sendChatMessage(currentSession!.id, messageText, {
        isFirstConversation: isFirst,
        nickname: onboarding.nickname ?? undefined,
        loudCategories: onboarding.loudCategories,
        triggerTimes: onboarding.triggerTimes,
        copingPrefs: onboarding.copingPrefs,
        tonePref: onboarding.tonePref ?? undefined,
        // Legacy passthrough for any analytics still consuming these
        onboardingMood: onboarding.selectedMood || undefined,
        onboardingContext: onboarding.selectedContext || undefined,
        reliefTag: onboarding.reliefTag || undefined,
      });
    } catch (err: any) {
      if (err?.message === 'PAYWALL') {
        router.push('/paywall');
      } else if (err?.message === 'Not authenticated') {
        await addAssistantMessage("Hey, I'd love to keep chatting but I need you to create an account so I can remember our convos. It only takes a sec.");
        setQuickReplies(["Let's do it", "Maybe later"]);
      } else {
        await addAssistantMessage("Ugh, something glitched on my end. Want to try again, or we could do a quick breathing exercise instead?");
        setQuickReplies(["Try again", "Let's breathe", "It's all good"]);
      }
    }
  }, [inputText, guardChat, addUserMessage, addAssistantMessage, setQuickReplies, currentSession, messages.length, onboarding]);

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble message={item} />,
    []
  );

  // Auto-scroll to bottom when new messages arrive or streaming starts/ends.
  // We deliberately do NOT scroll on every streamingContent change — that would
  // queue dozens of overlapping animated scrolls per second and jam the main
  // thread. The FlatList stays glued to the bottom via maintainVisibleContentPosition
  // (set below), and we only manually nudge it on explicit boundary events.
  useEffect(() => {
    if (messages.length === 0) return;
    const t = setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [messages.length, isStreaming]);

  const handleSupportPress = () => {
    track('support_sheet_opened');
    setShowSupportSheet(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderMuted }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth={2} />
              <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth={2} />
            </Svg>
          </View>
          <Text variant="bodyMedium">CalmAI</Text>
        </View>
        <Pressable onPress={handleSupportPress} style={styles.supportLink} hitSlop={8}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M12 2a10 10 0 100 20 10 10 0 000-20z" stroke={colors.primary} strokeWidth={1.8} />
            <Path d="M12 7v6M12 16h.01" stroke={colors.primary} strokeWidth={1.8} strokeLinecap="round" />
          </Svg>
          <Text variant="small" color={colors.primary}>Find support</Text>
        </Pressable>
      </View>

      <View style={[styles.datePill, { backgroundColor: colors.surfaceMuted }]}>
        <Text variant="small" color={colors.textMuted}>Today</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={messageKeyExtractor}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        // Pass the component reference (not <StreamingFooter />) so the
        // footer's own re-renders don't bubble up to the FlatList parent.
        ListFooterComponent={StreamingFooter}
        // Reasonable virtualization defaults for chat — keeps fewer offscreen
        // items mounted, which dramatically reduces re-render cost as the
        // conversation grows.
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {showCrisisBanner && (
        <Pressable style={styles.crisisBanner} onPress={handleSupportPress}>
          <Text variant="body" style={{ color: '#FFFFFF' }}>
            If it would help to talk to a real person right now, tap here to find a free crisis line near you.
          </Text>
        </Pressable>
      )}

      <View style={styles.chipsRow}>
        <FlatList
          horizontal
          data={quickReplies.length > 0 ? quickReplies : DEFAULT_CHIPS}
          renderItem={({ item }) => (
            <Chip
              label={item}
              size="small"
              onPress={() => {
                if (item === "Let's do it") {
                  router.push('/(auth)/sign-in');
                } else {
                  handleSend(item);
                }
              }}
            />
          )}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.chipsList}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.borderMuted }]}>
          <Pressable style={[styles.breatheShortcut, { backgroundColor: colors.primary }]} onPress={() => router.push('/breathe')}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth={2} />
            </Svg>
          </Pressable>
          <TextInput
            ref={inputRef}
            style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Message CalmAI..."
            placeholderTextColor={colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <Pressable style={[styles.sendButton, { backgroundColor: colors.primary }]} onPress={() => handleSend()}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <FindSupportSheet visible={showSupportSheet} onClose={() => setShowSupportSheet(false)} />
    </SafeAreaView>
  );
}

// ----------------- Memoized children -----------------

const messageKeyExtractor = (item: ChatMessage) => item.id;

const isAuthPrompt = (content: string) => content.includes('create an account');

// React.memo on the message bubble means each row only re-renders when its own
// `message` prop changes by reference. During streaming the messages array
// keeps the same object references for already-rendered messages, so they
// don't re-render on every token.
const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const colors = useThemeColors();
  const isAI = message.role === 'assistant';
  const showSignIn = isAI && isAuthPrompt(message.content);

  return (
    <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
      <View
        style={[
          styles.bubble,
          isAI
            ? { backgroundColor: colors.aiBubbleBg, borderBottomLeftRadius: 4 }
            : { backgroundColor: colors.userBubbleBg, borderBottomRightRadius: 4 },
        ]}
      >
        <Text variant="body" color={colors.text}>
          {message.content}
        </Text>
        {showSignIn && (
          <View style={styles.inlineSignInWrap}>
            <Pressable
              style={[styles.inlineSignIn, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Text variant="bodyMedium" color={colors.primary}>Create Account</Text>
            </Pressable>
          </View>
        )}
      </View>
      <Text
        variant="small"
        color={colors.textMuted}
        style={isAI ? styles.aiTime : styles.userTime}
      >
        {isAI ? 'CALMAI' : 'SENT'} -{' '}
        {new Date(message.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </Text>
    </View>
  );
});

// Streaming footer subscribes directly to its two slices of state. Because
// it's passed to FlatList as `ListFooterComponent={StreamingFooter}` (the
// component itself, not <StreamingFooter />), the FlatList renders it in
// place once and the footer's internal re-renders don't trigger the
// FlatList parent to re-render. Token append → only this footer re-renders.
function StreamingFooter() {
  const colors = useThemeColors();
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);

  if (!isStreaming) return null;
  if (!streamingContent) return <TypingIndicator />;

  return (
    <View style={[styles.messageRow, styles.aiRow]}>
      <View style={[styles.bubble, { backgroundColor: colors.aiBubbleBg, borderBottomLeftRadius: 4 }]}>
        <Text variant="body" color={colors.text}>
          {streamingContent}
        </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  supportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: {
    alignSelf: 'center',
    borderRadius: Radius.pill,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  messageList: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  messageRow: {
    gap: 4,
    maxWidth: '80%',
  },
  aiRow: {
    alignSelf: 'flex-start',
  },
  userRow: {
    alignSelf: 'flex-end',
  },
  bubble: {
    padding: Spacing.md,
    borderRadius: 20,
  },
  aiTime: { marginLeft: Spacing.xs },
  userTime: { textAlign: 'right', marginRight: Spacing.xs },
  chipsRow: { paddingVertical: Spacing.sm },
  chipsList: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  breatheShortcut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
  },
  crisisBanner: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.sm,
  },
  inlineSignInWrap: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  inlineSignIn: {
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
