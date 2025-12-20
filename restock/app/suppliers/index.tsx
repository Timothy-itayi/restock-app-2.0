import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSuppliersStyles } from '@styles/components/suppliers';
import { useSupplierStore, type Supplier } from '../../store/useSupplierStore';
import colors from '../../lib/theme/colors';
import { AlertModal } from '../../components/AlertModal';
import { useAlert } from '../../lib/hooks/useAlert';

export default function SuppliersScreen() {
  const styles = useThemedStyles(getSuppliersStyles);
  const suppliers = useSupplierStore((state) => state.suppliers);
  const addSupplier = useSupplierStore((state) => state.addSupplier);
  const updateSupplier = useSupplierStore((state) => state.updateSupplier);
  const deleteSupplier = useSupplierStore((state) => state.deleteSupplier);
  const loadSuppliers = useSupplierStore((state) => state.loadSuppliers);
  
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const { alert, hideAlert, showError, showWarning, showDelete } = useAlert();

  // Load from storage
  useEffect(() => {
    loadSuppliers().finally(() => setLoading(false));
  }, [loadSuppliers]);

  const saveSupplier = async () => {
    if (!name.trim()) {
      showError('Missing Field', 'Supplier name is required');
      return;
    }

    if (!email.trim()) {
      showError('Missing Field', 'Supplier email is required');
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
      showWarning(
        'Duplicate Supplier',
        `A supplier with the name "${trimmedName}" already exists. Please use a different name.`
      );
      return;
    }

    if (editing) {
      updateSupplier(editing.id, {
        name: trimmedName,
        email: trimmedEmail
      });
    } else {
      addSupplier(trimmedName, trimmedEmail);
    }

    setEditing(null);
    setName('');
    setEmail('');
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    showDelete(
      'Delete Supplier',
      `Are you sure you want to delete "${supplier.name}"?`,
      () => {
        try {
          deleteSupplier(supplier.id);

          if (editing && editing.id === supplier.id) {
            setEditing(null);
            setName('');
            setEmail('');
          }
        } catch (error) {
          console.warn('Error deleting supplier:', error);
          showError('Delete Failed', 'Failed to delete supplier. Please try again.');
        }
      }
    );
  };

  const startEdit = (sup: Supplier) => {
    setEditing(sup);
    setName(sup.name);
    setEmail(sup.email || '');
  };

  const cancel = () => {
    setEditing(null);
    setName('');
    setEmail('');
  };

  const renderSupplierItem = ({ item, index }: { item: Supplier; index: number }) => {
    const isEditing = editing?.id === item.id;
    
    return (
      <View>
        <View style={{
          backgroundColor: isEditing ? colors.cypress.pale : colors.neutral.lightest,
          paddingVertical: 16,
          paddingHorizontal: 16,
        }}>
          {isEditing ? (
            // Inline edit form
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{
                  width: 4,
                  height: 16,
                  backgroundColor: colors.cypress.deep,
                  borderRadius: 2,
                  marginRight: 8,
                }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.cypress.deep,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Editing Supplier
                </Text>
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.neutral.dark,
                  marginBottom: 4,
                  letterSpacing: 0.5,
                }}>
                  Supplier Name
                </Text>
                <TextInput
                  placeholder="Enter supplier name"
                  placeholderTextColor={colors.neutral.medium}
                  value={name}
                  onChangeText={setName}
                  style={[styles.textInput, { backgroundColor: colors.neutral.lightest }]}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: colors.neutral.dark,
                  marginBottom: 4,
                  letterSpacing: 0.5,
                }}>
                  Email Address
                </Text>
                <TextInput
                  placeholder="Enter email address"
                  placeholderTextColor={colors.neutral.medium}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.textInput, { backgroundColor: colors.neutral.lightest }]}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={saveSupplier}
                  style={[styles.saveButton, { flex: 1, paddingVertical: 12 }]}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={cancel}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    backgroundColor: colors.neutral.lightest,
                    borderRadius: 8,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.neutral.light,
                  }}
                >
                  <Text style={{ color: colors.neutral.dark, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // View mode
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => startEdit(item)}
                style={{ flex: 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: colors.cypress.deep,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}>
                    Supplier
                  </Text>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: colors.cypress.muted,
                    marginLeft: 8,
                  }} />
                </View>
                
                <Text style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.neutral.darkest,
                  marginBottom: 6,
                }}>
                  {item.name}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="mail-outline" size={14} color={colors.neutral.medium} style={{ marginRight: 6 }} />
                  <Text style={{
                    fontSize: 14,
                    color: item.email ? colors.neutral.medium : colors.status.error,
                  }}>
                    {item.email || 'No email - tap to add'}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TouchableOpacity
                  onPress={() => startEdit(item)}
                  style={{
                    padding: 10,
                    backgroundColor: colors.cypress.pale,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="pencil" size={18} color={colors.cypress.deep} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteSupplier(item)}
                  style={{
                    padding: 10,
                    backgroundColor: '#FEE2E2',
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="trash" size={18} color={colors.status.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        
        {index < suppliers.length - 1 && !isEditing && (
          <View style={{
            height: 1,
            backgroundColor: colors.neutral.light,
            marginHorizontal: 16,
          }} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Suppliers</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Add New Supplier Section - only show when not editing */}
          {!editing && (
            <>
              <View style={{
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 4,
                    height: 20,
                    backgroundColor: colors.cypress.deep,
                    borderRadius: 2,
                    marginRight: 10,
                  }} />
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: colors.cypress.deep,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}>
                    Add New Supplier
                  </Text>
                </View>
              </View>

              <View style={[styles.formCard, { marginHorizontal: 16, marginTop: 8 }]}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.neutral.dark,
                    marginBottom: 6,
                    letterSpacing: 0.5,
                  }}>
                    Supplier Name
                  </Text>
                  <TextInput
                    placeholder="Enter supplier name"
                    placeholderTextColor={colors.neutral.medium}
                    value={name}
                    onChangeText={setName}
                    style={styles.textInput}
                  />
                </View>

                <View style={{ marginBottom: 20 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: colors.neutral.dark,
                    marginBottom: 6,
                    letterSpacing: 0.5,
                  }}>
                    Email Address
                  </Text>
                  <TextInput
                    placeholder="Enter email address"
                    placeholderTextColor={colors.neutral.medium}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={styles.textInput}
                  />
                </View>

                <TouchableOpacity
                  onPress={saveSupplier}
                  style={styles.saveButton}
                >
                  <Text style={styles.saveButtonText}>Add Supplier</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={{
            paddingTop: 24,
            paddingBottom: 8,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 4,
                  height: 20,
                  backgroundColor: colors.brand.primary,
                  borderRadius: 2,
                  marginRight: 10,
                }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.brand.primary,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}>
                  Your Suppliers
                </Text>
              </View>
              <View style={{
                backgroundColor: colors.cypress.pale,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: colors.cypress.deep,
                }}>
                  {suppliers.length}
                </Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ color: colors.neutral.medium, fontSize: 14 }}>Loading suppliers...</Text>
            </View>
          ) : suppliers.length === 0 ? (
            <View style={{ 
              padding: 40, 
              alignItems: 'center',
              backgroundColor: colors.cypress.pale,
              marginHorizontal: 16,
              borderRadius: 12,
              marginTop: 8,
            }}>
              <Ionicons name="people-outline" size={48} color={colors.neutral.medium} />
              <Text style={{ 
                color: colors.neutral.dark, 
                fontSize: 16, 
                fontWeight: '600',
                marginTop: 12,
              }}>
                No suppliers yet
              </Text>
              <Text style={{ 
                color: colors.neutral.medium, 
                fontSize: 14, 
                textAlign: 'center',
                marginTop: 6,
                paddingHorizontal: 20,
              }}>
                Add suppliers manually or they will be added automatically when you upload documents.
              </Text>
            </View>
          ) : (
            <View style={{
              backgroundColor: colors.neutral.lightest,
              marginTop: 8,
              overflow: 'hidden',
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: colors.neutral.light,
            }}>
              <FlatList
                data={suppliers}
                keyExtractor={i => i.id}
                renderItem={renderSupplierItem}
                scrollEnabled={false}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

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
