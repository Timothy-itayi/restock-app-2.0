import { Modal, TouchableOpacity, View, Text } from "react-native";
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../styles/useThemeStore';

type SuccessModalProps = {
  visible: boolean;
  emailCount: number;
  onClose: () => void;
};

export const SuccessModal = ({
  visible,
  emailCount,
  onClose
}: SuccessModalProps) => {
  const { theme } = useThemeStore();
  
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}
      >
        <View
          style={{
            backgroundColor: theme.neutral.lightest,
            padding: 24,
            borderRadius: 12,
            width: '100%',
            maxWidth: 380,
            alignItems: 'center'
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: theme.status.success,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16
            }}
          >
            <Ionicons name="checkmark" size={32} color="white" />
          </View>

          <Text style={{ 
            fontSize: 20, 
            fontWeight: '700', 
            marginBottom: 8,
            color: theme.neutral.darkest
          }}>
            Emails Sent!
          </Text>
  
          <Text style={{ 
            color: theme.neutral.medium, 
            marginBottom: 24,
            textAlign: 'center',
            fontSize: 14
          }}>
            Successfully sent {emailCount} {emailCount === 1 ? 'email' : 'emails'} to your suppliers.
          </Text>
  
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: '100%',
              padding: 12,
              backgroundColor: theme.brand.primary,
              borderRadius: 8,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;

