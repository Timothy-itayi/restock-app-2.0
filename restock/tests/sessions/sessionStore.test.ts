/**
 * Tests for Session Store (Zustand)
 * @file tests/sessions/sessionStore.test.ts
 */
import { useSessionStore } from '../../store/useSessionStore';
import type { Session, SessionItem } from '../../lib/helpers/storage/sessions';

describe('useSessionStore', () => {
  let sessionIdCounter = 0;
  
  beforeEach(() => {
    // Reset store before each test
    useSessionStore.setState({ sessions: [], isHydrated: false });
    sessionIdCounter = 0;
    
    // Mock Date.now to ensure unique session IDs
    jest.spyOn(Date, 'now').mockImplementation(() => {
      sessionIdCounter++;
      return sessionIdCounter * 1000; // Ensure unique timestamps
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session with active status', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();

      expect(session).toBeDefined();
      expect(session.status).toBe('active');
      expect(session.items).toEqual([]);
      expect(typeof session.id).toBe('string');
      expect(typeof session.createdAt).toBe('number');
    });

    it('should add session to sessions array', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();
      const sessions = useSessionStore.getState().sessions;

      expect(sessions).toContainEqual(session);
    });

    it('should allow multiple active sessions', () => {
      const store = useSessionStore.getState();
      const session1 = store.createSession();
      const session2 = store.createSession();
      const sessions = useSessionStore.getState().sessions;

      expect(sessions.length).toBe(2);
      expect(sessions).toContainEqual(session1);
      expect(sessions).toContainEqual(session2);
    });
  });

  describe('getSession', () => {
    it('should return session by id', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();
      const found = store.getSession(session.id);

      expect(found).toEqual(session);
    });

    it('should return undefined for non-existent session', () => {
      const store = useSessionStore.getState();
      const found = store.getSession('non-existent-id');

      expect(found).toBeUndefined();
    });
  });

  describe('updateSession', () => {
    it('should update session status', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();
      store.updateSession(session.id, { status: 'completed' });

      const updated = store.getSession(session.id);
      expect(updated?.status).toBe('completed');
    });

    it('should not affect other sessions', () => {
      const store = useSessionStore.getState();
      const session1 = store.createSession();
      const session2 = store.createSession();
      store.updateSession(session1.id, { status: 'completed' });

      const updated1 = store.getSession(session1.id);
      const updated2 = store.getSession(session2.id);

      expect(updated1?.status).toBe('completed');
      expect(updated2?.status).toBe('active');
    });
  });

  describe('deleteSession', () => {
    it('should remove session from array', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();
      store.deleteSession(session.id);

      const sessions = useSessionStore.getState().sessions;
      expect(sessions).not.toContainEqual(session);
    });
  });

  describe('addItemToSession', () => {
    it('should add item to session', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();
      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 5
      };

      store.addItemToSession(session.id, item);
      const updated = store.getSession(session.id);

      expect(updated?.items).toContainEqual(item);
    });

    it('should not affect other sessions', () => {
      const store = useSessionStore.getState();
      const session1 = store.createSession();
      const session2 = store.createSession();
      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 5
      };

      store.addItemToSession(session1.id, item);
      const updated2 = store.getSession(session2.id);

      expect(updated2?.items).toEqual([]);
    });
  });

  describe('updateItemInSession', () => {
    it('should update item in session', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();
      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 5
      };

      store.addItemToSession(session.id, item);
      store.updateItemInSession(session.id, 'item-1', { quantity: 10 });

      const updated = store.getSession(session.id);
      expect(updated?.items[0].quantity).toBe(10);
      expect(updated?.items[0].productName).toBe('Test Product');
    });
  });

  describe('removeItemFromSession', () => {
    it('should remove item from session', () => {
      const store = useSessionStore.getState();
      const session = store.createSession();
      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 5
      };

      store.addItemToSession(session.id, item);
      store.removeItemFromSession(session.id, 'item-1');

      const updated = store.getSession(session.id);
      expect(updated?.items).not.toContainEqual(item);
    });
  });

  describe('getActiveSessions', () => {
    it('should return active and pendingEmails sessions', () => {
      const store = useSessionStore.getState();
      const session1 = store.createSession();
      const session2 = store.createSession();
      store.updateSession(session2.id, { status: 'pendingEmails' });
      store.updateSession(store.createSession().id, { status: 'completed' });

      const activeSessions = store.getActiveSessions();

      expect(activeSessions.length).toBe(2);
      expect(activeSessions.some(s => s.id === session1.id)).toBe(true);
      expect(activeSessions.some(s => s.id === session2.id)).toBe(true);
    });

    it('should not return completed or cancelled sessions', () => {
      const store = useSessionStore.getState();
      store.createSession();
      store.updateSession(store.createSession().id, { status: 'completed' });
      store.updateSession(store.createSession().id, { status: 'cancelled' });

      const activeSessions = store.getActiveSessions();

      expect(activeSessions.every(s => s.status === 'active' || s.status === 'pendingEmails')).toBe(true);
    });
  });

  describe('loadSessionsFromStorage', () => {
    it('should load sessions from storage', async () => {
      // TODO: Mock AsyncStorage and test loading
      expect(true).toBe(true);
    });
  });

  describe('saveSessionsToStorage', () => {
    it('should save sessions to storage', async () => {
      // TODO: Mock AsyncStorage and test saving
      expect(true).toBe(true);
    });
  });
});
