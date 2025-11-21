/**
 * Jest Setup File
 * Runs before all tests to configure test environment
 */

// Mock AsyncStorage globally
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
  multiRemove: jest.fn(),
}));

// Mock Expo Router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  Redirect: jest.fn(({ href }) => null),
}));

// Mock Expo constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {},
  },
}));
