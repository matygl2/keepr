import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryFilter from "../../components/CategoryFilter";
import ExpiringBanner from "../../components/ExpiringBanner";
import ProductCard from "../../components/ProductCard";
import StatsSummaryCard from "../../components/StatsSummaryCard";

import { colors, fonts, spacing } from "../../constants/theme";
import { useProducts } from "../../context/ProductsContext";
import { getExpiringSoonProducts } from "../../data/mockData";

export default function HomeScreen() {
  const { products } = useProducts();

  const [category, setCategory] = useState("All");

  // Productos cuyas garantías están próximas a vencer
  const expiringSoon = useMemo(
    () => getExpiringSoonProducts(products),
    [products],
  );

  // Filtrar productos según la categoría seleccionada
  const filtered = useMemo(() => {
    if (category === "All") return products;

    return products.filter((p) => p.category === category);
  }, [category, products]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <StatsSummaryCard />

            {/* Aviso de garantías próximas a vencer */}
            <ExpiringBanner count={expiringSoon.length} />

            <CategoryFilter selected={category} onSelect={setCategory} />

            <Text style={styles.sectionTitle}>Your belongings</Text>
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

  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.primary,
    marginBottom: spacing.md,
  },
});
