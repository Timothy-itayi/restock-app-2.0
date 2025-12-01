import { Modal, TouchableOpacity, View, Text } from "react-native";
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../lib/theme/colors';

type SendConfirmationModalProps = {
  visible: boolean;
  emailCount: number;
  onConfirm: () => void;
  onCancel: () => void;
};

export const SendConfirmationModal = ({
  visible,
  emailCount,
  onConfirm,
  onCancel
}: SendConfirmationModalProps) => {
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
          {/* Header */}
          <View style={{
            backgroundColor: colors.analytics.clay + '30',
            paddingVertical: 24,
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: colors.neutral.light,
          }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.analytics.olive,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="mail" size={28} color="#fff" />
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 24 }}>
            {/* Title */}
            <Text style={{ 
              fontSize: 20, 
              fontWeight: '800', 
              color: colors.neutral.darkest,
              textAlign: 'center',
              marginBottom: 8,
              letterSpacing: -0.5,
            }}>
              Send {emailCount} {emailCount === 1 ? 'Email' : 'Emails'}?
            </Text>

            {/* Description */}
            <Text style={{ 
              color: colors.neutral.medium, 
              textAlign: 'center',
              fontSize: 14,
              lineHeight: 20,
              marginBottom: 24,
            }}>
              This will send your restock order emails to all suppliers. Make sure you've reviewed all drafts.
            </Text>

            {/* Buttons */}
            <View style={{ gap: 10 }}>
              {/* Send Button */}
              <TouchableOpacity
                onPress={onConfirm}
                style={{
                  paddingVertical: 14,
                  backgroundColor: colors.brand.primary,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ 
                  color: '#fff', 
                  fontWeight: '700',
                  fontSize: 16,
                }}>
                  Send All
                </Text>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  paddingVertical: 14,
                  backgroundColor: colors.neutral.lighter,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.neutral.light,
                }}
                activeOpacity={0.8}
              >
                <Text style={{ 
                  color: colors.neutral.dark, 
                  fontWeight: '600',
                  fontSize: 15,
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default SendConfirmationModal;
