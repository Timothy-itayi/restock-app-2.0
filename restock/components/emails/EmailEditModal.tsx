import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  ScrollView, 
  SafeAreaView, 
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../styles/useThemeStore';

interface EmailEditModalProps {
  visible: boolean;
  editingEmail: {
    supplierName: string;
    supplierEmail: string;
    subject: string;
    body: string;
    items?: Array<{
      productName: string;
      quantity: number;
    }>;
  } | null;
  onSave: (updated: { subject: string; body: string }) => void;
  onCancel: () => void;
}

export function EmailEditModal({
  visible,
  editingEmail,
  onSave,
  onCancel
}: EmailEditModalProps) {
  const { theme } = useThemeStore();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (editingEmail) {
      setSubject(editingEmail.subject || '');
      setBody(editingEmail.body || '');
    }
  }, [editingEmail]);

  if (!visible || !editingEmail) return null;

  const handleSave = () => {
    onSave({ subject, body });
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.neutral.lightest }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.neutral.light
            }}
          >
            <TouchableOpacity
              onPress={onCancel}
              style={{
                padding: 6,
                backgroundColor: theme.neutral.lighter,
                borderRadius: 8
              }}
            >
              <Ionicons name="close" size={16} color={theme.neutral.medium} />
            </TouchableOpacity>

            <Text style={{ fontSize: 18, fontWeight: '600' }}>Edit Email</Text>

            <TouchableOpacity
              onPress={handleSave}
              style={{
                padding: 6,
                backgroundColor: theme.neutral.lighter,
                borderRadius: 8
              }}
            >
              <Ionicons name="checkmark" size={16} color={theme.neutral.medium} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>To</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, marginBottom: 4, color: theme.neutral.darkest, fontWeight: '600' }}>
                {editingEmail.supplierName}
              </Text>
              <Text style={{ fontSize: 14, color: theme.neutral.dark }}>
                {editingEmail.supplierEmail}
              </Text>
            </View>

            {editingEmail.items && editingEmail.items.length > 0 && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 8 }}>Items in this order</Text>
                <View style={{
                  backgroundColor: theme.neutral.lighter,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.neutral.light
                }}>
                  {editingEmail.items.map((item, index) => (
                    <Text key={index} style={{ fontSize: 14, color: theme.neutral.dark, marginBottom: 4 }}>
                      • {item.productName}{item.quantity > 1 ? ` (x${item.quantity})` : ''}
                    </Text>
                  ))}
                </View>
              </>
            )}

            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Subject</Text>
            <TextInput
              style={{
                fontSize: 16,
                marginBottom: 16,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.neutral.light,
                borderRadius: 8,
                backgroundColor: theme.neutral.lightest
              }}
              value={subject}
              onChangeText={setSubject}
              placeholder="Email subject"
            />

            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Message</Text>
            <TextInput
              style={{
                fontSize: 15,
                minHeight: 200,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.neutral.light,
                borderRadius: 8,
                backgroundColor: theme.neutral.lightest,
                textAlignVertical: 'top'
              }}
              value={body}
              onChangeText={setBody}
              placeholder="Email message"
              multiline
              scrollEnabled={false}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

interface EmailDetailModalProps {
  visible: boolean;
  email: {
    supplierName: string;
    supplierEmail: string;
    subject: string;
    body: string;
    items?: Array<{
      productName: string;
      quantity: number;
    }>;
  } | null;
  onClose: () => void;
  onEdit: (email: { supplierName: string; supplierEmail: string; subject: string; body: string; items?: Array<{ productName: string; quantity: number }> }) => void;
}

export function EmailDetailModal({
    visible,
    email,
    onClose,
    onEdit
  }: EmailDetailModalProps) {
    const { theme } = useThemeStore();
    if (!visible || !email) return null;
  
    return (
      <Modal visible={visible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.neutral.lightest }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: theme.neutral.light
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: 6,
                backgroundColor: theme.neutral.lighter,
                borderRadius: 8
              }}
            >
              <Ionicons name="close" size={16} color={theme.neutral.medium} />
            </TouchableOpacity>
  
            <Text style={{ fontSize: 18, fontWeight: '600' }}>Email Details</Text>
  
            <TouchableOpacity
              onPress={() => {
                onClose();
                onEdit(email);
              }}
              style={{
                padding: 6,
                backgroundColor: theme.neutral.lighter,
                borderRadius: 8
              }}
            >
              <Ionicons name="pencil" size={16} color={theme.neutral.medium} />
            </TouchableOpacity>
          </View>
  
          <ScrollView style={{ padding: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>To</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, marginBottom: 4, fontWeight: '600', color: theme.neutral.darkest }}>
                {email.supplierName}
              </Text>
              <Text style={{ fontSize: 14, color: theme.neutral.dark }}>
                {email.supplierEmail}
              </Text>
            </View>

            {email.items && email.items.length > 0 && (
              <>
                <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Items in this order</Text>
                <View style={{
                  backgroundColor: theme.neutral.lighter,
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.neutral.light
                }}>
                  {email.items.map((item, index) => (
                    <Text key={index} style={{ fontSize: 14, color: theme.neutral.dark, marginBottom: 4 }}>
                      • {item.productName}{item.quantity > 1 ? ` (x${item.quantity})` : ''}
                    </Text>
                  ))}
                </View>
              </>
            )}
  
            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Subject</Text>
            <Text style={{ fontSize: 16, marginBottom: 16 }}>{email.subject}</Text>
  
            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Message</Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: theme.neutral.darkest }}>{email.body}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }