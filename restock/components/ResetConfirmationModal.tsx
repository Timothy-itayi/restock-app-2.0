import { Modal, TouchableOpacity, View, Text } from "react-native";
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import colors from '../lib/theme/colors';

type ResetConfirmationModalProps = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ResetConfirmationModal = ({
  visible,
  onConfirm,
  onCancel
}: ResetConfirmationModalProps) => {
  const [step, setStep] = useState<'warning' | 'final'>('warning');

  const handleCancel = () => {
    setStep('warning');
    onCancel();
  };

  const handleGoBack = () => {
    setStep('warning');
  };

  const handleContinue = () => {
    setStep('final');
  };

  const handleConfirm = () => {
    setStep('warning');
    onConfirm();
  };

  // Reset step when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setStep('warning');
    }
  }, [visible]);

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
        {step === 'warning' ? (
          /* Step 1: Warning */
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
              backgroundColor: colors.status.error + '15',
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
                  backgroundColor: colors.status.error,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="warning" size={28} color="#fff" />
              </View>
            </View>

            {/* Content */}
            <View style={{ padding: 24 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                color: colors.neutral.darkest,
                textAlign: 'center',
                marginBottom: 16,
                letterSpacing: -0.5,
              }}>
                Reset All Data?
              </Text>

              {/* Warning Items */}
              <View style={{
                backgroundColor: colors.neutral.lighter,
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: colors.neutral.dark,
                  marginBottom: 12,
                }}>
                  This will permanently delete:
                </Text>
                
                {[
                  { icon: 'layers-outline', text: 'All sessions' },
                  { icon: 'people-outline', text: 'All suppliers' },
                  { icon: 'cube-outline', text: 'All products' },
                  { icon: 'person-outline', text: 'Your sender profile' },
                ].map((item, index) => (
                  <View key={index} style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: index < 3 ? 8 : 0,
                  }}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={16} 
                      color={colors.status.error} 
                      style={{ marginRight: 10 }} 
                    />
                    <Text style={{
                      fontSize: 14,
                      color: colors.neutral.darkest,
                    }}>
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={{ 
                color: colors.status.error, 
                textAlign: 'center',
                fontSize: 13,
                fontWeight: '600',
                marginBottom: 20,
              }}>
                This action cannot be undone.
              </Text>

              {/* Buttons */}
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={handleContinue}
                  style={{
                    paddingVertical: 14,
                    backgroundColor: colors.status.error,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ 
                    color: '#fff', 
                    fontWeight: '700',
                    fontSize: 16,
                  }}>
                    Continue
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancel}
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
        ) : (
          /* Step 2: Final Confirmation */
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
              backgroundColor: colors.status.error,
              paddingVertical: 24,
              alignItems: 'center',
            }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="trash" size={28} color="#fff" />
              </View>
            </View>

            {/* Content */}
            <View style={{ padding: 24 }}>
              <Text style={{ 
                fontSize: 20, 
                fontWeight: '800', 
                color: colors.neutral.darkest,
                textAlign: 'center',
                marginBottom: 8,
                letterSpacing: -0.5,
              }}>
                Final Confirmation
              </Text>

              <Text style={{ 
                color: colors.neutral.medium, 
                textAlign: 'center',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 24,
              }}>
                Are you absolutely sure you want to delete all data? You will be redirected to setup.
              </Text>

              {/* Buttons */}
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={handleConfirm}
                  style={{
                    paddingVertical: 14,
                    backgroundColor: colors.status.error,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ 
                    color: '#fff', 
                    fontWeight: '700',
                    fontSize: 16,
                  }}>
                    Delete Everything
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGoBack}
                  style={{
                    paddingVertical: 14,
                    backgroundColor: colors.neutral.lighter,
                    borderRadius: 12,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.neutral.light,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.neutral.dark} style={{ marginRight: 6 }} />
                  <Text style={{ 
                    color: colors.neutral.dark, 
                    fontWeight: '600',
                    fontSize: 15,
                  }}>
                    Go Back
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default ResetConfirmationModal;

