import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import pickDocuments from '../../lib/utils/pickDocuments';
import { normalizeImage, cleanupNormalizedImage } from '../../lib/utils/normalizeImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
import { useThemedStyles } from '@styles/useThemedStyles';
import { getUploadStyles } from '@styles/components/upload';
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
  const styles = useThemedStyles(getUploadStyles);

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

  // Send image to backend for parsing
  const sendForParsing = async () => {
    if (!file) return;

    setLoading(true);
    setParsingError(null);
    setLoadingMessage('Preparing image...');

    try {
      // Normalize image format (handles HEIC, WebP, etc. → JPEG)
      const normalized = await normalizeImage(file.uri, file.name || 'catalog.jpg');
      
      // Store preview URI for verification
      setPreviewUri(normalized.uri);
      
      setLoadingMessage('Uploading image...');

      const imageFile: DocumentFile = {
        uri: normalized.uri,
        name: normalized.name,
        mimeType: normalized.mimeType, // Always 'image/jpeg' now
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
      // Clear any previous edits when re-parsing
      setEditedValues(new Map());
      setEditingItemId(null);
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

  // Handle import button press - show choice if active session exists
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

    // If there's an active session, show choice modal
    if (activeSessions.length > 0) {
      setShowSessionChoice(true);
    } else {
      // No active session, create new one directly
      performImport(createSession());
    }
  };

  // Perform the actual import to a specific session
  const performImport = async (session: ReturnType<typeof createSession>) => {
    setShowSessionChoice(false);
    
    const itemsToImport = parsed.filter((p) => selectedItems.has(p.id));

    for (const p of itemsToImport) {
      // Use edited values if available, otherwise use original
      const productNameRaw = safeString(getItemValue(p, 'product') as string);
      const supplierNameRaw = safeString(getItemValue(p, 'supplier') as string);
      const editedQuantity = getItemValue(p, 'quantity') as number | undefined;

      let supplierId: string | undefined;

      if (supplierNameRaw) {
        const existing = getSupplierByName(supplierNameRaw);
        const supplier =
          existing ?? addSupplier(supplierNameRaw);

        supplierId = supplier.id;
      }

      // Use edited/parsed quantity, default to 1 if not extracted
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
          // Cleanup persisted image and saved results before navigating away
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

  // Get display value for an item (edited or original)
  const getItemValue = (item: ParsedItem, field: keyof ParsedItem) => {
    const edited = editedValues.get(item.id);
    if (edited && field in edited) {
      return edited[field];
    }
    return item[field];
  };

  // Update edited value for an item
  const updateEditedValue = (itemId: string, field: keyof ParsedItem, value: any) => {
    setEditedValues((prev) => {
      const next = new Map(prev);
      const existing = next.get(itemId) || {};
      next.set(itemId, { ...existing, [field]: value });
      return next;
    });
  };

  // Cancel editing an item
  const cancelEditing = (itemId: string) => {
    setEditingItemId(null);
    // Optionally remove edits: setEditedValues(prev => { const next = new Map(prev); next.delete(itemId); return next; });
  };

  // Add manual item to parsed list
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

    // Reset form
    setManualProduct('');
    setManualSupplier('');
    setManualQuantity('');
    setShowAddManual(false);
  };

  // Delete an item from parsed list
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

  // Render item for FlatList - Clean, minimal Mobbin-style cards
  const renderItem = ({ item }: { item: ParsedItem }) => {
    const isSelected = selectedItems.has(item.id);
    const isEditing = editingItemId === item.id;
    const hasEdits = editedValues.has(item.id);
    const isManual = item.id.startsWith('manual-');

    // Get display values (edited or original)
    const displayProduct = getItemValue(item, 'product') as string;
    const displaySupplier = getItemValue(item, 'supplier') as string;
    const displayQuantity = getItemValue(item, 'quantity') as number | undefined;

    // Editing mode - cleaner inline form
    if (isEditing) {
      return (
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.brand.primary,
        }}>
          {/* Product Name */}
          <TextInput
            value={displayProduct}
            onChangeText={(text) => updateEditedValue(item.id, 'product', text)}
            placeholder="Product name"
            placeholderTextColor={colors.neutral.medium}
            style={{
              backgroundColor: colors.neutral.lighter,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.neutral.darkest,
              marginBottom: 10,
            }}
          />

          {/* Supplier & Quantity row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
            <TextInput
              value={displaySupplier}
              onChangeText={(text) => updateEditedValue(item.id, 'supplier', text)}
              placeholder="Supplier"
              placeholderTextColor={colors.neutral.medium}
              style={{
                flex: 1,
                backgroundColor: colors.neutral.lighter,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 15,
                color: colors.neutral.darkest,
              }}
            />
            <TextInput
              value={displayQuantity ? String(displayQuantity) : ''}
              onChangeText={(text) => updateEditedValue(item.id, 'quantity', text ? parseInt(text) || undefined : undefined)}
              placeholder="Qty"
              placeholderTextColor={colors.neutral.medium}
              keyboardType="numeric"
              style={{
                width: 70,
                backgroundColor: colors.neutral.lighter,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                fontSize: 15,
                color: colors.neutral.darkest,
                textAlign: 'center',
              }}
            />
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => deleteItem(item.id)}
              style={{ padding: 8 }}
            >
              <Text style={{ color: colors.status.error, fontSize: 14, fontWeight: '500' }}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditingItemId(null)}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 20,
                backgroundColor: colors.brand.primary,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Normal display mode - clean two-line card
    return (
      <TouchableOpacity
        onPress={() => toggleItemSelection(item.id)}
        onLongPress={() => setEditingItemId(item.id)}
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          paddingVertical: 14,
          paddingLeft: 14,
          paddingRight: 10,
          flexDirection: 'row',
          alignItems: 'center',
        }}
        activeOpacity={0.7}
      >
        {/* Checkbox - minimal circle style */}
        <View style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1.5,
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

        {/* Content - two line structure */}
        <View style={{ flex: 1, marginRight: 8 }}>
          {/* Line 1: Product name */}
          <Text 
            style={{
              fontSize: 15,
              fontWeight: '500',
              color: colors.neutral.darkest,
              marginBottom: 3,
            }}
            numberOfLines={1}
          >
            {displayProduct}
          </Text>
          
          {/* Line 2: Supplier + Qty */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {displaySupplier ? (
              <Text style={{ fontSize: 13, color: colors.neutral.medium }} numberOfLines={1}>
                {displaySupplier}
              </Text>
            ) : (
              <Text style={{ fontSize: 13, color: colors.neutral.light, fontStyle: 'italic' }}>
                No supplier
              </Text>
            )}
            {displayQuantity && displayQuantity > 0 && (
              <Text style={{ fontSize: 13, color: colors.neutral.medium }}>
                {' '} · Qty: {displayQuantity}
              </Text>
            )}
            {/* Badges inline */}
            {(hasEdits || isManual) && (
              <View style={{
                backgroundColor: isManual ? colors.analytics.olive + '15' : colors.status.warning + '15',
                paddingHorizontal: 5,
                paddingVertical: 1,
                borderRadius: 3,
                marginLeft: 6,
              }}>
                <Text style={{
                  fontSize: 9,
                  fontWeight: '600',
                  color: isManual ? colors.analytics.olive : colors.status.warning,
                }}>
                  {isManual ? 'Added' : 'Edited'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Edit button - subtle */}
        <TouchableOpacity
          onPress={() => setEditingItemId(item.id)}
          style={{ padding: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={16} color={colors.neutral.light} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // If we have parsed items, show the selection view
  if (parsed.length > 0) {
    const allSelected = selectedItems.size === parsed.length;
    
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAF9' }} edges={['top']}>
        {/* Clean Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: '#FAFAF9',
          borderBottomWidth: 0.5,
          borderBottomColor: colors.neutral.light,
        }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ padding: 4, marginRight: 12 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
          </TouchableOpacity>
          <Text style={{
            fontSize: 17,
            fontWeight: '600',
            color: colors.neutral.darkest,
            flex: 1,
          }}>Scan Results</Text>
          
          {/* View Image button in header */}
          {previewUri && (
            <TouchableOpacity 
              onPress={() => setShowFullPreview(true)}
              style={{ padding: 6 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="image-outline" size={22} color={colors.neutral.dark} />
            </TouchableOpacity>
          )}
        </View>

        {/* Compact Summary Bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FAFAF9',
          borderBottomWidth: 0.5,
          borderBottomColor: colors.neutral.light,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.neutral.darkest,
            }}>
              {parsed.length} items
            </Text>
            <Text style={{
              fontSize: 15,
              color: colors.neutral.medium,
              marginLeft: 6,
            }}>
              • {allSelected ? 'All selected' : `${selectedItems.size} selected`}
            </Text>
          </View>
          
          {/* Manage selection toggle */}
          <TouchableOpacity
            onPress={() => {
              if (allSelected) {
                setSelectedItems(new Set());
              } else {
                setSelectedItems(new Set(parsed.map(p => p.id)));
              }
            }}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 6,
              backgroundColor: colors.neutral.lighter,
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: '600',
              color: colors.brand.primary,
            }}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Compact Icon Toolbar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingHorizontal: 12,
          paddingVertical: 8,
          backgroundColor: '#FAFAF9',
          gap: 4,
        }}>
          <TouchableOpacity
            onPress={() => setShowAddManual(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.neutral.lighter,
            }}
          >
            <Ionicons name="add" size={18} color={colors.neutral.darkest} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.neutral.darkest, marginLeft: 4 }}>Add</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={sendForParsing}
            disabled={loading}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.neutral.lighter,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.neutral.darkest} />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color={colors.neutral.darkest} />
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.neutral.darkest, marginLeft: 4 }}>Re-scan</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              // Cleanup persisted image and saved results
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
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: colors.neutral.lighter,
            }}
          >
            <Ionicons name="close" size={16} color={colors.neutral.dark} />
            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.neutral.dark, marginLeft: 4 }}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Item List - Primary focus, takes remaining space */}
        <FlatList
          data={parsed}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={true}
          style={{ flex: 1, backgroundColor: '#FAFAF9' }}
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingTop: 8,
            paddingBottom: 100, // Space for sticky CTA
          }}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: colors.neutral.light, marginVertical: 1 }} />
          )}
        />

        {/* Sticky Bottom CTA */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FAFAF9',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 34 : 16,
          borderTopWidth: 0.5,
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
            <Text style={{
              color: selectedItems.size === 0 ? colors.neutral.medium : '#fff',
              fontSize: 17,
              fontWeight: '600',
            }}>
              Import {selectedItems.size} {selectedItems.size === 1 ? 'Item' : 'Items'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Alert Modal */}
        <AlertModal
          visible={alert.visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          actions={alert.actions}
          onClose={hideAlert}
        />

        {/* Full Screen Image Preview Modal with Zoom */}
        <Modal
          visible={showFullPreview}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowFullPreview(false)}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.95)',
          }}>
            {/* Header with close button */}
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
                Pinch to zoom • Double-tap to reset
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
            
            {/* Zoomable Image */}
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
                  style={{ 
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT - 150,
                  }}
                  contentFit="contain"
                />
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* Add Manual Item Modal - Clean bottom sheet */}
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
              backgroundColor: '#fff',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            }}>
              {/* Handle bar */}
              <View style={{
                width: 36,
                height: 4,
                backgroundColor: colors.neutral.light,
                borderRadius: 2,
                alignSelf: 'center',
                marginBottom: 16,
              }} />

              {/* Header */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 17,
                  fontWeight: '600',
                  color: colors.neutral.darkest,
                }}>
                  Add Item
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddManual(false);
                    setManualProduct('');
                    setManualSupplier('');
                    setManualQuantity('');
                  }}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={22} color={colors.neutral.medium} />
                </TouchableOpacity>
              </View>

              {/* Product Name */}
              <TextInput
                value={manualProduct}
                onChangeText={setManualProduct}
                placeholder="Product name"
                placeholderTextColor={colors.neutral.medium}
                autoFocus
                style={{
                  backgroundColor: colors.neutral.lighter,
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  marginBottom: 12,
                }}
              />

              {/* Supplier & Quantity row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <TextInput
                  value={manualSupplier}
                  onChangeText={setManualSupplier}
                  placeholder="Supplier"
                  placeholderTextColor={colors.neutral.medium}
                  style={{
                    flex: 1,
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.neutral.darkest,
                  }}
                />
                <TextInput
                  value={manualQuantity}
                  onChangeText={setManualQuantity}
                  placeholder="Qty"
                  placeholderTextColor={colors.neutral.medium}
                  keyboardType="numeric"
                  style={{
                    width: 80,
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    fontSize: 16,
                    color: colors.neutral.darkest,
                    textAlign: 'center',
                  }}
                />
              </View>

              {/* Add Button */}
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
                  fontWeight: '600',
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
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 340,
            }}>
              {/* Header */}
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
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
                You have an active session. Where would you like to add these items?
              </Text>

              {/* Add to existing session */}
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
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: '600',
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

              {/* Create new session */}
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

              {/* Cancel */}
              <TouchableOpacity
                onPress={() => setShowSessionChoice(false)}
                style={{
                  paddingVertical: 14,
                  marginTop: 8,
                }}
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

  // Default view: file selection or parsing
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
        style={{ flex: 1 }} 
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {!file && (
          <>
            {/* Beta Notice */}
            <View style={{
              backgroundColor: colors.status.warning + '20',
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.status.warning + '40',
            }}>
              <Ionicons name="flask-outline" size={20} color={colors.status.warning} style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '700',
                  color: colors.neutral.darkest,
                  marginBottom: 2,
                }}>
                  Beta Testing
                </Text>
                <Text style={{
                  fontSize: 12,
                  color: colors.neutral.dark,
                  lineHeight: 16,
                }}>
                  Help us test the AI parsing! Upload an image of your Stock Item Sales Report and let us know if items are extracted correctly.
                </Text>
              </View>
            </View>

            {/* Upload Section */}
            <View style={{ paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.brand.primary,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="image-outline" size={16} color={colors.brand.primary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.brand.primary,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Upload Image
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.neutral.lightest,
              borderRadius: 12,
              padding: 24,
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.neutral.light,
              borderStyle: 'dashed',
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
                <Ionicons name="document-text-outline" size={32} color={colors.cypress.deep} />
              </View>

              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.neutral.darkest,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                Select Image from Device
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.neutral.medium,
                textAlign: 'center',
                marginBottom: 6,
                paddingHorizontal: 8,
              }}>
                Choose an image of your product list, order sheet, or catalog from your photo library.
              </Text>

              <Text style={{
                fontSize: 12,
                color: colors.neutral.medium,
                textAlign: 'center',
                marginBottom: 20,
                fontStyle: 'italic',
              }}>
                Camera capture coming soon
              </Text>

              <TouchableOpacity 
                onPress={pickFile} 
                style={{
                  backgroundColor: colors.brand.primary,
                  paddingVertical: 14,
                  paddingHorizontal: 32,
                  borderRadius: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="folder-open-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: '700',
                }}>
                  Choose from Photos
                </Text>
              </TouchableOpacity>
            </View>

            {/* What We're Testing Section */}
            <View style={{ paddingTop: 24, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.analytics.olive,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.analytics.olive} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.analytics.olive,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  What We're Testing
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.neutral.lightest,
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.neutral.light,
            }}>
              {[
                { icon: 'eye-outline', text: 'Does the AI correctly read product names?' },
                { icon: 'business-outline', text: 'Are supplier names detected accurately?' },
                { icon: 'calculator-outline', text: 'Are quantities extracted correctly?' },
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

            {/* Image Tips */}
            <View style={{ paddingTop: 20, paddingBottom: 12 }}>
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
                  For Best Results
                </Text>
              </View>
            </View>

            <View style={{
              backgroundColor: colors.neutral.lightest,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.neutral.light,
            }}>
              <Text style={{
                fontSize: 13,
                color: colors.neutral.dark,
                lineHeight: 20,
              }}>
                Use clear, well-lit images where text is readable. The AI works best with typed/printed text rather than handwriting.
              </Text>
            </View>
          </>
        )}

        {file && (
          <>
            {/* Selected File Section */}
            <View style={{ paddingBottom: 12 }}>
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
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.neutral.light,
              marginBottom: 16,
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
                    Ready to parse
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setFile(null);
                    setParsingError(null);
                  }}
                  style={{
                    padding: 8,
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.neutral.dark} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Parse Button */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" style={{ marginRight: 12 }} />
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600',
                  }}>
                    {loadingMessage || 'Processing...'}
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons name="scan-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '700',
                  }}>
                    Parse Image
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Error */}
            {parsingError && (
              <View style={{
                backgroundColor: colors.status.error + '15',
                borderRadius: 8,
                padding: 12,
                marginTop: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Ionicons name="alert-circle" size={20} color={colors.status.error} style={{ marginRight: 8 }} />
                <Text style={{
                  color: colors.status.error,
                  fontSize: 14,
                  flex: 1,
                }}>
                  {parsingError}
                </Text>
              </View>
            )}

            {/* Choose Different */}
            <TouchableOpacity
              onPress={() => {
                setFile(null);
                setParsingError(null);
              }}
              style={{
                paddingVertical: 16,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Text style={{
                color: colors.neutral.medium,
                fontSize: 14,
                fontWeight: '500',
              }}>
                Choose different image
              </Text>
            </TouchableOpacity>
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
