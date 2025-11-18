import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  SafeAreaView
} from 'react-native';
import pickDocuments from '../../../lib/utils/pickDocuments';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getUploadStyles } from '@styles/components/upload';

type ParsedItem = {
  id: string;
  supplier: string;
  product: string;
};

export default function UploadScreen() {
  const styles = useThemedStyles(getUploadStyles);
  const [file, setFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [supplierMap, setSupplierMap] = useState<Record<string, string>>({});

  const pickFile = async () => {
    const res = await pickDocuments({ multiple: false });

    if (res.canceled || res.assets.length === 0) return;

    setFile(res.assets[0]);
    setParsed([]);
  };

  const sendForParsing = async () => {
    if (!file) return;

    setLoading(true);

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

      if (!r.ok) throw new Error('Parse request failed');

      const data = await r.json();
      setParsed(data.items || []);

      // pre-fill emails if supplier seen before
      const stored = await AsyncStorage.getItem('suppliers');
      if (stored) {
        const known = JSON.parse(stored);
        const map: Record<string, string> = {};

        data.items.forEach((it: ParsedItem) => {
          if (known[it.supplier]) {
            map[it.supplier] = known[it.supplier].email;
          }
        });

        setSupplierMap(map);
      }

    } catch (e) {
      Alert.alert('Error', 'Failed to parse document');
    }

    setLoading(false);
  };

  const saveToSession = async () => {
    if (!parsed.length) return;

    for (const supplier of Object.keys(supplierMap)) {
      if (!supplierMap[supplier]) {
        Alert.alert('Missing Email', `Please enter an email for supplier: ${supplier}`);
        return;
      }
    }

    // load or initialize current session
    const raw = await AsyncStorage.getItem('current-session');
    const session = raw ? JSON.parse(raw) : { id: Date.now(), items: [] };

    const merged = parsed.map(p => ({
      ...p,
      supplierEmail: supplierMap[p.supplier] || ''
    }));

    session.items = [...session.items, ...merged];

    await AsyncStorage.setItem('current-session', JSON.stringify(session));

    // permanently store known suppliers
    const stored = await AsyncStorage.getItem('suppliers');
    const suppliers = stored ? JSON.parse(stored) : {};
    Object.keys(supplierMap).forEach(s => {
      suppliers[s] = { email: supplierMap[s] };
    });

    await AsyncStorage.setItem('suppliers', JSON.stringify(suppliers));

    Alert.alert('Imported', 'Items added to your session');
    setFile(null);
    setParsed([]);
  };

  // UI
  return (
    <SafeAreaView style={styles.sessionContainer}>
      <View style={{ padding: 16 }}>
        <Text style={styles.sessionSelectionTitle}>
          Upload Catalog
        </Text>

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

        {/* Parsed results */}
        {parsed.length > 0 && (
          <View style={{ flex: 1, marginTop: 16 }}>
            <Text style={styles.productListTitle}>Suppliers</Text>

            {Array.from(new Set(parsed.map(p => p.supplier))).map(s => (
              <View key={s} style={styles.formCard}>
                <Text style={[styles.productListTitle, { marginBottom: 6 }]}>{s}</Text>

                <TextInput
                  placeholder="Supplier email"
                  value={supplierMap[s] || ''}
                  onChangeText={v => setSupplierMap(prev => ({ ...prev, [s]: v }))}
                  style={styles.textInput}
                />

                {parsed.filter(p => p.supplier === s).map((p, i) => (
                  <Text key={p.id + i} style={styles.sectionSubtitle}>
                    • {p.product}
                  </Text>
                ))}
              </View>
            ))}

            <TouchableOpacity
              onPress={saveToSession}
              style={[styles.saveButton, { marginTop: 20 }]}
            >
              <Text style={styles.saveButtonText}>Add to Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
