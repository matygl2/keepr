import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import {
  WEEKDAY_LABELS,
  getMonthMatrix,
  isSameDay,
  monthLabel,
  toISODateOnly,
} from '../utils/dateUtils';

export interface DayMarker {
  purchase?: boolean;
  expiring?: boolean;
  expired?: boolean;
}

interface Props {
  year: number;
  month: number; // 0-indexed
  markedDates: Record<string, DayMarker>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarGrid({
  year,
  month,
  markedDates,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const weeks = getMonthMatrix(year, month);
  const today = new Date();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onPrevMonth} style={styles.navButton}>
          <Text style={styles.navIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel(year, month)}</Text>
        <TouchableOpacity onPress={onNextMonth} style={styles.navButton}>
          <Text style={styles.navIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, idx) => (
          <Text key={idx} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, wIdx) => (
        <View key={wIdx} style={styles.weekRow}>
          {week.map((date, dIdx) => {
            if (!date) {
              return <View key={dIdx} style={styles.dayCell} />;
            }
            const iso = toISODateOnly(date);
            const marker = markedDates[iso];
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            return (
              <TouchableOpacity
                key={dIdx}
                style={styles.dayCell}
                onPress={() => onSelectDate(date)}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isToday && !isSelected && styles.dayCircleToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
                {marker && (
                  <View style={styles.dotsRow}>
                    {marker.purchase && (
                      <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                    )}
                    {marker.expiring && (
                      <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                    )}
                    {marker.expired && (
                      <View style={[styles.dot, { backgroundColor: colors.textMuted }]} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 22,
    color: colors.secondary,
  },
  monthLabel: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.primary,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: CELL_SIZE * 0.72,
    height: CELL_SIZE * 0.72,
    borderRadius: (CELL_SIZE * 0.72) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  dayCircleSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
