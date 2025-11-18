import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

type SenderProfile = {
  name: string;
  email: string;
  storeName?: string | null;
};

export default function SettingsScreen() {
  const [profile, setProfile] = useState<SenderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem('senderProfile');
      if (raw) setProfile(JSON.parse(raw));
    } catch (err) {
      console.warn('Failed to load sender profile', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile?.name || !profile.email) {
      Alert.alert('Error', 'Name and email are required.');
      return;
    }

    try {
      await AsyncStorage.setItem('senderProfile', JSON.stringify(profile));
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
            router.replace('/sender-setup');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ marginBottom: 12 }}>No sender details found.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/sender-setup')}
        >
          <Text style={styles.buttonText}>Set Up Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.header}>Settings</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={profile.name}
        onChangeText={(v) => setProfile({ ...profile, name: v })}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        value={profile.email}
        onChangeText={(v) => setProfile({ ...profile, email: v })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Store Name (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Store Name"
        value={profile.storeName || ''}
        onChangeText={(v) => setProfile({ ...profile, storeName: v })}
      />

      <TouchableOpacity style={styles.button} onPress={saveProfile}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={handleClearAll}>
        <Text style={styles.resetText}>Reset All Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    flex: 1
  },
  header: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 30
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 6
  },
  input: {
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    fontSize: 15
  },
  button: {
    marginTop: 25,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#6B7F6B',
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15
  },
  resetButton: {
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#DDD'
  },
  resetText: {
    color: '#B20000',
    fontWeight: '600'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
