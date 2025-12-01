import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  FlatList
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import pickDocuments from '../../lib/utils/pickDocuments';
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

export default function UploadScreen() {
  const styles = useThemedStyles(getUploadStyles);

  // Local state
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

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

  // Import into session
  const saveToSession = async () => {
    if (!isSessionHydrated) {
      showWarning('Please Wait', 'Still loading sessions. Try again in a moment.');
      return;
    }

    const itemsToImport = parsed.filter((p) => selectedItems.has(p.id));

    if (itemsToImport.length === 0) {
      showWarning('Nothing Selected', 'Select at least one item to import.');
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

      addOrUpdateProduct(productNameRaw, supplierId, 1);

      const sessionItem: SessionItem = {
        id: ensureId('item'),
        productName: productNameRaw,
        quantity: 1,
        supplierId
      };

      addItemToSession(session.id, sessionItem);
    }

    showAlert('success', 'Items Imported', `${itemsToImport.length} item(s) added to session.`, [
      {
        text: 'View Session',
        onPress: () => {
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

  // Render item for FlatList
  const renderItem = ({ item, index }: { item: ParsedItem; index: number }) => {
    const isSelected = selectedItems.has(item.id);
    return (
      <View>
        <TouchableOpacity
          onPress={() => toggleItemSelection(item.id)}
          style={{
            paddingVertical: 14,
            paddingHorizontal: 16,
            backgroundColor: colors.neutral.lightest,
            flexDirection: 'row',
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          {/* Checkbox */}
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: isSelected ? colors.brand.primary : colors.neutral.light,
            backgroundColor: isSelected ? colors.brand.primary : 'transparent',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>

          {/* Content */}
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 15,
              fontWeight: '600',
              color: colors.neutral.darkest,
              marginBottom: 2,
            }}>
              {item.product}
            </Text>
            {!!item.supplier && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="business-outline" size={12} color={colors.neutral.medium} style={{ marginRight: 4 }} />
                <Text style={{
                  fontSize: 13,
                  color: colors.neutral.medium,
                }}>
                  {item.supplier}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Divider */}
        {index < parsed.length - 1 && (
          <View style={{
            height: 1,
            backgroundColor: colors.neutral.light,
            marginHorizontal: 16,
          }} />
        )}
      </View>
    );
  };

  // If we have parsed items, show the selection view
  if (parsed.length > 0) {
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

        {/* Summary Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 4,
              height: 20,
              backgroundColor: colors.brand.primary,
              borderRadius: 2,
              marginRight: 10,
            }} />
            <Ionicons name="document-text-outline" size={16} color={colors.brand.primary} style={{ marginRight: 6 }} />
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.brand.primary,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              Scan Results
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={{
          backgroundColor: colors.cypress.pale,
          marginHorizontal: 16,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{
                fontSize: 28,
                fontWeight: '800',
                color: colors.cypress.deep,
              }}>
                {parsed.length}
              </Text>
              <Text style={{
                fontSize: 13,
                color: colors.neutral.medium,
                fontWeight: '600',
              }}>
                items found
              </Text>
            </View>
            <View style={{
              backgroundColor: colors.brand.primary + '20',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Ionicons name="checkmark-circle" size={14} color={colors.brand.primary} style={{ marginRight: 4 }} />
              <Text style={{
                fontSize: 13,
                fontWeight: '700',
                color: colors.brand.primary,
              }}>
                {selectedItems.size} selected
              </Text>
            </View>
          </View>

          {/* Import Button */}
          <TouchableOpacity
            onPress={saveToSession}
            style={{
              backgroundColor: colors.brand.primary,
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '700',
            }}>
              Import {selectedItems.size} item(s) to Session
            </Text>
          </TouchableOpacity>
        </View>

        {/* Actions Row */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          marginBottom: 12,
        }}>
          <TouchableOpacity
            onPress={() => setSelectedItems(new Set(parsed.map(p => p.id)))}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.cypress.pale,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="checkbox-outline" size={14} color={colors.cypress.deep} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.cypress.deep, fontWeight: '600', fontSize: 13 }}>Select All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setSelectedItems(new Set())}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.neutral.light,
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="square-outline" size={14} color={colors.neutral.dark} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.neutral.dark, fontWeight: '600', fontSize: 13 }}>Deselect All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => {
              setFile(null);
              setParsed([]);
              setSelectedItems(new Set());
              setParsingError(null);
            }}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: colors.status.error + '15',
              borderRadius: 6,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons name="refresh-outline" size={14} color={colors.status.error} style={{ marginRight: 4 }} />
            <Text style={{ color: colors.status.error, fontWeight: '600', fontSize: 13 }}>Start Over</Text>
          </TouchableOpacity>
        </View>

        {/* Items Section Header */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 4,
              height: 20,
              backgroundColor: colors.cypress.deep,
              borderRadius: 2,
              marginRight: 10,
            }} />
            <Ionicons name="list-outline" size={16} color={colors.cypress.deep} style={{ marginRight: 6 }} />
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.cypress.deep,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}>
              Parsed Items
            </Text>
          </View>
        </View>

        {/* Item List */}
        <View style={{
          flex: 1,
          backgroundColor: colors.neutral.lightest,
          marginHorizontal: 16,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.neutral.light,
          marginBottom: 16,
        }}>
          <FlatList
            data={parsed}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={true}
          />
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
                <Ionicons name="camera-outline" size={16} color={colors.brand.primary} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.brand.primary,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Select Image
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
                <Ionicons name="image-outline" size={32} color={colors.cypress.deep} />
              </View>

              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.neutral.darkest,
                marginBottom: 8,
                textAlign: 'center',
              }}>
                Upload Catalog Photo
              </Text>
              
              <Text style={{
                fontSize: 14,
                color: colors.neutral.medium,
                textAlign: 'center',
                marginBottom: 20,
                paddingHorizontal: 16,
              }}>
                Take a photo of your product catalog or order list to automatically extract items
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
                  Choose Image
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tips Section */}
            <View style={{ paddingTop: 24, paddingBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.analytics.olive,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Ionicons name="bulb-outline" size={16} color={colors.analytics.olive} style={{ marginRight: 6 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.analytics.olive,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Tips
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
                { icon: 'sunny-outline', text: 'Ensure good lighting for clear text' },
                { icon: 'scan-outline', text: 'Keep the document flat and in frame' },
                { icon: 'text-outline', text: 'Make sure text is readable and not blurry' },
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
