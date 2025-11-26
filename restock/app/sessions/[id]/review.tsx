import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionStore } from '../../../store/useSessionStore';
import { useSupplierStore } from '../../../store/useSupplierStore';
import { groupBySupplier } from '../../../lib/utils/groupBySupplier';

export default function ReviewScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useSessionStore(s => s.getSession(id));
  const suppliers = useSupplierStore(s => s.suppliers);

  // Group items by supplier
  const supplierGroups = useMemo(() => {
    if (!session || !session.items.length) return [];
    return groupBySupplier(session.items, suppliers);
  }, [session, suppliers]);

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
      </View>
      <Text style={styles.itemQty}>x{item.quantity}</Text>
    </View>
  );

  // Render supplier group with header
  const renderSupplierGroup = ({ item: group }) => (
    <View style={{ marginBottom: 16 }}>
      {/* Supplier Header */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        backgroundColor: '#f5f5f5',
        borderLeftWidth: 3,
        borderLeftColor: '#6B7F6B',
        marginBottom: 8
      }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: '#333' 
        }}>
          {group.supplierName}
        </Text>
        {group.supplierEmail ? (
          <Text style={{ 
            fontSize: 13, 
            color: '#666', 
            marginTop: 2 
          }}>
            {group.supplierEmail}
          </Text>
        ) : null}
      </View>

      {/* Items for this supplier */}
      <FlatList
        data={group.items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 0 }}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Review Session</Text>
      </View>

      <View style={styles.contentContainer}>
        {session.items.length === 0 ? (
          <Text style={styles.emptyStateText}>No items yet.</Text>
        ) : supplierGroups.length === 0 ? (
          <Text style={styles.emptyStateText}>No items to display.</Text>
        ) : (
          <FlatList
            data={supplierGroups}
            keyExtractor={(group) => group.supplierId}
            renderItem={renderSupplierGroup}
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
