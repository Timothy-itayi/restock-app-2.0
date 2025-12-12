import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionHydrated, useSessionStore } from '../../../../store/useSessionStore';
import { useSupplierStore } from '../../../../store/useSupplierStore';
import colors from '../../../../lib/theme/colors';
import type { SessionItem } from '../../../../lib/helpers/storage/sessions';

type EditableItem = {
  id: string;
  productName: string;
  supplierName: string;
  quantity: number;
  supplierId?: string;
};

export default function EditAllProductsScreen() {
  const styles = useThemedStyles(getSessionsStyles);

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const loadSessionsFromStorage = useSessionStore((s) => s.loadSessionsFromStorage);
  const isHydrated = useSessionHydrated();

  const session = useSessionStore((s) => (id ? s.getSession(id) : undefined));
  const updateItem = useSessionStore((s) => s.updateItemInSession);
  const removeItem = useSessionStore((s) => s.removeItemFromSession);

  const suppliers = useSupplierStore((s) => s.suppliers);
  const getSupplierByName = useSupplierStore((s) => s.getSupplierByName);
  const addSupplier = useSupplierStore((s) => s.addSupplier);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const isSupplierHydrated = useSupplierStore((s) => s.isHydrated);

  // Local state for edits
  const [editedItems, setEditedItems] = useState<Record<string, EditableItem>>({});
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!isHydrated) loadSessionsFromStorage();
    if (!isSupplierHydrated) loadSuppliers();
  }, [isHydrated, isSupplierHydrated, loadSessionsFromStorage, loadSuppliers]);

  // Initialize edited items from session
  useEffect(() => {
    if (session?.items) {
      const initial: Record<string, EditableItem> = {};
      session.items.forEach((item) => {
        const supplierObj = item.supplierId 
          ? suppliers.find(s => s.id === item.supplierId)
          : null;
        initial[item.id] = {
          id: item.id,
          productName: item.productName,
          supplierName: supplierObj?.name || '',
          quantity: item.quantity || 1,
          supplierId: item.supplierId,
        };
      });
      setEditedItems(initial);
    }
  }, [session?.items, suppliers]);

  // Guard: missing route params
  if (!id) {
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

  const updateLocalItem = (itemId: string, updates: Partial<EditableItem>) => {
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...updates },
    }));
  };

  const incrementQty = (itemId: string) => {
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: (prev[itemId]?.quantity || 1) + 1 },
    }));
  };

  const decrementQty = (itemId: string) => {
    setEditedItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], quantity: Math.max(0, (prev[itemId]?.quantity || 1) - 1) },
    }));
  };

  const deleteItem = (itemId: string) => {
    removeItem(id, itemId);
  };

  const saveAllChanges = () => {
    // Save all edited items back to the store
    Object.entries(editedItems).forEach(([itemId, item]) => {
      // If quantity is 0, remove the item instead of updating it
      if (item.quantity === 0) {
        removeItem(id, itemId);
        return;
      }

      const supplierNameTrimmed = item.supplierName?.trim() || '';
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

      updateItem(id, itemId, {
        productName: item.productName,
        supplierName: supplierNameTrimmed || undefined,
        supplierId,
        quantity: item.quantity,
      });
    });

    router.back();
  };

  const renderItem = ({ item }: { item: SessionItem }) => {
    const edited = editedItems[item.id];
    const isExpanded = expandedItemId === item.id;

    if (!edited) return null;

    return (
      <View style={{
        backgroundColor: colors.neutral.lightest,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: isExpanded ? colors.brand.primary : colors.neutral.light,
        overflow: 'hidden',
      }}>
        {/* Collapsed View - tap to expand */}
        <TouchableOpacity
          onPress={() => setExpandedItemId(isExpanded ? null : item.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.neutral.darkest,
              marginBottom: 4,
            }} numberOfLines={1}>
              {edited.productName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {edited.supplierName ? (
                <Text style={{ fontSize: 13, color: colors.neutral.medium }}>
                  {edited.supplierName}
                </Text>
              ) : (
                <Text style={{ fontSize: 13, color: colors.neutral.light, fontStyle: 'italic' }}>
                  No supplier
                </Text>
              )}
              <View style={{
                backgroundColor: edited.quantity === 0 ? colors.neutral.light : colors.cypress.pale,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                marginLeft: 8,
              }}>
                <Text style={{ 
                  fontSize: 12, 
                  fontWeight: '700', 
                  color: edited.quantity === 0 ? colors.neutral.medium : colors.cypress.deep 
                }}>
                  ×{edited.quantity}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.neutral.medium} 
          />
        </TouchableOpacity>

        {/* Expanded Edit Form */}
        {isExpanded && (
          <View style={{
            padding: 16,
            paddingTop: 0,
            borderTopWidth: 1,
            borderTopColor: colors.neutral.light,
          }}>
            {/* Product Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.neutral.dark,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}>
                Product Name
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.neutral.lighter,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                }}
                value={edited.productName}
                onChangeText={(text) => updateLocalItem(item.id, { productName: text })}
                placeholder="Product name"
                placeholderTextColor={colors.neutral.medium}
              />
            </View>

            {/* Supplier */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.neutral.dark,
                marginBottom: 6,
                letterSpacing: 0.5,
              }}>
                Supplier (optional)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.neutral.lighter,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                }}
                value={edited.supplierName}
                onChangeText={(text) => updateLocalItem(item.id, { supplierName: text })}
                placeholder="Supplier name"
                placeholderTextColor={colors.neutral.medium}
              />
            </View>

            {/* Quantity */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: colors.neutral.dark,
                letterSpacing: 0.5,
                marginBottom: 6,
              }}>
                Quantity
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => decrementQty(item.id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: colors.neutral.light,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="remove" size={18} color={colors.neutral.darkest} />
                </TouchableOpacity>

                <TextInput
                  value={String(edited.quantity)}
                  onChangeText={(text) => {
                    const num = parseInt(text) || 0;
                    updateLocalItem(item.id, { quantity: Math.max(0, num) });
                  }}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    fontSize: 18,
                    fontWeight: '600',
                    color: edited.quantity === 0 ? colors.neutral.medium : colors.neutral.darkest,
                    textAlign: 'center',
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 8,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: colors.neutral.light,
                  }}
                />

                <TouchableOpacity
                  onPress={() => incrementQty(item.id)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: colors.brand.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 12,
                marginTop: 16,
                backgroundColor: '#FEE2E2',
                borderRadius: 8,
              }}
            >
              <Ionicons name="trash-outline" size={18} color={colors.status.error} style={{ marginRight: 6 }} />
              <Text style={{ color: colors.status.error, fontWeight: '600', fontSize: 14 }}>
                Remove Item
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.lighter }}>
      {/* Sticky Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.neutral.lighter,
        borderBottomWidth: 1,
        borderBottomColor: colors.neutral.light,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.neutral.darkest,
          flex: 1,
        }}>Edit Products</Text>
        <View style={{
          backgroundColor: colors.cypress.pale,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '700',
            color: colors.cypress.deep,
          }}>
            {session.items.length}
          </Text>
        </View>
      </View>

      {/* Tip */}
      <View style={{
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        backgroundColor: colors.analytics.clay + '20',
        borderRadius: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Ionicons name="bulb-outline" size={16} color={colors.analytics.olive} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 12, color: colors.analytics.olive, flex: 1 }}>
          Tap any item to expand and edit details
        </Text>
      </View>

      {/* Items List */}
      <FlatList
        data={session.items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={true}
      />

      {/* Save All Button */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.neutral.lighter,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: colors.neutral.light,
      }}>
        <TouchableOpacity
          onPress={saveAllChanges}
          style={{
            backgroundColor: colors.brand.primary,
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={{
            color: '#fff',
            fontSize: 17,
            fontWeight: '700',
          }}>
            Save All Changes
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

