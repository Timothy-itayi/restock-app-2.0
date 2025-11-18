import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import pickDocuments from '../../lib/utils/pickDocuments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getUploadStyles } from '@styles/components/upload';
import { useSessionStore, useActiveSession, useSessionHydrated } from '../../store/useSessionStore';
import type { SessionItem } from '../../lib/helpers/storage/sessions';

type ParsedItem = {
  id: string;
  supplier: string;
  product: string;
};

export default function UploadScreen() {
  const styles = useThemedStyles(getUploadStyles);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [supplierMap, setSupplierMap] = useState<Record<string, string>>({});
  
  const activeSession = useActiveSession();
  const isHydrated = useSessionHydrated();
  const loadSessionsFromStorage = useSessionStore((state) => state.loadSessionsFromStorage);
  const createSession = useSessionStore((state) => state.createSession);
  const addItemToSession = useSessionStore((state) => state.addItemToSession);

  // Ensure store is hydrated
  useEffect(() => {
    if (!isHydrated) {
      loadSessionsFromStorage();
    }
  }, [isHydrated, loadSessionsFromStorage]);

  // Ensure we have an active session
  useEffect(() => {
    if (isHydrated && !activeSession) {
      createSession();
    }
  }, [isHydrated, activeSession, createSession]);

  const pickFile = async () => {
    const res = await pickDocuments({ multiple: false });

    if (res.canceled || res.assets.length === 0) return;

    setFile(res.assets[0]);
    setParsed([]);
    setSelectedItems(new Set());
    setSupplierMap({});
    setParsingError(null);
  };

  const sendForParsing = async () => {
    if (!file) return;

    setLoading(true);
    setParsingError(null);
    setParsed([]);
    setSelectedItems(new Set());
    setSupplierMap({});

    try {
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream'
      } as any);

      const r = await fetch('https://your-backend-url/parse-doc', {
        method: 'POST',
        body: form,
      });

      if (!r.ok) {
        const errorText = await r.text();
        throw new Error(`Parse request failed: ${r.status} ${errorText}`);
      }

      const data = await r.json();
      
      // Validate response structure
      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from server');
      }

      if (data.items.length === 0) {
        setParsingError('No items found in document. Please check if the document contains product information.');
        setLoading(false);
        return;
      }

      // Add unique IDs to items if not present
      const itemsWithIds = data.items.map((it: ParsedItem, index: number) => ({
        ...it,
        id: it.id || `${Date.now()}-${index}`
      }));

      setParsed(itemsWithIds);
      
      // Select all items by default
      setSelectedItems(new Set(itemsWithIds.map((it: ParsedItem) => it.id)));

      // Pre-fill emails if supplier seen before
      const stored = await AsyncStorage.getItem('suppliers');
      if (stored) {
        const known = JSON.parse(stored);
        const map: Record<string, string> = {};

        itemsWithIds.forEach((it: ParsedItem) => {
          if (known[it.supplier]) {
            map[it.supplier] = known[it.supplier].email;
          }
        });

        setSupplierMap(map);
      }

    } catch (e: any) {
      console.error('Parse error:', e);
      const errorMessage = e.message || 'Failed to parse document';
      
      // Check for specific error types
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setParsingError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('Invalid response') || errorMessage.includes('format')) {
        setParsingError('The document format is not supported or the file is corrupted. Please try a different file.');
      } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        setParsingError('Parse service not available. Please check your backend configuration.');
      } else {
        setParsingError('Failed to parse document. The file may be corrupted or in an unsupported format.');
      }
      
      Alert.alert('Parse Error', errorMessage);
    }

    setLoading(false);
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleAllItems = () => {
    if (selectedItems.size === parsed.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(parsed.map(p => p.id)));
    }
  };

  const saveToSession = async () => {
    if (!parsed.length || selectedItems.size === 0) {
      Alert.alert('No Items Selected', 'Please select at least one item to import.');
      return;
    }

    // Get selected items
    const itemsToImport = parsed.filter(p => selectedItems.has(p.id));
    
    // Get unique suppliers from selected items
    const selectedSuppliers = new Set(itemsToImport.map(p => p.supplier));
    
    // Validate supplier emails for selected items only
    const missingSuppliers: string[] = [];
    selectedSuppliers.forEach(supplier => {
      if (!supplierMap[supplier] || !supplierMap[supplier].trim()) {
        missingSuppliers.push(supplier);
      }
    });

    if (missingSuppliers.length > 0) {
      Alert.alert(
        'Missing Supplier Emails',
        `Please enter email addresses for: ${missingSuppliers.join(', ')}`
      );
      return;
    }

    // Get or create active session
    let currentSession = activeSession;
    if (!currentSession) {
      currentSession = createSession();
    }

    // Convert selected parsed items to SessionItems and add to session
    itemsToImport.forEach(p => {
      const sessionItem: SessionItem = {
        id: `${Date.now()}-${Math.random()}`,
        productName: p.product,
        quantity: 1, // Default quantity, can be adjusted later
        supplierName: p.supplier
      };
      addItemToSession(currentSession.id, sessionItem);
    });

    // Permanently store known suppliers (only for selected items' suppliers)
    const stored = await AsyncStorage.getItem('suppliers');
    const suppliers = stored ? JSON.parse(stored) : {};
    selectedSuppliers.forEach(s => {
      if (supplierMap[s]) {
        suppliers[s] = { email: supplierMap[s] };
      }
    });
    await AsyncStorage.setItem('suppliers', JSON.stringify(suppliers));

    Alert.alert('Imported', `${itemsToImport.length} item(s) added to your session`);
    setFile(null);
    setParsed([]);
    setSelectedItems(new Set());
    setSupplierMap({});
    setParsingError(null);
  };

  // UI
  return (
    <SafeAreaView style={styles.sessionContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.sessionSelectionTitle}>
          Upload Catalog
        </Text>
      </View>

      <View style={{ padding: 16 }}>
        {!file && (
          <TouchableOpacity
            onPress={pickFile}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Choose File</Text>
          </TouchableOpacity>
        )}

        {file && !parsed.length && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionSubtitle}>Selected: {file.name}</Text>

            <TouchableOpacity
              onPress={sendForParsing}
              disabled={loading}
              style={[styles.saveButton, { opacity: loading ? 0.6 : 1, marginTop: 12 }]}
            >
              {loading ?
                <ActivityIndicator color="#fff" /> :
                <Text style={styles.saveButtonText}>Parse Document</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFile(null)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Remove File</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Parsing error */}
        {parsingError && (
          <View style={[styles.formCard, { marginTop: 20, backgroundColor: '#FFF3CD', borderColor: '#FFC107' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="warning" size={16} color="#856404" />
              <Text style={{ color: '#856404', fontSize: 14, fontWeight: '600', marginLeft: 6 }}>
                Error
              </Text>
            </View>
            <Text style={{ color: '#856404', fontSize: 14 }}>{parsingError}</Text>
            <TouchableOpacity
              onPress={() => setParsingError(null)}
              style={{ marginTop: 12, alignSelf: 'flex-end' }}
            >
              <Text style={{ color: '#856404', fontSize: 12, textDecorationLine: 'underline' }}>
                Dismiss
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Parsed results */}
        {parsed.length > 0 && (
          <ScrollView style={{ flex: 1, marginTop: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.productListTitle}>
                Select Items ({selectedItems.size} of {parsed.length})
              </Text>
              <TouchableOpacity
                onPress={toggleAllItems}
                style={{ padding: 8 }}
              >
                <Text style={{ color: '#6B7F6B', fontSize: 14, fontWeight: '600' }}>
                  {selectedItems.size === parsed.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
            </View>

            {Array.from(new Set(parsed.map(p => p.supplier))).map(supplier => {
              const supplierItems = parsed.filter(p => p.supplier === supplier);
              const selectedCount = supplierItems.filter(p => selectedItems.has(p.id)).length;
              const allSelected = selectedCount === supplierItems.length;

              return (
                <View key={supplier} style={[styles.formCard, { marginBottom: 12 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.productListTitle, { flex: 1 }]}>{supplier}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        supplierItems.forEach(item => {
                          if (allSelected) {
                            setSelectedItems(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(item.id);
                              return newSet;
                            });
                          } else {
                            setSelectedItems(prev => new Set(prev).add(item.id));
                          }
                        });
                      }}
                      style={{ padding: 4 }}
                    >
                      <Text style={{ color: '#6B7F6B', fontSize: 12 }}>
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    placeholder="Supplier email *"
                    value={supplierMap[supplier] || ''}
                    onChangeText={v => setSupplierMap(prev => ({ ...prev, [supplier]: v }))}
                    style={[
                      styles.textInput,
                      { marginBottom: 12 },
                      !supplierMap[supplier]?.trim() && selectedCount > 0 && { borderColor: '#FFC107' }
                    ]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  {supplierItems.map(item => {
                    const isSelected = selectedItems.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => toggleItemSelection(item.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 8,
                          paddingHorizontal: 8,
                          backgroundColor: isSelected ? '#F0F8F0' : 'transparent',
                          borderRadius: 6,
                          marginBottom: 4
                        }}
                      >
                        <Ionicons
                          name={isSelected ? 'checkbox' : 'checkbox-outline'}
                          size={20}
                          color={isSelected ? '#6B7F6B' : '#999'}
                          style={{ marginRight: 8 }}
                        />
                        <Text style={[styles.sectionSubtitle, { flex: 1, textAlign: 'left' }]}>
                          {item.product}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            <TouchableOpacity
              onPress={saveToSession}
              disabled={selectedItems.size === 0}
              style={[
                styles.saveButton,
                { marginTop: 20, marginBottom: 20 },
                selectedItems.size === 0 && { opacity: 0.5 }
              ]}
            >
              <Text style={styles.saveButtonText}>
                Import {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''} to Session
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

