import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';

interface Props {
  /** Muestra solo una ruedita de carga. */
  loading?: boolean;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export default function StatusScreen({
  loading,
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: Props) {
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <>
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {actionLabel && onAction ? (
            <TouchableOpacity style={styles.primary} activeOpacity={0.8} onPress={onAction}>
              <Text style={styles.primaryText}>{actionLabel}</Text>
            </TouchableOpacity>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <TouchableOpacity style={styles.secondary} onPress={onSecondary}>
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  primaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  secondary: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  secondaryText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
