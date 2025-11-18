import React from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionStore } from '../../../store/useSessionStore';

export default function ReviewScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useSessionStore(s => s.getSession(id));

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyStateText}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.itemRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.productName}</Text>
        {item.supplierName ? (
          <Text style={styles.itemSupplier}>{item.supplierName}</Text>
        ) : null}
      </View>
      <Text style={styles.itemQty}>x{item.quantity}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Review Session</Text>
      </View>

      <View style={styles.contentContainer}>
        {session.items.length === 0 ? (
          <Text style={styles.emptyStateText}>No items yet.</Text>
        ) : (
          <FlatList
            data={session.items}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 12 }}
          />
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 20 }]}
          onPress={() => router.push(`/email-preview/${session.id}`)}
        >
          <Text style={styles.primaryButtonText}>Generate Review Email</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
