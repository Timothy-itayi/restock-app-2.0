/**
 * Tests for Device ID Utility
 * @file tests/utils/deviceId.test.ts
 */
import { getDeviceId } from '../../lib/utils/deviceId';
import { getJSON, setJSON } from '../../lib/helpers/storage/utils';

// Mock storage utils
jest.mock('../../lib/helpers/storage/utils', () => ({
  getJSON: jest.fn(),
  setJSON: jest.fn(),
  getVersionedJSON: jest.fn(),
  setVersionedJSON: jest.fn(),
  STORAGE_VERSION: 1,
}));

describe('getDeviceId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return existing device ID from storage', async () => {
    (getJSON as jest.Mock).mockResolvedValue('existing-device-id');

    const deviceId = await getDeviceId();

    expect(deviceId).toBe('existing-device-id');
    expect(getJSON).toHaveBeenCalledWith('deviceId');
    expect(setJSON).not.toHaveBeenCalled();
  });

  it('should generate and save new device ID if not exists', async () => {
    (getJSON as jest.Mock).mockResolvedValue(null);

    const deviceId = await getDeviceId();

    expect(deviceId).toBeDefined();
    expect(typeof deviceId).toBe('string');
    expect(deviceId).toMatch(/^device-/);
    expect(setJSON).toHaveBeenCalledWith('deviceId', deviceId);
  });

  it('should return same ID on subsequent calls', async () => {
    (getJSON as jest.Mock).mockResolvedValue('device-id-123');

    const id1 = await getDeviceId();
    const id2 = await getDeviceId();

    expect(id1).toBe(id2);
    expect(id1).toBe('device-id-123');
  });

  it('should handle errors gracefully with fallback', async () => {
    (getJSON as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const deviceId = await getDeviceId();

    expect(deviceId).toBeDefined();
    expect(typeof deviceId).toBe('string');
    expect(deviceId).toMatch(/^device-fallback-/);
  });
});
