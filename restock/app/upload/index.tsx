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
import { safeString, ensureId } from '../../lib/utils/normalise';
import { parseImages, type ParsedItem, type DocumentFile } from '../../lib/api/parseDoc';
import { AlertModal } from '../../components/AlertModal';
import { useAlert } from '../../lib/hooks/useAlert';
import { saveScanResults, loadScanResults, clearScanResults } from '../../lib/helpers/storage/scanResults';

export default function UploadScreen() {
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Map<string, Partial<ParsedItem>>>(new Map());
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualProduct, setManualProduct] = useState('');
  const [manualSupplier, setManualSupplier] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');
  const [showSessionChoice, setShowSessionChoice] = useState(false);

  const { alert, hideAlert, showError, showWarning, showAlert } = useAlert();

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

  useEffect(() => {
    if (!isSessionHydrated) loadSessionsFromStorage();
  }, [isSessionHydrated, loadSessionsFromStorage]);

  useEffect(() => {
    if (!suppliersHydrated) loadSuppliers();
  }, [suppliersHydrated, loadSuppliers]);

  useEffect(() => {
    if (!productsHydrated) loadProducts();
  }, [productsHydrated, loadProducts]);

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

  useEffect(() => {
    if (parsed.length > 0) {
      saveScanResults(parsed, Array.from(selectedItems), previewUri, editedValues);
    }
  }, [parsed, selectedItems, previewUri, editedValues]);

  const pickFile = async () => {
    const res = await pickDocuments({ multiple: false });
    if (res.canceled || res.assets.length === 0) return;
    const asset = res.assets[0];
    if (!asset.mimeType?.startsWith('image/')) {
      showError('Invalid File', 'Please select an image file.');
      return;
    }
    setFile(asset);
    setParsed([]);
    setSelectedItems(new Set());
    setParsingError(null);
  };

  const takePhoto = async () => {
    try {
      const { captureFromCamera } = await import('../../lib/utils/captureCamera');
      const captured = await captureFromCamera(0.85);
      if (!captured) return;
      setFile({
        uri: captured.uri,
        name: captured.name,
        mimeType: captured.mimeType,
        size: 0,
        _isCameraCapture: true,
      });
      setParsed([]);
      setSelectedItems(new Set());
      setParsingError(null);
    } catch (err: any) {
      if (err.message?.includes('native module') || err.message?.includes('ExponentImagePicker')) {
        showError('Camera Not Available', 'Camera requires rebuilding the app. Use "Choose Photo" for now.');
      } else {
        showError('Camera Error', err.message || 'Failed to capture photo.');
      }
    }
  };

  const sendForParsing = async () => {
    if (!file) return;
    setLoading(true);
    setParsingError(null);
    const fileName = file.name || 'catalog.jpg';
    const isHeic = isHeicFormat(fileName, file.mimeType);
    const isCameraCapture = file._isCameraCapture;
    setLoadingMessage(isCameraCapture ? 'Uploading...' : isHeic ? 'Converting...' : 'Preparing...');

    try {
      let imageUri = file.uri;
      let imageName = fileName;
      let imageMimeType = file.mimeType || 'image/jpeg';

      if (!isCameraCapture) {
        const normalized = await normalizeImage(file.uri, fileName);
        imageUri = normalized.uri;
        imageName = normalized.name;
        imageMimeType = normalized.mimeType;
      }
      setPreviewUri(imageUri);
      setLoadingMessage('Analyzing...');

      const imageFile: DocumentFile = { uri: imageUri, name: imageName, mimeType: imageMimeType, size: file.size };
      const result = await parseImages([imageFile], (message) => setLoadingMessage(message));

      if (!result.success) {
        setParsingError(result.error);
        return;
      }
      setParsed(result.items);
      setSelectedItems(new Set(result.items.map((x) => x.id)));
      setEditedValues(new Map());
      setEditingItemId(null);
    } catch (e: any) {
      let errorMessage = e instanceof Error ? e.message : 'Failed to parse image';
      if (isHeic && (errorMessage.includes('IIOCall') || errorMessage.includes('ImageIO'))) {
        errorMessage = 'Could not convert image. Try using the camera or a JPEG/PNG.';
      }
      setParsingError(errorMessage);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  const clearSelection = async () => {
    if (previewUri) await cleanupNormalizedImage(previewUri);
    await clearScanResults();
    setFile(null);
    setParsed([]);
    setSelectedItems(new Set());
    setParsingError(null);
    setPreviewUri(null);
    setEditedValues(new Map());
    setEditingItemId(null);
  };

  const handleImportPress = () => {
    if (!isSessionHydrated) {
      showWarning('Loading', 'Still loading sessions...');
      return;
    }
    const itemsToImport = parsed.filter((p) => selectedItems.has(p.id));
    if (itemsToImport.length === 0) {
      showWarning('Nothing Selected', 'Select at least one item.');
      return;
    }
    if (activeSessions.length > 0) setShowSessionChoice(true);
    else performImport(createSession());
  };

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
      const sessionItem: SessionItem = { id: ensureId('item'), productName: productNameRaw, quantity, supplierId };
      addItemToSession(session.id, sessionItem);
    }

    showAlert('success', 'Imported', `${itemsToImport.length} item(s) added.`, [
      {
        text: 'View Session',
        onPress: async () => {
          if (previewUri) await cleanupNormalizedImage(previewUri);
          await clearScanResults();
          router.replace(`/sessions/${session.id}`);
        },
      },
    ]);
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getItemValue = (item: ParsedItem, field: keyof ParsedItem) => {
    const edited = editedValues.get(item.id);
    if (edited && field in edited) return edited[field];
    return item[field];
  };

  const updateEditedValue = (itemId: string, field: keyof ParsedItem, value: any) => {
    setEditedValues((prev) => {
      const next = new Map(prev);
      next.set(itemId, { ...next.get(itemId), [field]: value });
      return next;
    });
  };

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

  const deleteItem = (itemId: string) => {
    setParsed((prev) => prev.filter((p) => p.id !== itemId));
    setSelectedItems((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
    setEditedValues((prev) => { const next = new Map(prev); next.delete(itemId); return next; });
    if (editingItemId === itemId) setEditingItemId(null);
  };

  // =============================================
  // RESULTS VIEW
  // =============================================
  if (parsed.length > 0) {
    const allSelected = selectedItems.size === parsed.length;

    const renderItem = ({ item }: { item: ParsedItem }) => {
      const isSelected = selectedItems.has(item.id);
      const isEditing = editingItemId === item.id;
      const displayProduct = getItemValue(item, 'product') as string;
      const displaySupplier = getItemValue(item, 'supplier') as string;
      const displayQuantity = getItemValue(item, 'quantity') as number | undefined;

      if (isEditing) {
        return (
          <View style={{ backgroundColor: colors.cypress.pale, padding: 16, marginBottom: 1 }}>
            <TextInput
              value={displayProduct}
              onChangeText={(t) => updateEditedValue(item.id, 'product', t)}
              placeholder="Product"
              placeholderTextColor={colors.neutral.medium}
              style={{
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                color: colors.neutral.darkest,
                marginBottom: 10,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={displaySupplier}
                onChangeText={(t) => updateEditedValue(item.id, 'supplier', t)}
                placeholder="Supplier"
                placeholderTextColor={colors.neutral.medium}
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.neutral.darkest,
                }}
              />
              <TextInput
                value={displayQuantity ? String(displayQuantity) : ''}
                onChangeText={(t) => updateEditedValue(item.id, 'quantity', t ? parseInt(t) || undefined : undefined)}
                placeholder="Qty"
                keyboardType="numeric"
                placeholderTextColor={colors.neutral.medium}
                style={{
                  width: 60,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: colors.neutral.darkest,
                  textAlign: 'center',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => deleteItem(item.id)}
                style={{ paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fecaca', borderRadius: 8 }}
              >
                <Text style={{ color: colors.status.error, fontWeight: '600', fontSize: 14 }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEditingItemId(null)}
                style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.cypress.deep, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // Split product into brand and name (e.g., "Loco Love - Twin Caramel" → ["Loco Love", "Twin Caramel"])
      const productParts = displayProduct.split(' - ');
      const productBrand = productParts.length > 1 ? productParts[0].trim() : null;
      const productName = productParts.length > 1 ? productParts.slice(1).join(' - ').trim() : displayProduct;

      return (
        <TouchableOpacity
          onPress={() => toggleItemSelection(item.id)}
          onLongPress={() => setEditingItemId(item.id)}
          style={{
            backgroundColor: '#fff',
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 1,
          }}
          activeOpacity={0.7}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: isSelected ? colors.brand.primary : '#D1D5DB',
            backgroundColor: isSelected ? colors.brand.primary : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
          </View>
          <View style={{ flex: 1 }}>
            {/* META: Supplier - tiny label, feels like metadata */}
            {displaySupplier ? (
              <Text style={{ 
                fontSize: 10, 
                fontWeight: '500', 
                color: '#9AA3A0', 
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 1,
              }} numberOfLines={1}>
                {displaySupplier}
              </Text>
            ) : null}
            {/* SECONDARY: Brand - calm, olive, recedes */}
            {productBrand ? (
              <Text style={{ 
                fontSize: 12, 
                fontWeight: '400', 
                color: '#6E7B67',
                marginBottom: 1,
              }} numberOfLines={1}>
                {productBrand}
              </Text>
            ) : null}
            {/* PRIMARY: Product name - the only thing that pops */}
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '700', 
              color: '#1F2A24',
            }} numberOfLines={1}>
              {productName}
            </Text>
          </View>
          {displayQuantity && displayQuantity > 0 && (
            <View style={{ backgroundColor: colors.cypress.pale, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 5, marginLeft: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.cypress.deep }}>×{displayQuantity}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.lighter }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
          <TouchableOpacity 
            onPress={clearSelection} 
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.neutral.medium} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.neutral.darkest, marginLeft: 12 }}>
            Results
          </Text>
          {/* View uploaded image */}
          {previewUri && (
            <TouchableOpacity
              onPress={() => setShowFullPreview(true)}
              style={{ 
                paddingHorizontal: 10, 
                paddingVertical: 6, 
                backgroundColor: colors.analytics.clay, 
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
                marginRight: 8,
              }}
            >
              <Ionicons name="image-outline" size={16} color={colors.analytics.olive} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.analytics.olive }}>Image</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              if (allSelected) setSelectedItems(new Set());
              else setSelectedItems(new Set(parsed.map((p) => p.id)));
            }}
            style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.cypress.pale, borderRadius: 6 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.cypress.deep }}>
              {allSelected ? 'None' : 'All'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Count */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 13, color: colors.neutral.medium }}>
            {selectedItems.size} of {parsed.length} selected
          </Text>
        </View>

        {/* List */}
        <FlatList
          data={parsed}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        />

        {/* Bottom Bar */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.neutral.lighter,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          borderTopWidth: 1,
          borderTopColor: colors.neutral.light,
        }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => setShowAddManual(true)}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 18,
                backgroundColor: colors.cypress.pale,
                borderRadius: 10,
              }}
            >
              <Ionicons name="add" size={20} color={colors.cypress.deep} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleImportPress}
              disabled={selectedItems.size === 0}
              style={{
                flex: 1,
                backgroundColor: selectedItems.size === 0 ? colors.neutral.light : colors.brand.primary,
                paddingVertical: 14,
                borderRadius: 10,
                alignItems: 'center',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: selectedItems.size === 0 ? colors.neutral.medium : '#fff', fontSize: 16, fontWeight: '700' }}>
                Import {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modals */}
        <AlertModal visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} actions={alert.actions} onClose={hideAlert} />

        {/* Preview Modal */}
        <Modal visible={showFullPreview} animationType="fade" transparent onRequestClose={() => setShowFullPreview(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
            <TouchableOpacity
              onPress={() => setShowFullPreview(false)}
              style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {previewUri && (
              <ScrollView
                style={{ flex: 1, marginTop: 80 }}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
                maximumZoomScale={5}
                minimumZoomScale={1}
                bouncesZoom
                centerContent
              >
                <Image source={{ uri: previewUri }} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT - 150 }} contentFit="contain" />
              </ScrollView>
            )}
          </View>
        </Modal>

        {/* Add Manual Modal */}
        <Modal visible={showAddManual} animationType="slide" transparent onRequestClose={() => setShowAddManual(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setShowAddManual(false)} />
            <View style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.neutral.darkest, marginBottom: 20 }}>Add Item</Text>
              <TextInput
                value={manualProduct}
                onChangeText={setManualProduct}
                placeholder="Product name"
                placeholderTextColor={colors.neutral.medium}
                autoFocus
                style={{
                  backgroundColor: colors.neutral.lighter,
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  marginBottom: 12,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
                <TextInput
                  value={manualSupplier}
                  onChangeText={setManualSupplier}
                  placeholder="Supplier (optional)"
                  placeholderTextColor={colors.neutral.medium}
                  style={{
                    flex: 1,
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    color: colors.neutral.darkest,
                  }}
                />
                <TextInput
                  value={manualQuantity}
                  onChangeText={setManualQuantity}
                  placeholder="Qty"
                  keyboardType="numeric"
                  placeholderTextColor={colors.neutral.medium}
                  style={{
                    width: 70,
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 10,
                    padding: 14,
                    fontSize: 16,
                    color: colors.neutral.darkest,
                    textAlign: 'center',
                  }}
                />
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
              >
                <Text style={{ color: manualProduct.trim() ? '#fff' : colors.neutral.medium, fontSize: 16, fontWeight: '700' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Session Choice Modal */}
        <Modal visible={showSessionChoice} animationType="fade" transparent onRequestClose={() => setShowSessionChoice(false)}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 32 }}
            activeOpacity={1}
            onPress={() => setShowSessionChoice(false)}
          >
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.neutral.darkest, textAlign: 'center', marginBottom: 20 }}>
                Add to Session
              </Text>
              {activeSessions.length > 0 && (
                <TouchableOpacity
                  onPress={() => performImport(activeSessions[0])}
                  style={{
                    backgroundColor: colors.brand.primary,
                    paddingVertical: 14,
                    borderRadius: 10,
                    marginBottom: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Current Session</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 }}>
                    {activeSessions[0].items?.length || 0} items
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => performImport(createSession())}
                style={{
                  backgroundColor: colors.neutral.lighter,
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.neutral.darkest, fontSize: 15, fontWeight: '600' }}>New Session</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    );
  }

  // =============================================
  // UPLOAD VIEW - Clean & Minimal
  // =============================================
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.lighter }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.neutral.darkest, marginLeft: 12 }}>
          Scan Catalog
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        {!file ? (
          <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 80 }}>
            {/* Hero */}
            <View style={{ alignItems: 'center', marginBottom: 48 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.cypress.pale,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <Ionicons name="scan-outline" size={36} color={colors.cypress.deep} />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: colors.neutral.darkest, textAlign: 'center', marginBottom: 8 }}>
                Upload a Catalog
              </Text>
              <Text style={{ fontSize: 15, color: colors.neutral.medium, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 }}>
                Take a photo or choose an image of your stock list to extract items automatically.
              </Text>
            </View>

            {/* Actions */}
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                onPress={takePhoto}
                style={{
                  backgroundColor: colors.brand.primary,
                  paddingVertical: 18,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={22} color="#fff" style={{ marginRight: 10 }} />
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickFile}
                style={{
                  backgroundColor: '#fff',
                  paddingVertical: 18,
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: colors.neutral.light,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={22} color={colors.cypress.deep} style={{ marginRight: 10 }} />
                <Text style={{ color: colors.cypress.deep, fontSize: 17, fontWeight: '600' }}>Choose Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Subtle tip */}
            <View style={{ marginTop: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.neutral.medium, textAlign: 'center' }}>
                Supports JPEG, PNG, and HEIC images
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, paddingTop: 40 }}>
            {/* Selected file card */}
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: colors.cypress.pale,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name="image" size={24} color={colors.cypress.deep} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.neutral.darkest }} numberOfLines={1}>
                    {file.name || 'Photo'}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.neutral.medium, marginTop: 2 }}>Ready to scan</Text>
                </View>
                <TouchableOpacity onPress={clearSelection} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={24} color={colors.neutral.medium} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Analyze button */}
            <TouchableOpacity
              onPress={sendForParsing}
              disabled={loading}
              style={{
                backgroundColor: colors.brand.primary,
                paddingVertical: 18,
                borderRadius: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
              }}
              activeOpacity={0.8}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{loadingMessage || 'Processing...'}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>Analyze</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Error */}
            {parsingError && (
              <View style={{
                backgroundColor: '#fef2f2',
                borderRadius: 12,
                padding: 16,
                marginTop: 20,
                borderLeftWidth: 4,
                borderLeftColor: colors.status.error,
              }}>
                <Text style={{ fontSize: 14, color: colors.status.error, lineHeight: 20 }}>{parsingError}</Text>
              </View>
            )}

            {/* Change file */}
            <TouchableOpacity onPress={clearSelection} style={{ marginTop: 20, alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontSize: 15, color: colors.neutral.medium, fontWeight: '500' }}>Choose different file</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <AlertModal visible={alert.visible} type={alert.type} title={alert.title} message={alert.message} actions={alert.actions} onClose={hideAlert} />
    </SafeAreaView>
  );
}
