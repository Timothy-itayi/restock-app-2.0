import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionHydrated, useSessionStore } from '../../../../store/useSessionStore';
import { useSupplierStore } from '../../../../store/useSupplierStore';
import colors from '../../../../lib/theme/colors';

export default function EditProductScreen() {
  const styles = useThemedStyles(getSessionsStyles);

  // IMPORTANT: params can be string | string[] at runtime
  const params = useLocalSearchParams<{ id?: string | string[]; itemId?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const itemIdRaw = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  const loadSessionsFromStorage = useSessionStore((s) => s.loadSessionsFromStorage);
  const isHydrated = useSessionHydrated();

  const session = useSessionStore((s) => (id ? s.getSession(id) : undefined));
  const updateItem = useSessionStore((s) => s.updateItemInSession);

  const suppliers = useSupplierStore((s) => s.suppliers);
  const getSupplierByName = useSupplierStore((s) => s.getSupplierByName);
  const addSupplier = useSupplierStore((s) => s.addSupplier);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const isSupplierHydrated = useSupplierStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) loadSessionsFromStorage();
    if (!isSupplierHydrated) loadSuppliers();
  }, [isHydrated, isSupplierHydrated, loadSessionsFromStorage, loadSuppliers]);

  // Guard: missing route params
  if (!id || !itemIdRaw) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyStateText}>Missing route params.</Text>
      </SafeAreaView>
    );
  }

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

  // FIX: normalize and compare as strings to avoid type mismatch (number vs string, etc.)
  const item = session.items.find((i) => String(i.id) === String(itemIdRaw));

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyStateText}>Item not found.</Text>
      </SafeAreaView>
    );
  }

  const [name, setName] = useState(item.productName);
  const [supplier, setSupplier] = useState(item.supplierName || '');
  const [qty, setQty] = useState(item.quantity);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const supplierInputRef = useRef<TextInput>(null);

  const filteredSuppliers = useMemo(() => {
    if (!supplier.trim() || !suppliers.length) return [];
    const q = supplier.toLowerCase();
    return suppliers.filter((s) => s.name.toLowerCase().includes(q));
  }, [supplier, suppliers]);

  const increment = () => setQty((q) => q + 1);
  const decrement = () => setQty((q) => Math.max(1, q - 1));

  const selectSupplier = (supplierName: string) => {
    setSupplier(supplierName);
    setShowSuggestions(false);
    supplierInputRef.current?.blur();
  };

  const saveChanges = () => {
    const supplierNameTrimmed = supplier?.trim() || '';
    let supplierId: string | undefined;

    if (supplierNameTrimmed) {
      try {
        const existing = getSupplierByName(supplierNameTrimmed);
        const supplierObj = existing ?? addSupplier(supplierNameTrimmed);
        supplierId = supplierObj.id;
      } catch (error) {
        console.warn('Error accessing supplier store:', error);
      }
    }

    updateItem(id, String(itemIdRaw), {
      productName: name,
      supplierName: supplierNameTrimmed || undefined,
      supplierId,
      quantity: qty,
    });

    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.stickyHeaderTitle}>Edit Product</Text>
        </View>

        <ScrollView
          style={styles.contentContainer}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          {/* PRODUCT NAME */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 }}>
            Product Name
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Product Name"
          />

          {/* SUPPLIER NAME */}
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#333',
              marginBottom: 8,
              marginTop: 16,
            }}
          >
            Supplier (optional)
          </Text>
          <View style={{ position: 'relative', zIndex: 1 }}>
            <TextInput
              ref={supplierInputRef}
              style={styles.input}
              value={supplier}
              onChangeText={(text) => {
                setSupplier(text);
                if (text.trim() && filteredSuppliers.length > 0) setShowSuggestions(true);
                else setShowSuggestions(false);
              }}
              onFocus={() => {
                if (supplier.trim() && filteredSuppliers.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              placeholder="Enter supplier name"
            />

            {showSuggestions && filteredSuppliers.length > 0 && (
              <View
                style={{
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
                  overflow: 'hidden',
                }}
              >
                {filteredSuppliers.slice(0, 5).map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => selectSupplier(s.name)}
                    style={({ pressed }) => ({
                      padding: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.neutral.light,
                      backgroundColor: pressed ? colors.neutral.light : 'transparent',
                    })}
                  >
                    <Text style={{ fontSize: 16, color: colors.neutral.darkest }}>{s.name}</Text>
                    {s.email && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: colors.neutral.medium,
                          marginTop: 2,
                        }}
                      >
                        {s.email}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

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
                marginRight: 12,
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
                marginLeft: 12,
              }}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* SAVE BUTTON */}
          <TouchableOpacity style={[styles.primaryButton, { marginTop: 30 }]} onPress={saveChanges}>
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
