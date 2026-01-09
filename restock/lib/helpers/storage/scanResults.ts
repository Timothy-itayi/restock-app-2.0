/**
 * Persistence for scan results
 * Allows resuming a scan session if the app crashes or is closed
 */

import { getJSON, setJSON, removeJSON } from './utils';
import type { ParsedItem } from '../../api/parseDoc';
import logger from '../logger';

const SCAN_RESULTS_KEY = '@restock/temp-scan-results';

export type ScanResults = {
  sessionId: string;
  items: ParsedItem[];
  timestamp: number;
};

/**
 * Saves temporary scan results
 */
export async function saveScanResults(sessionId: string, items: ParsedItem[]): Promise<void> {
  try {
    const results: ScanResults = {
      sessionId,
      items,
      timestamp: Date.now(),
    };
    await setJSON(SCAN_RESULTS_KEY, results);
  } catch (e) {
    logger.warn('Failed to save scan results', { error: e });
  }
}

/**
 * Loads temporary scan results
 * Returns null if not found or older than 2 hours
 */
export async function loadScanResults(): Promise<ScanResults | null> {
  try {
    const results = await getJSON<ScanResults>(SCAN_RESULTS_KEY);
    if (!results) return null;

    // Check if results are older than 2 hours (in ms)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (Date.now() - results.timestamp > TWO_HOURS) {
      await clearScanResults();
      return null;
    }

    return results;
  } catch (e) {
    logger.warn('Failed to load scan results', { error: e });
    return null;
  }
}

/**
 * Clears temporary scan results
 */
export async function clearScanResults(): Promise<void> {
  try {
    await removeJSON(SCAN_RESULTS_KEY);
  } catch (e) {
    logger.warn('Failed to clear scan results', { error: e });
  }
}
