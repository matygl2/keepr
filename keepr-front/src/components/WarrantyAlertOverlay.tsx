import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatRemaining, getDaysRemaining } from '../data/mockData';
import { colors, fonts, radius, spacing } from '../constants/theme';
import { Product } from '../types';

interface Props {
  visible: boolean;
  product: Product | null;
  onDismiss: () => void;
}

export default function WarrantyAlertOverlay({ visible, product, onDismiss }: Props) {
  const router = useRouter();
  if (!product) return null;

  const days = getDaysRemaining(product.warrantyExpiryDate);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={styles.shield}>🛡️</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>WARRANTY ALERT</Text>
              <Text style={styles.title}>Warranty expiring soon</Text>
            </View>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.message}>
              Your <Text style={styles.bold}>{product.name}</Text> warranty
              expires in <Text style={styles.highlight}>{days}</Text> days.
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                onDismiss();
                router.push(`/product/${product.id}`);
              }}
            >
              <Text style={styles.primaryButtonText}>View Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss}>
              <Text style={styles.secondaryButtonText}>Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shield: {
    fontSize: 20,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    color: colors.white,
    fontFamily: fonts.serif,
    fontSize: 18,
  },
  messageBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  message: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: colors.white,
  },
  highlight: {
    fontWeight: '700',
    color: '#E0B45B',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
