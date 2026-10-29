// Visor de PDF dentro de la app (iPhone lo dibuja con un WebView; se puede pellizcar
// para hacer zoom y deslizar para pasar de página). El botón Share lo manda a otra app.
// En Android el WebView no dibuja PDF: se abre con el visor de PDF del teléfono.
import { File, Paths } from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { colors, fonts, spacing } from '../constants/theme';

const FLAG_GRANT_READ_URI_PERMISSION = 1;

/** Android: abre el PDF con la app de PDF del teléfono; si no hay ninguna, el menú de compartir. */
export async function openPdfInAnotherApp(fileUri: string, title: string): Promise<void> {
  try {
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: new File(fileUri).contentUri,
      type: 'application/pdf',
      flags: FLAG_GRANT_READ_URI_PERMISSION,
    });
  } catch {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: title });
  }
}

interface Props {
  title: string;
  /** Descarga el PDF y devuelve la ruta local. null = visor cerrado. */
  load: (() => Promise<string>) | null;
  onClose: () => void;
}

export default function PdfViewer({ title, load, onClose }: Props) {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!load) return;
    let cancelled = false;
    setFileUri(null);
    setError('');
    load()
      .then((uri) => {
        if (!cancelled) setFileUri(uri);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [load]);

  const share = async () => {
    if (!fileUri) return;
    try {
      await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch (err) {
      Alert.alert('Could not share the PDF', err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Modal visible={load !== null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={12} accessibilityRole="button">
            <Text style={styles.headerButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={share}
            disabled={!fileUri}
            hitSlop={12}
            accessibilityRole="button"
          >
            <Text style={[styles.headerButton, !fileUri && styles.disabled]}>Share</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={styles.error}>Could not load the PDF. {error}</Text>
        ) : fileUri ? (
          <WebView
            source={{ uri: fileUri }}
            originWhitelist={['*']}
            allowFileAccess
            allowingReadAccessToURL={Paths.cache.uri}
            style={styles.webview}
          />
        ) : (
          <ActivityIndicator style={styles.loading} color={colors.primary} />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.textPrimary,
  },
  headerButton: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    marginTop: spacing.xl,
  },
  error: {
    margin: spacing.lg,
    color: colors.danger,
    fontSize: 14,
  },
});
