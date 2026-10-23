import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

interface Props {
  count: number;
}

export default function ExpiringBanner({ count }: Props) {
  const router = useRouter();
  if (count <= 0) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.7}
      onPress={() => router.push('/(tabs)/warranties')}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.bell}>🔔</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>
          {count} warrant{count === 1 ? 'y' : 'ies'} expiring soon
        </Text>
        <Text style={styles.subtitle}>Tap to review</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1E4C8',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    color: colors.primary,
    fontSize: 15,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
  },
});
