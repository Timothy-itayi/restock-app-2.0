import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type Session = {
  id: string;
  createdAt: number;
  items: any[];
  status: 'active' | 'completed';
};

export default function SessionsScreen() {
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
      style={styles.sessionItem}
      onPress={() => router.push(`/session/${item.id}`)}
    >
      <Text style={styles.sessionTitle}>
        Session {new Date(item.createdAt).toLocaleDateString()}
      </Text>
      <Text style={styles.sessionMeta}>
        {item.items.length} items • {item.status}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restock Sessions</Text>

      <TouchableOpacity style={styles.button} onPress={startSession}>
        <Text style={styles.buttonText}>Start New Session</Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : sessions.length === 0 ? (
        <Text style={styles.empty}>No sessions yet. Start one!</Text>
      ) : (
        <FlatList
          data={sessions.sort((a, b) => b.createdAt - a.createdAt)}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={{ paddingTop: 12 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white'
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 20
  },
  button: {
    backgroundColor: '#6B7F6B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  sessionItem: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#F8F8F8',
    marginBottom: 12
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600'
  },
  sessionMeta: {
    marginTop: 4,
    fontSize: 14,
    color: '#555'
  },
  loading: {
    marginTop: 40,
    textAlign: 'center',
    color: '#777'
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    color: '#777'
  }
});
