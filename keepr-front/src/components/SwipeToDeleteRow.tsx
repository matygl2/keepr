// Deslizar la fila a la izquierda para mostrar "Delete".
// También se puede borrar desde el botón del detalle del producto.
import React, { useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { errorMessage } from '../api/client';
import { colors, radius, spacing } from '../constants/theme';
import { useProducts } from '../context/ProductsContext';
import type { Product } from '../types';

interface Props {
  product: Product;
  children: React.ReactNode;
}

export default function SwipeToDeleteRow({ product, children }: Props) {
  const { removeProduct } = useProducts();
  const rowRef = useRef<SwipeableMethods>(null);

  const confirmDelete = () => {
    Alert.alert(
      'Delete product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => rowRef.current?.close() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProduct(product.id);
            } catch (err) {
              rowRef.current?.close();
              Alert.alert('Could not delete product', errorMessage(err));
            }
          },
        },
      ]
    );
  };

  return (
    <ReanimatedSwipeable
      ref={rowRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          style={styles.deleteAction}
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${product.name}`}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    width: 96,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deleteIcon: {
    fontSize: 20,
  },
  deleteText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
