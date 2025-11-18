import AsyncStorage from '@react-native-async-storage/async-storage';
import { getJSON, setJSON } from '../helpers/storage/utils';

const DEVICE_ID_KEY = 'deviceId';

/**
 * Gets or creates a unique device ID for rate limiting.
 * Stores it in AsyncStorage for persistence.
 */
export async function getDeviceId(): Promise<string> {
  try {
    let deviceId = await getJSON<string>(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a simple device ID (in production, you might use expo-device or similar)
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      await setJSON(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.warn('Failed to get device ID, using fallback:', error);
    // Fallback device ID
    return `device-fallback-${Date.now()}`;
  }
}

