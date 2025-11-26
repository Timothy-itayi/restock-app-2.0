import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform
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
  // RESET ALL - Multi-step confirmation
  //----------------------------------------------------------------------
  const handleReset = async () => {
    // Step 1: Initial warning
    Alert.alert(
      'Reset All Data',
      'This will permanently delete:\n\n• All sessions\n• All suppliers\n• All products\n• Your sender profile\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            // Step 2: Final confirmation
            Alert.alert(
              'Final Confirmation',
              'Type "RESET" to confirm you want to delete all data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Reset',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await AsyncStorage.clear();
                      useSenderProfileStore.getState().clearProfile();
                      Alert.alert(
                        'Reset Complete',
                        'All data has been cleared. You will be redirected to setup.',
                        [
                          {
                            text: 'OK',
                            onPress: () => router.replace('/auth/sender-setup')
                          }
                        ]
                      );
                    } catch (error) {
                      Alert.alert(
                        'Reset Failed',
                        'An error occurred while resetting data. Please try again.'
                      );
                    }
                  }
                }
              ]
            );
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={theme.neutral.darkest} />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Settings</Text>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Sender Identity Preview */}
        {senderProfile && !hasUnsavedChanges && (
          <View style={styles.previewContainer}>
            <View style={styles.previewHeader}>
              <Ionicons name="person-circle" size={20} color={theme.brand.primary} />
              <Text style={styles.previewTitle}>Current Sender Identity</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewLabel}>Name:</Text>
              <Text style={styles.previewValue}>{senderProfile.name || 'Not set'}</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewLabel}>Email:</Text>
              <Text style={styles.previewValue}>{senderProfile.email || 'Not set'}</Text>
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewLabel}>Store:</Text>
              <Text style={styles.previewValue}>{senderProfile.storeName || 'Not set'}</Text>
            </View>
          </View>
        )}

        {/* Unsaved Changes Indicator */}
        {hasUnsavedChanges && (
          <View style={styles.unsavedChangesBanner}>
            <Ionicons name="information-circle" size={20} color={theme.status.warning} />
            <Text style={styles.unsavedChangesText}>
              You have unsaved changes
            </Text>
          </View>
        )}

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
    </KeyboardAvoidingView>
  );
}
