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

import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function SecurityScreen() {
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          void logout();
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* HEADER */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Security</Text>

        <Text style={styles.subtitle}>
          Manage your account security and active session.
        </Text>

        {/* ACCOUNT SECURITY */}
        <Text style={styles.groupLabel}>ACCOUNT SECURITY</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Email address</Text>
            <Text style={styles.rowDescription}>
              Your email is used to sign in to Keepr.
            </Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowTitle}>Password</Text>
            <Text style={styles.rowDescription}>
              Your account is protected with a password.
            </Text>

            <Text style={styles.unavailable}>
              Password changes are not available yet.
            </Text>
          </View>
        </View>

        {/* SESSION */}
        <Text style={styles.groupLabel}>SESSION & PRIVACY</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowTitle}>Current session</Text>

            <Text style={styles.rowDescription}>
              You are currently signed in to Keepr on this device.
            </Text>

            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active session</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowTitle}>Session protection</Text>

            <Text style={styles.rowDescription}>
              Keepr stores your authentication token on this device to keep you
              signed in.
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowTitle}>Signing out</Text>

            <Text style={styles.rowDescription}>
              Signing out removes your saved authentication token and clears
              cached images from this device. Your account and saved products
              remain available when you sign in again.
            </Text>
          </View>
        </View>

        {/* SIGN OUT */}
        <Text style={styles.groupLabel}>ACCOUNT ACCESS</Text>

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.logoutRow}
            onPress={confirmLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutText}>Log out</Text>
            <Text style={styles.logoutArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          Security settings reflect the features currently available in Keepr.
        </Text>
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
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  },

  backText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },

  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 21,
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

  row: {
    padding: spacing.lg,
  },

  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  rowDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  email: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
    marginTop: spacing.sm,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },

  unavailable: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    fontStyle: "italic",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#5B9B6E",
  },

  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B9B6E",
  },

  logoutRow: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
  },

  logoutArrow: {
    fontSize: 18,
    color: colors.textMuted,
  },

  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
