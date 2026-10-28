import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rememberCapturedPhoto } from '../../api/receipt';
import { colors, fonts, radius, spacing } from '../../constants/theme';

type ScanStep = 'intro' | 'camera' | 'preview';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [step, setStep] = useState<ScanStep>('intro');
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera permission needed',
          'Keepr needs camera access to photograph your receipts and warranties.'
        );
        return;
      }
    }
    setCameraReady(false);
    setStep('camera');
  };

  const handleCapture = async () => {
    // La documentación de expo-camera pide esperar a onCameraReady antes de sacar la foto.
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    try {
      // quality + base64: la cámara entrega la foto ya comprimida y lista para subir.
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
      if (!photo?.uri) throw new Error('No photo');
      if (photo.base64) rememberCapturedPhoto(photo.uri, photo.base64);
      setPhotoUri(photo.uri);
      setStep('preview');
    } catch {
      Alert.alert('Error', 'Could not capture the photo. Try again.');
    } finally {
      setCapturing(false);
    }
  };

  const reset = () => {
    setStep('intro');
    setPhotoUri(null);
    setCameraReady(false);
  };

  const retake = () => {
    setPhotoUri(null);
    setCameraReady(false);
    setStep('camera');
  };

  // Abre el formulario con la foto adjunta. La foto se sube junto con el producto al guardar.
  const usePhoto = () => {
    if (!photoUri) return;
    router.push({ pathname: '/product/new', params: { photoUri } });
    reset();
  };

  // ---- Paso: intro ----
  if (step === 'intro') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <Text style={styles.title}>Photograph your warranty</Text>
          <Text style={styles.subtitle}>
            Take a photo of your receipt or warranty card. Keepr saves it with your product, and
            then you fill in the details.
          </Text>

          <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={openCamera}>
            <Text style={styles.buttonText}>Open Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/product/new')}
            hitSlop={8}
          >
            <Text style={styles.linkText}>Add without a photo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ---- Paso: cámara ----
  if (step === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
        <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
          <TouchableOpacity style={styles.cancelButton} onPress={reset}>
            <Text style={styles.cancelButtonText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.frameHint}>
            <Text style={styles.frameHintText}>Center the document and keep the text sharp</Text>
          </View>

          <View style={styles.captureRow}>
            <TouchableOpacity
              style={[styles.captureButton, (!cameraReady || capturing) && styles.captureDisabled]}
              onPress={handleCapture}
              disabled={!cameraReady || capturing}
            >
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ---- Paso: vista previa ----
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.previewContent}>
        <Text style={styles.title}>Is the text readable?</Text>
        <Text style={styles.subtitle}>
          If it's blurry or cut off, retake it. You can still fill in the details by hand.
        </Text>

        <View style={styles.previewCard}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImage} contentFit="contain" />
          ) : null}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.retakeButton} onPress={retake}>
            <Text style={styles.retakeButtonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={usePhoto}>
            <Text style={styles.confirmButtonText}>Use photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
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
  linkButton: {
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  linkText: {
    color: colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Cámara
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
  captureDisabled: {
    opacity: 0.4,
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
  },

  // Vista previa
  previewContent: {
    flex: 1,
    padding: spacing.lg,
  },
  previewCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  previewImage: {
    flex: 1,
    borderRadius: radius.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
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
