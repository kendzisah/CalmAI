import { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, TextInput, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text, Chip } from '@/components/ui';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { useChatStore } from '@/stores/chatStore';
import { usePaywall } from '@/hooks/usePaywall';
import { detectCrisis, CRISIS_MESSAGE, CRISIS_PHONE } from '@/utils/crisisDetection';
import { sendChatMessage } from '@/services/chatService';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import type { ChatMessage } from '@/types/chat';

const DEFAULT_CHIPS = ["I'm feeling anxious", "I need to vent", "Help me regulate", "Just talk"];

export default function ChatScreen() {
  const { messages, currentSession, isStreaming, streamingContent, quickReplies, startSession, addUserMessage, addAssistantMessage, setQuickReplies } = useChatStore();
  const { guardChat } = usePaywall();
  const { selectedMood, selectedContext, reliefTag } = useOnboardingStore();
  const { isAuthenticated, isAnonymous } = useAuthStore();
  const needsAccount = !isAuthenticated || isAnonymous;
  const [inputText, setInputText] = useState('');
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!currentSession) {
      startSession();
    }
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputText).trim();
    if (!messageText) return;

    // Check paywall
    const allowed = await guardChat();
    if (!allowed) return;

    // Crisis detection (Layer 1)
    if (detectCrisis(messageText)) {
      setShowCrisisBanner(true);
    }

    setInputText('');
    await addUserMessage(messageText);

    try {
      const isFirst = messages.length <= 1;
      await sendChatMessage(currentSession!, messageText, {
        isFirstConversation: isFirst,
        onboardingMood: selectedMood || undefined,
        onboardingContext: selectedContext || undefined,
        reliefTag: reliefTag || undefined,
      });
    } catch (err: any) {
      if (err?.message === 'PAYWALL') {
        router.push('/paywall');
      } else if (err?.message === 'Not authenticated') {
        // Fallback for unauthenticated users — provide a local response
        await addAssistantMessage("Hey, I'd love to keep chatting but I need you to create an account so I can remember our convos. It only takes a sec.");
        setQuickReplies(["Let's do it", "Maybe later"]);
      } else {
        await addAssistantMessage("Ugh, something glitched on my end. Want to try again, or we could do a quick breathing exercise instead?");
        setQuickReplies(["Try again", "Let's breathe", "It's all good"]);
      }
    }
  }, [inputText, guardChat, addUserMessage, addAssistantMessage, setQuickReplies, currentSession]);

  const isAuthPrompt = (content: string) =>
    content.includes('create an account');

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isAI = item.role === 'assistant';
    const showSignIn = isAI && isAuthPrompt(item.content);
    return (
      <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
        <View style={[styles.bubble, isAI ? styles.aiBubble : styles.userBubble]}>
          <Text variant="body" color={Colors.primaryDark}>
            {item.content}
          </Text>
          {showSignIn && (
            <View style={{ alignItems: 'center', marginTop: Spacing.sm }}>
              <Pressable
                style={styles.inlineSignIn}
                onPress={() => router.push('/(auth)/sign-in')}
              >
                <Text variant="bodyMedium" color={Colors.primary}>Create Account</Text>
              </Pressable>
            </View>
          )}
        </View>
        <Text variant="small" color={Colors.gray} style={isAI ? styles.aiTime : styles.userTime}>
          {isAI ? 'CALMAI' : 'SENT'} - {new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth={2} />
            <Circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth={2} />
          </Svg>
        </View>
        <Text variant="bodyMedium">CalmAI</Text>
      </View>

      {/* Date pill */}
      <View style={styles.datePill}>
        <Text variant="small" color={Colors.gray}>Today</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={isStreaming ? <TypingIndicator /> : null}
      />

      {/* Crisis Banner */}
      {showCrisisBanner && (
        <View style={styles.crisisBanner}>
          <Text variant="body" style={{ color: '#FFFFFF' }}>{CRISIS_MESSAGE}</Text>
        </View>
      )}

      {/* Quick Reply Chips */}
      <View style={styles.chipsRow}>
        <FlatList
          horizontal
          data={quickReplies.length > 0 ? quickReplies : DEFAULT_CHIPS}
          renderItem={({ item }) => (
            <Chip
              label={item}
              size="small"
              backgroundColor={Colors.grayLavender}
              textColor={Colors.primaryDark}
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

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputBar}>
          <Pressable style={styles.breatheShortcut} onPress={() => router.push('/breathe')}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Circle cx="12" cy="12" r="4" stroke="#FFFFFF" strokeWidth={2} />
            </Svg>
          </Pressable>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            placeholder="Message CalmAI..."
            placeholderTextColor={Colors.gray}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <Pressable style={styles.sendButton} onPress={() => handleSend()}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePill: {
    alignSelf: 'center',
    backgroundColor: Colors.grayLavender,
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
  aiBubble: {
    backgroundColor: Colors.lavenderLight,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.surface,
    borderBottomRightRadius: 4,
  },
  aiTime: {
    marginLeft: Spacing.xs,
  },
  userTime: {
    textAlign: 'right',
    marginRight: Spacing.xs,
  },
  chipsRow: {
    paddingVertical: Spacing.sm,
  },
  chipsList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  breatheShortcut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.primaryDark,
  },
  crisisBanner: {
    backgroundColor: Colors.error,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    borderRadius: Radius.sm,
  },
  inlineSignIn: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
