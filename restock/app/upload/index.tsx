import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import pickDocuments from '../../lib/utils/pickDocuments';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getUploadStyles } from '@styles/components/upload';

import {
  useSessionStore,
  useActiveSessions,
  useSessionHydrated
} from '../../store/useSessionStore';

import { useSupplierStore } from '../../store/useSupplierStore';
import { useProductsStore } from '../../store/useProductsStore';

import type { SessionItem } from '../../lib/helpers/storage/sessions';
import {
  safeString,
  ensureId
} from '../../lib/utils/normalise';
import { parseImages, type ParsedItem, type DocumentFile } from '../../lib/api/parseDoc';

export default function UploadScreen() {
  const styles = useThemedStyles(getUploadStyles);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // ---------------------------------------------------------------------------
  // Stores
  // ---------------------------------------------------------------------------
  const activeSessions = useActiveSessions();
  const isSessionHydrated = useSessionHydrated();

  const loadSessionsFromStorage = useSessionStore((s) => s.loadSessionsFromStorage);
  const addItemToSession = useSessionStore((s) => s.addItemToSession);
  const createSession = useSessionStore((s) => s.createSession);

  const addSupplier = useSupplierStore((s) => s.addSupplier);
  const getSupplierByName = useSupplierStore((s) => s.getSupplierByName);
  const loadSuppliers = useSupplierStore((s) => s.loadSuppliers);
  const suppliersHydrated = useSupplierStore((s) => s.isHydrated);

  const addOrUpdateProduct = useProductsStore((s) => s.addOrUpdateProduct);
  const loadProducts = useProductsStore((s) => s.loadProducts);
  const productsHydrated = useProductsStore((s) => s.isHydrated);

  // ---------------------------------------------------------------------------
  // Hydration
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSessionHydrated) loadSessionsFromStorage();
  }, [isSessionHydrated, loadSessionsFromStorage]);

  useEffect(() => {
    if (!suppliersHydrated) loadSuppliers();
  }, [suppliersHydrated, loadSuppliers]);

  useEffect(() => {
    if (!productsHydrated) loadProducts();
  }, [productsHydrated, loadProducts]);

  // ---------------------------------------------------------------------------
  // File picker - images only
  // ---------------------------------------------------------------------------
  const pickFile = async () => {
    const res = await pickDocuments({ multiple: false });
    if (res.canceled || res.assets.length === 0) return;

    const asset = res.assets[0];
    
    // Validate it's an image
    const mimeType = asset.mimeType || '';
    if (!mimeType.startsWith('image/')) {
      Alert.alert('Invalid file', 'Please select an image file (photo of your catalog).');
      return;
    }

    setFile(asset);
    setParsed([]);
    setSelectedItems(new Set());
    setParsingError(null);
  };

  // ---------------------------------------------------------------------------
  // Send image to backend for parsing
  // ---------------------------------------------------------------------------
  const sendForParsing = async () => {
    if (!file) return;

    setLoading(true);
    setParsingError(null);
    setLoadingMessage('Uploading image...');

    try {
      const imageFile: DocumentFile = {
        uri: file.uri,
        name: file.name || 'catalog.jpg',
        mimeType: file.mimeType || 'image/jpeg',
        size: file.size,
      };

      const result = await parseImages([imageFile], (message) => {
        setLoadingMessage(message);
      });

      if (!result.success) {
        setParsingError(result.error);
        return;
      }

      setParsed(result.items);
      setSelectedItems(new Set(result.items.map((x) => x.id)));
    } catch (e: any) {
      console.warn('parse-doc error', e);
      setParsingError(
        e instanceof Error ? e.message : 'Failed to parse image'
      );
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // ---------------------------------------------------------------------------
  // Import into session
  // ---------------------------------------------------------------------------
  const saveToSession = async () => {
    if (!isSessionHydrated) {
      Alert.alert('Please wait', 'Still loading sessions. Try again in a moment.');
      return;
    }

    const itemsToImport = parsed.filter((p) => selectedItems.has(p.id));

    if (itemsToImport.length === 0) {
      Alert.alert('Nothing selected', 'Select at least one item to import.');
      return;
    }

    let session =
      activeSessions.length > 0 ? activeSessions[0] : createSession();

    for (const p of itemsToImport) {
      const productNameRaw = safeString(p.product);
      const supplierNameRaw = safeString(p.supplier);

      let supplierId: string | undefined;

      if (supplierNameRaw) {
        const existing = getSupplierByName(supplierNameRaw);
        const supplier =
          existing ?? addSupplier(supplierNameRaw);

        supplierId = supplier.id;
      }

      // Update product history
      addOrUpdateProduct(productNameRaw, supplierId, 1);

      const sessionItem: SessionItem = {
        id: ensureId('item'),
        productName: productNameRaw,
        quantity: 1,
        supplierId
      };

      addItemToSession(session.id, sessionItem);
    }

    Alert.alert('Imported', `${itemsToImport.length} item(s) added.`, [
      {
        text: 'View Session',
        onPress: () => {
          // Replace upload screen so back button goes to previous screen (dashboard/sessions list)
          router.replace(`/sessions/${session.id}`);
        },
      },
    ]);
  };

  // ---------------------------------------------------------------------------
  // Toggle selection
  // ---------------------------------------------------------------------------
  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Render item for FlatList
  const renderItem = ({ item }: { item: ParsedItem }) => {
    const isSelected = selectedItems.has(item.id);
    return (
      <TouchableOpacity
        onPress={() => toggleItemSelection(item.id)}
        style={{
          padding: 12,
          marginBottom: 4,
          marginHorizontal: 16,
          borderRadius: 8,
          backgroundColor: isSelected ? '#E8F5E8' : '#fff',
          borderWidth: 1,
          borderColor: isSelected ? '#4CAF50' : '#ddd'
        }}
      >
        <Text style={{ fontWeight: '500' }}>{item.product}</Text>
        {!!item.supplier && (
          <Text style={{ color: '#666', fontSize: 13 }}>
            {item.supplier}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // If we have parsed items, show the selection view
  if (parsed.length > 0) {
    return (
      <SafeAreaView style={styles.sessionContainer}>
        {/* Sticky Header */}
        <View style={styles.stickyHeader}>
          <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.stickyHeaderTitle}>Upload Catalog</Text>
        </View>

        {/* Sticky Action Bar */}
        <View style={{ 
          backgroundColor: '#fff', 
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>
                {parsed.length} items found
              </Text>
              <Text style={{ fontSize: 14, color: '#6B7F6B', fontWeight: '500' }}>
                {selectedItems.size} selected
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            onPress={saveToSession}
            style={[styles.saveButton, { marginTop: 0 }]}
          >
            <Text style={styles.saveButtonText}>
              Import {selectedItems.size} item(s) to Session
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setSelectedItems(new Set(parsed.map(p => p.id)))}
              style={{ padding: 8 }}
            >
              <Text style={{ color: '#6B7F6B', fontWeight: '600' }}>Select All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSelectedItems(new Set())}
              style={{ padding: 8 }}
            >
              <Text style={{ color: '#666' }}>Deselect All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setFile(null);
                setParsed([]);
                setSelectedItems(new Set());
                setParsingError(null);
              }}
              style={{ padding: 8 }}
            >
              <Text style={{ color: '#CC0000' }}>Start Over</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Item List using FlatList for better performance */}
        <FlatList
          data={parsed}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={true}
        />
      </SafeAreaView>
    );
  }

  // Default view: file selection or parsing
  return (
    <SafeAreaView style={styles.sessionContainer}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Upload Catalog</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {!file && (
          <View>
            <TouchableOpacity onPress={pickFile} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Choose Image</Text>
            </TouchableOpacity>
            <Text style={{ color: '#666', marginTop: 12, textAlign: 'center', fontSize: 14 }}>
              Take a photo of your product catalog or order list
            </Text>
          </View>
        )}

        {file && (
          <View style={{ marginTop: 20 }}>
            <Text>{file.name}</Text>
            <TouchableOpacity
              onPress={sendForParsing}
              style={[styles.saveButton, { marginTop: 12 }]}
              disabled={loading}
            >
              {loading ? (
                <View style={{ alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" />
                  {loadingMessage && (
                    <Text style={{ color: '#fff', marginTop: 8, fontSize: 12 }}>
                      {loadingMessage}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.saveButtonText}>Parse</Text>
              )}
            </TouchableOpacity>

            {parsingError && (
              <Text style={{ color: 'red', marginTop: 8 }}>
                {parsingError}
              </Text>
            )}

            <TouchableOpacity
              onPress={() => {
                setFile(null);
                setParsingError(null);
              }}
              style={{ marginTop: 16, alignItems: 'center' }}
            >
              <Text style={{ color: '#666' }}>Choose different image</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
