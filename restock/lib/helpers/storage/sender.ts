import AsyncStorage from '@react-native-async-storage/async-storage';

const SENDER_PROFILE_KEY = 'senderProfile';

export type SenderProfile = {
  name: string;
  email: string;
  storeName?: string | null;
};

/**
 * Retrieves the sender profile from AsyncStorage.
 * Returns null if not found or on error.
 */
export async function getSenderProfile(): Promise<SenderProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(SENDER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SenderProfile;
  } catch (err) {
    console.warn('Failed to load sender profile from storage:', err);
    return null;
  }
}

/**
 * Saves the sender profile to AsyncStorage.
 * Never throws - logs errors quietly.
 */
export async function setSenderProfile(profile: SenderProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(SENDER_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Failed to save sender profile to storage:', err);
  }
}

