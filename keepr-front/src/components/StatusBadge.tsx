import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { WarrantyStatus } from '../types';

interface Props {
  status: WarrantyStatus;
}

const CONFIG: Record<WarrantyStatus, { label: string; bg: string; fg: string }> = {
  active: { label: 'Warranty Active', bg: '#E7EDE3', fg: colors.secondary },
  expiring: { label: 'Expiring Soon', bg: colors.dangerBg, fg: colors.danger },
  expired: { label: 'Expired', bg: '#EEE6D8', fg: colors.textMuted },
};

export default function StatusBadge({ status }: Props) {
  const { label, bg, fg } = CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
