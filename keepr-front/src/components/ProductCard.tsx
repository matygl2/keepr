import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatDate, formatRemaining, getWarrantyStatus } from '../data/mockData';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { Product } from '../types';
import ProductIcon from './ProductIcon';
import StatusBadge from './StatusBadge';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const router = useRouter();
  const status = getWarrantyStatus(product.warrantyExpiryDate);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View style={styles.topRow}>
        <ProductIcon icon={product.icon} />
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.subtitle}>
            {product.subCategory} · {product.store}
          </Text>
          <StatusBadge status={status} />
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.metaLabel}>PURCHASED</Text>
          <Text style={styles.metaValue}>{formatDate(product.purchaseDate)}</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>WARRANTY</Text>
          <Text
            style={[
              styles.metaValue,
              status === 'expiring' && { color: colors.danger },
            ]}
          >
            {formatRemaining(product.warrantyExpiryDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.primary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
