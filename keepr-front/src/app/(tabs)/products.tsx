import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryFilter from '../../components/CategoryFilter';
import ProductCard from '../../components/ProductCard';
import SwipeToDeleteRow from '../../components/SwipeToDeleteRow';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useProducts } from '../../context/ProductsContext';

export default function ProductsScreen() {
  const router = useRouter();
  const { products } = useProducts();
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    if (category === 'All') return products;
    return products.filter((p) => p.category === category);
  }, [category, products]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeToDeleteRow product={item}>
            <ProductCard product={item} />
          </SwipeToDeleteRow>
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Products</Text>
              <TouchableOpacity
                style={styles.addButton}
                activeOpacity={0.8}
                onPress={() => router.push('/product/new')}
              >
                <Text style={styles.addButtonText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            <CategoryFilter selected={category} onSelect={setCategory} />
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {products.length === 0 ? 'No products yet' : 'Nothing in this category'}
            </Text>
            <Text style={styles.emptyText}>
              {products.length === 0
                ? 'Add your first product to start tracking its warranty.'
                : 'Try another category or add a new product.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
});
