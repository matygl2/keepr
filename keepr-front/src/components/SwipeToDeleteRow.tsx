import React, { useRef } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Reanimated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import { errorMessage } from "../api/client";
import { colors, radius, spacing } from "../constants/theme";
import { useProducts } from "../context/ProductsContext";
import type { Product } from "../types";

interface Props {
  product: Product;
  children: React.ReactNode;
}

interface DeleteActionProps {
  progress: SharedValue<number>;
  onPress: () => void;
  productName: string;
}

function DeleteAction({ progress, onPress, productName }: DeleteActionProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value > 0.05 ? 1 : 0,
    };
  });

  return (
    <Reanimated.View style={[styles.actionContainer, animatedStyle]}>
      <Pressable
        style={styles.deleteAction}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${productName}`}
      >
        <Text style={styles.deleteIcon}>🗑</Text>
        <Text style={styles.deleteText}>Delete</Text>
      </Pressable>
    </Reanimated.View>
  );
}

export default function SwipeToDeleteRow({ product, children }: Props) {
  const { removeProduct } = useProducts();
  const rowRef = useRef<SwipeableMethods>(null);

  const confirmDelete = () => {
    Alert.alert(
      "Delete product",
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => rowRef.current?.close(),
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await removeProduct(product.id);
            } catch (err) {
              rowRef.current?.close();

              Alert.alert("Could not delete product", errorMessage(err));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ReanimatedSwipeable
        ref={rowRef}
        friction={2}
        rightThreshold={40}
        overshootRight={false}
        renderRightActions={(progress) => (
          <DeleteAction
            progress={progress}
            onPress={confirmDelete}
            productName={product.name}
          />
        )}
      >
        {children}
      </ReanimatedSwipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderRadius: radius.md,
  },

  actionContainer: {
    width: 96,
    marginLeft: spacing.sm,
    marginBottom: spacing.md,
  },

  deleteAction: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },

  deleteIcon: {
    fontSize: 20,
  },

  deleteText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
});
