import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { errorMessage } from '../../../api/client';
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
import {
  formatDate,
  formatMoney,
  formatRemaining,
  getProductById,
  getWarrantyStatus,
} from '../../../data/mockData';
import ProductShareCard from '../../../components/ProductShareCard';
import ReceiptSection from '../../../components/ReceiptSection';
import { useProducts } from '../../../context/ProductsContext';
import { useCalendarSync } from '../../../hooks/useCalendarSync';
import type { Product } from '../../../types';
import { parseISODate } from '../../../utils/dateUtils';

const STATUS_DOT_COLOR = {
  active: colors.success,
  expiring: colors.danger,
  expired: colors.textMuted,
};

function getWarrantyProgress(
  purchaseDate: string,
  expiryDate: string
): number {
  const start = parseISODate(purchaseDate).getTime();
  const end = parseISODate(expiryDate).getTime();
  const now = Date.now();

  if (now >= end) return 1;
  if (now <= start) return 0;

  return (now - start) / (end - start);
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products } = useProducts();
  const product = getProductById(products, id);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  return <ProductDetailContent product={product} />;
}

function ProductDetailContent({ product }: { product: Product }) {
  const router = useRouter();
  const { removeProduct } = useProducts();

  const {
    synced,
    loading: calendarLoading,
    toggle: toggleCalendarSync,
  } = useCalendarSync(product);

  const status = getWarrantyStatus(product.warrantyExpiryDate);
  const progress = getWarrantyProgress(
    product.purchaseDate,
    product.warrantyExpiryDate
  );

  const handleDeleteProduct = () => {
    Alert.alert(
      'Delete product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              router.replace('/(tabs)');
              await removeProduct(product.id);
            } catch (err) {
              Alert.alert(
                'Could not delete product',
                errorMessage(err)
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Text style={{ fontSize: 28 }}>{product.icon}</Text>
            </View>

            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>{product.name}</Text>
              <Text style={styles.headerSubtitle}>
                {product.subCategory}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusDot,
              { backgroundColor: STATUS_DOT_COLOR[status] },
            ]}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PURCHASE</Text>

            <View style={styles.threeCol}>
              <View style={styles.threeColItem}>
                <Text style={styles.fieldLabel}>PURCHASED</Text>
                <Text style={styles.fieldValue}>
                  {formatDate(product.purchaseDate)}
                </Text>
              </View>

              <View style={styles.threeColItem}>
                <Text style={styles.fieldLabel}>STORE</Text>
                <Text style={styles.fieldValue}>{product.store}</Text>
              </View>

              <View style={styles.threeColItem}>
                <Text style={styles.fieldLabel}>PRICE</Text>
                <Text style={styles.fieldValue}>
                  {formatMoney(product.price)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>WARRANTY</Text>

            <View style={styles.warrantyRow}>
              <Text style={styles.fieldLabel}>Expires</Text>
              <Text style={styles.fieldValue}>
                {formatDate(product.warrantyExpiryDate)}
              </Text>
            </View>

            <View style={styles.warrantyRow}>
              <Text style={styles.fieldLabel}>Remaining</Text>
              <Text
                style={[
                  styles.fieldValue,
                  status === 'expiring' && {
                    color: colors.danger,
                  },
                ]}
              >
                {formatRemaining(product.warrantyExpiryDate)}
              </Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(progress, 1) * 100}%`,
                  },
                ]}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.calendarButton,
                synced && styles.calendarButtonSynced,
              ]}
              onPress={toggleCalendarSync}
              disabled={calendarLoading}
            >
              <Text style={styles.calendarButtonIcon}>
                {synced ? '✓' : '📅'}
              </Text>

              <Text
                style={[
                  styles.calendarButtonText,
                  synced && styles.calendarButtonTextSynced,
                ]}
              >
                {calendarLoading
                  ? 'Syncing…'
                  : synced
                    ? 'Added to your Calendar'
                    : 'Add warranty reminder to Calendar'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>PRODUCT INFORMATION</Text>

            <InfoRow
              label="Serial number"
              value={product.serialNumber}
              isFirst
            />
            <InfoRow label="Model" value={product.model} />
            <InfoRow label="Brand" value={product.brand} />
            <InfoRow
              label="Category"
              value={product.subCategory}
              isLast
            />
          </View>

          <ReceiptSection product={product} />

          <View style={styles.card}>
            <Text style={styles.cardTitle}>DOCUMENTATION</Text>

            {product.documentation.map((doc) => {
              // El recibo cuenta como cargado si hay foto o PDF.
              const uploaded =
                doc.uploaded ||
                (doc.name === 'Receipt' && Boolean(product.receiptPhotoId));

              return (
                <View key={doc.name} style={styles.docRow}>
                  <View style={styles.docIconWrap}>
                    <Text>📄</Text>
                  </View>

                  <Text style={styles.docName}>{doc.name}</Text>

                  <Text
                    style={uploaded ? styles.docCheck : styles.docMissing}
                  >
                    {uploaded ? '✓' : '—'}
                  </Text>
                </View>
              );
            })}
          </View>

          <ProductShareCard product={product} />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() =>
                router.push(`/product/${product.id}/maintenance`)
              }
            >
              <Text style={styles.actionIcon}>🔧</Text>
              <Text style={styles.actionLabel}>
                Maintenance History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionCard,
                styles.actionCardOutline,
              ]}
              onPress={() =>
                Alert.alert(
                  'Transfer Product',
                  'This is a UI demo action.'
                )
              }
            >
              <Text style={styles.actionIcon}>🔗</Text>
              <Text
                style={[
                  styles.actionLabel,
                  { color: colors.primary },
                ]}
              >
                Transfer Product
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteProduct}
            accessibilityRole="button"
          >
            <Text style={styles.deleteButtonText}>
              🗑 Delete product
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  isFirst,
  isLast,
}: {
  label: string;
  value: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !isFirst && styles.infoRowBorder,
        isLast && { paddingBottom: 0 },
      ]}
    >
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  notFound: {
    padding: spacing.lg,
    color: colors.textPrimary,
  },
  header: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  backIcon: {
    color: colors.white,
    fontSize: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: 26,
    color: colors.white,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: spacing.md,
  },
  body: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    marginTop: -radius.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  cardTitle: {
    fontFamily: fonts.serif,
    fontSize: 15,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  threeCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  threeColItem: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  warrantyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calendarButtonSynced: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  calendarButtonIcon: {
    fontSize: 14,
  },
  calendarButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  calendarButtonTextSynced: {
    color: colors.success,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  docIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    flex: 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  docCheck: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 16,
  },
  docMissing: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCardOutline: {
    backgroundColor: '#F1E4C8',
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    fontWeight: '700',
    color: colors.secondary,
    fontSize: 13,
    textAlign: 'center',
  },
  deleteButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});