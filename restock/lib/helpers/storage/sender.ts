import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionedJSON, setVersionedJSON } from './utils';

const SENDER_PROFILE_KEY = 'senderProfile';

export type SenderProfile = {
  name: string;
  email: string;
  storeName?: string | null;
};

/**
 * Migrates sender profile data from older versions to current version.
 * Returns null if migration is not possible.
 */
function migrateSenderProfile(oldVersion: number, oldData: any): SenderProfile | null {
  // For now, all versions are compatible (v1)
  // Future versions can add migration logic here
  if (oldVersion === 0 || oldVersion === 1) {
    // Unversioned or v1 data - validate and return
    if (oldData && typeof oldData === 'object' && typeof oldData.name === 'string' && typeof oldData.email === 'string') {
      return oldData as SenderProfile;
    }
    console.warn('Sender profile migration: invalid data format, resetting');
    return null;
  }
  
  // Unknown version - cannot migrate
  return null;
}

/**
 * Retrieves the sender profile from AsyncStorage.
 * Returns null if not found or on error.
 * Supports version migration for future schema changes.
 */
export async function getSenderProfile(): Promise<SenderProfile | null> {
  try {
    return await getVersionedJSON<SenderProfile>(
      SENDER_PROFILE_KEY,
      migrateSenderProfile
    );
  } catch (err) {
    console.warn('Failed to load sender profile from storage:', err);
    return null;
  }
}

/**
 * Saves the sender profile to AsyncStorage.
 * Never throws - logs errors quietly.
 * Saves with version metadata for future migrations.
 */
export async function setSenderProfile(profile: SenderProfile): Promise<void> {
  await setVersionedJSON(SENDER_PROFILE_KEY, profile);
}

