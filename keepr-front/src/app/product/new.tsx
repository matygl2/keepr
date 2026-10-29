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
import { errorMessage } from '../../api/client';
import FormField from '../../components/FormField';
import NewProductDocuments, {
  EMPTY_DOCUMENTS,
  PendingDocuments,
} from '../../components/NewProductDocuments';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { useProducts } from '../../context/ProductsContext';
import { formatDate, getProductById } from '../../data/mockData';
import { Category, DocumentType, Product } from '../../types';
import { addMonthsISO, isValidISODate, localTodayISO } from '../../utils/validation';
import { DOCUMENT_TYPES, readFileBase64 } from '../../api/documents';
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

/** La duración de la lista que da justo esa fecha de vencimiento, o 'custom'. */
function durationFor(purchaseDate: string, expiryDate: string): DurationKey {
  const match = DURATIONS.find(
    (d) => d.months > 0 && addMonthsISO(purchaseDate, d.months) === expiryDate
  );
  return match ? match.key : 'custom';
}

/**
 * Formulario para agregar un producto. También se usa para editarlo:
 * /product/[id]/edit abre esta misma pantalla con el producto ya cargado.
 */
export default function NewProductScreen() {
  const router = useRouter();
  const { products, addProduct, updateProduct, attachReceipt, attachDocument } = useProducts();
  // Si venís de sacar una foto, llega su ubicación temporal en el teléfono.
  // Si venís de "Edit", llega el id del producto a editar.
  const { photoUri, id } = useLocalSearchParams<{ photoUri?: string; id?: string }>();
  const editing = id ? getProductById(products, id) : undefined;
  // Recibo, garantía y manual: si venís de la cámara, el recibo ya trae la foto.
  const [documents, setDocuments] = useState<PendingDocuments>(() =>
    photoUri
      ? {
          ...EMPTY_DOCUMENTS,
          receipt: { has: true, file: { kind: 'camera', uri: resolvePhotoUri(photoUri) } },
        }
      : EMPTY_DOCUMENTS
  );

  // Al editar, cada campo arranca con el valor que ya tiene el producto.
  const [name, setName] = useState(editing?.name ?? '');
  const [brand, setBrand] = useState(editing?.brand ?? '');
  const [model, setModel] = useState(editing?.model ?? '');
  const [category, setCategory] = useState<Category>(editing?.category ?? 'Tech');
  const [subCategory, setSubCategory] = useState(editing?.subCategory ?? '');
  const [store, setStore] = useState(editing?.store ?? '');
  const [purchaseDate, setPurchaseDate] = useState(editing?.purchaseDate ?? localTodayISO());
  const [price, setPrice] = useState(editing ? String(editing.price) : '');
  const [duration, setDuration] = useState<DurationKey>(
    editing ? durationFor(editing.purchaseDate, editing.warrantyExpiryDate) : '1y'
  );
  const [customExpiry, setCustomExpiry] = useState(editing?.warrantyExpiryDate ?? '');
  const [serialNumber, setSerialNumber] = useState(
    editing && editing.serialNumber !== 'N/A' ? editing.serialNumber : ''
  );
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [saving, setSaving] = useState(false);
  // Evita guardar dos veces con un doble toque: el estado tarda un render en
  // actualizarse, el ref cambia al instante.
  const savingRef = useRef(false);

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
    if (savingRef.current) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const priceNumber = Number(price);
    savingRef.current = true;
    setSaving(true);

    // Editar: PATCH con los datos del formulario y volver al detalle.
    if (editing) {
      try {
        await updateProduct(editing.id, {
          name: name.trim(),
          brand: brand.trim(),
          model: model.trim(),
          category,
          subCategory: subCategory.trim() || category,
          icon: category === editing.category ? editing.icon : CATEGORY_ICONS[category],
          store: store.trim(),
          purchaseDate,
          price: priceNumber,
          warrantyExpiryDate: expiryDate,
          serialNumber: serialNumber.trim() || 'N/A',
        });
        router.back();
      } catch (err) {
        Alert.alert('Could not save the changes', errorMessage(err));
        savingRef.current = false;
        setSaving(false);
      }
      return;
    }

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
        documentation: DOCUMENT_TYPES.map(({ type, label }) => ({
          name: label,
          uploaded: documents[type].has,
        })),
      });
    } catch (err) {
      Alert.alert('Could not save', errorMessage(err));
      savingRef.current = false;
      setSaving(false);
      return;
    }

    const goToProduct = () => router.replace(`/product/${created.id}`);

    // Sube un documento adjunto al producto recién creado.
    const upload = async (type: DocumentType) => {
      const file = documents[type].file;
      if (!file) return;
      if (file.kind === 'camera') await attachReceipt(created.id, file.uri);
      else if (file.kind === 'photo') await attachDocument(created.id, type, file.base64);
      else await attachDocument(created.id, type, await readFileBase64(file.uri));
    };

    // El producto ya está guardado: si algún archivo falla, se puede reintentar o seguir sin él.
    const uploadAll = async (types: DocumentType[]) => {
      const failed: DocumentType[] = [];
      for (const type of types) {
        try {
          await upload(type);
        } catch {
          failed.push(type);
        }
      }
      if (failed.length === 0) {
        goToProduct();
        return;
      }
      const names = failed
        .map((type) => DOCUMENT_TYPES.find((d) => d.type === type)!.label.toLowerCase())
        .join(', ');
      Alert.alert(
        'Product saved',
        `Some files could not be uploaded (${names}). You can add them later from the product.`,
        [
          { text: 'Skip', style: 'cancel', onPress: goToProduct },
          { text: 'Try again', onPress: () => void uploadAll(failed) },
        ],
        { cancelable: false }
      );
    };

    await uploadAll(DOCUMENT_TYPES.map((d) => d.type).filter((type) => documents[type].file));
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
          <Text style={styles.title}>{editing ? 'Edit product' : 'Add a product'}</Text>
          <Text style={styles.subtitle}>
            {editing
              ? 'Update the details. Documents are managed from the product page.'
              : 'Enter the purchase details and Keepr will track the warranty for you.'}
          </Text>

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

          {editing ? null : (
            <>
              <Text style={styles.label}>DOCUMENTS</Text>
              <NewProductDocuments value={documents} onChange={setDocuments} />
            </>
          )}

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.8}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Save product'}
            </Text>
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
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
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
