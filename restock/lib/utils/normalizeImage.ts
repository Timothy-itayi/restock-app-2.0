/**
 * Image normalization utility
 * Converts HEIC, WebP, and other formats to JPEG for API compatibility
 * Persists normalized images to document directory for re-parsing
 */

import * as ImageManipulator from 'expo-image-manipulator';
import { Paths, Directory, File } from 'expo-file-system';

export type NormalizedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: 'image/jpeg';
  name: string;
};

// Directory for storing normalized images temporarily
const NORMALIZED_DIR_NAME = 'normalized-images';

/**
 * Gets or creates the normalized images directory
 */
function getNormalizedImagesDir(): Directory {
  const dir = new Directory(Paths.document, NORMALIZED_DIR_NAME);
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

/**
 * Converts any image format (HEIC, WebP, BMP, etc.) to JPEG
 * Persists to document directory so it survives for re-parsing
 * 
 * @param uri - Original image URI (file:// or content://)
 * @param originalName - Original filename for generating new name
 * @param maxDimension - Max width/height (default 2048px, good for vision APIs)
 * @returns Normalized image with JPEG format in persistent storage
 */
export async function normalizeImage(
  uri: string,
  originalName: string,
  maxDimension: number = 2048
): Promise<NormalizedImage> {
  // Ensure directory exists
  const dir = getNormalizedImagesDir();

  // ImageManipulator handles format conversion automatically
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize: {
          width: maxDimension,
          // Height auto-scales to maintain aspect ratio
        },
      },
    ],
    {
      compress: 0.85, // Good balance of quality vs file size
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  // Generate unique filename
  const baseName = originalName.replace(/\.[^/.]+$/, '') || 'image';
  const timestamp = Date.now();
  const newName = `${baseName}-${timestamp}.jpg`;

  // Create file reference for destination
  const destFile = new File(dir, newName);

  // Copy from temp location to persistent location
  const sourceFile = new File(result.uri);
  await sourceFile.copy(destFile);

  return {
    uri: destFile.uri,
    width: result.width,
    height: result.height,
    mimeType: 'image/jpeg',
    name: newName,
  };
}

/**
 * Cleans up a normalized image after it's no longer needed
 */
export async function cleanupNormalizedImage(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      await file.delete();
    }
  } catch (e) {
    console.warn('Failed to cleanup normalized image:', e);
  }
}

/**
 * Cleans up all normalized images (call on app start or periodically)
 */
export async function cleanupAllNormalizedImages(): Promise<void> {
  try {
    const dir = new Directory(Paths.document, NORMALIZED_DIR_NAME);
    if (dir.exists) {
      await dir.delete();
    }
  } catch (e) {
    console.warn('Failed to cleanup normalized images directory:', e);
  }
}
