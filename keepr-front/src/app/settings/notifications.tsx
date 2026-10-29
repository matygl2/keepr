import { router } from "expo-router";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radius, spacing } from "../../constants/theme";
import {
    ReminderDays,
    useNotificationPreferences,
} from "../../context/NotificationPreferencesContext";

const REMINDER_OPTIONS: ReminderDays[] = [7, 15, 30];

export default function NotificationsScreen() {
  const { preferences, loading, updatePreferences } =
    useNotificationPreferences();

  const changePreferences = async (changes: Partial<typeof preferences>) => {
    try {
      await updatePreferences(changes);
    } catch {
      Alert.alert(
        "Something went wrong",
        "Your preferences could not be saved. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Notifications</Text>

        <Text style={styles.subtitle}>
          Choose when Keepr should remind you about your warranties.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : (
          <>
            <Text style={styles.groupLabel}>WARRANTY ALERTS</Text>

            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.rowTitle}>Warranty alerts</Text>
                  <Text style={styles.rowDescription}>
                    Show reminders for warranties that are about to expire.
                  </Text>
                </View>

                <Switch
                  value={preferences.warrantyAlertsEnabled}
                  onValueChange={(value) =>
                    void changePreferences({
                      warrantyAlertsEnabled: value,
                    })
                  }
                  trackColor={{
                    false: colors.border,
                    true: colors.secondary,
                  }}
                  thumbColor={colors.white}
                />
              </View>
            </View>

            <Text style={styles.groupLabel}>REMIND ME BEFORE</Text>

            <View
              style={[
                styles.card,
                !preferences.warrantyAlertsEnabled && styles.disabledCard,
              ]}
            >
              {REMINDER_OPTIONS.map((days, index) => {
                const selected = preferences.reminderDays === days;

                return (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.optionRow,
                      index !== REMINDER_OPTIONS.length - 1 && styles.rowBorder,
                    ]}
                    disabled={!preferences.warrantyAlertsEnabled}
                    onPress={() =>
                      void changePreferences({ reminderDays: days })
                    }
                  >
                    <Text style={styles.rowTitle}>{days} days before</Text>

                    <View
                      style={[styles.radio, selected && styles.radioSelected]}
                    >
                      {selected && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.note}>
              Your preferences are saved automatically on this device. These
              settings control reminders inside Keepr, not push notifications.
            </Text>
          </>
        )}
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
  backButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  groupLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    gap: spacing.md,
  },
  switchInfo: {
    flex: 1,
  },
  rowTitle: {
    color: colors.secondary,
    fontSize: 15,
    fontWeight: "600",
  },
  rowDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  disabledCard: {
    opacity: 0.45,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.secondary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  note: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl,
  },
});
