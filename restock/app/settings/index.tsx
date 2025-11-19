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
import { useSafeTheme } from '../../lib/store/useThemeStore';

import {
  useSenderProfileStore,
  useSenderProfileHydrated
} from '../../store/useSenderProfileStore';

export default function SettingsScreen() {
  const styles = useThemedStyles(getSettingsStyles);
  const { theme } = useSafeTheme();

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

  const [originalForm, setOriginalForm] = useState({
    name: '',
    email: '',
    storeName: ''
  });

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if form has unsaved changes
  const hasUnsavedChanges = 
    form.name !== originalForm.name ||
    form.email !== originalForm.email ||
    form.storeName !== originalForm.storeName;

  //----------------------------------------------------------------------
  // HYDRATE AND SYNC FORM
  //----------------------------------------------------------------------
  useEffect(() => {
    if (!isHydrated) {
      loadProfileFromStorage();
      return;
    }

    setLoading(false);

    // Sync form with profile whenever profile changes
    if (senderProfile) {
      const newForm = {
        name: senderProfile.name || '',
        email: senderProfile.email || '',
        storeName: senderProfile.storeName ?? ''
      };
      setForm(newForm);
      setOriginalForm(newForm); // Track original values
    } else {
      // If no profile, initialize with empty form
      const emptyForm = {
        name: '',
        email: '',
        storeName: ''
      };
      setForm(emptyForm);
      setOriginalForm(emptyForm);
    }
  }, [isHydrated, senderProfile, loadProfileFromStorage]);

  //----------------------------------------------------------------------
  // VALIDATION
  //----------------------------------------------------------------------
  const isValidEmail = (email: string) =>
    email.includes('@') && email.trim().length > 2;

  //----------------------------------------------------------------------
  // SAVE ACTION
  //----------------------------------------------------------------------
  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.storeName.trim()) {
      Alert.alert('Missing fields', 'Name, email, and store name are required.');
      return;
    }

    if (!isValidEmail(form.email)) {
      Alert.alert('Invalid email', 'Please provide a valid email address.');
      return;
    }

    updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      storeName: form.storeName.trim()
    });

    await saveProfileToStorage();

    // Update original form to reflect saved state
    setOriginalForm({
      name: form.name.trim(),
      email: form.email.trim(),
      storeName: form.storeName.trim() || ''
    });

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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.headerContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <View style={styles.unsavedChangesBanner}>
            <Ionicons name="information-circle" size={20} color={theme.status.warning} />
            <Text style={styles.unsavedChangesText}>
              You have unsaved changes
            </Text>
          </View>
        )}
      </View>

      <View style={styles.formContainer}>
        <View style={styles.settingsSection}>
        {/* NAME */}
        <View style={[
          styles.settingItem,
          focusedField === 'name' ? styles.formFieldContainerEditing : styles.formFieldContainer
        ]}>
          <View style={styles.formFieldLabelRow}>
            <Text style={styles.formFieldLabel}>Name</Text>
            {focusedField === 'name' && (
              <View style={styles.editingBadge}>
                <Text style={styles.editingBadgeText}>EDITING</Text>
              </View>
            )}
            {form.name !== originalForm.name && (
              <Ionicons 
                name="pencil" 
                size={16} 
                color={theme.brand.primary} 
                style={styles.modifiedIndicator} 
              />
            )}
          </View>
          <TextInput
            style={[
              styles.formFieldInput,
              focusedField === 'name' && styles.formFieldInputEditing
            ]}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
            placeholder="Your Name"
            placeholderTextColor={styles.settingDescription.color}
          />
        </View>

        {/* EMAIL */}
        <View style={[
          styles.settingItem,
          focusedField === 'email' ? styles.formFieldContainerEditing : styles.formFieldContainer
        ]}>
          <View style={styles.formFieldLabelRow}>
            <Text style={styles.formFieldLabel}>Email</Text>
            {focusedField === 'email' && (
              <View style={styles.editingBadge}>
                <Text style={styles.editingBadgeText}>EDITING</Text>
              </View>
            )}
            {form.email !== originalForm.email && (
              <Ionicons 
                name="pencil" 
                size={16} 
                color={theme.brand.primary} 
                style={styles.modifiedIndicator} 
              />
            )}
          </View>
          <TextInput
            style={[
              styles.formFieldInput,
              focusedField === 'email' && styles.formFieldInputEditing
            ]}
            value={form.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(v) => setForm({ ...form, email: v })}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            placeholder="Email Address"
            placeholderTextColor={styles.settingDescription.color}
          />
        </View>

        {/* STORE NAME */}
        <View style={[
          styles.settingItem,
          focusedField === 'storeName' ? styles.formFieldContainerEditing : styles.formFieldContainer,
          { borderBottomWidth: 0 }
        ]}>
          <View style={styles.formFieldLabelRow}>
            <Text style={styles.formFieldLabel}>Store Name</Text>
            {focusedField === 'storeName' && (
              <View style={styles.editingBadge}>
                <Text style={styles.editingBadgeText}>EDITING</Text>
              </View>
            )}
            {form.storeName !== originalForm.storeName && (
              <Ionicons 
                name="pencil" 
                size={16} 
                color={theme.brand.primary} 
                style={styles.modifiedIndicator} 
              />
            )}
          </View>
          <TextInput
            style={[
              styles.formFieldInput,
              focusedField === 'storeName' && styles.formFieldInputEditing
            ]}
            value={form.storeName}
            onChangeText={(v) => setForm({ ...form, storeName: v })}
            onFocus={() => setFocusedField('storeName')}
            onBlur={() => setFocusedField(null)}
            placeholder="Store Name"
            placeholderTextColor={styles.settingDescription.color}
          />
        </View>
      </View>
      </View>

      <View style={styles.actionsContainer}>
      <TouchableOpacity 
        style={[
          styles.saveButton, 
          !hasUnsavedChanges && { opacity: 0.5 }
        ]} 
        onPress={handleSave}
        disabled={!hasUnsavedChanges}
      >
        <Text style={styles.saveButtonText}>
          {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
        <Text style={styles.resetButtonText}>Reset All Data</Text>
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
