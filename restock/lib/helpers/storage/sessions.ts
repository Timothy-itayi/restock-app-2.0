import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionedJSON, setVersionedJSON } from './utils';

const SESSIONS_KEY = 'sessions';

export type SessionItem = {
  id: string;
  productName: string;
  quantity: number;
  supplierName?: string;
  supplierId?: string;
};

export type Session = {
  id: string;
  createdAt: number;
  status: 'active' | 'completed' | 'cancelled' | 'pendingEmails';
  items: SessionItem[];
};

/**
 * Validates that a session has the required structure.
 */
function isValidSession(session: any): session is Session {
  return (
    session &&
    typeof session === 'object' &&
    typeof session.id === 'string' &&
    typeof session.createdAt === 'number' &&
    (session.status === 'active' || session.status === 'completed' || session.status === 'cancelled' || session.status === 'pendingEmails') &&
    Array.isArray(session.items)
  );
}

/**
 * Validates session items structure.
 */
function isValidSessionItem(item: any): item is SessionItem {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.productName === 'string' &&
    typeof item.quantity === 'number'
  );
}

/**
 * Migrates sessions data from older versions to current version.
 * Returns null if migration is not possible.
 */
function migrateSessions(oldVersion: number, oldData: any): Session[] | null {
  // For now, all versions are compatible (v1)
  // Future versions can add migration logic here
  if (oldVersion === 0 || oldVersion === 1) {
    // Unversioned or v1 data - validate and return
    if (!Array.isArray(oldData)) {
      console.warn('Sessions migration: data is not an array, resetting');
      return [];
    }
    
    // Validate each session
    const validSessions: Session[] = [];
    for (const session of oldData) {
      if (isValidSession(session)) {
        // Validate items within session
        const validItems = session.items.filter(isValidSessionItem);
        validSessions.push({
          ...session,
          items: validItems
        });
      } else {
        console.warn('Sessions migration: invalid session found, skipping:', session);
      }
    }
    
    return validSessions;
  }
  
  // Unknown version - cannot migrate
  return null;
}

/**
 * Retrieves all sessions from AsyncStorage.
 * Returns empty array if not found or on error.
 * Handles corrupted data by resetting to empty array.
 * Supports version migration for future schema changes.
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const sessions = await getVersionedJSON<Session[]>(
      SESSIONS_KEY,
      migrateSessions
    );
    
    if (!sessions) return [];
    
    // Validate it's an array (additional safety check)
    if (!Array.isArray(sessions)) {
      console.warn('Sessions data is not an array, resetting storage');
      await setSessions([]);
      return [];
    }
    
    // Validate each session (additional safety check)
    const validSessions: Session[] = [];
    for (const session of sessions) {
      if (isValidSession(session)) {
        // Validate items within session
        const validItems = session.items.filter(isValidSessionItem);
        validSessions.push({
          ...session,
          items: validItems
        });
      } else {
        console.warn('Invalid session found, skipping:', session);
      }
    }
    
    // If we filtered out invalid sessions, save the cleaned version
    if (validSessions.length !== sessions.length) {
      console.warn('Some sessions were corrupted, saving cleaned version');
      await setSessions(validSessions);
    }
    
    return validSessions;
  } catch (err) {
    console.warn('Failed to load sessions from storage, resetting:', err);
    // Reset corrupted storage
    try {
      await setSessions([]);
    } catch (resetErr) {
      console.error('Failed to reset sessions storage:', resetErr);
    }
    return [];
  }
}

/**
 * Saves all sessions to AsyncStorage.
 * Never throws - logs errors quietly.
 * Saves with version metadata for future migrations.
 */
export async function setSessions(sessions: Session[]): Promise<void> {
  await setVersionedJSON(SESSIONS_KEY, sessions);
}
