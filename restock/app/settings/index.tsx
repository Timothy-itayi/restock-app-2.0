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
import { useSenderProfileStore, useSenderProfileHydrated } from '../../store/useSenderProfileStore';
import type { SenderProfile } from '../../lib/helpers/storage/sender';

export default function SettingsScreen() {
  const styles = useThemedStyles(getSettingsStyles);
  const senderProfile = useSenderProfileStore((state) => state.senderProfile);
  const isHydrated = useSenderProfileHydrated();
  const updateProfile = useSenderProfileStore((state) => state.updateProfile);
  const loadProfileFromStorage = useSenderProfileStore((state) => state.loadProfileFromStorage);
  const [profile, setProfile] = useState<SenderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) {
      loadProfileFromStorage().finally(() => setLoading(false));
    } else {
      setProfile(senderProfile);
      setLoading(false);
    }
  }, [isHydrated, senderProfile, loadProfileFromStorage]);

  // Sync local state when store updates
  useEffect(() => {
    if (isHydrated) {
      setProfile(senderProfile);
    }
  }, [senderProfile, isHydrated]);

  const validateEmail = (email: string): boolean => {
    return email.includes('@') && email.trim().length > 0;
  };

  const saveProfile = async () => {
    if (!profile?.name || !profile.email) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }

    if (!validateEmail(profile.email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    try {
      updateProfile(profile);
      Alert.alert('Saved', 'Your details have been updated.');
    } catch {
      Alert.alert('Error', 'Unable to save profile.');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Reset App',
      'This will delete all sessions, suppliers, and your profile. Continue?',
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerSubtitle}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.headerSubtitle}>No sender details found.</Text>
        <TouchableOpacity
          style={{ marginTop: 12 }}
          onPress={() => router.replace('/auth/sender-setup')}
        >
          <Text style={styles.headerTitle}>Set Up Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.settingsSection}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Name</Text>
            <TextInput
              placeholder="Your Name"
              value={profile.name}
              onChangeText={(v) => setProfile({ ...profile, name: v })}
              style={styles.settingDescription}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Email</Text>
            <TextInput
              placeholder="Email Address"
              value={profile.email}
              onChangeText={(v) => setProfile({ ...profile, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.settingDescription}
            />
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Store Name (optional)</Text>
            <TextInput
              placeholder="Store Name"
              value={profile.storeName || ''}
              onChangeText={(v) => setProfile({ ...profile, storeName: v })}
              style={styles.settingDescription}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={saveProfile}
      >
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleClearAll}
      >
        <Text style={styles.resetButtonText}>Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

