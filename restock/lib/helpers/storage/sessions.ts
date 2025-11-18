import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'sessions';

export type SessionItem = {
  id: string;
  productName: string;
  quantity: number;
  supplierName?: string;
};

export type Session = {
  id: string;
  createdAt: number;
  status: 'active' | 'completed';
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
    (session.status === 'active' || session.status === 'completed') &&
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
 * Retrieves all sessions from AsyncStorage.
 * Returns empty array if not found or on error.
 * Handles corrupted data by resetting to empty array.
 */
export async function getSessions(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    
    // Validate it's an array
    if (!Array.isArray(parsed)) {
      console.warn('Sessions data is not an array, resetting storage');
      await setSessions([]);
      return [];
    }
    
    // Validate each session
    const validSessions: Session[] = [];
    for (const session of parsed) {
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
    if (validSessions.length !== parsed.length) {
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
 */
export async function setSessions(sessions: Session[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save sessions to storage:', err);
  }
}

