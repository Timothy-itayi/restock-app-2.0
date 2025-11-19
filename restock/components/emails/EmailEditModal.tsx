import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../styles/useThemeStore';

interface EmailEditModalProps {
  visible: boolean;
  editingEmail: {
    supplierEmail: string;
    subject: string;
    body: string;
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

        <ScrollView style={{ padding: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>To</Text>
          <Text style={{ fontSize: 16, marginBottom: 16, color: theme.neutral.medium }}>
            {editingEmail.supplierEmail}
          </Text>

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
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

interface EmailDetailModalProps {
  visible: boolean;
  email: {
    supplierEmail: string;
    subject: string;
    body: string;
  } | null;
  onClose: () => void;
  onEdit: (email: { supplierEmail: string; subject: string; body: string }) => void;
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
            <Text style={{ fontSize: 16, marginBottom: 16 }}>{email.supplierEmail}</Text>
  
            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Subject</Text>
            <Text style={{ fontSize: 16, marginBottom: 16 }}>{email.subject}</Text>
  
            <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 6 }}>Message</Text>
            <Text style={{ fontSize: 15, lineHeight: 22 }}>{email.body}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }