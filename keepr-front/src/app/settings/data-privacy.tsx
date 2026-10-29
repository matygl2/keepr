import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FormField from "../../components/FormField";
import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type PrivacySectionProps = {
  title: string;
  description: string;
  isLast?: boolean;
};

function PrivacySection({
  title,
  description,
  isLast = false,
}: PrivacySectionProps) {
  return (
    <>
      <View style={styles.infoRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionDescription}>{description}</Text>
      </View>

      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export default function DataPrivacyScreen() {
  const { deleteAccount } = useAuth();

  // Formulario de borrado de cuenta (se abre dentro de la tarjeta).
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const closeDeleteForm = () => {
    setDeleting(false);
    setPassword("");
    setPasswordError("");
    setFormError("");
  };

  const submitDelete = async () => {
    if (submitting) return;
    setPasswordError("");
    setFormError("");
    if (!password) {
      setPasswordError("Enter your password to confirm.");
      return;
    }

    setSubmitting(true);
    const result = await deleteAccount(password);

    // Si sale bien, la app cambia sola a la pantalla de inicio de sesión: solo
    // hay que tocar el estado cuando algo falló.
    if (!result.ok) {
      setFormError(result.error);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* BACK */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        {/* TITLE */}
        <Text style={styles.title}>Data & Privacy</Text>

        <Text style={styles.subtitle}>
          Learn how your information is handled in Keepr.
        </Text>

        {/* YOUR INFORMATION */}
        <Text style={styles.groupLabel}>YOUR INFORMATION</Text>

        <View style={styles.card}>
          <PrivacySection
            title="Account information"
            description="Your name and email address are associated with your Keepr account."
          />

          <PrivacySection
            title="Products & warranties"
            description="Your registered products, warranty information and maintenance history are stored on the Keepr server and linked to your account."
            isLast
          />
        </View>

        {/* STORAGE */}
        <Text style={styles.groupLabel}>STORAGE & DOCUMENTS</Text>

        <View style={styles.card}>
          <PrivacySection
            title="Local storage"
            description="Keepr stores certain preferences and session information on your device to improve your experience."
          />

          <PrivacySection
            title="Documents & photos"
            description="Photos and documents you attach to products are uploaded to the Keepr server and associated with those products."
            isLast
          />
        </View>

        {/* ACCOUNT */}
        <Text style={styles.groupLabel}>ACCOUNT & SESSION</Text>

        <View style={styles.card}>
          <PrivacySection
            title="Signing out"
            description="When you log out, Keepr removes your saved authentication token and clears cached images. Your account and registered products remain on the server."
          />

          <PrivacySection
            title="Session security"
            description="Keepr uses an authentication token to identify your session when communicating with the server."
            isLast
          />
        </View>

        {/* DATA MANAGEMENT */}
        <Text style={styles.groupLabel}>DATA MANAGEMENT</Text>

        <View style={styles.card}>
          <PrivacySection
            title="Exporting your data"
            description="Data export is not available in this version of Keepr."
            isLast
          />
        </View>

        {/* DELETE ACCOUNT */}
        <Text style={styles.groupLabel}>DELETE ACCOUNT</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.sectionTitle}>Deleting your account</Text>
            <Text style={styles.sectionDescription}>
              Permanently deletes your Keepr account and everything linked to
              it: your products, warranties, maintenance history and the photos
              and documents you uploaded. This cannot be undone.
            </Text>

            {deleting ? (
              <View style={styles.deleteForm}>
                <FormField
                  label="CONFIRM WITH YOUR PASSWORD"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  error={passwordError}
                />

                {formError ? (
                  <Text style={styles.formError}>{formError}</Text>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.dangerButton,
                    submitting && styles.buttonDisabled,
                  ]}
                  activeOpacity={0.8}
                  onPress={submitDelete}
                  disabled={submitting}
                >
                  <Text style={styles.dangerButtonText}>
                    {submitting ? "Deleting…" : "Delete my account permanently"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeDeleteForm}
                  disabled={submitting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.dangerOutlineButton}
                activeOpacity={0.7}
                onPress={() => setDeleting(true)}
              >
                <Text style={styles.dangerOutlineText}>Delete account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            This page describes how the current version of Keepr handles
            information. Additional privacy and account management features may
            be introduced in future updates.
          </Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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
    marginTop: spacing.md,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  infoRow: {
    paddingVertical: spacing.lg,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },

  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  deleteForm: {
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

  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  dangerButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },

  buttonDisabled: {
    opacity: 0.6,
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

  dangerOutlineButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  dangerOutlineText: {
    color: colors.danger,
    fontWeight: "600",
    fontSize: 14,
  },

  infoBox: {
    backgroundColor: colors.iconBg,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },

  infoText: {
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 20,
  },
});
