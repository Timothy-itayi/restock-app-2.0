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
import {
  useSessions,
  useSessionHydrated,
  useSessionStore,
  useActiveSessions
} from '../../store/useSessionStore';
import type { Session } from '../../lib/helpers/storage/sessions';

export default function SessionsScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const sessions = useSessions();
  const isHydrated = useSessionHydrated();
  const activeSessions = useActiveSessions();
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
    const newSession = createSession();
    router.push(`/sessions/${newSession.id}/add-product`);
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    const isActive = item.status === 'active';

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          isActive && { borderWidth: 2, borderColor: '#6B7F6B' }
        ]}
        onPress={() => router.push(`/sessions/${item.id}`)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
      {/* Header */}
      <View style={{ flexDirection: 'row', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Restock Sessions</Text>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={startSession}
        >
          <Text style={styles.primaryButtonText}>Start New Session</Text>
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
