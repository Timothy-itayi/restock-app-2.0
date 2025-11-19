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
import { addProductScreenStyles } from '@styles/components/add-product';
import { useSessionStore } from '../../../store/useSessionStore';
import type { SessionItem } from '../../../lib/helpers/storage/sessions';

export default function AddProductScreen() {
  const styles = useThemedStyles(getUploadStyles);
  const qtyStyles = addProductScreenStyles;

  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useSessionStore((state) =>
    state.sessions.find((s) => s.id === id)
  );

  const addItemToSession = useSessionStore((state) => state.addItemToSession);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
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

    const newItem: SessionItem = {
      id: `${Date.now()}-${Math.random()}`,
      productName: productName.trim(),
      quantity,
      supplierName: supplier.trim() || undefined,
    };

    addItemToSession(session.id, newItem);

    setProductName('');
    setQuantity(1);
    setSupplier('');

    router.replace(`/sessions/${session.id}`);
  };

  const incrementQty = () => setQuantity(q => q + 1);
  const decrementQty = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  return (
    <SafeAreaView style={styles.sessionContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }}>
          
          <Text style={styles.sessionSelectionTitle}>Add Product</Text>

          <View style={[styles.formCard, { marginTop: 20 }]}>
            
            {/* PRODUCT NAME */}
            <Text style={qtyStyles.label}>Product Name *</Text>
            <TextInput
              placeholder="Enter product name"
              value={productName}
              onChangeText={setProductName}
              style={styles.textInput}
            />

            {/* QUANTITY */}
            <Text style={qtyStyles.label}>Quantity *</Text>
            <View style={qtyStyles.qtyContainer}>
              <TouchableOpacity style={qtyStyles.qtyButton} onPress={decrementQty}>
                <Text style={qtyStyles.qtyButtonText}>−</Text>
              </TouchableOpacity>

              <Text style={qtyStyles.qtyValue}>{quantity}</Text>

              <TouchableOpacity style={qtyStyles.qtyButton} onPress={incrementQty}>
                <Text style={qtyStyles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* SUPPLIER */}
            <Text style={qtyStyles.label}>Supplier (optional)</Text>
            <TextInput
              placeholder="Enter supplier name"
              value={supplier}
              onChangeText={setSupplier}
              style={styles.textInput}
            />

            {/* ACTION BUTTONS */}
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
