import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { Colors, Spacing } from '@/lib/constants';

export default function GroundScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M18 6L6 18M6 6l12 12" stroke={Colors.gray} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      </Pressable>
      <View style={styles.content}>
        <Text variant="h1" style={{ textAlign: 'center' }}>5-4-3-2-1 Grounding</Text>
        <Text variant="body" color={Colors.gray} style={{ textAlign: 'center' }}>
          This exercise is coming soon. In the meantime, try a breathing exercise to help you feel centered.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: Spacing.base,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
  },
});
