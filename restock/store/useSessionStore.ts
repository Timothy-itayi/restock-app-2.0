import { create } from 'zustand';
import {
  getSessions,
  setSessions,
  type Session,
  type SessionItem
} from '../lib/helpers/storage/sessions';

type SessionStore = {
  sessions: Session[];
  isHydrated: boolean;

  // CRUD
  createSession: () => Session;
  getSession: (id: string) => Session | undefined;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;

  // Items
  addItemToSession: (sessionId: string, item: SessionItem) => void;
  updateItemInSession: (sessionId: string, itemId: string, updates: Partial<SessionItem>) => void;
  removeItemFromSession: (sessionId: string, itemId: string) => void;

  // Active session helpers
  getActiveSession: () => Session | undefined;
  completeSession: (id: string) => void;

  // Persistence
  loadSessionsFromStorage: () => Promise<void>;
  saveSessionsToStorage: () => Promise<void>;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  isHydrated: false,

  //----------------------------------------------------------------------
  // CREATE SESSION — always creates a NEW active session, completes others
  //----------------------------------------------------------------------
  createSession: () => {
    const state = get();

    // Mark all existing active sessions as completed
    const updatedSessions = state.sessions.map((s) =>
      s.status === 'active' ? { ...s, status: 'completed' as const } : s
    );

    const newSession: Session = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      status: 'active',
      items: []
    };

    const allSessions = [...updatedSessions, newSession];
    set({ sessions: allSessions });
    setSessions(allSessions).catch(console.warn);

    return newSession;
  },

  //----------------------------------------------------------------------
  // GET SESSION BY ID
  //----------------------------------------------------------------------
  getSession: (id) => {
    return get().sessions.find((s) => s.id === id);
  },

  //----------------------------------------------------------------------
  // UPDATE SESSION — fixed version (only one active session allowed)
  //----------------------------------------------------------------------
  updateSession: (id, updates) => {
    const state = get();

    // Special case: activating a session
    if (updates.status === 'active') {
      const finalSessions = state.sessions.map((session) => {
        if (session.id === id) {
          return { ...session, ...updates, status: 'active' as const };
        }
        if (session.status === 'active') {
          return { ...session, status: 'completed' as const };
        }
        return session;
      });

      set({ sessions: finalSessions });
      setSessions(finalSessions).catch(console.warn);
      return;
    }

    // Standard updates
    const updatedSessions = state.sessions.map((session) =>
      session.id === id ? { ...session, ...updates } : session
    );

    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },

  //----------------------------------------------------------------------
  // DELETE SESSION
  //----------------------------------------------------------------------
  deleteSession: (id) => {
    const updatedSessions = get().sessions.filter((s) => s.id !== id);
    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },

  //----------------------------------------------------------------------
  // ITEMS: ADD TO SESSION
  //----------------------------------------------------------------------
  addItemToSession: (sessionId, item) => {
    const updatedSessions = get().sessions.map((session) =>
      session.id === sessionId
        ? { ...session, items: [...session.items, item] }
        : session
    );

    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },

  //----------------------------------------------------------------------
  // ITEMS: UPDATE ITEM IN SESSION
  //----------------------------------------------------------------------
  updateItemInSession: (sessionId, itemId, updates) => {
    const updatedSessions = get().sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            items: session.items.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          }
        : session
    );

    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },

  //----------------------------------------------------------------------
  // ITEMS: REMOVE ITEM FROM SESSION
  //----------------------------------------------------------------------
  removeItemFromSession: (sessionId, itemId) => {
    const updatedSessions = get().sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            items: session.items.filter((item) => item.id !== itemId)
          }
        : session
    );

    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },

  //----------------------------------------------------------------------
  // GET ACTIVE SESSION — safe and deterministic
  //----------------------------------------------------------------------
  getActiveSession: () => {
    const sessions = get().sessions;
    return sessions.find((s) => s.status === 'active');
  },

  //----------------------------------------------------------------------
  // COMPLETE SESSION
  //----------------------------------------------------------------------
  completeSession: (id) => {
    get().updateSession(id, { status: 'completed' });
  },

  //----------------------------------------------------------------------
  // LOAD FROM PERSISTENCE
  //----------------------------------------------------------------------
  loadSessionsFromStorage: async () => {
    const sessions = await getSessions();
    set({ sessions, isHydrated: true });
  },

  //----------------------------------------------------------------------
  // SAVE TO PERSISTENCE
  //----------------------------------------------------------------------
  saveSessionsToStorage: async () => {
    await setSessions(get().sessions);
  }
}));

// Export hooks
export const useSessions = () => useSessionStore((s) => s.sessions);
export const useActiveSession = () => useSessionStore((s) => s.getActiveSession());
export const useSessionHydrated = () => useSessionStore((s) => s.isHydrated);
