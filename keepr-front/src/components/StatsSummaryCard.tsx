import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { useProducts } from '../context/ProductsContext';
import { formatMoney, getStats, getTotalRegisteredValue } from '../data/mockData';

export default function StatsSummaryCard() {
  const { products } = useProducts();
  const stats = getStats(products);
  const totalValue = getTotalRegisteredValue(products);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>TOTAL REGISTERED VALUE</Text>
      <Text style={styles.value}>{formatMoney(totalValue)} ARS</Text>

      <View style={styles.row}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active warranties</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, styles.statNumberWarn]}>
            {stats.expiring}
          </Text>
          <Text style={styles.statLabel}>Expiring soon</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  label: {
    color: '#B9CBCE',
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  value: {
    fontFamily: fonts.serif,
    color: colors.white,
    fontSize: 32,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    gap: 4,
  },
  statNumber: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '700',
  },
  statNumberWarn: {
    color: '#E0B45B',
  },
  statLabel: {
    color: '#B9CBCE',
    fontSize: 12,
  },
});
