import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getUploadStyles } from '@styles/components/upload';
import { useSessionStore, useActiveSession, useSessionHydrated } from '../store/useSessionStore';
import type { SessionItem } from '../lib/helpers/storage/sessions';

export default function AddProductScreen() {
  const styles = useThemedStyles(getUploadStyles);
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [supplier, setSupplier] = useState('');
  
  const activeSession = useActiveSession();
  const isHydrated = useSessionHydrated();
  const loadSessionsFromStorage = useSessionStore((state) => state.loadSessionsFromStorage);
  const addItemToSession = useSessionStore((state) => state.addItemToSession);

  useEffect(() => {
    if (!isHydrated) {
      loadSessionsFromStorage();
    }
  }, [isHydrated, loadSessionsFromStorage]);

  // Check for active session on mount
  useEffect(() => {
    if (isHydrated && !activeSession) {
      Alert.alert(
        'No Active Session',
        'You need to start a session before adding products. Would you like to create one?',
        [
          {
            text: 'Create Session',
            onPress: () => {
              useSessionStore.getState().createSession();
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.back()
          }
        ]
      );
    }
  }, [isHydrated, activeSession]);

  const handleSave = () => {
    // Validate product name
    if (!productName.trim()) {
      Alert.alert('Error', 'Product name is required.');
      return;
    }

    // Validate quantity
    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum < 1) {
      Alert.alert('Error', 'Quantity must be a number greater than 0.');
      return;
    }

    // Check for active session
    if (!activeSession) {
      Alert.alert('Error', 'No active session found. Please start a session first.');
      return;
    }

    // Create session item
    const newItem: SessionItem = {
      id: `${Date.now()}-${Math.random()}`,
      productName: productName.trim(),
      quantity: quantityNum,
      supplierName: supplier.trim() || undefined
    };

    // Add to session
    addItemToSession(activeSession.id, newItem);

    // Reset form
    setProductName('');
    setQuantity('1');
    setSupplier('');

    // Redirect back to session view
    // If we came from a session detail, go back; otherwise go to sessions list
    router.back();
  };

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.sessionContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.sessionContainer}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={styles.sessionSelectionTitle}>No Active Session</Text>
          <Text style={styles.sectionSubtitle}>
            You need to start a session before adding products.
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 20 }]}
            onPress={() => router.replace('/sessions')}
          >
            <Text style={styles.saveButtonText}>Go to Sessions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.sessionContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sessionSelectionTitle}>Add Product</Text>
          <Text style={styles.sectionSubtitle}>
            Add a product to your active session
          </Text>

          <View style={[styles.formCard, { marginTop: 20 }]}>
            <Text style={{ marginBottom: 8, fontSize: 16, fontWeight: '600', color: '#333' }}>
              Product Name *
            </Text>
            <TextInput
              placeholder="Enter product name"
              value={productName}
              onChangeText={setProductName}
              style={styles.textInput}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: '600', color: '#333' }}>
              Quantity *
            </Text>
            <TextInput
              placeholder="1"
              value={quantity}
              onChangeText={(text) => {
                // Only allow numbers
                if (text === '' || /^\d+$/.test(text)) {
                  setQuantity(text);
                }
              }}
              style={styles.textInput}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <Text style={{ marginTop: 16, marginBottom: 8, fontSize: 16, fontWeight: '600', color: '#333' }}>
              Supplier (optional)
            </Text>
            <TextInput
              placeholder="Enter supplier name"
              value={supplier}
              onChangeText={setSupplier}
              style={styles.textInput}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleSave}
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

