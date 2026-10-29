// Exportar la garantía como PDF y generar un texto para vender el producto.
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, fonts, radius, spacing } from '../constants/theme';
import type { Product } from '../types';
import {
  buildSaleListingText,
  buildWarrantyHtml,
  type ListingLanguage,
} from '../utils/productExport';

const LANGUAGES: { value: ListingLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

export default function ProductShareCard({ product }: { product: Product }) {
  const [creatingPdf, setCreatingPdf] = useState(false);
  const [listingOpen, setListingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [language, setLanguage] = useState<ListingLanguage>('es');

  const listingText = buildSaleListingText(product, language);

  const changeLanguage = (value: ListingLanguage) => {
    setLanguage(value);
    setCopied(false);
  };

  const shareWarrantyPdf = async () => {
    setCreatingPdf(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Not available', 'This device cannot share files from Keepr.');
        return;
      }
      const { uri } = await Print.printToFileAsync({ html: buildWarrantyHtml(product) });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: `${product.name} — warranty`,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      Alert.alert('Could not create the PDF', detail);
    } finally {
      setCreatingPdf(false);
    }
  };

  const copyListing = async () => {
    try {
      await Clipboard.setStringAsync(listingText);
      setCopied(true);
    } catch {
      Alert.alert('Could not copy', 'Select the text and copy it manually.');
    }
  };

  const closeListing = () => {
    setListingOpen(false);
    setCopied(false);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>SHARE</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, creatingPdf && styles.buttonDisabled]}
          onPress={shareWarrantyPdf}
          disabled={creatingPdf}
          accessibilityRole="button"
          accessibilityLabel="Download the warranty as a PDF"
        >
          {creatingPdf ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            <>
              <Text style={styles.buttonIcon}>🧾</Text>
              <Text style={styles.buttonText}>Warranty PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setListingOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Create a text to sell this product"
        >
          <Text style={styles.buttonIcon}>🏷️</Text>
          <Text style={styles.buttonText}>Sale listing</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={listingOpen} transparent animationType="slide" onRequestClose={closeListing}>
        <Pressable style={styles.backdrop} onPress={closeListing}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>Ready to post</Text>
            <Text style={styles.sheetHint}>
              Built from this product&apos;s data. Copy it and paste it in your listing.
            </Text>

            <View style={styles.languageRow} accessibilityRole="radiogroup">
              {LANGUAGES.map(({ value, label }) => {
                const active = value === language;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.languageButton, active && styles.languageButtonActive]}
                    onPress={() => changeLanguage(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.languageText, active && styles.languageTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView style={styles.textBox}>
              <Text style={styles.listingText} selectable>
                {listingText}
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={[styles.copyButton, copied && styles.copyButtonDone]}
              onPress={copyListing}
              accessibilityRole="button"
            >
              <Text style={styles.copyButtonText}>{copied ? 'Copied ✓' : 'Copy text'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={closeListing} hitSlop={8}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 12,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  sheetTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    color: colors.textPrimary,
  },
  sheetHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  languageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  languageButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  languageButtonActive: {
    backgroundColor: colors.secondary,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  languageTextActive: {
    color: colors.white,
  },
  textBox: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  listingText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
  },
  copyButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonDone: {
    backgroundColor: colors.success,
  },
  copyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
