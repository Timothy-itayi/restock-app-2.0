import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';

type Session = {
  id: string;
  createdAt: number;
  items: any[];
  status: 'active' | 'completed';
};

export default function SessionsScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem('sessions');
      const parsed: Session[] = raw ? JSON.parse(raw) : [];
      setSessions(parsed);
    } catch (err) {
      console.warn('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    const newSession: Session = {
      id: Date.now().toString(),
      createdAt: Date.now(),
      items: [],
      status: 'active'
    };

    const updated = [...sessions, newSession];
    await AsyncStorage.setItem('sessions', JSON.stringify(updated));
    setSessions(updated);

    router.push(`/session/${newSession.id}`);
  };

  const renderSessionItem = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => router.push(`/session/${item.id}`)}
    >
      <Text style={styles.sessionTitle}>
        Session {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.sessionSubtitle}>
        {item.items.length} items • {item.status}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Restock Sessions</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={startSession}>
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
    </View>
  );
}

