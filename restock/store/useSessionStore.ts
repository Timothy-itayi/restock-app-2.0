import { useMemo } from 'react';
import { create } from 'zustand';
import {
  getSessions,
  setSessions,
  type Session,
  type SessionItem
} from '../lib/helpers/storage/sessions';
import logger from '../lib/helpers/logger';

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

  // Session helpers
  getActiveSessions: () => Session[];

  // Persistence
  loadSessionsFromStorage: () => Promise<void>;
  saveSessionsToStorage: () => Promise<void>;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  isHydrated: false,

  //----------------------------------------------------------------------
  // CREATE SESSION — NOW allows multiple active sessions
  //----------------------------------------------------------------------
  createSession: () => {
    const state = get();

    const newSession: Session = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      status: 'active',
      items: []
    };

    const updated = [...state.sessions, newSession];

    set({ sessions: updated });
    setSessions(updated).catch(err => logger.error('Failed to save sessions after creation', err));

    return newSession;
  },

  //----------------------------------------------------------------------
  // GET SESSION BY ID
  //----------------------------------------------------------------------
  getSession: (id) => get().sessions.find((s) => s.id === id),

  //----------------------------------------------------------------------
  // UPDATE SESSION
  //----------------------------------------------------------------------
  updateSession: (id, updates) => {
    const updated = get().sessions.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );

    set({ sessions: updated });
    setSessions(updated).catch(err => logger.error('Failed to save sessions after update', err));
  },

  //----------------------------------------------------------------------
  // DELETE SESSION
  //----------------------------------------------------------------------
  deleteSession: (id) => {
    const updated = get().sessions.filter((s) => s.id !== id);
    set({ sessions: updated });
    setSessions(updated).catch(err => logger.error('Failed to save sessions after delete', err));
  },

  //----------------------------------------------------------------------
  // ITEMS: ADD
  //----------------------------------------------------------------------
  addItemToSession: (sessionId, item) => {
    const updated = get().sessions.map((session) =>
      session.id === sessionId
        ? { ...session, items: [...session.items, item] }
        : session
    );

    set({ sessions: updated });
    setSessions(updated).catch(err => logger.error('Failed to save sessions after item add', err));
  },

  //----------------------------------------------------------------------
  // ITEMS: UPDATE
  //----------------------------------------------------------------------
  updateItemInSession: (sessionId, itemId, updates) => {
    const updated = get().sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            items: session.items.map((i) =>
              i.id === itemId ? { ...i, ...updates } : i
            )
          }
        : session
    );

    set({ sessions: updated });
    setSessions(updated).catch(err => logger.error('Failed to save sessions after item update', err));
  },

  //----------------------------------------------------------------------
  // ITEMS: REMOVE
  //----------------------------------------------------------------------
  removeItemFromSession: (sessionId, itemId) => {
    const updated = get().sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            items: session.items.filter((i) => i.id !== itemId)
          }
        : session
    );

    set({ sessions: updated });
    setSessions(updated).catch(err => logger.error('Failed to save sessions after item removal', err));
  },

  //----------------------------------------------------------------------
  // ACTIVE SESSIONS — *Stable selector*
  // Includes 'active' and 'pendingEmails' (sessions still in progress)
  //----------------------------------------------------------------------
  getActiveSessions: () => {
    return get().sessions.filter((s) => s.status === 'active' || s.status === 'pendingEmails');
  },

  //----------------------------------------------------------------------
  // LOAD
  //----------------------------------------------------------------------
  loadSessionsFromStorage: async () => {
    try {
      const sessions = await getSessions();
      set({ sessions, isHydrated: true });
    } catch (err) {
      logger.error('Failed to load sessions from storage', err);
      set({ isHydrated: true });
    }
  },

  //----------------------------------------------------------------------
  // SAVE
  //----------------------------------------------------------------------
  saveSessionsToStorage: async () => {
    try {
      await setSessions(get().sessions);
    } catch (err) {
      logger.error('Failed to save sessions to storage', err);
    }
  }
}));

// Stable hooks
export const useSessions = () => useSessionStore((s) => s.sessions);

export const useActiveSessions = () => {
  const sessions = useSessions();
  return useMemo(
    () => sessions.filter((x) => x.status === 'active' || x.status === 'pendingEmails'),
    [sessions]
  );
};

export const useActiveSession = () => {
  const activeSessions = useActiveSessions();
  return activeSessions.length > 0 ? activeSessions[0] : null;
};

export const useSessionHydrated = () => useSessionStore((s) => s.isHydrated);
