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

// Formats that Groq Vision API supports
const SUPPORTED_VISION_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Formats that need conversion (HEIC, HEIF from iPhone)
const HEIC_FORMATS = ['image/heic', 'image/heif', 'image/heic-sequence', 'image/heif-sequence'];

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
 * Detects if a file is HEIC based on name or mimeType
 */
export function isHeicFormat(fileName: string, mimeType?: string | null): boolean {
  const ext = fileName.toLowerCase().split('.').pop();
  const isHeicExtension = ext === 'heic' || ext === 'heif';
  const isHeicMime = mimeType ? HEIC_FORMATS.includes(mimeType.toLowerCase()) : false;
  return isHeicExtension || isHeicMime;
}

/**
 * Checks if format is directly supported by Vision API
 */
export function isDirectlySupportedFormat(mimeType?: string | null): boolean {
  if (!mimeType) return false;
  return SUPPORTED_VISION_FORMATS.includes(mimeType.toLowerCase());
}

/**
 * Converts any image format (HEIC, WebP, BMP, etc.) to JPEG
 * Persists to document directory so it survives for re-parsing
 * 
 * HEIC Handling:
 * - HDR HEIC from newer iPhones can fail with IIOCallConvertHDRData error
 * - We retry with progressively lower quality/size if initial conversion fails
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

  // Try conversion with progressively lower settings if needed
  // This helps with HDR HEIC images that can fail at higher quality
  const attempts = [
    { width: maxDimension, compress: 0.85 },
    { width: 1600, compress: 0.80 },      // Retry with smaller size
    { width: 1200, compress: 0.75 },      // Even smaller
    { width: 1024, compress: 0.70 },      // Last resort
  ];

  let lastError: Error | null = null;
  let result: ImageManipulator.ImageResult | null = null;

  for (const attempt of attempts) {
    try {
      console.log(`[normalizeImage] Attempting conversion: width=${attempt.width}, compress=${attempt.compress}`);
      
      result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: attempt.width,
              // Height auto-scales to maintain aspect ratio
            },
          },
        ],
        {
          compress: attempt.compress,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Success - break out of retry loop
      console.log(`[normalizeImage] Conversion succeeded: ${result.width}x${result.height}`);
      break;
    } catch (err: any) {
      lastError = err;
      console.warn(`[normalizeImage] Conversion failed at width=${attempt.width}:`, err?.message || err);
      
      // If this is not an ImageIO HDR error, don't retry
      const errorMessage = err?.message || '';
      if (!errorMessage.includes('IIOCall') && !errorMessage.includes('ImageIO')) {
        throw err;
      }
      
      // Continue to next attempt
      result = null;
    }
  }

  // If all attempts failed, throw the last error
  if (!result) {
    console.error('[normalizeImage] All conversion attempts failed');
    throw new Error(
      `Failed to convert image. ${lastError?.message || 'The image format may not be supported.'}` +
      '\n\nTry taking a new photo or using a JPEG/PNG image instead.'
    );
  }

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
