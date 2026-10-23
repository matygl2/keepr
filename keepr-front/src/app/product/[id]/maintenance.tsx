import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../../constants/theme';
import { formatDate, formatMoney, getProductById } from '../../../data/mockData';
import { useProducts } from '../../../context/ProductsContext';

export default function MaintenanceHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products } = useProducts();
  const product = getProductById(products, id);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  const history = [...product.maintenanceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Maintenance History</Text>
        </View>

        <View style={styles.productBanner}>
          <Text style={{ fontSize: 22 }}>{product.icon}</Text>
          <View>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productSerial}>{product.serialNumber}</Text>
          </View>
        </View>

        <View style={styles.timeline}>
          {history.map((entry, idx) => (
            <View key={entry.id} style={styles.timelineItem}>
              <View style={styles.timelineMarkerColumn}>
                <View
                  style={[
                    styles.timelineDot,
                    entry.type === 'purchase' && styles.timelineDotFilled,
                  ]}
                >
                  <Text style={styles.timelineDotIcon}>
                    {entry.type === 'purchase' ? '🏷️' : '🔧'}
                  </Text>
                </View>
                {idx < history.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.timelineCard}>
                <Text style={styles.timelineDate}>{formatDate(entry.date)}</Text>
                <Text style={styles.timelineTitle}>{entry.title}</Text>
                <Text style={styles.timelineMeta}>
                  {entry.provider} · {formatMoney(entry.cost)}
                  {entry.type === 'maintenance' ? ' ARS' : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            Alert.alert('Add Maintenance', 'This is a UI demo action.')
          }
        >
          <Text style={styles.addButtonText}>+  Add Maintenance</Text>
        </TouchableOpacity>
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
  notFound: {
    padding: spacing.lg,
    color: colors.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.secondary,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primary,
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#EFE3C4',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  productName: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.primary,
  },
  productSerial: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeline: {
    marginBottom: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineMarkerColumn: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotFilled: {
    backgroundColor: colors.secondary,
  },
  timelineDotIcon: {
    fontSize: 16,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  timelineCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  timelineTitle: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.primary,
    marginBottom: 4,
  },
  timelineMeta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.secondary,
    fontWeight: '700',
  },
});
