import { router } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import SettingsRow from "../../components/SettingsRow";
import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const notImplemented = (label: string) =>
    Alert.alert(label, "This is a UI demo — this screen is not yet built.");

  const confirmLogout = () =>
    Alert.alert("Log out", "Your products stay saved on this device.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ]);

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.initial}</Text>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{user.plan}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.groupLabel}>ACCOUNT</Text>

        <View style={styles.card}>
          <SettingsRow
            label="Personal information"
            onPress={() => notImplemented("Personal information")}
          />

          <SettingsRow
            label="Email & phone"
            onPress={() => notImplemented("Email & phone")}
            isLast
          />
        </View>

        <Text style={styles.groupLabel}>PREFERENCES</Text>

        <View style={styles.card}>
          <SettingsRow
            label="Notifications"
            onPress={() => router.push("/settings/notifications")}
          />

          <SettingsRow
            label="Security"
            onPress={() => notImplemented("Security")}
          />

          <SettingsRow
            label="Data & Privacy"
            onPress={() => notImplemented("Data & Privacy")}
            isLast
          />
        </View>

        <Text style={styles.groupLabel}>DATA</Text>

        <View style={styles.card}>
          <SettingsRow
            label="Export my data"
            onPress={() => notImplemented("Export my data")}
          />

          <SettingsRow
            label="Settings"
            onPress={() => notImplemented("Settings")}
            isLast
          />
        </View>

        <Text style={styles.groupLabel}>SUPPORT</Text>

        <View style={styles.card}>
          <SettingsRow
            label="Help & FAQ"
            onPress={() => router.push("/settings/help")}
          />

          <SettingsRow
            label="Send feedback"
            onPress={() => notImplemented("Send feedback")}
            isLast
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
          <Text style={styles.logoutText}>⇥ Log Out</Text>
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
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: fonts.serif,
    fontSize: 19,
    color: colors.primary,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  planBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.iconBg,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    marginTop: 4,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark,
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
    marginBottom: spacing.md,
    overflow: "hidden",
  },
  logoutButton: {
    marginTop: spacing.md,
    backgroundColor: "#F1E4C8",
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  logoutText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
});
