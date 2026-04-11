import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/lib/constants';
import { Text } from '@/components/ui';
import type { ChatMessage } from '@/types';

interface Props {
  message: Pick<ChatMessage, 'role' | 'content' | 'createdAt'>;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text variant="body" color={Colors.primaryDark}>
          {message.content}
        </Text>
      </View>
      <Text
        variant="small"
        color={Colors.gray}
        style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAssistant]}
      >
        {formattedTime}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.base,
    maxWidth: '80%',
  },
  rowUser: {
    alignSelf: 'flex-end',
  },
  rowAssistant: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  bubbleUser: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: Colors.lavenderLight,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 20,
  },
  timestamp: {
    marginTop: Spacing.xs,
  },
  timestampUser: {
    textAlign: 'right',
  },
  timestampAssistant: {
    textAlign: 'left',
  },
});
