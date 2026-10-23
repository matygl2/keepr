import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CalendarGrid, { DayMarker } from '../../components/CalendarGrid';
import ProductIcon from '../../components/ProductIcon';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { getWarrantyStatus } from '../../data/mockData';
import { useProducts } from '../../context/ProductsContext';
import { useCalendarSync } from '../../hooks/useCalendarSync';
import { Product } from '../../types';
import { toISODateOnly } from '../../utils/dateUtils';

interface DayEvent {
  product: Product;
  kind: 'purchase' | 'expiry';
}

export default function CalendarScreen() {
  const router = useRouter();
  const { products } = useProducts();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(now);

  const eventsByDate = useMemo(() => {
    const map: Record<string, DayEvent[]> = {};
    products.forEach((product) => {
      const purchaseKey = product.purchaseDate;
      const expiryKey = product.warrantyExpiryDate;
      map[purchaseKey] = [...(map[purchaseKey] ?? []), { product, kind: 'purchase' }];
      map[expiryKey] = [...(map[expiryKey] ?? []), { product, kind: 'expiry' }];
    });
    return map;
  }, [products]);

  const markedDates = useMemo(() => {
    const marks: Record<string, DayMarker> = {};
    Object.entries(eventsByDate).forEach(([date, events]) => {
      const marker: DayMarker = {};
      events.forEach((event) => {
        if (event.kind === 'purchase') marker.purchase = true;
        else {
          const status = getWarrantyStatus(event.product.warrantyExpiryDate);
          if (status === 'expired') marker.expired = true;
          else marker.expiring = true;
        }
      });
      marks[date] = marker;
    });
    return marks;
  }, [eventsByDate]);

  const selectedEvents = selectedDate
    ? eventsByDate[toISODateOnly(selectedDate)] ?? []
    : [];

  const goPrevMonth = () => {
    const newDate = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(newDate.getFullYear());
    setViewMonth(newDate.getMonth());
  };

  const goNextMonth = () => {
    const newDate = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(newDate.getFullYear());
    setViewMonth(newDate.getMonth());
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Calendar</Text>

        <CalendarGrid
          year={viewYear}
          month={viewMonth}
          markedDates={markedDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
        />

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.secondary }]} />
            <Text style={styles.legendText}>Purchased</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Warranty expires</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.textMuted }]} />
            <Text style={styles.legendText}>Already expired</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {selectedDate
            ? selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
            : 'Select a day'}
        </Text>

        {selectedEvents.length === 0 ? (
          <Text style={styles.emptyText}>No warranty events on this day.</Text>
        ) : (
          selectedEvents.map((event, idx) => (
            <EventRow
              key={`${event.product.id}-${event.kind}-${idx}`}
              event={event}
              onPress={() => router.push(`/product/${event.product.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EventRow({
  event,
  onPress,
}: {
  event: DayEvent;
  onPress: () => void;
}) {
  const { synced, loading, toggle } = useCalendarSync(event.product);

  return (
    <View style={styles.eventCard}>
      <TouchableOpacity
        style={styles.eventMain}
        activeOpacity={0.7}
        onPress={onPress}
      >
        <ProductIcon icon={event.product.icon} size={44} />
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{event.product.name}</Text>
          <Text style={styles.eventKind}>
            {event.kind === 'purchase'
              ? 'Purchased on this day'
              : 'Warranty expires on this day'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {event.kind === 'expiry' && (
        <TouchableOpacity
          style={[styles.syncButton, synced && styles.syncButtonActive]}
          onPress={toggle}
          disabled={loading}
        >
          <Text
            style={[styles.syncButtonText, synced && styles.syncButtonTextActive]}
          >
            {loading ? 'Syncing…' : synced ? '✓ In your Calendar' : '📅 Remind me'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
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
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  eventCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  eventMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  eventInfo: {
    flex: 1,
  },
  syncButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  syncButtonActive: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  syncButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
  },
  syncButtonTextActive: {
    color: colors.success,
  },
  eventName: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.primary,
  },
  eventKind: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
});
