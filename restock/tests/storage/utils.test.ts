/**
 * Tests for Storage Utils (Versioned Storage)
 * @file tests/storage/utils.test.ts
 */
import { getVersionedJSON, setVersionedJSON, STORAGE_VERSION } from '../../lib/helpers/storage/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage - already mocked in setup.ts
jest.mock('@react-native-async-storage/async-storage');

describe('Versioned Storage Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setVersionedJSON', () => {
    it('should save data with version metadata', async () => {
      const testData = { key: 'value' };

      await setVersionedJSON('test-key', testData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        expect.stringContaining(`"version":${STORAGE_VERSION}`)
      );
    });

    it('should wrap data in versioned container', async () => {
      const testData = { key: 'value' };

      await setVersionedJSON('test-key', testData);

      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const saved = JSON.parse(callArgs[1]);

      expect(saved.version).toBe(STORAGE_VERSION);
      expect(saved.data).toEqual(testData);
    });
  });

  describe('getVersionedJSON', () => {
    it('should return data when version matches', async () => {
      const testData = { key: 'value' };
      const versioned = { version: STORAGE_VERSION, data: testData };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(versioned)
      );

      const result = await getVersionedJSON('test-key');

      expect(result).toEqual(testData);
    });

    it('should migrate unversioned data', async () => {
      const testData = { key: 'value' };
      const migrateFn = jest.fn((oldVersion, oldData) => oldData);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(testData)
      );

      const result = await getVersionedJSON('test-key', migrateFn);

      expect(migrateFn).toHaveBeenCalledWith(0, testData);
      expect(result).toEqual(testData);
      expect(AsyncStorage.setItem).toHaveBeenCalled(); // Should save as versioned
    });

    it('should migrate older version data', async () => {
      const testData = { key: 'value' };
      const oldVersioned = { version: 0, data: testData };
      const migrateFn = jest.fn((oldVersion, oldData) => oldData);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(oldVersioned)
      );

      const result = await getVersionedJSON('test-key', migrateFn);

      expect(migrateFn).toHaveBeenCalledWith(0, testData);
      expect(result).toEqual(testData);
    });

    it('should return null when migration fails', async () => {
      const oldVersioned = { version: 99, data: { key: 'value' } };
      const migrateFn = jest.fn(() => null);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(oldVersioned)
      );

      const result = await getVersionedJSON('test-key', migrateFn);

      expect(result).toBeNull();
    });

    it('should handle corrupted data', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const result = await getVersionedJSON('test-key');

      expect(result).toBeNull();
    });

    it('should return null when key does not exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getVersionedJSON('test-key');

      expect(result).toBeNull();
    });
  });
});
