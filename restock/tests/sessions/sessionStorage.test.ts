/**
 * Tests for Session Storage Helpers
 * @file tests/sessions/sessionStorage.test.ts
 */
import { getSessions, setSessions } from '../../lib/helpers/storage/sessions';
import type { Session, SessionItem } from '../../lib/helpers/storage/sessions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage - already mocked in setup.ts, but can override if needed
jest.mock('@react-native-async-storage/async-storage');

describe('Session Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSessions', () => {
    it('should return empty array when no sessions exist', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const sessions = await getSessions();

      expect(sessions).toEqual([]);
    });

    it('should return sessions from storage', async () => {
      const mockSessions: Session[] = [
        {
          id: '1',
          createdAt: Date.now(),
          status: 'active',
          items: []
        }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockSessions })
      );

      const sessions = await getSessions();

      expect(sessions).toEqual(mockSessions);
    });

    it('should handle corrupted data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const sessions = await getSessions();

      expect(sessions).toEqual([]);
    });

    it('should migrate unversioned data to versioned format', async () => {
      const mockSessions: Session[] = [
        {
          id: '1',
          createdAt: Date.now(),
          status: 'active',
          items: []
        }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockSessions)
      );

      const sessions = await getSessions();

      expect(sessions).toEqual(mockSessions);
      // Should have called setItem to save versioned format
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should filter invalid sessions', async () => {
      const invalidData = [
        { id: '1', createdAt: Date.now(), status: 'active', items: [] },
        { invalid: 'session' },
        { id: '2', createdAt: Date.now(), status: 'active', items: [] }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: invalidData })
      );

      const sessions = await getSessions();

      expect(sessions.length).toBe(2);
      expect(sessions.every(s => s.id)).toBe(true);
    });

    it('should filter invalid items within sessions', async () => {
      const sessionsWithInvalidItems: Session[] = [
        {
          id: '1',
          createdAt: Date.now(),
          status: 'active',
          items: [
            { id: 'item-1', productName: 'Valid', quantity: 1 },
            { invalid: 'item' } as any,
            { id: 'item-2', productName: 'Valid 2', quantity: 2 }
          ]
        }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: sessionsWithInvalidItems })
      );

      const sessions = await getSessions();

      expect(sessions[0].items.length).toBe(2);
      expect(sessions[0].items.every(i => i.id && i.productName)).toBe(true);
    });
  });

  describe('setSessions', () => {
    it('should save sessions with version metadata', async () => {
      const sessions: Session[] = [
        {
          id: '1',
          createdAt: Date.now(),
          status: 'active',
          items: []
        }
      ];

      await setSessions(sessions);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(callArgs[1]);
      
      expect(savedData.version).toBeDefined();
      expect(savedData.data).toEqual(sessions);
    });

    it('should handle save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const sessions: Session[] = [];

      // Should not throw
      await expect(setSessions(sessions)).resolves.not.toThrow();
    });
  });
});
