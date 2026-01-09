import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import logger from '../helpers/logger';

export type NormalizedImage = {
  uri: string;
  width: number;
  height: number;
  size: number;
};

const NORMALIZED_DIR = `${FileSystem.cacheDirectory}normalized-images/`;

/**
 * Ensures the normalized images directory exists
 */
async function ensureDir() {
  const dirInfo = await FileSystem.getInfoAsync(NORMALIZED_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(NORMALIZED_DIR, { intermediates: true });
  }
}

/**
 * Checks if a file is in HEIC format based on its extension
 */
export function isHeicFormat(uri: string): boolean {
  return uri.toLowerCase().endsWith('.heic') || uri.toLowerCase().endsWith('.heif');
}

/**
 * Normalizes an image for worker parsing:
 * 1. Converts HEIC to JPEG
 * 2. Resizes if too large (workers have limits)
 * 3. Compresses to stay under 5MB
 */
export async function normalizeImage(uri: string): Promise<NormalizedImage> {
  await ensureDir();

  const filename = uri.split('/').pop() || `img-${Date.now()}.jpg`;
  const destUri = `${NORMALIZED_DIR}${filename.replace(/\.(heic|heif|png|webp)$/i, '.jpg')}`;

  const info = await FileSystem.getInfoAsync(uri, { size: true });
  if (!info.exists) {
    throw new Error('Image file does not exist');
  }

  // Get image dimensions
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    // We can use ImageManipulator to get dimensions by doing a no-op manipulation
    ImageManipulator.manipulateAsync(uri, [])
      .then(result => resolve({ width: result.width, height: result.height }))
      .catch(reject);
  });

  const isHeic = isHeicFormat(uri);
  const needsResize = width > 2000 || height > 2000;
  const isLarge = (info as any).size > 5 * 1024 * 1024;

  // If already fine, just return original (or copy to destUri if we want to be consistent)
  if (!isHeic && !needsResize && !isLarge) {
    logger.debug(`[normalizeImage] Image already normalized`, { width, height, size: (info as any).size });
    await FileSystem.copyAsync({ from: uri, to: destUri });
    return {
      uri: destUri,
      width,
      height,
      size: (info as any).size
    };
  }
  
  // Workers handle JPEG best. Resize to reasonable size for OCR.
  const attempts = [
    { width: 1600, compress: 0.8 },
    { width: 1200, compress: 0.7 },
    { width: 1000, compress: 0.6 },
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    try {
      logger.debug(`[normalizeImage] Attempting conversion`, { width: attempt.width, compress: attempt.compress });
      
      const actions: ImageManipulator.Action[] = [];
      if (width > attempt.width) {
        actions.push({ resize: { width: attempt.width } });
      }

      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: attempt.compress, format: ImageManipulator.SaveFormat.JPEG }
      );

      const resultInfo = await FileSystem.getInfoAsync(result.uri, { size: true });
      const size = (resultInfo as any).size || 0;

      // Target < 5MB for safety with workers
      if (size < 5 * 1024 * 1024) {
        logger.info(`[normalizeImage] Conversion succeeded`, { width: result.width, height: result.height, size });
        
        // Move to final destination
        await FileSystem.moveAsync({ from: result.uri, to: destUri });

        return {
          uri: destUri,
          width: result.width,
          height: result.height,
          size
        };
      }
    } catch (err: any) {
      logger.warn(`[normalizeImage] Conversion failed at width=${attempt.width}`, { error: err?.message || err });
      lastError = err;
    }
  }

  logger.error('[normalizeImage] All conversion attempts failed', lastError);
  throw lastError || new Error('Failed to normalize image');
}

/**
 * Cleans up a normalized image
 */
export async function cleanupNormalizedImage(uri: string) {
  try {
    if (uri.startsWith(NORMALIZED_DIR)) {
      await FileSystem.deleteAsync(uri, { idontcare: true });
    }
  } catch (e) {
    logger.warn('Failed to cleanup normalized image', { uri, error: e });
  }
}

/**
 * Cleans up all normalized images
 */
export async function cleanupAllNormalizedImages() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(NORMALIZED_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(NORMALIZED_DIR, { idontcare: true });
    }
  } catch (e) {
    logger.warn('Failed to cleanup normalized images directory', e);
  }
}
