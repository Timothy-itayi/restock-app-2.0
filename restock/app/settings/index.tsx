import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSettingsStyles } from '@styles/components/settings';

import {
  useSenderProfileStore,
  useSenderProfileHydrated
} from '../../store/useSenderProfileStore';

export default function SettingsScreen() {
  const styles = useThemedStyles(getSettingsStyles);

  const senderProfile = useSenderProfileStore((s) => s.senderProfile);
  const updateProfile = useSenderProfileStore((s) => s.updateProfile);
  const loadProfileFromStorage = useSenderProfileStore((s) => s.loadProfileFromStorage);
  const saveProfileToStorage = useSenderProfileStore((s) => s.saveProfileToStorage);

  const isHydrated = useSenderProfileHydrated();

  const [form, setForm] = useState({
    name: '',
    email: '',
    storeName: ''
  });

  const [loading, setLoading] = useState(true);

  //----------------------------------------------------------------------
  // HYDRATE ONCE
  //----------------------------------------------------------------------
  useEffect(() => {
    if (!isHydrated) {
      loadProfileFromStorage();
      return;
    }

    // populate local form state ONCE
    if (senderProfile) {
      setForm({
        name: senderProfile.name,
        email: senderProfile.email,
        storeName: senderProfile.storeName ?? ''
      });
    }

    setLoading(false);
  }, [isHydrated]);

  //----------------------------------------------------------------------
  // VALIDATION
  //----------------------------------------------------------------------
  const isValidEmail = (email: string) =>
    email.includes('@') && email.trim().length > 2;

  //----------------------------------------------------------------------
  // SAVE ACTION
  //----------------------------------------------------------------------
  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      Alert.alert('Missing fields', 'Name and email are required.');
      return;
    }

    if (!isValidEmail(form.email)) {
      Alert.alert('Invalid email', 'Please provide a valid email address.');
      return;
    }

    updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      storeName: form.storeName.trim() || null
    });

    await saveProfileToStorage();

    Alert.alert('Saved', 'Your profile has been updated.');
  };

  //----------------------------------------------------------------------
  // RESET ALL
  //----------------------------------------------------------------------
  const handleReset = async () => {
    Alert.alert(
      'Reset App',
      'This will erase all sessions, suppliers, and your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            useSenderProfileStore.getState().clearProfile();
            router.replace('/auth/sender-setup');
          }
        }
      ]
    );
  };

  //----------------------------------------------------------------------
  // UI
  //----------------------------------------------------------------------
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerSubtitle}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.settingsSection}>
        {/* NAME */}
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Name</Text>
          <TextInput
            style={styles.settingDescription}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholder="Your Name"
          />
        </View>

        {/* EMAIL */}
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Email</Text>
          <TextInput
            style={styles.settingDescription}
            value={form.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(v) => setForm({ ...form, email: v })}
            placeholder="Email Address"
          />
        </View>

        {/* STORE NAME */}
        <View style={styles.settingItem}>
          <Text style={styles.settingTitle}>Store Name (optional)</Text>
          <TextInput
            style={styles.settingDescription}
            value={form.storeName}
            onChangeText={(v) => setForm({ ...form, storeName: v })}
            placeholder="Store Name"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
