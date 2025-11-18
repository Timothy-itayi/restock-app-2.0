import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getUploadStyles } from '@styles/components/upload';
import { useSessionStore } from '../../../store/useSessionStore';
import type { SessionItem } from '../../../lib/helpers/storage/sessions';

export default function AddProductScreen() {
  const styles = useThemedStyles(getUploadStyles);
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useSessionStore((state) =>
    state.sessions.find((s) => s.id === id)
  );

  const addItemToSession = useSessionStore((state) => state.addItemToSession);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [supplier, setSupplier] = useState('');

  if (!session) {
    return (
      <SafeAreaView style={styles.sessionContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Session not found.</Text>
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 20 }]}
            onPress={() => router.replace('/sessions')}
          >
            <Text style={styles.saveButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (!productName.trim()) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty < 1) {
      Alert.alert('Error', 'Quantity must be at least 1.');
      return;
    }

    const newItem: SessionItem = {
      id: `${Date.now()}-${Math.random()}`,
      productName: productName.trim(),
      quantity: qty,
      supplierName: supplier.trim() || undefined
    };

    addItemToSession(session.id, newItem);

    setProductName('');
    setQuantity('1');
    setSupplier('');

    router.replace(`/sessions/${session.id}`);
  };

  return (
    <SafeAreaView style={styles.sessionContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
          <Text style={styles.sessionSelectionTitle}>Add Product</Text>
          <Text style={styles.sectionSubtitle}>
            Add a product to Session {new Date(session.createdAt).toLocaleDateString()}
          </Text>

          <View style={[styles.formCard, { marginTop: 20 }]}>

            <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 16, fontWeight: '700', color: '#1c2011', marginTop: 16 }}>Product Name *</Text>
            <TextInput
              placeholder="Enter product name"
              value={productName}
              onChangeText={setProductName}
              style={styles.textInput}
            />

            <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 16, fontWeight: '700', color: '#1c2011', marginTop: 16 }}>
              Quantity *
            </Text>
            <TextInput
              placeholder="1"
              value={quantity}
              onChangeText={(t) => {
                if (t === '' || /^\d+$/.test(t)) setQuantity(t);
              }}
              style={styles.textInput}
              keyboardType="numeric"
            />

            <Text style={{ fontFamily: 'Satoshi-Bold', fontSize: 16, fontWeight: '700', color: '#1c2011', marginTop: 16 }}>Supplier (optional)</Text>
            <TextInput
              placeholder="Enter supplier name"
              value={supplier}
              onChangeText={setSupplier}
              style={styles.textInput}
            />

            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 24 }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Add to Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { marginTop: 12 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
