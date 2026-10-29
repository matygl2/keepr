import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radius, spacing } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type FeedbackType = "Suggestion" | "Report a bug" | "General feedback";

const FEEDBACK_EMAIL = "feedback@keepr.example";

const feedbackTypes: FeedbackType[] = [
  "Suggestion",
  "Report a bug",
  "General feedback",
];

export default function SendFeedbackScreen() {
  const { user } = useAuth();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>("Suggestion");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const sendFeedback = async () => {
    if (!message.trim()) {
      Alert.alert(
        "Missing message",
        "Please write your feedback before continuing.",
      );
      return;
    }

    if (!user) {
      Alert.alert("Error", "Please sign in to send feedback.");
      return;
    }

    // Cerrar el teclado antes de abrir el correo
    Keyboard.dismiss();

    const subject = `Keepr Feedback - ${feedbackType}`;

    const body = [
      `Feedback type: ${feedbackType}`,
      "",
      `Name: ${user.name}`,
      `Email: ${user.email}`,
      "",
      "Message:",
      message.trim(),
    ].join("\n");

    const url =
      `mailto:${FEEDBACK_EMAIL}` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;

    try {
      setLoading(true);

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Email unavailable",
        "Could not open an email application on this device.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* HEADER */}
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Send feedback</Text>

            <Text style={styles.subtitle}>
              Have an idea or found something that could be better? We'd love to
              hear from you.
            </Text>

            {/* FEEDBACK TYPE */}
            <Text style={styles.groupLabel}>FEEDBACK TYPE</Text>

            <View style={styles.card}>
              {feedbackTypes.map((type, index) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.option,
                    index < feedbackTypes.length - 1 && styles.optionBorder,
                  ]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setFeedbackType(type);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionText}>{type}</Text>

                  <View
                    style={[
                      styles.radio,
                      feedbackType === type && styles.radioSelected,
                    ]}
                  >
                    {feedbackType === type && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* MESSAGE */}
            <Text style={styles.groupLabel}>YOUR MESSAGE</Text>

            <View style={styles.card}>
              <TextInput
                style={styles.messageInput}
                placeholder="Tell us what you think..."
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
                maxLength={1000}
                returnKeyType="done"
                blurOnSubmit={true}
                onSubmitEditing={() => Keyboard.dismiss()}
                scrollEnabled
              />

              <Text style={styles.counter}>{message.length}/1000</Text>
            </View>

            {/* EMAIL */}
            <Text style={styles.groupLabel}>YOUR EMAIL</Text>

            <View style={styles.card}>
              <Text style={styles.email}>{user?.email ?? "Not available"}</Text>
            </View>

            <Text style={styles.helperText}>
              Your email will be included so the Keepr team can respond to your
              feedback.
            </Text>

            {/* SEND BUTTON */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!message.trim() || loading) && styles.disabledButton,
              ]}
              onPress={sendFeedback}
              disabled={!message.trim() || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>
                {loading ? "Opening email..." : "Send feedback →"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.footer}>
              Your email application will open to complete the send.
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + 40,
    flexGrow: 1,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.md,
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
    lineHeight: 21,
    marginBottom: spacing.lg,
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

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },

  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  optionText: {
    fontSize: 15,
    color: colors.secondary,
    fontWeight: "500",
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: colors.primary,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  messageInput: {
    minHeight: 150,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },

  counter: {
    textAlign: "right",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
  },

  email: {
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },

  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },

  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.5,
  },

  sendButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },

  footer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
