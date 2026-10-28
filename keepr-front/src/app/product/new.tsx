import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../../api/client';
import FormField from '../../components/FormField';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useProducts } from '../../context/ProductsContext';
import { formatDate } from '../../data/mockData';
import { Category, Product } from '../../types';
import { addMonthsISO, isValidISODate, localTodayISO } from '../../utils/validation';
import { resolvePhotoUri } from '../../api/receipt';

const CATEGORIES: Category[] = ['Tech', 'Home', 'Fashion', 'Other'];

const CATEGORY_ICONS: Record<Category, string> = {
  Tech: '📱',
  Home: '🏠',
  Fashion: '👟',
  Other: '📦',
};

const DURATIONS = [
  { key: '6m', label: '6 months', months: 6 },
  { key: '1y', label: '1 year', months: 12 },
  { key: '2y', label: '2 years', months: 24 },
  { key: '3y', label: '3 years', months: 36 },
  { key: 'custom', label: 'Custom date', months: 0 },
] as const;

type DurationKey = (typeof DURATIONS)[number]['key'];
type FieldName = 'name' | 'store' | 'purchaseDate' | 'price' | 'customExpiry';

export default function NewProductScreen() {
  const router = useRouter();
  const { addProduct, attachReceipt } = useProducts();
  // Si venís de sacar una foto, llega su ubicación temporal en el teléfono.
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();
  const [photo, setPhoto] = useState<string | null>(photoUri ? resolvePhotoUri(photoUri) : null);

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<Category>('Tech');
  const [subCategory, setSubCategory] = useState('');
  const [store, setStore] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(localTodayISO());
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState<DurationKey>('1y');
  const [customExpiry, setCustomExpiry] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [docs, setDocs] = useState({ receipt: Boolean(photoUri), warranty: false, manual: false });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [saving, setSaving] = useState(false);

  const selectedDuration = DURATIONS.find((d) => d.key === duration)!;
  const purchaseOk = isValidISODate(purchaseDate);

  // Expiry date shown to the user and saved with the product.
  const expiryDate =
    duration === 'custom'
      ? customExpiry
      : purchaseOk
        ? addMonthsISO(purchaseDate, selectedDuration.months)
        : '';

  const validate = () => {
    const next: Partial<Record<FieldName, string>> = {};
    if (!name.trim()) next.name = 'Enter the product name.';
    if (!store.trim()) next.store = 'Enter the store where you bought it.';

    if (!isValidISODate(purchaseDate)) {
      next.purchaseDate = 'Use the format YYYY-MM-DD.';
    } else if (purchaseDate > localTodayISO()) {
      next.purchaseDate = 'The purchase date cannot be in the future.';
    }

    const priceNumber = Number(price);
    if (!price || !Number.isFinite(priceNumber) || priceNumber <= 0) {
      next.price = 'Enter a price greater than 0.';
    }

    if (duration === 'custom') {
      if (!isValidISODate(customExpiry)) {
        next.customExpiry = 'Use the format YYYY-MM-DD.';
      } else if (purchaseOk && customExpiry <= purchaseDate) {
        next.customExpiry = 'Must be after the purchase date.';
      }
    }
    return next;
  };

  const handleSave = async () => {
    if (saving) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const priceNumber = Number(price);
    setSaving(true);

    let created: Product;
    try {
      // El servidor genera el id y registra la compra en el historial.
      created = await addProduct({
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        category,
        subCategory: subCategory.trim() || category,
        icon: CATEGORY_ICONS[category],
        store: store.trim(),
        purchaseDate,
        price: priceNumber,
        warrantyExpiryDate: expiryDate,
        serialNumber: serialNumber.trim() || 'N/A',
        documentation: [
          { name: 'Receipt', uploaded: docs.receipt || photo !== null },
          { name: 'Warranty document', uploaded: docs.warranty },
          { name: 'Manual', uploaded: docs.manual },
        ],
      });
    } catch (err) {
      Alert.alert('Could not save', errorMessage(err));
      setSaving(false);
      return;
    }

    const goToProduct = () => router.replace(`/product/${created.id}`);
    if (!photo) {
      goToProduct();
      return;
    }

    // El producto ya está guardado: si la foto falla, se puede reintentar o seguir sin ella.
    const uploadPhoto = async () => {
      try {
        await attachReceipt(created.id, photo);
        goToProduct();
      } catch (err) {
        Alert.alert(
          'Product saved, but the photo was not uploaded',
          errorMessage(err),
          [
            { text: 'Skip', style: 'cancel', onPress: goToProduct },
            { text: 'Try again', onPress: () => void uploadPhoto() },
          ],
          { cancelable: false }
        );
      }
    };
    await uploadPhoto();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Add a product</Text>
          <Text style={styles.subtitle}>
            Enter the purchase details and Keepr will track the warranty for you.
          </Text>

          {photo ? (
            <View style={styles.photoCard}>
              <Image source={{ uri: photo }} style={styles.photoThumb} contentFit="cover" />
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle}>Photo attached</Text>
                <Text style={styles.photoText}>It will be saved with your product.</Text>
                <TouchableOpacity onPress={() => setPhoto(null)} hitSlop={8}>
                  <Text style={styles.photoRemove}>Remove photo</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <FormField
            label="PRODUCT NAME *"
            value={name}
            onChangeText={setName}
            placeholder="HP Victus 16"
            error={errors.name}
          />

          <View style={styles.row}>
            <View style={styles.half}>
              <FormField label="BRAND" value={brand} onChangeText={setBrand} placeholder="HP" />
            </View>
            <View style={styles.half}>
              <FormField
                label="MODEL"
                value={model}
                onChangeText={setModel}
                placeholder="16-d0xxx"
              />
            </View>
          </View>

          <Text style={styles.label}>CATEGORY</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FormField
            label="TYPE (OPTIONAL)"
            value={subCategory}
            onChangeText={setSubCategory}
            placeholder="Laptop, Headphones, Sneakers…"
          />

          <FormField
            label="STORE *"
            value={store}
            onChangeText={setStore}
            placeholder="Frávega"
            error={errors.store}
          />

          <FormField
            label="PURCHASE DATE *"
            value={purchaseDate}
            onChangeText={setPurchaseDate}
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            error={errors.purchaseDate}
          />

          <FormField
            label="PRICE (ARS) *"
            value={price}
            onChangeText={(text) => setPrice(text.replace(/[^0-9]/g, ''))}
            placeholder="1850000"
            keyboardType="numeric"
            error={errors.price}
          />

          <Text style={styles.label}>WARRANTY DURATION</Text>
          <View style={styles.chipRow}>
            {DURATIONS.map((d) => (
              <TouchableOpacity
                key={d.key}
                style={[styles.chip, duration === d.key && styles.chipActive]}
                onPress={() => setDuration(d.key)}
              >
                <Text style={[styles.chipText, duration === d.key && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {duration === 'custom' ? (
            <FormField
              label="WARRANTY EXPIRY DATE"
              value={customExpiry}
              onChangeText={setCustomExpiry}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              error={errors.customExpiry}
            />
          ) : (
            <Text style={styles.expiryNote}>
              {expiryDate
                ? `Warranty expires on ${formatDate(expiryDate)}.`
                : 'Enter a valid purchase date to calculate the expiry.'}
            </Text>
          )}

          <FormField
            label="SERIAL NUMBER (OPTIONAL)"
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="5CD123XYZ"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Text style={styles.label}>DOCUMENTS YOU HAVE</Text>
          <View style={styles.docsCard}>
            {(
              [
                ['receipt', 'Receipt'],
                ['warranty', 'Warranty document'],
                ['manual', 'Manual'],
              ] as const
            ).map(([key, label], index, all) => (
              <View
                key={key}
                style={[styles.docRow, index < all.length - 1 && styles.docRowBorder]}
              >
                <Text style={styles.docLabel}>{label}</Text>
                <Switch
                  value={docs[key]}
                  onValueChange={(value) => setDocs((prev) => ({ ...prev, [key]: value }))}
                  trackColor={{ true: colors.secondaryLight, false: colors.border }}
                  thumbColor={colors.white}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save product'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  back: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 28,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
  },
  chipTextActive: {
    color: colors.white,
  },
  expiryNote: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  docsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  docRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  docLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  photoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  photoThumb: {
    width: 72,
    height: 96,
    borderRadius: radius.sm,
    backgroundColor: colors.iconBg,
  },
  photoInfo: {
    flex: 1,
    gap: 2,
  },
  photoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  photoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  photoRemove: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
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
