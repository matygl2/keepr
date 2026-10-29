import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { errorMessage } from '../api/client';
import { DOCUMENT_TYPES, documentImageSource } from '../api/documents';
import { pickPhotoBase64, PhotoSource } from '../api/pickPhoto';
import { colors, radius, spacing } from '../constants/theme';
import { useProducts } from '../context/ProductsContext';
import { DocumentType, Product } from '../types';

/**
 * Los tres documentos del producto (recibo, garantía y manual), cada uno con su foto:
 * se puede sacar con la cámara, elegir de la galería, ver a pantalla completa y quitar.
 */
export default function DocumentsCard({ product }: { product: Product }) {
  const { attachDocument, removeDocument } = useProducts();
  const insets = useSafeAreaInsets();
  const [sheetFor, setSheetFor] = useState<DocumentType | null>(null);
  const [viewing, setViewing] = useState<DocumentType | null>(null);
  const [busy, setBusy] = useState<DocumentType | null>(null);

  const photoIdOf = (type: DocumentType) => product.documents?.[type];
  const labelOf = (type: DocumentType) => DOCUMENT_TYPES.find((d) => d.type === type)!.label;
  const flagged = (type: DocumentType) =>
    product.documentation.some((d) => d.name === labelOf(type) && d.uploaded);

  const addPhoto = async (type: DocumentType, source: PhotoSource) => {
    setSheetFor(null);
    let image: string | null;
    try {
      image = await pickPhotoBase64(source);
    } catch (err) {
      Alert.alert('Could not get the photo', errorMessage(err));
      return;
    }
    if (!image) return; // canceló

    setBusy(type);
    try {
      await attachDocument(product.id, type, image);
    } catch (err) {
      Alert.alert('Could not save the photo', errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const confirmRemove = (type: DocumentType) => {
    setSheetFor(null);
    Alert.alert('Remove photo?', `The photo of the ${labelOf(type).toLowerCase()} will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(type);
          try {
            await removeDocument(product.id, type);
          } catch (err) {
            Alert.alert('Could not remove the photo', errorMessage(err));
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  const viewingId = viewing ? photoIdOf(viewing) : undefined;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>DOCUMENTATION</Text>

      {DOCUMENT_TYPES.map(({ type, label }, index) => {
        const photoId = photoIdOf(type);
        return (
          <View key={type} style={[styles.row, index > 0 && styles.rowBorder]}>
            {photoId ? (
              <TouchableOpacity activeOpacity={0.85} onPress={() => setViewing(type)}>
                <Image
                  source={documentImageSource(product.id, type, photoId)}
                  style={styles.thumb}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconWrap}>
                <Text>📄</Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.name}>{label}</Text>
              <Text style={photoId ? styles.statusOk : styles.status}>
                {photoId ? 'Photo saved · tap to view' : flagged(type) ? 'Marked as available' : 'Not added'}
              </Text>
            </View>

            {busy === type ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={() => setSheetFor(type)} hitSlop={6}>
                <Text style={styles.buttonText}>{photoId ? 'Change' : 'Add'}</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Opciones para agregar, cambiar o quitar la foto */}
      <Modal visible={sheetFor !== null} transparent animationType="fade" onRequestClose={() => setSheetFor(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheetFor(null)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
            onPress={() => {}}
          >
            <Text style={styles.sheetTitle}>{sheetFor ? labelOf(sheetFor) : ''}</Text>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => sheetFor && void addPhoto(sheetFor, 'camera')}
            >
              <Text style={styles.sheetOptionText}>📷  Take a photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => sheetFor && void addPhoto(sheetFor, 'library')}
            >
              <Text style={styles.sheetOptionText}>🖼️  Choose from gallery</Text>
            </TouchableOpacity>
            {sheetFor && photoIdOf(sheetFor) ? (
              <TouchableOpacity style={styles.sheetOption} onPress={() => confirmRemove(sheetFor)}>
                <Text style={[styles.sheetOptionText, styles.danger]}>🗑️  Remove photo</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setSheetFor(null)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Foto a pantalla completa */}
      <Modal visible={viewing !== null} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable style={styles.viewer} onPress={() => setViewing(null)}>
          {viewing && viewingId ? (
            <Image
              source={documentImageSource(product.id, viewing, viewingId)}
              style={styles.full}
              contentFit="contain"
              cachePolicy="disk"
            />
          ) : null}
          <TouchableOpacity
            style={[styles.close, { top: insets.top + spacing.sm }]}
            onPress={() => setViewing(null)}
            hitSlop={12}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  status: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusOk: {
    fontSize: 12,
    color: colors.success,
    marginTop: 2,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.iconBg,
  },
  buttonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  // Hoja de opciones
  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  sheetTitle: {
    fontSize: 13,
    letterSpacing: 0.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  sheetOption: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  sheetOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  danger: {
    color: colors.danger,
  },
  sheetCancel: {
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
  },
  sheetCancelText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },

  // Visor
  viewer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  full: {
    width: '100%',
    height: '100%',
  },
  close: {
    position: 'absolute',
    right: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: colors.white,
    fontSize: 18,
  },
});
