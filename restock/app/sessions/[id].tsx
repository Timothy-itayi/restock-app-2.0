import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionStore } from '../../store/useSessionStore';

export default function SessionDetailScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === id)
  );

  useEffect(() => {
    if (!session) {
      console.warn('Session not found:', id);
    }
  }, [session]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={{ padding: 16 }}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.emptyStateText}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Session Details</Text>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.sessionTitle}>
          Session {new Date(session.createdAt).toLocaleDateString()}
        </Text>
        <Text style={styles.sessionSubtitle}>
          {session.items.length} items • {session.status}
        </Text>

        {/* Placeholder for your upcoming UI */}
        <View style={{ marginTop: 24 }}>
          <Text style={styles.emptyStateText}>
            Item list, actions, and UI go here.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
