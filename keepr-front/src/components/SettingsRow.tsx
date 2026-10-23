import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing } from '../constants/theme';

interface Props {
  label: string;
  onPress?: () => void;
  isLast?: boolean;
}

export default function SettingsRow({ label, onPress, isLast }: Props) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 15,
    color: colors.secondary,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
});
