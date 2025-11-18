import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Global Storage Wrapper Utilities
 * 
 * Safe JSON wrappers around AsyncStorage that never throw errors.
 * Returns null on corrupted data and logs warnings for debugging.
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

