import { Modal, Pressable, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Text, Button } from '@/components/ui';
import { Spacing, Radius } from '@/lib/constants';
import { useThemeColors } from '@/theme';
import { track } from '@/lib/analytics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const FIND_HELPLINE_URL = 'https://findahelpline.com';

export function FindSupportSheet({ visible, onClose }: Props) {
  const colors = useThemeColors();
  const handleFind = async () => {
    track('support_sheet_findahelpline_tapped');
    try {
      await WebBrowser.openBrowserAsync(FIND_HELPLINE_URL);
    } catch {
      // openBrowserAsync rejects if already open or unsupported — silently no-op.
    }
    onClose();
  };

  const handleClose = () => {
    track('support_sheet_dismissed');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={() => { /* swallow */ }}>
          <View style={[styles.handle, { backgroundColor: colors.borderMuted }]} />
          <Text variant="h2" style={styles.title}>Need to talk to a person?</Text>
          <Text variant="body" color={colors.textMuted} style={styles.body}>
            If you're in crisis or just need a real human, find a free crisis line near you. They're trained for this.
          </Text>
          <Button title="Find a line near me" onPress={handleFind} />
          <Pressable onPress={handleClose} style={styles.notNow}>
            <Text variant="body" color={colors.textMuted}>Not now</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.base,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center' },
  notNow: { alignSelf: 'center', padding: Spacing.sm },
});
