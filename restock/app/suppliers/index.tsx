import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSuppliersStyles } from '@styles/components/suppliers';
import colors from '../../lib/theme/colors';

type Supplier = {
  id: string;
  name: string;
  email: string;
};

export default function SuppliersScreen() {
  const styles = useThemedStyles(getSuppliersStyles);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // Load from storage
  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem('suppliers');
      if (raw) {
        const obj = JSON.parse(raw);
        const arr = Object.keys(obj).map(key => ({
          id: key,
          name: key,
          email: obj[key].email || ''
        }));
        setSuppliers(arr);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.warn('Failed to load suppliers:', err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const saveSupplier = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Supplier name required');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Supplier email required');
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Check for duplicate names (case-insensitive)
    const duplicate = suppliers.find(
      s => s.name.toLowerCase() === trimmedName.toLowerCase() && 
      (!editing || s.id !== editing.id)
    );

    if (duplicate) {
      Alert.alert(
        'Duplicate Supplier',
        `A supplier with the name "${trimmedName}" already exists. Please use a different name.`
      );
      return;
    }

    const updatedList = editing
      ? suppliers.map(s => (s.id === editing.id ? { id: trimmedName, name: trimmedName, email: trimmedEmail } : s))
      : [...suppliers, { id: trimmedName, name: trimmedName, email: trimmedEmail }];

    setSuppliers(updatedList);
    setEditing(null);
    setName('');
    setEmail('');

    const map: any = {};
    updatedList.forEach(s => {
      map[s.name] = { email: s.email };
    });

    await AsyncStorage.setItem('suppliers', JSON.stringify(map));
  };

  const deleteSupplier = (supplier: Supplier) => {
    Alert.alert(
      'Delete Supplier',
      `Are you sure you want to delete "${supplier.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedList = suppliers.filter(s => s.id !== supplier.id);
            setSuppliers(updatedList);

            const map: any = {};
            updatedList.forEach(s => {
              map[s.name] = { email: s.email };
            });

            await AsyncStorage.setItem('suppliers', JSON.stringify(map));

            // If we were editing this supplier, cancel editing
            if (editing && editing.id === supplier.id) {
              setEditing(null);
              setName('');
              setEmail('');
            }
          }
        }
      ]
    );
  };

  const startEdit = (sup: Supplier) => {
    setEditing(sup);
    setName(sup.name);
    setEmail(sup.email);
  };

  const cancel = () => {
    setEditing(null);
    setName('');
    setEmail('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>
          Suppliers
        </Text>
      </View>

      {/* Add/Edit Form */}
      <View style={styles.formCard}>
        <TextInput
          placeholder="Supplier name"
          placeholderTextColor={colors.neutral.medium}
          value={name}
          onChangeText={setName}
          style={styles.textInput}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.neutral.medium}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.textInput, { marginTop: 16 }]}
        />

        <TouchableOpacity
          onPress={saveSupplier}
          style={styles.saveButton}
        >
          <Text style={styles.saveButtonText}>
            {editing ? 'Save Changes' : 'Add Supplier'}
          </Text>
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity
            onPress={cancel}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Suppliers List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={styles.sectionSubtitle}>Loading...</Text>
        </View>
      ) : suppliers.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={styles.sectionSubtitle}>No suppliers yet</Text>
          <Text style={[styles.sectionSubtitle, { marginTop: 8, fontSize: 14, color: '#666' }]}>
            Add suppliers manually or they will be added automatically when you upload documents.
          </Text>
        </View>
      ) : (
        <FlatList
          data={suppliers}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={[styles.productItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <TouchableOpacity
                onPress={() => startEdit(item)}
                style={{ flex: 1 }}
              >
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productEmail}>{item.email}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => startEdit(item)}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="pencil" size={20} color="#6B7F6B" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteSupplier(item)}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="trash" size={20} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

