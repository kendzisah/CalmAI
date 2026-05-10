import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Chip } from '@/components/ui';
import { Spacing } from '@/lib/constants';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  selected: T[];
  onChange: (value: T[]) => void;
}

export function MultiSelectChips<T extends string>({ options, selected, onChange }: Props<T>) {
  const toggle = (value: T) => {
    Haptics.selectionAsync();
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <View style={styles.container}>
      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          selected={selected.includes(opt.value)}
          onPress={() => toggle(opt.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
});
