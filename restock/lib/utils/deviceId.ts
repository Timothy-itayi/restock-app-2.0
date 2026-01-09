import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '../helpers/logger';

const DEVICE_ID_KEY = 'restock_device_id';
const ERROR_FALLBACK_DEVICE_ID = `error-fallback-stable-id`;

/**
 * Gets a unique device ID.
 * On iOS, uses vendor ID. On Android, uses androidId.
 * Falls back to a generated UUID stored in SecureStore (native) or AsyncStorage (web) if needed.
 */
export async function getDeviceId(): Promise<string> {
  try {
    if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      if (id) return id;
    } else if (Platform.OS === 'android') {
      if (Application.androidId) return Application.androidId;
    }

    // Fallback: Check platform-appropriate storage for a previously generated ID
    let fallbackId: string | null = null;
    
    if (Platform.OS === 'web') {
      fallbackId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    } else {
      fallbackId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    }

    if (!fallbackId) {
      fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(DEVICE_ID_KEY, fallbackId);
      } else {
        await SecureStore.setItemAsync(DEVICE_ID_KEY, fallbackId);
      }
    }
    return fallbackId;
  } catch (error) {
    logger.warn('Failed to get device ID, using fallback', { error });
    return ERROR_FALLBACK_DEVICE_ID;
  }
}
