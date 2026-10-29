// Formulario para registrar un service o arreglo de un producto.
// Usa la ruta del back POST /products/:id/maintenance (addMaintenance del contexto).
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../../../api/client';
import FormField from '../../../components/FormField';
import { colors, fonts, radius, spacing } from '../../../constants/theme';
import { useProducts } from '../../../context/ProductsContext';
import { formatDate, getProductById } from '../../../data/mockData';
import { isValidISODate, localTodayISO } from '../../../utils/validation';

type FieldName = 'title' | 'date';

export default function AddMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { products, addMaintenance } = useProducts();
  const product = getProductById(products, id);

  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [date, setDate] = useState(localTodayISO());
  const [cost, setCost] = useState('');
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [saving, setSaving] = useState(false);
  // Evita guardar dos veces si se toca el botón rápido (el estado tarda un render en cambiar).
  const savingRef = useRef(false);

  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.notFound}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  const validate = () => {
    const next: Partial<Record<FieldName, string>> = {};
    if (!title.trim()) next.title = 'Tell us what was done.';
    if (!isValidISODate(date)) {
      next.date = 'Use the format YYYY-MM-DD.';
    } else if (date > localTodayISO()) {
      next.date = 'The date cannot be in the future.';
    } else if (date < product.purchaseDate) {
      next.date = `The date cannot be before the purchase (${formatDate(product.purchaseDate)}).`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    if (savingRef.current || !validate()) return;
    savingRef.current = true;
    setSaving(true);
    try {
      await addMaintenance(product.id, {
        type: 'maintenance',
        title: title.trim(),
        provider: provider.trim(),
        date,
        cost: cost ? Number(cost) : 0,
      });
      router.back();
    } catch (err) {
      Alert.alert('Could not save the maintenance', errorMessage(err));
      savingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Maintenance</Text>
          </View>

          <Text style={styles.productName}>{product.name}</Text>

          <FormField
            label="WHAT WAS DONE *"
            value={title}
            onChangeText={setTitle}
            placeholder="Battery replacement, cleaning…"
            maxLength={120}
            error={errors.title}
          />

          <FormField
            label="WHO DID IT (OPTIONAL)"
            value={provider}
            onChangeText={setProvider}
            placeholder="Official service, technician…"
            maxLength={120}
          />

          <FormField
            label="DATE *"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            error={errors.date}
          />

          <FormField
            label="COST (ARS, OPTIONAL)"
            value={cost}
            onChangeText={(text) => setCost(text.replace(/[^0-9]/g, ''))}
            placeholder="0"
            keyboardType="numeric"
            maxLength={10}
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save maintenance'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  notFound: {
    padding: spacing.lg,
    color: colors.textPrimary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.secondary,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primary,
  },
  productName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
