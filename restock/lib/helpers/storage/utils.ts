import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../logger';

/**
 * Storage Utilities
 * 
 * Thin wrapper around AsyncStorage with JSON support and error handling.
 */

/**
 * Retrieves a JSON value from storage.
 * Returns null if not found or on error.
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch (parseError) {
      logger.warn(`[Storage] Failed to parse JSON for key "${key}"`, { parseError });
      
      // If parsing fails, the data is corrupted - better to remove it
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        logger.error(`[Storage] Failed to remove corrupted key "${key}"`, removeError);
      }
      return null;
    }
  } catch (err) {
    logger.error(`[Storage] Failed to get item for key "${key}"`, err);
    return null;
  }
}

/**
 * Saves a JSON value to storage.
 * Never throws - logs errors quietly.
 */
export async function setJSON(key: string, value: any): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (err) {
    logger.error(`[Storage] Failed to set item for key "${key}"`, err);
  }
}

/**
 * Removes an item from storage.
 */
export async function removeJSON(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    logger.error(`[Storage] Failed to remove item for key "${key}"`, err);
  }
}

/**
 * Clears all app storage.
 */
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (err) {
    logger.error('[Storage] Failed to clear storage', err);
  }
}

//----------------------------------------------------------------------
// VERSIONED STORAGE (Schema protection)
//----------------------------------------------------------------------

interface VersionedData<T> {
  version: number;
  data: T;
}

const CURRENT_SCHEMA_VERSION = 1;

/**
 * getVersionedJSON with migration support
 */
export async function getVersionedJSON<T>(
  key: string, 
  migrate?: (oldVersion: number, oldData: any) => T | null
): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);

      // If it's a versioned format
      if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
        const vData = parsed as VersionedData<T>;
        
        if (vData.version === CURRENT_SCHEMA_VERSION) {
          return vData.data;
        }

        // Try migration if provided
        if (migrate) {
          logger.info(`[Storage] Migrating key "${key}" from v${vData.version} to v${CURRENT_SCHEMA_VERSION}`);
          const migrated = migrate(vData.version, vData.data);
          if (migrated !== null) {
            // Save migrated data immediately
            await setVersionedJSON(key, migrated);
            return migrated;
          }
        }
        
        logger.warn(`[Storage] Schema mismatch for key "${key}": expected v${CURRENT_SCHEMA_VERSION}, got v${vData.version}`);
        return null;
      }

      // If it's old unversioned data, try to migrate it as v0
      if (migrate) {
        logger.info(`[Storage] Migrating unversioned key "${key}" to v${CURRENT_SCHEMA_VERSION}`);
        const migrated = migrate(0, parsed);
        if (migrated !== null) {
          await setVersionedJSON(key, migrated);
          return migrated;
        }
      }

      return null;
    } catch (parseError) {
      logger.warn(`[Storage] Failed to parse JSON for key "${key}"`, { parseError });
      try {
        await AsyncStorage.removeItem(key);
      } catch (removeError) {
        logger.error(`[Storage] Failed to remove corrupted key "${key}"`, removeError);
      }
      return null;
    }
  } catch (err) {
    logger.error(`[Storage] Failed to get versioned item for key "${key}"`, err);
    return null;
  }
}

/**
 * setVersionedJSON
 */
export async function setVersionedJSON(key: string, data: any): Promise<void> {
  try {
    const vData: VersionedData<any> = {
      version: CURRENT_SCHEMA_VERSION,
      data
    };
    await AsyncStorage.setItem(key, JSON.stringify(vData));
  } catch (err) {
    logger.error(`[Storage] Failed to set versioned item for key "${key}"`, err);
  }
}

