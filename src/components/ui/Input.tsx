import { TextInput, StyleSheet, TextInputProps, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@/lib/constants';

interface Props extends TextInputProps {
  multiline?: boolean;
}

export function Input({ multiline = false, style, ...props }: Props) {
  return (
    <TextInput
      style={[
        styles.base,
        multiline && styles.multiline,
        style,
      ]}
      multiline={multiline}
      placeholderTextColor={Colors.gray}
      selectionColor={Colors.primary}
      scrollEnabled={multiline}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.base,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.primaryDark,
    lineHeight: 24,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
