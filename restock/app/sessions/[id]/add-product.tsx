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
  SafeAreaView,
  FlatList
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getUploadStyles } from '@styles/components/upload';
import { addProductScreenStyles } from '@styles/components/add-product';
import { useSessionStore } from '../../../store/useSessionStore';
import { useSupplierStore } from '../../../store/useSupplierStore';
import type { SessionItem } from '../../../lib/helpers/storage/sessions';
import colors from '../../../lib/theme/colors';

export default function AddProductScreen() {
  const styles = useThemedStyles(getUploadStyles);
  const qtyStyles = addProductScreenStyles;

  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useSessionStore((state) =>
    state.sessions.find((s) => s.id === id)
  );

  const addItemToSession = useSessionStore((state) => state.addItemToSession);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const getSupplierByName = useSupplierStore((state) => state.getSupplierByName);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);

  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [supplier, setSupplier] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<typeof suppliers>([]);

  // Load suppliers on mount
  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // Filter suppliers based on input
  useEffect(() => {
    if (supplier.trim()) {
      const filtered = suppliers.filter(s =>
        s.name.toLowerCase().includes(supplier.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuppliers([]);
    }
  }, [supplier, suppliers]);

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

    const supplierNameTrimmed = supplier.trim();
    let supplierId: string | undefined;

    // If supplier name provided, create or get supplier
    if (supplierNameTrimmed) {
      try {
        const existing = getSupplierByName(supplierNameTrimmed);
        const supplierObj = existing ?? addSupplier(supplierNameTrimmed);
        supplierId = supplierObj.id;
      } catch (error) {
        console.warn('Error accessing supplier store:', error);
        // Continue without supplierId if there's an error
      }
    }

    const newItem: SessionItem = {
      id: `${Date.now()}-${Math.random()}`,
      productName: productName.trim(),
      quantity,
      supplierName: supplierNameTrimmed || undefined,
      supplierId,
    };

    addItemToSession(session.id, newItem);

    setProductName('');
    setQuantity(1);
    setSupplier('');
    setShowSuggestions(false);

    router.replace(`/sessions/${session.id}`);
  };

  const selectSupplier = (supplierName: string) => {
    setSupplier(supplierName);
    setShowSuggestions(false);
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
            <View style={{ position: 'relative' }}>
              <TextInput
                placeholder="Enter supplier name"
                value={supplier}
                onChangeText={setSupplier}
                onFocus={() => {
                  if (supplier.trim() && filteredSuppliers.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                style={styles.textInput}
              />
              {showSuggestions && filteredSuppliers.length > 0 && (
                <View style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: colors.neutral.lightest,
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                  borderRadius: 8,
                  marginTop: 4,
                  maxHeight: 200,
                  zIndex: 1000,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 5,
                }}>
                  <FlatList
                    data={filteredSuppliers}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => selectSupplier(item.name)}
                        style={{
                          padding: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.neutral.light,
                        }}
                      >
                        <Text style={{ fontSize: 16, color: colors.neutral.darkest }}>
                          {item.name}
                        </Text>
                        {item.email && (
                          <Text style={{ fontSize: 12, color: colors.neutral.medium, marginTop: 2 }}>
                            {item.email}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>

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
