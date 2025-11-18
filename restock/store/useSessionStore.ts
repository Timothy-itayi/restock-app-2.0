import { create } from 'zustand';
import { getSessions, setSessions, type Session, type SessionItem } from '../lib/helpers/storage/sessions';

type SessionStore = {
  sessions: Session[];
  isHydrated: boolean;
  
  // CRUD Operations
  createSession: () => Session;
  getSession: (id: string) => Session | undefined;
  updateSession: (id: string, updates: Partial<Session>) => void;
  deleteSession: (id: string) => void;
  
  // Session Items
  addItemToSession: (sessionId: string, item: SessionItem) => void;
  updateItemInSession: (sessionId: string, itemId: string, updates: Partial<SessionItem>) => void;
  removeItemFromSession: (sessionId: string, itemId: string) => void;
  
  // Active Session Management
  getActiveSession: () => Session | undefined;
  completeSession: (id: string) => void;
  
  // Persistence
  loadSessionsFromStorage: () => Promise<void>;
  saveSessionsToStorage: () => Promise<void>;
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  isHydrated: false,
  
  createSession: () => {
    const state = get();
    
    // Ensure only one active session: mark all others as completed
    const updatedSessions = state.sessions.map(session => 
      session.status === 'active' 
        ? { ...session, status: 'completed' as const }
        : session
    );
    
    const newSession: Session = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      status: 'active',
      items: []
    };
    
    const allSessions = [...updatedSessions, newSession];
    set({ sessions: allSessions });
    
    // Auto-save to storage
    setSessions(allSessions).catch(console.warn);
    
    return newSession;
  },
  
  getSession: (id: string) => {
    return get().sessions.find(s => s.id === id);
  },
  
  updateSession: (id: string, updates: Partial<Session>) => {
    const state = get();
    const updatedSessions = state.sessions.map(session => {
      if (session.id === id) {
        const updated = { ...session, ...updates };
        
        // If setting status to 'active', ensure only one active session
        if (updates.status === 'active') {
          return updated;
        }
        
        return updated;
      }
      return session;
    });
    
    // If we're activating a session, mark all others as completed
    if (updates.status === 'active') {
      const finalSessions = updatedSessions.map(session => {
        if (session.id === id) {
          return { ...session, status: 'active' as const };
        }
        if (session.status === 'active') {
          return { ...session, status: 'completed' as const };
        }
        return session;
      });
      set({ sessions: finalSessions });
      setSessions(finalSessions).catch(console.warn);
    } else {
      set({ sessions: updatedSessions });
      setSessions(updatedSessions).catch(console.warn);
    }
  },
  
  deleteSession: (id: string) => {
    const state = get();
    const sessionToDelete = state.sessions.find(s => s.id === id);
    const updatedSessions = state.sessions.filter(s => s.id !== id);
    
    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
    
    // Edge case: If we deleted the active session, no need to clear pointer
    // since we just filter it out. The next createSession will handle it.
  },
  
  addItemToSession: (sessionId: string, item: SessionItem) => {
    const state = get();
    const updatedSessions = state.sessions.map(session => {
      if (session.id === sessionId) {
        // Handle duplicate items: if same productName and supplierName exist,
        // we add it as a separate item (don't merge - let grouping logic handle it)
        return {
          ...session,
          items: [...session.items, item]
        };
      }
      return session;
    });
    
    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },
  
  updateItemInSession: (sessionId: string, itemId: string, updates: Partial<SessionItem>) => {
    const state = get();
    const updatedSessions = state.sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          items: session.items.map(item => 
            item.id === itemId ? { ...item, ...updates } : item
          )
        };
      }
      return session;
    });
    
    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },
  
  removeItemFromSession: (sessionId: string, itemId: string) => {
    const state = get();
    const updatedSessions = state.sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          items: session.items.filter(item => item.id !== itemId)
        };
      }
      return session;
    });
    
    set({ sessions: updatedSessions });
    setSessions(updatedSessions).catch(console.warn);
  },
  
  getActiveSession: () => {
    return get().sessions.find(s => s.status === 'active');
  },
  
  completeSession: (id: string) => {
    get().updateSession(id, { status: 'completed' });
  },
  
  loadSessionsFromStorage: async () => {
    const sessions = await getSessions();
    set({ sessions, isHydrated: true });
  },
  
  saveSessionsToStorage: async () => {
    const sessions = get().sessions;
    await setSessions(sessions);
  },
}));

// Convenience hooks
export const useSessions = () => {
  return useSessionStore((state) => state.sessions);
};

export const useActiveSession = () => {
  return useSessionStore((state) => state.getActiveSession());
};

export const useSessionHydrated = () => {
  return useSessionStore((state) => state.isHydrated);
};

