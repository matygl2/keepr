import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryFilter from "../../components/CategoryFilter";
import ExpiringBanner from "../../components/ExpiringBanner";
import ProductCard from "../../components/ProductCard";
import StatsSummaryCard from "../../components/StatsSummaryCard";

import { colors, fonts, spacing } from "../../constants/theme";

import { useNotificationPreferences } from "../../context/NotificationPreferencesContext";
import { useProducts } from "../../context/ProductsContext";

import { getDaysRemaining } from "../../data/mockData";

export default function HomeScreen() {
  const { products } = useProducts();

  // Preferencias configuradas en Profile → Notifications
  const { preferences, loading } = useNotificationPreferences();

  const [category, setCategory] = useState("All");

  // Productos cuyas garantías están próximas a vencer,
  // según los días elegidos por el usuario.
  const expiringSoon = useMemo(() => {
    if (loading || !preferences.warrantyAlertsEnabled) {
      return [];
    }

    return products.filter((product) => {
      const daysRemaining = getDaysRemaining(product.warrantyExpiryDate);

      return daysRemaining >= 0 && daysRemaining <= preferences.reminderDays;
    });
  }, [products, preferences, loading]);

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

            {/* Mostrar avisos solo si hay garantías próximas a vencer */}
            {expiringSoon.length > 0 && (
              <ExpiringBanner count={expiringSoon.length} />
            )}

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
