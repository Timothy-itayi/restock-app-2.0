import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessions, useSessionHydrated, useSessionStore, useActiveSession } from '../../store/useSessionStore';
import type { Session } from '../../lib/helpers/storage/sessions';

export default function SessionsScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const sessions = useSessions();
  const isHydrated = useSessionHydrated();
  const activeSession = useActiveSession();
  const loadSessionsFromStorage = useSessionStore((state) => state.loadSessionsFromStorage);
  const createSession = useSessionStore((state) => state.createSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) {
      loadSessionsFromStorage().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isHydrated, loadSessionsFromStorage]);

  const startSession = () => {
    // Prevent starting a new session if one is already active
    if (activeSession) {
      Alert.alert(
        'Active Session Exists',
        'You already have an active session. Please complete or cancel it before starting a new one.',
        [
          {
            text: 'View Active Session',
            onPress: () => router.push(`/session/${activeSession.id}`)
          },
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    }

    const newSession = createSession();
    router.push(`/session/${newSession.id}`);
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    const isActive = item.status === 'active';
    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          isActive && { borderWidth: 2, borderColor: '#6B7F6B' } // Highlight active session
        ]}
        onPress={() => router.push(`/session/${item.id}`)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionTitle}>
              Session {new Date(item.createdAt).toLocaleDateString()}
            </Text>
            <Text style={styles.sessionSubtitle}>
              {item.items.length} items • {item.status}
            </Text>
          </View>
          {isActive && (
            <View
              style={{
                backgroundColor: '#6B7F6B',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                Active
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Restock Sessions</Text>
      </View>

      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            activeSession && { opacity: 0.6 } // Visual feedback when disabled
          ]}
          onPress={startSession}
          disabled={!!activeSession} // Disable if active session exists
        >
          <Text style={styles.primaryButtonText}>
            {activeSession ? 'Active Session Exists' : 'Start New Session'}
          </Text>
        </TouchableOpacity>

        {loading ? (
          <Text style={styles.emptyStateText}>Loading...</Text>
        ) : sessions.length === 0 ? (
          <Text style={styles.emptyStateText}>No sessions yet. Start one!</Text>
        ) : (
          <FlatList
            data={sessions.sort((a, b) => b.createdAt - a.createdAt)}
            keyExtractor={(item) => item.id}
            renderItem={renderSessionItem}
            contentContainerStyle={{ paddingTop: 12 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

