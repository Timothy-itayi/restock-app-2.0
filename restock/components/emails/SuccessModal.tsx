import { Modal, TouchableOpacity, View, Text } from "react-native";
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../lib/theme/colors';

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
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24
        }}
      >
        <View
          style={{
            backgroundColor: colors.neutral.lightest,
            borderRadius: 16,
            width: '100%',
            maxWidth: 340,
            overflow: 'hidden',
          }}
        >
          {/* Success Header */}
          <View style={{
            backgroundColor: colors.cypress.pale,
            paddingVertical: 32,
            alignItems: 'center',
          }}>
            {/* Checkmark Circle */}
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.brand.primary,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: colors.brand.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="checkmark" size={40} color="#fff" />
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 24, alignItems: 'center' }}>
            {/* Title */}
            <Text style={{ 
              fontSize: 22, 
              fontWeight: '800', 
              color: colors.neutral.darkest,
              marginBottom: 8,
              letterSpacing: -0.5,
            }}>
              Emails Sent!
            </Text>

            {/* Subtitle */}
            <Text style={{ 
              color: colors.neutral.medium, 
              textAlign: 'center',
              fontSize: 15,
              lineHeight: 22,
              marginBottom: 8,
            }}>
              Successfully delivered to your suppliers
            </Text>

            {/* Count Badge */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.cypress.pale,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginBottom: 24,
            }}>
              <Ionicons name="mail" size={16} color={colors.cypress.deep} style={{ marginRight: 6 }} />
              <Text style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.cypress.deep,
              }}>
                {emailCount} {emailCount === 1 ? 'email' : 'emails'} sent
              </Text>
            </View>

            {/* Done Button */}
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: '100%',
                paddingVertical: 16,
                backgroundColor: colors.brand.primary,
                borderRadius: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={{ 
                color: '#fff', 
                fontWeight: '700',
                fontSize: 16,
              }}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SuccessModal;
