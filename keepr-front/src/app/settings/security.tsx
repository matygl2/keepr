import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { api, ApiError, errorMessage } from "../../api/client";
import FormField from "../../components/FormField";
import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type PasswordErrors = Partial<
  Record<"current" | "next" | "confirm", string>
>;

export default function SecurityScreen() {
  const { user, logout } = useAuth();

  // Formulario de cambio de contraseña (se abre dentro de la tarjeta).
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setErrors({});
    setFormError("");
  };

  const openPasswordForm = () => {
    resetPasswordForm();
    setPasswordChanged(false);
    setEditingPassword(true);
  };

  const cancelPasswordForm = () => {
    resetPasswordForm();
    setEditingPassword(false);
  };

  // Mismas reglas que el backend; así el usuario ve el error sin esperar la red.
  const validatePassword = (): PasswordErrors => {
    const found: PasswordErrors = {};
    if (!currentPassword) found.current = "Enter your current password.";
    if (newPassword.length < 6) found.next = "Use at least 6 characters.";
    else if (newPassword === currentPassword)
      found.next = "Choose a password different from the current one.";
    if (confirmPassword !== newPassword)
      found.confirm = "Passwords do not match.";
    return found;
  };

  const submitPasswordChange = async () => {
    if (submitting) return;
    const found = validatePassword();
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      resetPasswordForm();
      setEditingPassword(false);
      setPasswordChanged(true);
    } catch (err) {
      // El servidor marca en qué campo está el problema (por ejemplo, la
      // contraseña actual incorrecta); cualquier otro error va arriba del botón.
      if (err instanceof ApiError && err.fields) {
        const fromServer: PasswordErrors = {};
        if (err.fields.currentPassword?.[0])
          fromServer.current = err.fields.currentPassword[0];
        if (err.fields.newPassword?.[0])
          fromServer.next = err.fields.newPassword[0];
        if (Object.keys(fromServer).length > 0) {
          setErrors(fromServer);
        } else {
          setFormError(errorMessage(err));
        }
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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

            {passwordChanged && !editingPassword ? (
              <Text style={styles.successBox}>
                Your password was updated. Use it the next time you sign in.
              </Text>
            ) : null}

            {editingPassword ? (
              <View style={styles.passwordForm}>
                <FormField
                  label="CURRENT PASSWORD"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  error={errors.current}
                />
                <FormField
                  label="NEW PASSWORD"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 6 characters"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  error={errors.next}
                />
                <FormField
                  label="CONFIRM NEW PASSWORD"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  error={errors.confirm}
                />

                {formError ? (
                  <Text style={styles.formError}>{formError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.button, submitting && styles.buttonDisabled]}
                  activeOpacity={0.8}
                  onPress={submitPasswordChange}
                  disabled={submitting}
                >
                  <Text style={styles.buttonText}>
                    {submitting ? "Please wait…" : "Update password"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelPasswordForm}
                  disabled={submitting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.outlineButton}
                activeOpacity={0.7}
                onPress={openPasswordForm}
              >
                <Text style={styles.outlineButtonText}>Change password</Text>
              </TouchableOpacity>
            )}
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
      </KeyboardAvoidingView>
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

  flex: {
    flex: 1,
  },

  passwordForm: {
    marginTop: spacing.md,
  },

  formError: {
    color: colors.danger,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 13,
    marginBottom: spacing.md,
  },

  successBox: {
    color: colors.success,
    backgroundColor: colors.successBg,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 13,
    marginTop: spacing.md,
  },

  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  cancelButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  cancelText: {
    color: colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },

  outlineButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  outlineButtonText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
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
