import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Radius, Spacing } from '@/lib/constants';
import { useThemeColors } from '@/theme';

interface Props extends TextInputProps {
  multiline?: boolean;
}

export function Input({ multiline = false, style, ...props }: Props) {
  const colors = useThemeColors();
  return (
    <TextInput
      style={[
        styles.base,
        {
          backgroundColor: colors.surfaceMuted,
          color: colors.text,
        },
        multiline && styles.multiline,
        style,
      ]}
      multiline={multiline}
      placeholderTextColor={colors.textMuted}
      selectionColor={colors.primary}
      scrollEnabled={multiline}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    padding: Spacing.base,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
