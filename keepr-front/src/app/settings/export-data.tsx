import { File, Paths } from "expo-file-system";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useState } from "react";
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
import { useProducts } from "../../context/ProductsContext";
import type { Product } from "../../types";

type ExportProduct = Omit<
  Product,
  "calendarEventId" | "documents" | "documentKinds" | "receiptPhotoId"
>;

function prepareProductForExport(product: Product): ExportProduct {
  const {
    calendarEventId,
    documents,
    documentKinds,
    receiptPhotoId,
    ...exportableProduct
  } = product;

  return exportableProduct;
}

export default function ExportDataScreen() {
  const { user } = useAuth();
  const { reload } = useProducts();

  const [exporting, setExporting] = useState(false);

  const exportData = async () => {
    if (!user) {
      Alert.alert("Error", "Please sign in to export your data.");
      return;
    }

    if (exporting) return;

    try {
      setExporting(true);

      const products = await reload();

      const exportContent = {
        application: "Keepr",
        exportedAt: new Date().toISOString(),
        account: {
          name: user.name,
          email: user.email,
        },
        products: products.map(prepareProductForExport),
      };

      const json = JSON.stringify(exportContent, null, 2);

      const date = new Date().toISOString().split("T")[0];
      const file = new File(Paths.cache, `keepr-export-${date}.json`);

      file.create({ overwrite: true });
      file.write(json);

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        Alert.alert(
          "Sharing unavailable",
          "Your device does not support sharing files.",
        );
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Export Keepr data",
        UTI: "public.json",
      });
    } catch {
      Alert.alert(
        "Export failed",
        "We couldn't export your data. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };

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

        <Text style={styles.title}>Export my data</Text>

        <Text style={styles.subtitle}>
          Your data, your control. Download a copy of the information you've
          saved in Keepr.
        </Text>

        {/* INFORMATION */}
        <Text style={styles.groupLabel}>WHAT'S INCLUDED</Text>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoTitle}>Personal information</Text>
            <Text style={styles.infoDescription}>
              Your name and email address.
            </Text>
          </View>

          <View style={[styles.infoRow, styles.rowBorder]}>
            <Text style={styles.infoTitle}>Products</Text>
            <Text style={styles.infoDescription}>
              Your registered products and purchase details.
            </Text>
          </View>

          <View style={[styles.infoRow, styles.rowBorder]}>
            <Text style={styles.infoTitle}>Warranties</Text>
            <Text style={styles.infoDescription}>
              Warranty expiration dates for your products.
            </Text>
          </View>

          <View style={[styles.infoRow, styles.rowBorder]}>
            <Text style={styles.infoTitle}>Maintenance history</Text>
            <Text style={styles.infoDescription}>
              Maintenance records, dates and costs.
            </Text>
          </View>

          <View style={[styles.infoRow, styles.rowBorder]}>
            <Text style={styles.infoTitle}>Documentation</Text>
            <Text style={styles.infoDescription}>
              Document information. Original files are not included.
            </Text>
          </View>
        </View>

        {/* FORMAT */}
        <Text style={styles.groupLabel}>EXPORT FORMAT</Text>

        <View style={styles.card}>
          <View style={styles.formatRow}>
            <View>
              <Text style={styles.infoTitle}>JSON file</Text>
              <Text style={styles.infoDescription}>
                Structured, machine-readable data.
              </Text>
            </View>

            <Text style={styles.formatBadge}>.JSON</Text>
          </View>
        </View>

        {/* PRIVACY */}
        <Text style={styles.privacyText}>
          Your export will not include passwords, authentication tokens or
          original document files.
        </Text>

        {/* EXPORT BUTTON */}
        <TouchableOpacity
          style={[styles.exportButton, exporting && styles.disabledButton]}
          onPress={exportData}
          disabled={exporting}
          activeOpacity={0.8}
        >
          <Text style={styles.exportButtonText}>
            {exporting ? "Preparing export..." : "Export my data ↓"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          You'll be able to save or share your file using your device.
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
    paddingBottom: spacing.xl + 40,
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

  infoRow: {
    padding: spacing.md,
  },

  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  infoTitle: {
    fontSize: 15,
    color: colors.secondary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },

  infoDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },

  formatRow: {
    padding: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  formatBadge: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  privacyText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 19,
    marginBottom: spacing.lg,
  },

  exportButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.5,
  },

  exportButtonText: {
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
