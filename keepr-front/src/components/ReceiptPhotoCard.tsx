import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { receiptImageSource } from '../api/receipt';
import { colors, radius, spacing } from '../constants/theme';

interface Props {
  productId: string;
  photoId: string;
}

/** Muestra la foto guardada de la garantía; al tocarla se ve a pantalla completa. */
export default function ReceiptPhotoCard({ productId, photoId }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const source = receiptImageSource(productId, photoId);

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>PHOTO</Text>

      {failed ? (
        <Text style={styles.error}>Couldn't load the photo. Check your connection.</Text>
      ) : (
        <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)}>
          <Image
            source={source}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="disk"
            onError={() => setFailed(true)}
          />
          <Text style={styles.hint}>Tap to enlarge</Text>
        </TouchableOpacity>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Image source={source} style={styles.full} contentFit="contain" cachePolicy="disk" />
          <TouchableOpacity
            style={[styles.close, { top: insets.top + spacing.sm }]}
            onPress={() => setOpen(false)}
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
  thumb: {
    width: '100%',
    height: 180,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  error: {
    fontSize: 13,
    color: colors.danger,
  },
  backdrop: {
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
