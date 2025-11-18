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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSuppliersStyles } from '@styles/components/suppliers';

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

  // Load from storage
  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('suppliers');
      if (raw) {
        const obj = JSON.parse(raw);
        const arr = Object.keys(obj).map(key => ({
          id: key,
          name: key,
          email: obj[key].email || ''
        }));
        setSuppliers(arr);
      }
    })();
  }, []);

  const saveSupplier = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Supplier name required');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Supplier email required');
      return;
    }

    const updatedList =
      editing
        ? suppliers.map(s => (s.id === editing.id ? { id: name, name, email } : s))
        : [...suppliers, { id: name, name, email }];

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
      <Text style={styles.sectionTitle}>
        Suppliers
      </Text>

      {/* Add/Edit Form */}
      <View style={styles.formCard}>
        <TextInput
          placeholder="Supplier name"
          value={name}
          onChangeText={setName}
          style={styles.textInput}
        />

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.textInput, { marginTop: 10 }]}
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
      <FlatList
        data={suppliers}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => startEdit(item)}
            style={styles.productItem}
          >
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.productEmail}>{item.email}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
