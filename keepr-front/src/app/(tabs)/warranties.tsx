import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductIcon from '../../components/ProductIcon';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { formatRemaining, getWarrantyStatus } from '../../data/mockData';
import { useProducts } from '../../context/ProductsContext';
import { Product, WarrantyStatus } from '../../types';

const SECTIONS: { status: WarrantyStatus; label: string; color: string }[] = [
  { status: 'expiring', label: 'Expiring Soon', color: colors.danger },
  { status: 'active', label: 'Active', color: colors.secondary },
  { status: 'expired', label: 'Expired', color: colors.primary },
];

function WarrantyRow({ product }: { product: Product }) {
  const router = useRouter();
  const status = getWarrantyStatus(product.warrantyExpiryDate);
  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <ProductIcon icon={product.icon} size={48} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{product.name}</Text>
        <Text
          style={[
            styles.rowRemaining,
            status === 'expiring' && { color: colors.danger },
            status === 'expired' && { color: colors.textMuted },
          ]}
        >
          {formatRemaining(product.warrantyExpiryDate)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function WarrantiesScreen() {
  const { products } = useProducts();

  const grouped = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      items: products.filter(
        (p) => getWarrantyStatus(p.warrantyExpiryDate) === section.status
      ),
    })).filter((section) => section.items.length > 0);
  }, [products]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Warranties</Text>

        {grouped.map((section) => (
          <View key={section.status} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionDot, { backgroundColor: section.color }]} />
              <Text style={[styles.sectionLabel, { color: section.color }]}>
                {section.label.toUpperCase()}
              </Text>
              <Text style={styles.sectionCount}>{section.items.length}</Text>
            </View>

            <View style={styles.card}>
              {section.items.map((product, idx) => (
                <View key={product.id}>
                  <WarrantyRow product={product} />
                  {idx < section.items.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionLabel: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
    flex: 1,
  },
  sectionCount: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.primary,
    marginBottom: 2,
  },
  rowRemaining: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 48 + spacing.md,
  },
});
