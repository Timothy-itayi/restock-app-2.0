import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useThemedStyles } from '../../styles/useThemedStyles';
import { getCompanyStyles } from '../../styles/components/company';
import colors from '../../lib/theme/colors';
import type { Snapshot } from '../../lib/api/company';

export default function StoreSnapshot() {
  const router = useRouter();
  const { store } = useLocalSearchParams<{ store: string }>();
  const storeName = decodeURIComponent(store);
  const { getSnapshot } = useCompanyStore();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const styles = useThemedStyles(getCompanyStyles);

  useEffect(() => {
    getSnapshot(storeName)
      .then(setSnapshot)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [storeName]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  if (!snapshot) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.stickyBackButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>{storeName}</Text>
      </View>

      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.timestamp}>
            Published: {new Date(snapshot.publishedAt).toLocaleString()}
          </Text>
        </View>

        {snapshot.sessions.map((session, idx) => (
          <View key={session.id || idx} style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>
              Order from {new Date(session.createdAt).toLocaleDateString()}
            </Text>
            {session.items.map((item: any, i: number) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemText}>{item.productName}</Text>
                <Text style={styles.qtyText}>x{item.quantity}</Text>
              </View>
            ))}
          </View>
        ))}
        
        {snapshot.sessions.length === 0 && (
          <Text style={styles.empty}>No shared orders for this store</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

