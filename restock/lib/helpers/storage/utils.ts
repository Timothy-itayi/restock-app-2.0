import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage version constant
 * Increment this when the data schema changes to trigger migrations
 */
export const STORAGE_VERSION = 1;

/**
 * Versioned storage container structure
 */
export type VersionedStorage<T> = {
  version: number;
  data: T;
};

/**
 * Global Storage Wrapper Utilities
 * 
 * Safe JSON wrappers around AsyncStorage that never throw errors.
 * Returns null on corrupted data and logs warnings for debugging.
 * Includes versioning support for future data migrations.
 */

/**
 * Retrieves a JSON value from AsyncStorage.
 * Returns null if not found or on error.
 * Never throws - logs errors quietly.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    
    try {
      return JSON.parse(raw) as T;
    } catch (parseError) {
      console.warn(`[Storage] Failed to parse JSON for key "${key}":`, parseError);
      // Remove corrupted data
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`[Storage] Failed to remove corrupted key "${key}":`, removeError);
      }
      return null;
    }
  } catch (err) {
    console.warn(`[Storage] Failed to get item for key "${key}":`, err);
    return null;
  }
}

/**
 * Saves a JSON value to AsyncStorage.
 * Never throws - logs errors quietly.
 */
export async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[Storage] Failed to set item for key "${key}":`, err);
  }
}

/**
 * Removes an item from AsyncStorage.
 * Never throws - logs errors quietly.
 */
export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Storage] Failed to remove item for key "${key}":`, err);
  }
}

/**
 * Clears all AsyncStorage data.
 * Use with caution - logs errors quietly.
 */
export async function clear(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (err) {
    console.warn('[Storage] Failed to clear storage:', err);
  }
}

/**
 * Retrieves versioned data from AsyncStorage.
 * Automatically migrates data if version is older than current.
 * Returns null if not found or on error.
 */
export async function getVersionedJSON<T>(
  key: string,
  migrateFn?: (oldVersion: number, oldData: any) => T | null
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    
    try {
      const parsed = JSON.parse(raw);
      
      // Check if data is versioned
      if (parsed && typeof parsed === 'object' && 'version' in parsed) {
        const versioned = parsed as VersionedStorage<T>;
        
        // If version matches, return data
        if (versioned.version === STORAGE_VERSION) {
          return versioned.data;
        }
        
        // Version mismatch - attempt migration
        console.warn(
          `[Storage] Version mismatch for key "${key}": found v${versioned.version}, expected v${STORAGE_VERSION}. Attempting migration...`
        );
        
        if (migrateFn) {
          const migrated = migrateFn(versioned.version, versioned.data);
          if (migrated !== null) {
            // Save migrated data
            await setVersionedJSON(key, migrated);
            return migrated;
          }
        }
        
        // Migration failed or no migration function - log warning
        console.warn(
          `[Storage] Migration failed or unavailable for key "${key}". Resetting to null.`
        );
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      // Legacy unversioned data - migrate to versioned format
      console.warn(
        `[Storage] Unversioned data found for key "${key}". Migrating to version ${STORAGE_VERSION}...`
      );
      
      const migrated = migrateFn ? migrateFn(0, parsed) : (parsed as T);
      
      if (migrated !== null) {
        // Save as versioned
        await setVersionedJSON(key, migrated);
        return migrated;
      }
      
      // Fallback: return parsed data as-is (backward compatibility)
      return parsed as T;
      
    } catch (parseError) {
      console.warn(`[Storage] Failed to parse JSON for key "${key}":`, parseError);
      // Remove corrupted data
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`[Storage] Failed to remove corrupted key "${key}":`, removeError);
      }
      return null;
    }
  } catch (err) {
    console.warn(`[Storage] Failed to get versioned item for key "${key}":`, err);
    return null;
  }
}

/**
 * Saves versioned data to AsyncStorage.
 * Automatically wraps data in version container.
 * Never throws - logs errors quietly.
 */
export async function setVersionedJSON<T>(key: string, value: T): Promise<void> {
  try {
    const versioned: VersionedStorage<T> = {
      version: STORAGE_VERSION,
      data: value
    };
    const serialized = JSON.stringify(versioned);
    await AsyncStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[Storage] Failed to set versioned item for key "${key}":`, err);
  }
}

