import React, { useState, useEffect, useRef } from 'react';
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
import * as FileSystem from 'expo-file-system';

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
import { parseDocument, parseImages, type ParsedItem, type DocumentFile } from '../../lib/api/parseDoc';

// Try to import PDF conversion libraries (may not be available in Expo managed workflow)
let PDF: any = null;
let captureRef: any = null;
let PDF_AVAILABLE = false;

try {
  // @ts-ignore - react-native-pdf may not have types
  PDF = require('react-native-pdf').default;
  // @ts-ignore - react-native-view-shot may not have types
  const viewShot = require('react-native-view-shot');
  captureRef = viewShot.captureRef;
  PDF_AVAILABLE = true;
} catch (e) {
  // Silently fail - PDF conversion will be disabled
  PDF_AVAILABLE = false;
}

export default function UploadScreen() {
  const styles = useThemedStyles(getUploadStyles);

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // PDF conversion state
  const pdfRef = useRef<any>(null);
  const pdfViewRef = useRef<View>(null);
  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [pdfTotalPages, setPdfTotalPages] = useState<number>(1);
  const pdfConversionRef = useRef<{
    resolve: (value: string[]) => void;
    reject: (error: Error) => void;
    imageUris: string[];
    maxPages: number;
  } | null>(null);
  const [pdfConversionState, setPdfConversionState] = useState<{
    isConverting: boolean;
    currentPage: number;
    totalPages: number;
    pdfUri: string | null;
    cacheDir: string;
  } | null>(null);

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
  // Convert PDF to images
  // ---------------------------------------------------------------------------
  const convertPdfToImages = async (pdfUri: string, maxPages: number = 10): Promise<string[]> => {
    if (!PDF_AVAILABLE || !PDF || !captureRef) {
      throw new Error('PDF conversion libraries not available. Please install react-native-pdf and react-native-view-shot.');
    }

    return new Promise((resolve, reject) => {
      const cacheDir = `${FileSystem.cacheDirectory}pdf-conversion/`;
      const imageUris: string[] = [];
      
      pdfConversionRef.current = {
        resolve,
        reject,
        imageUris,
        maxPages,
      };

      setPdfConversionState({
        isConverting: true,
        currentPage: 0,
        totalPages: 1,
        pdfUri,
        cacheDir,
      });

      // Ensure cache directory exists
      FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true })
        .then(() => {
          setPdfPage(1);
        })
        .catch((err) => {
          console.error('Failed to create cache directory:', err);
          reject(new Error('Failed to create cache directory for PDF conversion'));
        });
    });
  };

  // Handle PDF page rendering and capture
  useEffect(() => {
    if (!PDF_AVAILABLE || !pdfPage || !pdfConversionRef.current || !pdfViewRef.current || !captureRef) return;

    const conversion = pdfConversionRef.current;
    const currentPage = pdfPage;
    const maxPages = Math.min(pdfTotalPages, conversion.maxPages);
    
    const timeout = setTimeout(() => {
      if (!pdfViewRef.current || !pdfConversionRef.current) return;

      captureRef(pdfViewRef.current, {
        format: 'jpg',
        quality: 0.85,
      })
        .then((uri: string) => {
          if (!pdfConversionRef.current) return;
          
          const conv = pdfConversionRef.current;
          conv.imageUris.push(uri);
          const progress = (conv.imageUris.length / maxPages) * 100;
          setLoadingProgress(progress);
          setLoadingMessage(`Converted page ${conv.imageUris.length} of ${maxPages}...`);

          // Move to next page or finish
          if (conv.imageUris.length >= maxPages) {
            // Done converting
            const uris = [...conv.imageUris];
            conv.resolve(uris);
            pdfConversionRef.current = null;
            setPdfConversionState(null);
            setPdfPage(null);
          } else {
            // Move to next page
            setPdfPage(conv.imageUris.length + 1);
          }
        })
        .catch((err: Error) => {
          console.error('Failed to capture PDF page:', err);
          if (pdfConversionRef.current) {
            pdfConversionRef.current.reject(new Error(`Failed to capture PDF page ${currentPage}: ${err.message}`));
            pdfConversionRef.current = null;
          }
          setPdfConversionState(null);
          setPdfPage(null);
        });
    }, 1000); // Wait for PDF to render (increased timeout)

    return () => clearTimeout(timeout);
  }, [pdfPage, pdfTotalPages]);

  // ---------------------------------------------------------------------------
  // Send file to backend for parsing
  // ---------------------------------------------------------------------------
  const sendForParsing = async () => {
    if (!file) return;

    setLoading(true);
    setParsingError(null);
    setLoadingMessage('');
    setLoadingProgress(0);

    try {
      const isPdf = file.mimeType?.includes('pdf') || file.name?.endsWith('.pdf');

      if (isPdf) {
        // Convert PDF to images first
        setLoadingMessage('Converting PDF to images...');
        setLoadingProgress(0);

        try {
          const imageUris = await convertPdfToImages(file.uri, 10);
          
          if (imageUris.length === 0) {
            setParsingError('Failed to convert PDF to images. No pages were converted.');
            return;
          }

          setLoadingMessage(`Uploading ${imageUris.length} image(s)...`);
          setLoadingProgress(50);

          // Convert image URIs to DocumentFile format
          const imageFiles: DocumentFile[] = imageUris.map((uri, index) => ({
            uri,
            name: `page-${index + 1}.jpg`,
            mimeType: 'image/jpeg',
            size: null,
          }));

          // Parse images
          const result = await parseImages(imageFiles, (message, progress) => {
            setLoadingMessage(message);
            if (progress !== undefined) {
              setLoadingProgress(50 + (progress * 0.5)); // Second half of progress
            }
          });

          if (!result.success) {
            setParsingError(result.error);
            return;
          }

          setParsed(result.items);
          setSelectedItems(new Set(result.items.map((x) => x.id)));
        } catch (conversionError: any) {
          console.error('PDF conversion error:', conversionError);
          setParsingError(
            conversionError instanceof Error 
              ? conversionError.message 
              : 'Failed to convert PDF to images. Please ensure react-native-pdf and react-native-view-shot are installed.'
          );
          return;
        }
      } else {
        // Direct image upload
        const result = await parseDocument({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
        } as DocumentFile, (message, progress) => {
          setLoadingMessage(message);
          if (progress !== undefined) {
            setLoadingProgress(progress);
          }
        });

        if (!result.success) {
          setParsingError(result.error);
          return;
        }

        setParsed(result.items);
        setSelectedItems(new Set(result.items.map((x) => x.id)));
      }
    } catch (e: any) {
      console.warn('parse-doc error', e);
      setParsingError(
        e instanceof Error ? e.message : 'Failed to parse document'
      );
    } finally {
      setLoading(false);
      setLoadingMessage('');
      setLoadingProgress(0);
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
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Upload Catalog</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
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
                <View style={{ alignItems: 'center' }}>
                  <ActivityIndicator color="#fff" />
                  {loadingMessage && (
                    <Text style={{ color: '#fff', marginTop: 8, fontSize: 12 }}>
                      {loadingMessage}
                    </Text>
                  )}
                  {loadingProgress > 0 && (
                    <View style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.3)', height: 4, borderRadius: 2, marginTop: 8 }}>
                      <View style={{ width: `${loadingProgress}%`, backgroundColor: '#fff', height: 4, borderRadius: 2 }} />
                    </View>
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
          </View>
        )}

        {/* Hidden PDF renderer for conversion */}
        {PDF_AVAILABLE && pdfConversionState && PDF && pdfPage && (
          <View
            ref={pdfViewRef}
            style={{
              position: 'absolute',
              left: -10000,
              top: -10000,
              width: 800,
              height: 1200,
              opacity: 0,
            }}
            collapsable={false}
          >
            <PDF
              ref={pdfRef}
              source={{ uri: pdfConversionState.pdfUri, cache: true }}
              page={pdfPage}
              onLoadComplete={(numberOfPages: number) => {
                if (numberOfPages > 0) {
                  setPdfTotalPages(numberOfPages);
                  if (pdfConversionRef.current) {
                    pdfConversionRef.current.maxPages = Math.min(numberOfPages, pdfConversionRef.current.maxPages);
                  }
                }
              }}
              onError={(error: Error) => {
                console.error('PDF load error:', error);
                if (pdfConversionRef.current) {
                  pdfConversionRef.current.reject(new Error(`Failed to load PDF: ${error.message}`));
                  pdfConversionRef.current = null;
                }
                setPdfConversionState(null);
                setPdfPage(null);
              }}
              style={{ flex: 1 }}
            />
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
      </ScrollView>
    </SafeAreaView>
  );
}
