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

import {
  useSessionStore,
  useActiveSessions,
  useSessionHydrated
} from '../../store/useSessionStore';

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
  const [supplierMap, setSupplierMap] = useState<Record<string,string>>({});

  const activeSessions = useActiveSessions();
  const isHydrated = useSessionHydrated();
  const loadSessionsFromStorage = useSessionStore((s) => s.loadSessionsFromStorage);
  const addItemToSession = useSessionStore((s) => s.addItemToSession);
  const createSession = useSessionStore((s) => s.createSession);

  useEffect(() => {
    if (!isHydrated) loadSessionsFromStorage();
  }, [isHydrated]);

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

    try {
      const form = new FormData();
      form.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream'
      } as any);

      const r = await fetch('https://your-backend-url/parse-doc', {
        method: 'POST',
        body: form
      });

      const data = await r.json();

      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid format');
      }

      const itemsWithIds = data.items.map((it, i) => ({
        ...it,
        id: it.id || `${Date.now()}-${i}`
      }));

      setParsed(itemsWithIds);
      setSelectedItems(new Set(itemsWithIds.map((x) => x.id)));

    } catch (e) {
      setParsingError('Failed to parse document');
    }

    setLoading(false);
  };

  const saveToSession = async () => {
    const itemsToImport = parsed.filter((p) => selectedItems.has(p.id));

    let session =
      activeSessions.length > 0 ? activeSessions[0] : createSession();

    itemsToImport.forEach((p) => {
      const sessionItem: SessionItem = {
        id: `${Date.now()}-${Math.random()}`,
        productName: p.product,
        quantity: 1,
        supplierName: p.supplier
      };
      addItemToSession(session.id, sessionItem);
    });

    Alert.alert('Imported', `${itemsToImport.length} items added.`);
    router.push(`/sessions/${session.id}`);
  };

  return (
    <SafeAreaView style={styles.sessionContainer}>
      <View style={{ flexDirection:'row', alignItems:'center', padding:16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight:16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.sessionSelectionTitle}>Upload Catalog</Text>
      </View>

      <View style={{ padding:16 }}>
        {!file && (
          <TouchableOpacity onPress={pickFile} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Choose File</Text>
          </TouchableOpacity>
        )}

        {file && !parsed.length && (
          <View style={{ marginTop:20 }}>
            <Text>{file.name}</Text>
            <TouchableOpacity
              onPress={sendForParsing}
              style={[styles.saveButton, { marginTop:12 }]}
            >
              {loading ? <ActivityIndicator color="#fff" /> :
                <Text style={styles.saveButtonText}>Parse</Text>}
            </TouchableOpacity>
          </View>
        )}

        {parsed.length > 0 && (
          <ScrollView style={{ marginTop:16 }}>
            {parsed.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  const newSet = new Set(selectedItems);
                  newSet.has(item.id)
                    ? newSet.delete(item.id)
                    : newSet.add(item.id);
                  setSelectedItems(newSet);
                }}
                style={{
                  padding:12,
                  marginBottom:4,
                  borderRadius:8,
                  backgroundColor: selectedItems.has(item.id) ? '#E8F5E8' : '#fff',
                  borderWidth:1,
                  borderColor:'#ddd'
                }}
              >
                <Text>{item.product}</Text>
                <Text style={{ color:'#666', fontSize:13 }}>{item.supplier}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={saveToSession}
              style={[styles.saveButton, { marginTop:20 }]}
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
