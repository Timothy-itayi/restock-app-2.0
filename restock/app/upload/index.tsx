import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView
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
  normalizeSupplierName,
  normalizeProductName,
  safeString,
  ensureId
} from '../../lib/utils/normalise';

type ParsedItem = {
  id: string;
  supplier: string;
  product: string;
};

const PARSE_DOC_URL = 'https://your-backend-url/parse-doc'; // TODO: env/config

export default function UploadScreen() {
  const styles = useThemedStyles(getUploadStyles);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
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
  // File picker
  // ---------------------------------------------------------------------------
  const pickFile = async () => {
    const res = await pickDocuments({ multiple: false });
    if (res.canceled || res.assets.length === 0) return;

    setFile(res.assets[0]);
    setParsed([]);
    setSelectedItems(new Set());
    setParsingError(null);
  };

  // ---------------------------------------------------------------------------
  // Send file to backend for parsing
  // ---------------------------------------------------------------------------
  const sendForParsing = async () => {
    if (!file) return;

    setLoading(true);
    setParsingError(null);

    try {
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream'
      } as any);

      const response = await fetch(PARSE_DOC_URL, {
        method: 'POST',
        body: form
      });

      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }

      let data: any;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid server response');
      }

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid parse format');
      }

      const itemsWithIds: ParsedItem[] = data.items
        .map((raw: any, i: number) => {
          const product = safeString(raw.product);
          const supplier = safeString(raw.supplier);

          // Ignore lines with no product name
          if (!product) return null;

          return {
            id: raw.id || ensureId('parsed'),
            product,
            supplier
          };
        })
        .filter(Boolean) as ParsedItem[];

      if (itemsWithIds.length === 0) {
        throw new Error('No items found in document');
      }

      setParsed(itemsWithIds);
      setSelectedItems(new Set(itemsWithIds.map((x) => x.id)));
    } catch (e: any) {
      console.warn('parse-doc error', e);
      setParsingError(
        e instanceof Error ? e.message : 'Failed to parse document'
      );
    } finally {
      setLoading(false);
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

    Alert.alert('Imported', `${itemsToImport.length} item(s) added.`);
    router.push(`/sessions/${session.id}`);
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
  return (
    <SafeAreaView style={styles.sessionContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.sessionSelectionTitle}>Upload Catalog</Text>
      </View>

      <View style={{ padding: 16 }}>
        {!file && (
          <TouchableOpacity onPress={pickFile} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Choose File</Text>
          </TouchableOpacity>
        )}

        {file && !parsed.length && (
          <View style={{ marginTop: 20 }}>
            <Text>{file.name}</Text>
            <TouchableOpacity
              onPress={sendForParsing}
              style={[styles.saveButton, { marginTop: 12 }]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Parse</Text>
              )}
            </TouchableOpacity>

            {parsingError && (
              <Text style={{ color: 'red', marginTop: 8 }}>
                {parsingError}
              </Text>
            )}
          </View>
        )}

        {parsed.length > 0 && (
          <ScrollView style={{ marginTop: 16 }}>
            {parsed.map((item) => {
              const isSelected = selectedItems.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleItemSelection(item.id)}
                  style={{
                    padding: 12,
                    marginBottom: 4,
                    borderRadius: 8,
                    backgroundColor: isSelected ? '#E8F5E8' : '#fff',
                    borderWidth: 1,
                    borderColor: '#ddd'
                  }}
                >
                  <Text>{item.product}</Text>
                  {!!item.supplier && (
                    <Text style={{ color: '#666', fontSize: 13 }}>
                      {item.supplier}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              onPress={saveToSession}
              style={[styles.saveButton, { marginTop: 20 }]}
            >
              <Text style={styles.saveButtonText}>
                Import {selectedItems.size} item(s)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
