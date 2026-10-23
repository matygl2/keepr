import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

const CATEGORIES = ['All', 'Tech', 'Home', 'Fashion', 'Other'];

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((category) => {
        const active = category === selected;
        return (
          <TouchableOpacity
            key={category}
            style={[styles.pill, active && styles.pillActive]}
            onPress={() => onSelect(category)}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  pillActive: {
    backgroundColor: colors.secondary,
  },
  label: {
    fontWeight: '600',
    color: colors.secondary,
  },
  labelActive: {
    color: colors.white,
  },
});
