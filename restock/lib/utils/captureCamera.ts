/**
 * Camera capture utility
 * Takes photos directly in JPEG format, bypassing HEIC/HDR issues
 */

import * as ImagePicker from 'expo-image-picker';
import { Paths, Directory, File } from 'expo-file-system';
import logger from '../helpers/logger';

export type CapturedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
  name: string;
};

// Directory for storing captured images
const CAPTURED_DIR_NAME = 'captured-images';

/**
 * Gets or creates the captured images directory
 */
function getCapturedImagesDir(): Directory {
  const dir = new Directory(Paths.document, CAPTURED_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

/**
 * Request camera permissions
 * @returns true if permission granted
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if camera permission is already granted
 */
export async function hasCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return status === 'granted';
}

/**
 * Capture a photo using the device camera
 * Outputs JPEG directly - no HEIC conversion needed
 * 
 * @param quality - Image quality 0-1 (default 0.85)
 * @returns Captured image info, or null if cancelled
 */
export async function captureFromCamera(
  quality: number = 0.85
): Promise<CapturedImage | null> {
  // Check/request permission
  const hasPermission = await hasCameraPermission();
  if (!hasPermission) {
    const granted = await requestCameraPermission();
    if (!granted) {
      throw new Error('Camera permission is required to take photos');
    }
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false, // Don't crop - we want full document
    quality: quality,
    exif: false, // Don't need EXIF data
    // This forces JPEG output on iOS, avoiding HEIC
    base64: false,
  });

  // User cancelled
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];

  // The image picker already outputs JPEG when quality is set
  // But let's persist it to our document directory for consistency
  const dir = getCapturedImagesDir();
  const timestamp = Date.now();
  const fileName = `capture-${timestamp}.jpg`;
  const destFile = new File(dir, fileName);

  // Copy from camera output to our directory
  const sourceFile = new File(asset.uri);
  await sourceFile.copy(destFile);

  logger.info('[captureCamera] Photo captured successfully', { fileName, width: asset.width, height: asset.height });

  return {
    uri: destFile.uri,
    width: asset.width,
    height: asset.height,
    mimeType: 'image/jpeg',
    name: fileName,
  };
}

/**
 * Cleans up a captured image after it's no longer needed
 */
export async function cleanupCapturedImage(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      await file.delete();
    }
  } catch (e) {
    logger.warn('Failed to cleanup captured image', { uri, error: e });
  }
}

/**
 * Cleans up all captured images
 */
export async function cleanupAllCapturedImages(): Promise<void> {
  try {
    const dir = new Directory(Paths.document, CAPTURED_DIR_NAME);
    if (dir.exists) {
      await dir.delete();
    }
  } catch (e) {
    logger.warn('Failed to cleanup captured images directory', e);
  }
}

/**
 * Request photo library permissions
 * @returns true if permission granted
 */
export async function requestPhotoLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Check if photo library permission is already granted
 */
export async function hasPhotoLibraryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return status === 'granted';
}

/**
 * Pick an image from the photo library
 * @returns Picked image info, or null if cancelled
 */
export async function pickFromPhotoLibrary(): Promise<{
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
} | null> {
  // Check/request permission
  const hasPermission = await hasPhotoLibraryPermission();
  if (!hasPermission) {
    const granted = await requestPhotoLibraryPermission();
    if (!granted) {
      throw new Error('Photo library permission is required to select images');
    }
  }

  // Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
    exif: false,
    base64: false,
  });

  // User cancelled
  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  
  // Generate a filename from the asset
  const fileName = asset.fileName || `photo-${Date.now()}.jpg`;
  const mimeType = asset.mimeType || 'image/jpeg';

  logger.info('[captureCamera] Image picked from library', { fileName, mimeType });

  return {
    uri: asset.uri,
    name: fileName,
    mimeType,
    size: asset.fileSize || undefined,
  };
}
