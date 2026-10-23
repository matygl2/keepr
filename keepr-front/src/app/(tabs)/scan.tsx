import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { errorMessage } from '../../api/client';
import { colors, fonts, radius, spacing } from '../../constants/theme';
import { addYears } from '../../data/mockData';
import { useProducts } from '../../context/ProductsContext';
import { Category, NewProductInput } from '../../types';
import { localTodayISO } from '../../utils/validation';

type ScanStep = 'intro' | 'camera' | 'processing' | 'review';

interface MockTemplate {
  name: string;
  brand: string;
  model: string;
  category: Category;
  subCategory: string;
  icon: string;
  store: string;
  price: number;
}

const MOCK_TEMPLATES: MockTemplate[] = [
  {
    name: 'Xiaomi Redmi Note 13',
    brand: 'Xiaomi',
    model: 'Note 13 Pro',
    category: 'Tech',
    subCategory: 'Phone',
    icon: '📱',
    store: 'Movistar',
    price: 650000,
  },
  {
    name: 'JBL Flip 6',
    brand: 'JBL',
    model: 'Flip 6',
    category: 'Tech',
    subCategory: 'Speaker',
    icon: '🔊',
    store: 'Garbarino',
    price: 180000,
  },
  {
    name: 'Philips Air Fryer',
    brand: 'Philips',
    model: 'HD9252',
    category: 'Home',
    subCategory: 'Kitchen',
    icon: '🍳',
    store: 'Frávega',
    price: 290000,
  },
  {
    name: 'Adidas Ultraboost 22',
    brand: 'Adidas',
    model: 'Ultraboost 22',
    category: 'Fashion',
    subCategory: 'Shoes',
    icon: '👟',
    store: 'Adidas Store',
    price: 210000,
  },
];

const CATEGORIES: Category[] = ['Tech', 'Home', 'Fashion', 'Other'];

export default function ScanScreen() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<ScanStep>('intro');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [draft, setDraft] = useState<MockTemplate | null>(null);
  const [saving, setSaving] = useState(false);

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera permission needed',
          'Keepr needs camera access to scan receipts.'
        );
        return;
      }
    }
    setStep('camera');
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      setPhotoUri(photo?.uri ?? null);
      setStep('processing');

      const template =
        MOCK_TEMPLATES[Math.floor(Math.random() * MOCK_TEMPLATES.length)];

      setTimeout(() => {
        setDraft(template);
        setStep('review');
      }, 1400);
    } catch {
      Alert.alert('Error', 'Could not capture the photo. Try again.');
    }
  };

  const handleConfirm = async () => {
    if (!draft || saving) return;
    const purchaseDate = localTodayISO();
    // El servidor genera el id y registra la compra en el historial.
    const newProduct: NewProductInput = {
      name: draft.name,
      brand: draft.brand,
      model: draft.model,
      category: draft.category,
      subCategory: draft.subCategory,
      icon: draft.icon,
      store: draft.store,
      purchaseDate,
      price: draft.price,
      warrantyExpiryDate: addYears(purchaseDate, 1),
      serialNumber: 'PENDING',
      documentation: [
        { name: 'Receipt', uploaded: true },
        { name: 'Warranty document', uploaded: false },
        { name: 'Manual', uploaded: false },
      ],
    };

    setSaving(true);
    try {
      await addProduct(newProduct);
      resetFlow();
      Alert.alert('Added!', `${newProduct.name} was added to your products.`, [
        { text: 'OK', onPress: () => router.push('/(tabs)/products') },
      ]);
    } catch (err) {
      Alert.alert('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const resetFlow = () => {
    setStep('intro');
    setPhotoUri(null);
    setDraft(null);
  };

  // ---- Step: intro ----
  if (step === 'intro') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <Text style={styles.title}>Scan a receipt</Text>
          <Text style={styles.subtitle}>
            Point your camera at a receipt or warranty card and Keepr will
            read the product, price, date and warranty automatically.
          </Text>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleOpenCamera}
          >
            <Text style={styles.buttonText}>Open Camera</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Step: camera ----
  if (step === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity style={styles.cancelButton} onPress={resetFlow}>
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.frameHint}>
            <Text style={styles.frameHintText}>
              Center the receipt inside the frame
            </Text>
          </View>

          <View style={styles.captureRow}>
            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---- Step: processing ----
  if (step === 'processing') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.previewThumb} />
          )}
          <Text style={styles.title}>Reading receipt…</Text>
          <Text style={styles.subtitle}>
            Keepr's AI is detecting the product, store, price and warranty.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Step: review ----
  if (step === 'review' && draft) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.reviewContent}>
          <View style={styles.reviewCard}>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI Reading</Text>
            </View>

            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.reviewThumb} />
            )}

            <Text style={styles.fieldLabel}>PRODUCT NAME</Text>
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(text) => setDraft({ ...draft, name: text })}
            />

            <Text style={styles.fieldLabel}>STORE</Text>
            <TextInput
              style={styles.input}
              value={draft.store}
              onChangeText={(text) => setDraft({ ...draft, store: text })}
            />

            <Text style={styles.fieldLabel}>PRICE (ARS)</Text>
            <TextInput
              style={styles.input}
              value={String(draft.price)}
              keyboardType="numeric"
              onChangeText={(text) =>
                setDraft({ ...draft, price: Number(text.replace(/[^0-9]/g, '')) || 0 })
              }
            />

            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    draft.category === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setDraft({ ...draft, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      draft.category === cat && styles.categoryChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.warrantyNote}>
              Warranty will be set to 1 year from today by default — you can
              edit it later from the product detail screen.
            </Text>
          </View>

          <View style={styles.reviewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={() => setStep('camera')}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, saving && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={saving}
            >
              <Text style={styles.confirmButtonText}>
                {saving ? 'Saving…' : 'Add to my products'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 24,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing.xl,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  previewThumb: {
    width: 140,
    height: 140,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cancelButton: {
    alignSelf: 'flex-end',
    margin: spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 16,
  },
  frameHint: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  frameHintText: {
    color: colors.white,
    fontSize: 13,
  },
  captureRow: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },

  // Review
  reviewContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  aiBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#E0C88A',
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  reviewThumb: {
    width: '100%',
    height: 120,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  categoryChipActive: {
    backgroundColor: colors.secondary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  warrantyNote: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.md,
    lineHeight: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  retakeButtonText: {
    color: colors.secondary,
    fontWeight: '700',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
});
