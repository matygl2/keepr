// Tarjeta del recibo en el detalle: cargar, ver o reemplazar una foto o un PDF.
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { errorMessage } from '../api/client';
import { downloadReceiptPdf } from '../api/receipt';
import { colors, radius, spacing } from '../constants/theme';
import { useProducts } from '../context/ProductsContext';
import type { Product } from '../types';
import ReceiptPhotoCard from './ReceiptPhotoCard';

/** Mismo límite que el servidor (5 MB). */
const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

type Busy = 'photo' | 'pdf' | 'open' | null;

export default function ReceiptSection({ product }: { product: Product }) {
  const { attachReceipt, attachReceiptPdf } = useProducts();
  const [busy, setBusy] = useState<Busy>(null);

  const hasReceipt = Boolean(product.receiptPhotoId);
  const isPdf = product.receiptType === 'pdf';

  // El selector de fotos del sistema no necesita pedir permiso.
  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1, // la compresión a JPEG la hace uploadReceipt
    });
    if (result.canceled) return;

    setBusy('photo');
    try {
      await attachReceipt(product.id, result.assets[0].uri);
    } catch (err) {
      Alert.alert('Could not upload the photo', uploadErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const pickPdf = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.size !== undefined && asset.size > MAX_RECEIPT_BYTES) {
      Alert.alert('File too large', 'The PDF must be 5 MB or smaller.');
      return;
    }

    setBusy('pdf');
    try {
      await attachReceiptPdf(product.id, asset.uri);
    } catch (err) {
      Alert.alert('Could not upload the PDF', uploadErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  // El PDF es privado: se baja con el token y se abre con el visor del teléfono.
  const openPdf = async () => {
    if (!product.receiptPhotoId) return;
    setBusy('open');
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Not available', 'This device cannot open files from Keepr.');
        return;
      }
      const uri = await downloadReceiptPdf(product.id, product.receiptPhotoId);
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Open receipt',
      });
    } catch (err) {
      Alert.alert('Could not open the PDF', uploadErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>RECEIPT</Text>

      {!hasReceipt && (
        <Text style={styles.empty}>
          No receipt yet. Add a photo or a PDF so you have it at hand for a warranty claim.
        </Text>
      )}

      {hasReceipt && !isPdf && product.receiptPhotoId && (
        <ReceiptPhotoCard productId={product.id} photoId={product.receiptPhotoId} bare />
      )}

      {hasReceipt && isPdf && (
        <TouchableOpacity
          style={styles.pdfRow}
          onPress={openPdf}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel="Open the receipt PDF"
        >
          <Text style={styles.pdfIcon}>📄</Text>
          <View style={styles.pdfText}>
            <Text style={styles.pdfName}>Receipt.pdf</Text>
            <Text style={styles.pdfHint}>Tap to open</Text>
          </View>
          {busy === 'open' ? (
            <ActivityIndicator color={colors.secondary} />
          ) : (
            <Text style={styles.chevron}>›</Text>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.buttons}>
        <UploadButton
          label={hasReceipt ? 'Replace with photo' : 'Photo from gallery'}
          icon="🖼"
          loading={busy === 'photo'}
          disabled={busy !== null}
          onPress={pickPhoto}
        />
        <UploadButton
          label={hasReceipt ? 'Replace with PDF' : 'Upload PDF'}
          icon="📎"
          loading={busy === 'pdf'}
          disabled={busy !== null}
          onPress={pickPdf}
        />
      </View>
    </View>
  );
}

function UploadButton({
  label,
  icon,
  loading,
  disabled,
  onPress,
}: {
  label: string;
  icon: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
    >
      {loading ? (
        <ActivityIndicator color={colors.secondary} />
      ) : (
        <Text style={styles.buttonText}>
          {icon} {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function uploadErrorMessage(err: unknown): string {
  if (err instanceof Error && err.name !== 'ApiError') return err.message;
  return errorMessage(err);
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
  empty: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  pdfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
    marginBottom: spacing.md,
  },
  pdfIcon: {
    fontSize: 24,
  },
  pdfText: {
    flex: 1,
  },
  pdfName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pdfHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
    textAlign: 'center',
  },
});
