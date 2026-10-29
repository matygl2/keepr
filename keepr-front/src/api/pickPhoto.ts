import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PhotoSource = 'camera' | 'library';

// La foto sale ya comprimida del selector: alcanza para leer un papel y pesa poco.
const QUALITY = 0.5;

// Un JPEG empieza con los bytes FF D8 FF, que en base64 se escriben "/9j/".
const isJpegBase64 = (data: string) => data.startsWith('/9j/');

/** Si la imagen elegida no es JPEG (por ejemplo PNG), la convierte. */
async function toJpegBase64(asset: ImagePicker.ImagePickerAsset): Promise<string> {
  if (asset.base64 && isJpegBase64(asset.base64)) return asset.base64;
  try {
    const rendered = await ImageManipulator.manipulate(asset.uri).renderAsync();
    const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: QUALITY, base64: true });
    if (result.base64) return result.base64;
  } catch {
    // cae al error de abajo
  }
  throw new Error('That image format is not supported. Choose a JPEG or PNG photo.');
}

/**
 * Abre la cámara o la galería y devuelve la foto como JPEG en base64.
 * Devuelve `null` si la persona cancela. Lanza un Error con un texto para mostrar
 * si falta un permiso o la imagen no sirve.
 */
export async function pickPhotoBase64(source: PhotoSource): Promise<string | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Keepr needs camera access to photograph your documents.');
    }
  } else if (Platform.OS === 'ios') {
    // En Android la galería se abre sin pedir permiso; en iOS el sistema lo pide.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Keepr needs access to your photos to choose an image.');
    }
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: QUALITY,
    base64: true,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  const asset = result.canceled ? undefined : result.assets[0];
  return asset ? toJpegBase64(asset) : null;
}
