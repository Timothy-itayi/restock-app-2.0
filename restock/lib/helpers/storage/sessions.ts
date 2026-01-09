import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionedJSON, setVersionedJSON } from './utils';
import logger from '../logger';

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
 */
function migrateSessions(oldVersion: number, oldData: any): Session[] | null {
  if (oldVersion === 0 || oldVersion === 1) {
    if (!Array.isArray(oldData)) {
      logger.warn('[Sessions] Migration: data is not an array, resetting');
      return [];
    }
    
    const validSessions: Session[] = [];
    for (const session of oldData) {
      if (isValidSession(session)) {
        const validItems = session.items.filter(isValidSessionItem);
        validSessions.push({
          ...session,
          items: validItems
        });
      } else {
        logger.warn('[Sessions] Migration: invalid session found, skipping', { session });
      }
    }
    
    return validSessions;
  }
  
  return null;
}

/**
 * Retrieves all sessions from AsyncStorage.
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const sessions = await getVersionedJSON<Session[]>(
      SESSIONS_KEY,
      migrateSessions
    );
    
    if (!sessions) return [];
    
    if (!Array.isArray(sessions)) {
      logger.warn('[Sessions] Data is not an array, resetting storage');
      await setSessions([]);
      return [];
    }
    
    const validSessions: Session[] = [];
    for (const session of sessions) {
      if (isValidSession(session)) {
        const validItems = session.items.filter(isValidSessionItem);
        validSessions.push({
          ...session,
          items: validItems
        });
      } else {
        logger.warn('[Sessions] Invalid session found, skipping', { session });
      }
    }
    
    if (validSessions.length !== sessions.length) {
      logger.info('[Sessions] Some sessions were corrupted, saving cleaned version');
      await setSessions(validSessions);
    }
    
    return validSessions;
  } catch (err) {
    logger.error('[Sessions] Failed to load sessions from storage, resetting', err);
    try {
      await setSessions([]);
    } catch (resetErr) {
      logger.error('[Sessions] Failed to reset sessions storage', resetErr);
    }
    return [];
  }
}

/**
 * Saves all sessions to AsyncStorage.
 */
export async function setSessions(sessions: Session[]): Promise<void> {
  await setVersionedJSON(SESSIONS_KEY, sessions);
}
