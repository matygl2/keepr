import { router } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function PersonalInformationScreen() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* VOLVER */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        {/* TITULO */}
        <Text style={styles.title}>Personal information</Text>

        <Text style={styles.subtitle}>
          View the personal information associated with your Keepr account.
        </Text>

        {/* INFORMACION PERSONAL */}
        <Text style={styles.groupLabel}>YOUR INFORMATION</Text>

        <View style={styles.card}>
          {/* NOMBRE */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Full name</Text>
            <Text style={styles.value}>{user.name}</Text>
          </View>

          <View style={styles.divider} />

          {/* EMAIL */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Email address</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>

          <View style={styles.divider} />

          {/* TELEFONO */}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone number</Text>
            <Text style={styles.placeholder}>Not provided</Text>
          </View>
        </View>

        {/* MENSAJE INFORMATIVO */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Your personal information is associated with your Keepr account.
            Editing these details is not available in this version.
          </Text>
        </View>
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
    marginBottom: spacing.lg,
    alignSelf: "flex-start",
  },

  backText: {
    color: colors.primary,
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
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.xl,
  },

  groupLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
  },

  infoRow: {
    paddingVertical: spacing.lg,
  },

  label: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  placeholder: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: "italic",
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  infoBox: {
    backgroundColor: colors.iconBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },

  infoText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
