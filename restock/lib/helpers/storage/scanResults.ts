/**
 * Scan Results Persistence
 * Stores parsed items between app sessions so users don't lose progress
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParsedItem } from '../../api/parseDoc';

const STORAGE_KEY = '@restock/scan-results';

export interface PersistedScanResults {
  parsed: ParsedItem[];
  selectedIds: string[];
  previewUri: string | null;
  editedValues: Record<string, Partial<ParsedItem>>;
  savedAt: number;
}

/**
 * Save scan results to persistent storage
 */
export async function saveScanResults(
  parsed: ParsedItem[],
  selectedIds: string[],
  previewUri: string | null,
  editedValues: Map<string, Partial<ParsedItem>>
): Promise<void> {
  try {
    const data: PersistedScanResults = {
      parsed,
      selectedIds,
      previewUri,
      editedValues: Object.fromEntries(editedValues),
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save scan results:', e);
  }
}

/**
 * Load scan results from persistent storage
 * Returns null if no saved results or if data is stale (>24 hours)
 */
export async function loadScanResults(): Promise<PersistedScanResults | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;

    const data: PersistedScanResults = JSON.parse(json);
    
    // Check if data is stale (older than 24 hours)
    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.savedAt > MAX_AGE) {
      await clearScanResults();
      return null;
    }

    return data;
  } catch (e) {
    console.warn('Failed to load scan results:', e);
    return null;
  }
}

/**
 * Clear saved scan results
 */
export async function clearScanResults(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear scan results:', e);
  }
}

/**
 * Check if there are saved scan results
 */
export async function hasSavedScanResults(): Promise<boolean> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return false;
    
    const data: PersistedScanResults = JSON.parse(json);
    const MAX_AGE = 24 * 60 * 60 * 1000;
    return Date.now() - data.savedAt <= MAX_AGE && data.parsed.length > 0;
  } catch {
    return false;
  }
}

