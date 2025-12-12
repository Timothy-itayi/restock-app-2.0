/**
 * Camera capture utility
 * Takes photos directly in JPEG format, bypassing HEIC/HDR issues
 */

import * as ImagePicker from 'expo-image-picker';
import { Paths, Directory, File } from 'expo-file-system';

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
    console.warn('Failed to cleanup captured image:', e);
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
    console.warn('Failed to cleanup captured images directory:', e);
  }
}

