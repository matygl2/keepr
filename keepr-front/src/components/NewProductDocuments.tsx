// Documentos al crear un producto: recibo, garantía y manual. Cada uno se puede marcar
// como "lo tengo" y, si querés, adjuntarle una foto (cámara o galería) o un PDF en el momento.
// Los archivos se suben recién cuando el producto ya está guardado (ver product/new.tsx).
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import React from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { DOCUMENT_TYPES } from '../api/documents';
import { pickPhotoBase64, PhotoSource } from '../api/pickPhoto';
import { colors, radius, spacing } from '../constants/theme';
import { DocumentType } from '../types';

/** Mismo límite que el servidor (5 MB). */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Archivo elegido para un documento, todavía sin subir. */
export type PendingFile =
  | { kind: 'camera'; uri: string } // foto sacada con la cámara de Keepr (pantalla Scan)
  | { kind: 'photo'; base64: string } // foto de la cámara o la galería, ya en JPEG
  | { kind: 'pdf'; uri: string; name: string };

export interface PendingDocument {
  has: boolean;
  file: PendingFile | null;
}

export type PendingDocuments = Record<DocumentType, PendingDocument>;

export const EMPTY_DOCUMENTS: PendingDocuments = {
  receipt: { has: false, file: null },
  warranty: { has: false, file: null },
  manual: { has: false, file: null },
};

interface Props {
  value: PendingDocuments;
  onChange: (next: PendingDocuments) => void;
}

export default function NewProductDocuments({ value, onChange }: Props) {
  const update = (type: DocumentType, patch: Partial<PendingDocument>) =>
    onChange({ ...value, [type]: { ...value[type], ...patch } });

  const addPhoto = async (type: DocumentType, source: PhotoSource) => {
    try {
      const base64 = await pickPhotoBase64(source);
      if (base64) update(type, { has: true, file: { kind: 'photo', base64 } });
    } catch (err) {
      Alert.alert('Could not get the photo', err instanceof Error ? err.message : String(err));
    }
  };

  const addPdf = async (type: DocumentType) => {
    let result: DocumentPicker.DocumentPickerResult;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
    } catch (err) {
      Alert.alert('Could not open your files', err instanceof Error ? err.message : String(err));
      return;
    }
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.size !== undefined && asset.size > MAX_FILE_BYTES) {
      Alert.alert('File too large', 'The PDF must be 5 MB or smaller.');
      return;
    }
    update(type, { has: true, file: { kind: 'pdf', uri: asset.uri, name: asset.name } });
  };

  return (
    <View style={styles.card}>
      {DOCUMENT_TYPES.map(({ type, label }, index) => {
        const doc = value[type];
        return (
          <View key={type} style={[styles.row, index > 0 && styles.rowBorder]}>
            <View style={styles.topRow}>
              <Text style={styles.label}>{label}</Text>
              <Switch
                value={doc.has}
                onValueChange={(has) => update(type, { has, file: has ? doc.file : null })}
                trackColor={{ true: colors.secondaryLight, false: colors.border }}
                thumbColor={colors.white}
                accessibilityLabel={`I have the ${label.toLowerCase()}`}
              />
            </View>

            {doc.has && doc.file ? (
              <View style={styles.fileRow}>
                {doc.file.kind === 'pdf' ? (
                  <View style={styles.thumb}>
                    <Text style={styles.pdfIcon}>📄</Text>
                  </View>
                ) : (
                  <Image
                    source={{
                      uri:
                        doc.file.kind === 'photo'
                          ? `data:image/jpeg;base64,${doc.file.base64}`
                          : doc.file.uri,
                    }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                )}
                <Text style={styles.fileName} numberOfLines={1}>
                  {doc.file.kind === 'pdf' ? doc.file.name : 'Photo attached'}
                </Text>
                <TouchableOpacity onPress={() => update(type, { file: null })} hitSlop={8}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : doc.has ? (
              <>
                <View style={styles.buttons}>
                  <AttachButton label="📷 Camera" onPress={() => void addPhoto(type, 'camera')} />
                  <AttachButton label="🖼 Gallery" onPress={() => void addPhoto(type, 'library')} />
                  <AttachButton label="📎 PDF" onPress={() => void addPdf(type)} />
                </View>
                <Text style={styles.hint}>Optional: you can also add it later from the product.</Text>
              </>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

function AttachButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    paddingVertical: spacing.sm,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  thumb: {
    width: 44,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfIcon: {
    fontSize: 22,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  remove: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
