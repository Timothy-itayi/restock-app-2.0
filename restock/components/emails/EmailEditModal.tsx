import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../styles/useThemeStore';

export function EmailDetailModal({
    visible,
    email,
    onClose,
    onEdit
  }) {
    const { theme } = useThemeStore();
    if (!email) return null;
  
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
  