import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSettingsStyles } from '@styles/components/settings';
import { useSafeTheme } from '../../lib/store/useThemeStore';
import colors from '../../lib/theme/colors';
import { ResetConfirmationModal } from '../../components/ResetConfirmationModal';
import { AlertModal } from '../../components/AlertModal';
import { useAlert } from '../../lib/hooks/useAlert';

import {
  useSenderProfileStore,
  useSenderProfileHydrated
} from '../../store/useSenderProfileStore';

export default function SettingsScreen() {
  const styles = useThemedStyles(getSettingsStyles);
  const { theme } = useSafeTheme();
  const { alert, hideAlert, showError, showSuccess, showWarning } = useAlert();

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
  const [showResetModal, setShowResetModal] = useState(false);

  // Check if form has unsaved changes
  const hasUnsavedChanges = 
    form.name !== originalForm.name ||
    form.email !== originalForm.email ||
    form.storeName !== originalForm.storeName;

  useEffect(() => {
    if (!isHydrated) {
      loadProfileFromStorage();
      return;
    }

    setLoading(false);

    if (senderProfile) {
      const newForm = {
        name: senderProfile.name || '',
        email: senderProfile.email || '',
        storeName: senderProfile.storeName ?? ''
      };
      setForm(newForm);
      setOriginalForm(newForm);
    } else {
      const emptyForm = { name: '', email: '', storeName: '' };
      setForm(emptyForm);
      setOriginalForm(emptyForm);
    }
  }, [isHydrated, senderProfile, loadProfileFromStorage]);

  const isValidEmail = (email: string) =>
    email.includes('@') && email.trim().length > 2;

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.storeName.trim()) {
      showWarning('Missing Fields', 'Name, email, and store name are required.');
      return;
    }

    if (!isValidEmail(form.email)) {
      showError('Invalid Email', 'Please provide a valid email address.');
      return;
    }

    updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      storeName: form.storeName.trim()
    });

    await saveProfileToStorage();

    setOriginalForm({
      name: form.name.trim(),
      email: form.email.trim(),
      storeName: form.storeName.trim() || ''
    });

    showSuccess('Profile Saved', 'Your profile has been updated.');
  };

  const handleResetConfirm = async () => {
    setShowResetModal(false);
    try {
      await AsyncStorage.clear();
      useSenderProfileStore.getState().clearProfile();
      router.replace('/welcome');
    } catch (error) {
      showError('Reset Failed', 'An error occurred while resetting data. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.lightest }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.neutral.medium, fontSize: 14 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.lightest }}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Settings</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Current Identity Section */}
          {senderProfile && !hasUnsavedChanges && (
            <>
              <View style={{ paddingTop: 20, paddingBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
                  <View style={{
                    width: 4,
                    height: 20,
                    backgroundColor: colors.brand.primary,
                    borderRadius: 2,
                    marginRight: 10,
                  }} />
                  <Ionicons name="person-circle-outline" size={16} color={colors.brand.primary} style={{ marginRight: 6 }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.brand.primary,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}>
                    Current Identity
                  </Text>
                </View>
              </View>

              <View style={{
                backgroundColor: colors.neutral.lightest,
                overflow: 'hidden',
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: colors.neutral.light,
              }}>
                {/* Name */}
                <View style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Ionicons name="person-outline" size={14} color={colors.neutral.medium} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11, color: colors.neutral.medium, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Name
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.neutral.darkest, marginLeft: 20 }}>
                    {senderProfile.name || 'Not set'}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.neutral.light, marginHorizontal: 16 }} />

                {/* Email */}
                <View style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Ionicons name="mail-outline" size={14} color={colors.neutral.medium} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11, color: colors.neutral.medium, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Email
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.neutral.darkest, marginLeft: 20 }}>
                    {senderProfile.email || 'Not set'}
                  </Text>
                </View>
                <View style={{ height: 1, backgroundColor: colors.neutral.light, marginHorizontal: 16 }} />

                {/* Store */}
                <View style={{ paddingVertical: 14, paddingHorizontal: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Ionicons name="storefront-outline" size={14} color={colors.neutral.medium} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 11, color: colors.neutral.medium, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Store
                    </Text>
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.neutral.darkest, marginLeft: 20 }}>
                    {senderProfile.storeName || 'Not set'}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Unsaved Changes Banner */}
          {hasUnsavedChanges && (
            <View style={{
              marginTop: 16,
              padding: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.analytics.clay + '30',
              flexDirection: 'row',
              alignItems: 'center',
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.analytics.clay,
            }}>
              <Ionicons name="alert-circle" size={18} color={colors.analytics.olive} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: colors.analytics.olive, fontWeight: '600' }}>
                You have unsaved changes
              </Text>
            </View>
          )}

          {/* Edit Profile Section */}
          <View style={{ paddingTop: 24, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              <View style={{
                width: 4,
                height: 20,
                backgroundColor: colors.cypress.deep,
                borderRadius: 2,
                marginRight: 10,
              }} />
              <Ionicons name="create-outline" size={16} color={colors.cypress.deep} style={{ marginRight: 6 }} />
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.cypress.deep,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
                Edit Profile
              </Text>
            </View>
          </View>

          <View style={{
            backgroundColor: colors.neutral.lightest,
            overflow: 'hidden',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: colors.neutral.light,
          }}>
            {/* Name Input */}
            <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.neutral.dark,
                  letterSpacing: 0.5,
                }}>
                  Name
                </Text>
                {form.name !== originalForm.name && (
                  <View style={{
                    backgroundColor: colors.cypress.pale,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.cypress.deep }}>MODIFIED</Text>
                  </View>
                )}
              </View>
              <TextInput
                style={{
                  backgroundColor: colors.neutral.lighter,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  borderWidth: focusedField === 'name' ? 2 : 1,
                  borderColor: focusedField === 'name' ? colors.brand.primary : colors.neutral.light,
                }}
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholder="Your name"
                placeholderTextColor={colors.neutral.medium}
              />
            </View>
            <View style={{ height: 1, backgroundColor: colors.neutral.light, marginHorizontal: 16 }} />

            {/* Email Input */}
            <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.neutral.dark,
                  letterSpacing: 0.5,
                }}>
                  Email
                </Text>
                {form.email !== originalForm.email && (
                  <View style={{
                    backgroundColor: colors.cypress.pale,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.cypress.deep }}>MODIFIED</Text>
                  </View>
                )}
              </View>
              <TextInput
                style={{
                  backgroundColor: colors.neutral.lighter,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  borderWidth: focusedField === 'email' ? 2 : 1,
                  borderColor: focusedField === 'email' ? colors.brand.primary : colors.neutral.light,
                }}
                value={form.email}
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(v) => setForm({ ...form, email: v })}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="your@email.com"
                placeholderTextColor={colors.neutral.medium}
              />
            </View>
            <View style={{ height: 1, backgroundColor: colors.neutral.light, marginHorizontal: 16 }} />

            {/* Store Name Input */}
            <View style={{ paddingVertical: 12, paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: colors.neutral.dark,
                  letterSpacing: 0.5,
                }}>
                  Store Name
                </Text>
                {form.storeName !== originalForm.storeName && (
                  <View style={{
                    backgroundColor: colors.cypress.pale,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.cypress.deep }}>MODIFIED</Text>
                  </View>
                )}
              </View>
              <TextInput
                style={{
                  backgroundColor: colors.neutral.lighter,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  fontSize: 16,
                  color: colors.neutral.darkest,
                  borderWidth: focusedField === 'storeName' ? 2 : 1,
                  borderColor: focusedField === 'storeName' ? colors.brand.primary : colors.neutral.light,
                }}
                value={form.storeName}
                onChangeText={(v) => setForm({ ...form, storeName: v })}
                onFocus={() => setFocusedField('storeName')}
                onBlur={() => setFocusedField(null)}
                placeholder="Your store name"
                placeholderTextColor={colors.neutral.medium}
              />
            </View>
          </View>

          {/* Actions Section */}
          <View style={{ paddingTop: 24, paddingBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 }}>
              <View style={{
                width: 4,
                height: 20,
                backgroundColor: colors.neutral.medium,
                borderRadius: 2,
                marginRight: 10,
              }} />
              <Ionicons name="settings-outline" size={16} color={colors.neutral.medium} style={{ marginRight: 6 }} />
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: colors.neutral.medium,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
                Actions
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: 16 }}>
            {/* Save Button */}
            <TouchableOpacity 
              style={{
                backgroundColor: hasUnsavedChanges ? colors.brand.primary : colors.cypress.soft,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: hasUnsavedChanges ? 1 : 0.7,
              }} 
              onPress={handleSave}
              disabled={!hasUnsavedChanges}
            >
              <Ionicons 
                name={hasUnsavedChanges ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color="#fff" 
                style={{ marginRight: 8 }} 
              />
              <Text style={{
                color: '#fff',
                fontSize: 16,
                fontWeight: '700',
              }}>
                {hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
              </Text>
            </TouchableOpacity>

            {/* Reset Button */}
            <TouchableOpacity 
              style={{
                backgroundColor: colors.neutral.lightest,
                paddingVertical: 16,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                marginTop: 12,
                borderWidth: 1,
                borderColor: colors.status.error,
              }} 
              onPress={() => setShowResetModal(true)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.status.error} style={{ marginRight: 8 }} />
              <Text style={{
                color: colors.status.error,
                fontSize: 16,
                fontWeight: '600',
              }}>
                Reset All Data
              </Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={{ paddingHorizontal: 16, paddingTop: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: colors.neutral.medium }}>
              Restock App v1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Reset Confirmation Modal */}
      <ResetConfirmationModal
        visible={showResetModal}
        onConfirm={handleResetConfirm}
        onCancel={() => setShowResetModal(false)}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        actions={alert.actions}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}
