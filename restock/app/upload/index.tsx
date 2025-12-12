import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import pickDocuments from '../../lib/utils/pickDocuments';
import { normalizeImage, cleanupNormalizedImage, isHeicFormat } from '../../lib/utils/normalizeImage';
// Camera capture - requires native rebuild after expo install
// import { captureFromCamera, cleanupCapturedImage } from '../../lib/utils/captureCamera';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import colors from '../../lib/theme/colors';

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
import { AlertModal } from '../../components/AlertModal';
import { useAlert } from '../../lib/hooks/useAlert';
import { 
  saveScanResults, 
  loadScanResults, 
  clearScanResults 
} from '../../lib/helpers/storage/scanResults';

export default function UploadScreen() {
  // Local state
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Preview & verification state
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);

  // Inline editing state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Map<string, Partial<ParsedItem>>>(new Map());

  // Manual item entry state
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualProduct, setManualProduct] = useState('');
  const [manualSupplier, setManualSupplier] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');

  // Session choice state
  const [showSessionChoice, setShowSessionChoice] = useState(false);

  const { alert, hideAlert, showError, showWarning, showSuccess, showAlert } = useAlert();

  // Stores
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

  // Hydration
  useEffect(() => {
    if (!isSessionHydrated) loadSessionsFromStorage();
  }, [isSessionHydrated, loadSessionsFromStorage]);

  useEffect(() => {
    if (!suppliersHydrated) loadSuppliers();
  }, [suppliersHydrated, loadSuppliers]);

  useEffect(() => {
    if (!productsHydrated) loadProducts();
  }, [productsHydrated, loadProducts]);

  // Load saved scan results on mount
  useEffect(() => {
    const restoreSavedResults = async () => {
      const saved = await loadScanResults();
      if (saved && saved.parsed.length > 0) {
        setParsed(saved.parsed);
        setSelectedItems(new Set(saved.selectedIds));
        setPreviewUri(saved.previewUri);
        setEditedValues(new Map(Object.entries(saved.editedValues)));
      }
    };
    restoreSavedResults();
  }, []);

  // Auto-save scan results when they change
  useEffect(() => {
    if (parsed.length > 0) {
      saveScanResults(
        parsed,
        Array.from(selectedItems),
        previewUri,
        editedValues
      );
    }
  }, [parsed, selectedItems, previewUri, editedValues]);

  // File picker - images only
  const pickFile = async () => {
    const res = await pickDocuments({ multiple: false });
    if (res.canceled || res.assets.length === 0) return;

    const asset = res.assets[0];
    
    const mimeType = asset.mimeType || '';
    if (!mimeType.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file (photo of your catalog).');
      return;
    }

    setFile(asset);
    setParsed([]);
    setSelectedItems(new Set());
    setParsingError(null);
  };

  // Camera capture - outputs JPEG directly, no HEIC issues
  // Note: Requires native rebuild after installing expo-image-picker
  const takePhoto = async () => {
    try {
      // Dynamically import to avoid crash if native module not linked
      const { captureFromCamera } = await import('../../lib/utils/captureCamera');
      
      const captured = await captureFromCamera(0.85);
      
      if (!captured) {
        // User cancelled
        return;
      }

      // Set as file with camera-captured info
      setFile({
        uri: captured.uri,
        name: captured.name,
        mimeType: captured.mimeType,
        size: 0, // Size not needed since it's already JPEG
        _isCameraCapture: true, // Flag to skip normalization
      });
      setParsed([]);
      setSelectedItems(new Set());
      setParsingError(null);
    } catch (err: any) {
      console.warn('Camera capture error:', err);
      
      // Check if it's a native module error
      if (err.message?.includes('native module') || err.message?.includes('ExponentImagePicker')) {
        showError(
          'Camera Not Available',
          'Camera feature requires rebuilding the app. Please restart the development server or rebuild the native app.\n\nFor now, use "Choose from Photos" instead.'
        );
      } else {
        showError(
          'Camera Error', 
          err.message || 'Failed to capture photo. Please check camera permissions.'
        );
      }
    }
  };

  // Send image to backend for parsing
  const sendForParsing = async () => {
    if (!file) return;

    setLoading(true);
    setParsingError(null);
    
    const fileName = file.name || 'catalog.jpg';
    const isHeic = isHeicFormat(fileName, file.mimeType);
    const isCameraCapture = file._isCameraCapture;
    
    // Show appropriate message
    if (isCameraCapture) {
      setLoadingMessage('Uploading photo...');
    } else {
      setLoadingMessage(isHeic ? 'Converting image format...' : 'Preparing image...');
    }

    try {
      let imageUri = file.uri;
      let imageName = fileName;
      let imageMimeType = file.mimeType || 'image/jpeg';

      // Skip normalization for camera captures (already JPEG)
      if (!isCameraCapture) {
        const normalized = await normalizeImage(file.uri, fileName);
        imageUri = normalized.uri;
        imageName = normalized.name;
        imageMimeType = normalized.mimeType;
      }
      
      // Store preview URI for verification
      setPreviewUri(imageUri);
      
      setLoadingMessage('Analyzing document...');

      const imageFile: DocumentFile = {
        uri: imageUri,
        name: imageName,
        mimeType: imageMimeType,
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
      setEditedValues(new Map());
      setEditingItemId(null);
    } catch (e: any) {
      console.warn('parse-doc error', e);
      
      let errorMessage = e instanceof Error ? e.message : 'Failed to parse image';
      
      if (isHeic && (errorMessage.includes('IIOCall') || errorMessage.includes('ImageIO') || errorMessage.includes('convert'))) {
        errorMessage = 'Could not convert this image format. Try using the camera instead, or use a JPEG/PNG image.';
      }
      
      setParsingError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  // Clear current selection
  const clearSelection = async () => {
    if (previewUri) {
      await cleanupNormalizedImage(previewUri);
    }
    await clearScanResults();
    setFile(null);
    setParsed([]);
    setSelectedItems(new Set());
    setParsingError(null);
    setPreviewUri(null);
    setEditedValues(new Map());
    setEditingItemId(null);
  };

  // Handle import button press
  const handleImportPress = () => {
    if (!isSessionHydrated) {
      showWarning('Please Wait', 'Still loading sessions. Try again in a moment.');
      return;
    }

    const itemsToImport = parsed.filter((p) => selectedItems.has(p.id));

    if (itemsToImport.length === 0) {
      showWarning('Nothing Selected', 'Select at least one item to import.');
      return;
    }

    if (activeSessions.length > 0) {
      setShowSessionChoice(true);
    } else {
      performImport(createSession());
    }
  };

  // Perform the actual import
  const performImport = async (session: ReturnType<typeof createSession>) => {
    setShowSessionChoice(false);
    
    const itemsToImport = parsed.filter((p) => selectedItems.has(p.id));

    for (const p of itemsToImport) {
      const productNameRaw = safeString(getItemValue(p, 'product') as string);
      const supplierNameRaw = safeString(getItemValue(p, 'supplier') as string);
      const editedQuantity = getItemValue(p, 'quantity') as number | undefined;

      let supplierId: string | undefined;

      if (supplierNameRaw) {
        const existing = getSupplierByName(supplierNameRaw);
        const supplier = existing ?? addSupplier(supplierNameRaw);
        supplierId = supplier.id;
      }

      const quantity = editedQuantity && editedQuantity > 0 ? editedQuantity : 1;

      addOrUpdateProduct(productNameRaw, supplierId, quantity);

      const sessionItem: SessionItem = {
        id: ensureId('item'),
        productName: productNameRaw,
        quantity,
        supplierId
      };

      addItemToSession(session.id, sessionItem);
    }

    showAlert('success', 'Items Imported', `${itemsToImport.length} item(s) added to session.`, [
      {
        text: 'View Session',
        onPress: async () => {
          if (previewUri) {
            await cleanupNormalizedImage(previewUri);
          }
          await clearScanResults();
          router.replace(`/sessions/${session.id}`);
        },
      },
    ]);
  };

  // Toggle selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Get display value for an item
  const getItemValue = (item: ParsedItem, field: keyof ParsedItem) => {
    const edited = editedValues.get(item.id);
    if (edited && field in edited) {
      return edited[field];
    }
    return item[field];
  };

  // Update edited value
  const updateEditedValue = (itemId: string, field: keyof ParsedItem, value: any) => {
    setEditedValues((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId) || {};
      next.set(itemId, { ...existing, [field]: value });
      return next;
    });
  };

  // Add manual item
  const addManualItem = () => {
    if (!manualProduct.trim()) {
      showWarning('Missing Product', 'Please enter a product name.');
      return;
    }

    const newItem: ParsedItem = {
      id: `manual-${Date.now()}`,
      product: manualProduct.trim(),
      supplier: manualSupplier.trim(),
      quantity: manualQuantity ? parseInt(manualQuantity) || undefined : undefined,
    };

    setParsed((prev) => [...prev, newItem]);
    setSelectedItems((prev) => new Set([...prev, newItem.id]));

    setManualProduct('');
    setManualSupplier('');
    setManualQuantity('');
    setShowAddManual(false);
  };

  // Delete an item
  const deleteItem = (itemId: string) => {
    setParsed((prev) => prev.filter((p) => p.id !== itemId));
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
    setEditedValues((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  // Render item for FlatList
  const renderItem = ({ item }: { item: ParsedItem }) => {
    const isSelected = selectedItems.has(item.id);
    const isEditing = editingItemId === item.id;
    const hasEdits = editedValues.has(item.id);
    const isManual = item.id.startsWith('manual-');

    const displayProduct = getItemValue(item, 'product') as string;
    const displaySupplier = getItemValue(item, 'supplier') as string;
    const displayQuantity = getItemValue(item, 'quantity') as number | undefined;

    if (isEditing) {
      return (
        <View style={{
          backgroundColor: colors.cypress.pale,
          paddingVertical: 16,
          paddingHorizontal: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 4,
              height: 16,
              backgroundColor: colors.cypress.deep,
              borderRadius: 2,
              marginRight: 8,
            }} />
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              color: colors.cypress.deep,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              Editing Item
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '600',
              color: colors.neutral.dark,
              marginBottom: 4,
              letterSpacing: 0.5,
            }}>
              Product Name
            </Text>
            <TextInput
              value={displayProduct}
              onChangeText={(text) => updateEditedValue(item.id, 'product', text)}
              placeholder="Product name"
              placeholderTextColor={colors.neutral.medium}
              style={{
                backgroundColor: colors.neutral.lightest,
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: colors.neutral.darkest,
                borderWidth: 1,
                borderColor: colors.neutral.light,
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: colors.neutral.dark,
                marginBottom: 4,
                letterSpacing: 0.5,
              }}>
                Supplier
              </Text>
              <TextInput
                value={displaySupplier}
                onChangeText={(text) => updateEditedValue(item.id, 'supplier', text)}
                placeholder="Supplier"
                placeholderTextColor={colors.neutral.medium}
                style={{
                  backgroundColor: colors.neutral.lightest,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                }}
              />
            </View>
            <View style={{ width: 80 }}>
              <Text style={{
                fontSize: 11,
                fontWeight: '600',
                color: colors.neutral.dark,
                marginBottom: 4,
                letterSpacing: 0.5,
              }}>
                Qty
              </Text>
              <TextInput
                value={displayQuantity ? String(displayQuantity) : ''}
                onChangeText={(text) => updateEditedValue(item.id, 'quantity', text ? parseInt(text) || undefined : undefined)}
                placeholder="0"
                placeholderTextColor={colors.neutral.medium}
                keyboardType="numeric"
                style={{
                  backgroundColor: colors.neutral.lightest,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  textAlign: 'center',
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                }}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 16,
                backgroundColor: '#FEE2E2',
                borderRadius: 8,
              }}
            >
              <Text style={{ color: colors.status.error, fontWeight: '600', fontSize: 14 }}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditingItemId(null)}
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: colors.brand.primary,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onPress={() => toggleItemSelection(item.id)}
        onLongPress={() => setEditingItemId(item.id)}
        style={{
          backgroundColor: colors.neutral.lightest,
          paddingVertical: 14,
          paddingLeft: 16,
          paddingRight: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        activeOpacity={0.7}
      >
        <View style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: isSelected ? colors.brand.primary : colors.neutral.light,
          backgroundColor: isSelected ? colors.brand.primary : 'transparent',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          {isSelected && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>

        <View style={{ flex: 1, marginRight: 8 }}>
          <Text 
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.neutral.darkest,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {displayProduct}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            {displaySupplier ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="business-outline" size={12} color={colors.neutral.medium} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, color: colors.neutral.medium }} numberOfLines={1}>
                  {displaySupplier}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 13, color: colors.neutral.light, fontStyle: 'italic' }}>
                No supplier
              </Text>
            )}
            {displayQuantity && displayQuantity > 0 && (
              <View style={{
                backgroundColor: colors.cypress.pale,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
                marginLeft: 8,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.cypress.deep }}>
                  ×{displayQuantity}
                </Text>
              </View>
            )}
            {(hasEdits || isManual) && (
              <View style={{
                backgroundColor: isManual ? colors.analytics.olive + '20' : colors.status.warning + '20',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
                marginLeft: 8,
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: isManual ? colors.analytics.olive : colors.status.warning,
                }}>
                  {isManual ? 'MANUAL' : 'EDITED'}
                </Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setEditingItemId(item.id)}
          style={{
            padding: 10,
            backgroundColor: colors.cypress.pale,
            borderRadius: 8,
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={16} color={colors.cypress.deep} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // ========================================
  // RESULTS VIEW - Show parsed items
  // ========================================
  if (parsed.length > 0) {
    const allSelected = selectedItems.size === parsed.length;
    
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
          }}>Scan Results</Text>
          
          {previewUri && (
            <TouchableOpacity 
              onPress={() => setShowFullPreview(true)}
              style={{
                padding: 8,
                backgroundColor: colors.cypress.pale,
                borderRadius: 8,
              }}
            >
              <Ionicons name="image-outline" size={20} color={colors.cypress.deep} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={true}
        >
          {/* Summary Section */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.brand.primary,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="list-outline" size={16} color={colors.brand.primary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.brand.primary,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Extracted Items
                </Text>
              </View>
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
                  {selectedItems.size}/{parsed.length}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Toolbar */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 8,
          }}>
            <TouchableOpacity
              onPress={() => {
                if (allSelected) {
                  setSelectedItems(new Set());
                } else {
                  setSelectedItems(new Set(parsed.map(p => p.id)));
                }
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: colors.neutral.lightest,
                borderWidth: 1,
                borderColor: colors.neutral.light,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name={allSelected ? "checkbox" : "square-outline"} 
                size={16} 
                color={colors.brand.primary} 
                style={{ marginRight: 6 }} 
              />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.neutral.darkest }}>
                {allSelected ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowAddManual(true)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: colors.cypress.pale,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="add" size={16} color={colors.cypress.deep} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.cypress.deep }}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearSelection}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: '#FEE2E2',
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="close" size={16} color={colors.status.error} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.status.error }}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Items List */}
          <View style={{
            backgroundColor: colors.neutral.lightest,
            marginHorizontal: 16,
            borderRadius: 12,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: colors.neutral.light,
          }}>
            <FlatList
              data={parsed}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => (
                <View style={{ height: 1, backgroundColor: colors.neutral.light, marginHorizontal: 16 }} />
              )}
            />
          </View>

          {/* Tip */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <View style={{
              backgroundColor: colors.analytics.clay + '20',
              borderRadius: 8,
              padding: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="bulb-outline" size={16} color={colors.analytics.olive} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: colors.analytics.olive, flex: 1 }}>
                Long-press any item to edit details
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom CTA */}
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
            onPress={handleImportPress}
            disabled={selectedItems.size === 0}
            style={{
              backgroundColor: selectedItems.size === 0 ? colors.neutral.light : colors.brand.primary,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="download-outline" 
              size={20} 
              color={selectedItems.size === 0 ? colors.neutral.medium : '#fff'} 
              style={{ marginRight: 8 }} 
            />
            <Text style={{
              color: selectedItems.size === 0 ? colors.neutral.medium : '#fff',
              fontSize: 17,
              fontWeight: '700',
            }}>
              Import {selectedItems.size} {selectedItems.size === 1 ? 'Item' : 'Items'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <AlertModal
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          actions={alert.actions}
          onClose={hideAlert}
        />

        {/* Full Screen Image Preview */}
        <Modal
          visible={showFullPreview}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowFullPreview(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              paddingTop: 50,
              paddingHorizontal: 16,
              paddingBottom: 12,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' }}>
                Pinch to zoom
              </Text>
              <TouchableOpacity
                onPress={() => setShowFullPreview(false)}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 20,
                  padding: 8,
                }}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {previewUri && (
              <ScrollView
                style={{ flex: 1, marginTop: 90 }}
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                maximumZoomScale={5}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bouncesZoom={true}
                centerContent={true}
              >
                <Image
                  source={{ uri: previewUri }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT - 150 }}
                  contentFit="contain"
                />
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* Add Manual Item Modal */}
        <Modal
          visible={showAddManual}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddManual(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
              activeOpacity={1}
              onPress={() => setShowAddManual(false)}
            />
            <View style={{
              backgroundColor: colors.neutral.lightest,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            }}>
              <View style={{
                width: 36,
                height: 4,
                backgroundColor: colors.neutral.light,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }} />

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.neutral.darkest,
                }}>
                  Add Item Manually
                </Text>
                <TouchableOpacity onPress={() => setShowAddManual(false)} style={{ padding: 4 }}>
                  <Ionicons name="close" size={22} color={colors.neutral.medium} />
                </TouchableOpacity>
              </View>

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
                  value={manualProduct}
                  onChangeText={setManualProduct}
                  placeholder="Enter product name"
                  placeholderTextColor={colors.neutral.medium}
                  autoFocus
                  style={{
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 8,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.neutral.darkest,
                    borderWidth: 1,
                    borderColor: colors.neutral.light,
                  }}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.neutral.dark,
                    marginBottom: 6,
                    letterSpacing: 0.5,
                  }}>
                    Supplier
                  </Text>
                  <TextInput
                    value={manualSupplier}
                    onChangeText={setManualSupplier}
                    placeholder="Optional"
                    placeholderTextColor={colors.neutral.medium}
                    style={{
                      backgroundColor: colors.neutral.lighter,
                      borderRadius: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: colors.neutral.darkest,
                      borderWidth: 1,
                      borderColor: colors.neutral.light,
                    }}
                  />
                </View>
                <View style={{ width: 80 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.neutral.dark,
                    marginBottom: 6,
                    letterSpacing: 0.5,
                  }}>
                    Qty
                  </Text>
                  <TextInput
                    value={manualQuantity}
                    onChangeText={setManualQuantity}
                    placeholder="1"
                    placeholderTextColor={colors.neutral.medium}
                    keyboardType="numeric"
                    style={{
                      backgroundColor: colors.neutral.lighter,
                      borderRadius: 8,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      fontSize: 16,
                      color: colors.neutral.darkest,
                      textAlign: 'center',
                      borderWidth: 1,
                      borderColor: colors.neutral.light,
                    }}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={addManualItem}
                disabled={!manualProduct.trim()}
                style={{
                  backgroundColor: manualProduct.trim() ? colors.brand.primary : colors.neutral.light,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{
                  color: manualProduct.trim() ? '#fff' : colors.neutral.medium,
                  fontSize: 17,
                  fontWeight: '700',
                }}>
                  Add Item
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Session Choice Modal */}
        <Modal
          visible={showSessionChoice}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowSessionChoice(false)}
        >
          <TouchableOpacity
            style={{ 
              flex: 1, 
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 24,
            }}
            activeOpacity={1}
            onPress={() => setShowSessionChoice(false)}
          >
            <View style={{
              backgroundColor: colors.neutral.lightest,
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 340,
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.neutral.darkest,
                textAlign: 'center',
                marginBottom: 8,
              }}>
                Import to Session
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.neutral.medium,
                textAlign: 'center',
                marginBottom: 24,
              }}>
                Where would you like to add these items?
              </Text>

              {activeSessions.length > 0 && (
                <TouchableOpacity
                  onPress={() => performImport(activeSessions[0])}
                  style={{
                    backgroundColor: colors.brand.primary,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: '700',
                    }}>
                      Add to Current Session
                    </Text>
                    <Text style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 12,
                      marginTop: 2,
                    }}>
                      {activeSessions[0].items?.length || 0} items already
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => performImport(createSession())}
                style={{
                  backgroundColor: colors.neutral.lighter,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="document-outline" size={18} color={colors.neutral.darkest} style={{ marginRight: 8 }} />
                <Text style={{
                  color: colors.neutral.darkest,
                  fontSize: 15,
                  fontWeight: '600',
                }}>
                  Create New Session
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowSessionChoice(false)}
                style={{ paddingVertical: 14, marginTop: 8 }}
              >
                <Text style={{
                  color: colors.neutral.medium,
                  fontSize: 15,
                  fontWeight: '500',
                  textAlign: 'center',
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // ========================================
  // UPLOAD VIEW - Initial state
  // ========================================
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
        }}>Upload Catalog</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {!file ? (
          <>
            {/* Capture Section */}
            <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.brand.primary,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="camera-outline" size={16} color={colors.brand.primary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.brand.primary,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Capture Document
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.neutral.lightest,
              marginHorizontal: 16,
              borderRadius: 12,
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.neutral.light,
            }}>
              <View style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.cypress.pale,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <Ionicons name="camera" size={32} color={colors.cypress.deep} />
              </View>

              <Text style={{
                fontSize: 17,
                fontWeight: '700',
                color: colors.neutral.darkest,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                Take a Photo
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.neutral.medium,
                textAlign: 'center',
                marginBottom: 20,
                paddingHorizontal: 8,
              }}>
                Use your camera to capture a stock report or product list. Best quality and no format issues.
              </Text>

              <TouchableOpacity 
                onPress={takePhoto} 
                style={{
                  backgroundColor: colors.brand.primary,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  Open Camera
                </Text>
              </TouchableOpacity>
            </View>

            {/* Or Divider */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginHorizontal: 16,
              marginVertical: 20,
            }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.neutral.light }} />
              <Text style={{ 
                paddingHorizontal: 16, 
                fontSize: 13, 
                color: colors.neutral.medium,
                fontWeight: '600',
              }}>
                OR
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.neutral.light }} />
            </View>

            {/* Upload Section */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.cypress.deep,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="folder-open-outline" size={16} color={colors.cypress.deep} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.cypress.deep,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Choose from Photos
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.neutral.lightest,
              marginHorizontal: 16,
              borderRadius: 12,
              padding: 20,
              borderWidth: 2,
              borderColor: colors.neutral.light,
              borderStyle: 'dashed',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.cypress.pale,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 16,
                }}>
                  <Ionicons name="images" size={24} color={colors.cypress.deep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.neutral.darkest,
                    marginBottom: 4,
                  }}>
                    Select from Library
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.neutral.medium,
                  }}>
                    JPEG, PNG, or HEIC images
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={pickFile} 
                  style={{
                    backgroundColor: colors.cypress.pale,
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{
                    color: colors.cypress.deep,
                    fontSize: 14,
                    fontWeight: '700',
                  }}>
                    Browse
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tips Section */}
            <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.neutral.medium,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="bulb-outline" size={16} color={colors.neutral.medium} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.neutral.medium,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Tips for Best Results
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.neutral.lightest,
              marginHorizontal: 16,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.neutral.light,
            }}>
              {[
                { icon: 'sunny-outline', text: 'Use good lighting to avoid shadows' },
                { icon: 'scan-outline', text: 'Keep the document flat and aligned' },
                { icon: 'text-outline', text: 'Ensure all text is clearly readable' },
              ].map((tip, index) => (
                <View key={index}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                  }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.analytics.clay + '30',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Ionicons name={tip.icon as any} size={16} color={colors.analytics.olive} />
                    </View>
                    <Text style={{
                      fontSize: 14,
                      color: colors.neutral.dark,
                      flex: 1,
                    }}>
                      {tip.text}
                    </Text>
                  </View>
                  {index < 2 && (
                    <View style={{
                      height: 1,
                      backgroundColor: colors.neutral.light,
                      marginHorizontal: 16,
                    }} />
                  )}
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Selected File Section */}
            <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.brand.primary,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="document-outline" size={16} color={colors.brand.primary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.brand.primary,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Selected File
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.neutral.lightest,
              marginHorizontal: 16,
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.neutral.light,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: colors.cypress.pale,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}>
                  <Ionicons name="image" size={24} color={colors.cypress.deep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.neutral.darkest,
                    marginBottom: 2,
                  }} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: colors.neutral.medium,
                  }}>
                    Ready to analyze
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={clearSelection}
                  style={{
                    padding: 10,
                    backgroundColor: '#FEE2E2',
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.status.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Actions Section */}
            <View style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.cypress.deep,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="sparkles-outline" size={16} color={colors.cypress.deep} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.cypress.deep,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Actions
                </Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 16 }}>
              <TouchableOpacity
                onPress={sendForParsing}
                style={{
                  backgroundColor: colors.brand.primary,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  opacity: loading ? 0.7 : 1,
                }}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" style={{ marginRight: 12 }} />
                    <Text style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: '600',
                    }}>
                      {loadingMessage || 'Processing...'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: '700',
                    }}>
                      Analyze Document
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearSelection}
                style={{
                  backgroundColor: colors.neutral.lightest,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  marginTop: 12,
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                }}
              >
                <Text style={{
                  color: colors.neutral.dark,
                  fontSize: 15,
                  fontWeight: '600',
                }}>
                  Choose Different File
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Display */}
            {parsingError && (
              <View style={{
                marginHorizontal: 16,
                marginTop: 16,
                backgroundColor: '#FEE2E2',
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.status.error + '40',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <Ionicons name="alert-circle" size={20} color={colors.status.error} style={{ marginRight: 10, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.status.error,
                      marginBottom: 4,
                    }}>
                      Analysis Failed
                    </Text>
                    <Text style={{
                      color: colors.status.error,
                      fontSize: 13,
                      lineHeight: 18,
                    }}>
                      {parsingError}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Alert Modal */}
      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        actions={alert.actions}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}
