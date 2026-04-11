import { View, Pressable, Linking, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, Spacing, Radius } from '@/lib/constants';
import { Text } from '@/components/ui';

function PhoneIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.68 21 20.35 21.01 20 21.01C10.61 21.01 3 13.4 3 3.99C3 3.65 3.01 3.32 3.03 2.99C3.07 2.44 3.52 2 4.08 2H7.08C7.56 2 7.97 2.34 8.06 2.81C8.14 3.24 8.26 3.65 8.42 4.05C8.56 4.39 8.47 4.78 8.2 5.03L6.83 6.4C8.07 8.57 9.94 10.44 12.11 11.68L13.47 10.31C13.72 10.04 14.12 9.96 14.46 10.09C14.86 10.25 15.27 10.37 15.7 10.45C16.17 10.54 16.51 10.95 16.51 11.43V14.43C16.51 14.43 16.51 14.43 16.51 14.43"
        stroke={Colors.error}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CrisisBanner() {
  const handleCall = () => {
    Linking.openURL('tel:988');
  };

  return (
    <View style={styles.banner}>
      <Text variant="caption" color={Colors.primaryDark} style={styles.text}>
        If you're in crisis, please reach out to the 988 Suicide &amp; Crisis
        Lifeline (call or text 988)
      </Text>
      <Pressable style={styles.callButton} onPress={handleCall}>
        <PhoneIcon />
        <Text variant="bodyMedium" color={Colors.error} style={styles.callText}>
          Call 988
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: `${Colors.error}15`,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    gap: Spacing.md,
  },
  text: {
    lineHeight: 20,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: `${Colors.error}20`,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  callText: {
    fontSize: 14,
  },
});
