import React, { useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionHydrated, useSessionStore } from '../../../../store/useSessionStore';

export default function EditProductScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();

  const session = useSessionStore(s => s.getSession(id));
  const updateItem = useSessionStore(s => s.updateItemInSession);
  const loadSessionsFromStorage = useSessionStore(s => s.loadSessionsFromStorage);
  const isHydrated = useSessionHydrated();

  useEffect(() => {
    if (!isHydrated) loadSessionsFromStorage();
  }, [isHydrated, loadSessionsFromStorage]);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyStateText}>Loading session…</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyStateText}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const item = session.items.find(i => i.id === itemId);

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyStateText}>Item not found.</Text>
      </SafeAreaView>
    );
  }

  const [name, setName] = React.useState(item.productName);
  const [supplier, setSupplier] = React.useState(item.supplierName);
  const [qty, setQty] = React.useState(item.quantity);

  const increment = () => setQty(q => q + 1);
  const decrement = () => setQty(q => Math.max(1, q - 1));

  const saveChanges = () => {
    updateItem(id, itemId, {
      productName: name,
      supplierName: supplier,
      quantity: qty
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Product</Text>
      </View>

      <View style={styles.contentContainer}>

        {/* PRODUCT NAME */}
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Product Name"
        />

        {/* SUPPLIER NAME */}
        <TextInput
          style={styles.input}
          value={supplier}
          onChangeText={setSupplier}
          placeholder="Supplier Name"
        />

        {/* QUANTITY */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <TouchableOpacity
            onPress={decrement}
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              backgroundColor: '#E5E5E5',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <Ionicons name="remove" size={22} color="#333" />
          </TouchableOpacity>

          <Text style={{ fontSize: 20, fontWeight: '600', minWidth: 40, textAlign: 'center' }}>
            {qty}
          </Text>

          <TouchableOpacity
            onPress={increment}
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              backgroundColor: '#6B7F6B',
              justifyContent: 'center',
              alignItems: 'center',
              marginLeft: 12
            }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity style={[styles.primaryButton, { marginTop: 30 }]} onPress={saveChanges}>
          <Text style={styles.primaryButtonText}>Save Changes</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
