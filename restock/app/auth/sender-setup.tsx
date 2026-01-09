import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSenderProfileStore } from '../../store/useSenderProfileStore';
import { useThemedStyles } from '../../styles/useThemedStyles';
import { getAuthStyles } from '../../styles/components/auth-index';
import logger from '../../lib/helpers/logger';

export default function SenderSetupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSenderProfile = useSenderProfileStore((state) => state.setSenderProfile);
  const saveProfileToStorage = useSenderProfileStore((state) => state.saveProfileToStorage);
  const styles = useThemedStyles(getAuthStyles);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setSenderProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        storeName: storeName.trim() || undefined,
      });

      await saveProfileToStorage();
      logger.info('[SenderSetup] Profile saved successfully');
      router.replace('/');
    } catch (err) {
      logger.error('[SenderSetup] Failed to save sender profile', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to Restock</Text>
            <Text style={styles.subtitle}>Let's set up your profile</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Email</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. john@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Store Name (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Main Street Grocers"
                value={storeName}
                onChangeText={setStoreName}
                autoCapitalize="words"
              />
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#CC0000" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Get Started'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
