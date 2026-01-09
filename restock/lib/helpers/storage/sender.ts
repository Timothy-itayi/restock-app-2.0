import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionedJSON, setVersionedJSON } from './utils';
import logger from '../logger';

const SENDER_PROFILE_KEY = 'sender_profile';

export type SenderProfile = {
  name: string;
  email: string;
  storeName?: string;
};

/**
 * Migration for sender profile data.
 */
function migrateSenderProfile(oldVersion: number, oldData: any): SenderProfile | null {
  if (oldVersion === 0 || oldVersion === 1) {
    if (oldData && typeof oldData === 'object' && typeof oldData.name === 'string' && typeof oldData.email === 'string') {
      return {
        name: oldData.name,
        email: oldData.email,
        storeName: oldData.storeName
      };
    }
    logger.warn('[Sender] Migration: invalid data format, resetting');
    return null;
  }
  return null;
}

/**
 * Loads the sender profile from storage.
 */
export async function getSenderProfile(): Promise<SenderProfile | null> {
  try {
    return await getVersionedJSON<SenderProfile>(
      SENDER_PROFILE_KEY,
      migrateSenderProfile
    );
  } catch (err) {
    logger.error('[Sender] Failed to load sender profile from storage', err);
    return null;
  }
}

/**
 * Saves the sender profile to storage.
 */
export async function setSenderProfile(profile: SenderProfile | null): Promise<void> {
  if (!profile) {
    try {
      await AsyncStorage.removeItem(SENDER_PROFILE_KEY);
    } catch (err) {
      logger.error('[Sender] Failed to remove sender profile', err);
    }
    return;
  }
  await setVersionedJSON(SENDER_PROFILE_KEY, profile);
}
