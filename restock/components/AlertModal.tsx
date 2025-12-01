import { Modal, TouchableOpacity, View, Text } from "react-native";
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import colors from '../lib/theme/colors';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm' | 'delete';

export type AlertAction = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertModalProps = {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  actions?: AlertAction[];
  onClose: () => void;
};

const getAlertConfig = (type: AlertType) => {
  switch (type) {
    case 'success':
      return {
        icon: 'checkmark-circle' as const,
        headerBg: colors.cypress.pale,
        iconBg: colors.brand.primary,
        iconColor: '#fff',
      };
    case 'warning':
      return {
        icon: 'alert-circle' as const,
        headerBg: colors.analytics.clay + '30',
        iconBg: colors.analytics.olive,
        iconColor: '#fff',
      };
    case 'error':
      return {
        icon: 'close-circle' as const,
        headerBg: colors.status.error + '15',
        iconBg: colors.status.error,
        iconColor: '#fff',
      };
    case 'confirm':
      return {
        icon: 'help-circle' as const,
        headerBg: colors.analytics.clay + '30',
        iconBg: colors.analytics.olive,
        iconColor: '#fff',
      };
    case 'delete':
      return {
        icon: 'trash' as const,
        headerBg: colors.status.error + '15',
        iconBg: colors.status.error,
        iconColor: '#fff',
      };
    case 'info':
    default:
      return {
        icon: 'information-circle' as const,
        headerBg: colors.cypress.pale,
        iconBg: colors.brand.primary,
        iconColor: '#fff',
      };
  }
};

export const AlertModal = ({
  visible,
  type = 'info',
  title,
  message,
  actions,
  onClose
}: AlertModalProps) => {
  const config = getAlertConfig(type);
  
  // Default actions if none provided
  const displayActions = actions && actions.length > 0 ? actions : [
    { text: 'OK', onPress: onClose, style: 'default' as const }
  ];

  const handleAction = (action: AlertAction) => {
    if (action.onPress) {
      action.onPress();
    }
    onClose();
  };

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
            maxWidth: 320,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <View style={{
            backgroundColor: config.headerBg,
            paddingVertical: 20,
            alignItems: 'center',
          }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: config.iconBg,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name={config.icon} size={26} color={config.iconColor} />
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 20 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '700', 
              color: colors.neutral.darkest,
              textAlign: 'center',
              marginBottom: message ? 8 : 0,
            }}>
              {title}
            </Text>

            {message && (
              <Text style={{ 
                color: colors.neutral.medium, 
                textAlign: 'center',
                fontSize: 14,
                lineHeight: 20,
                marginBottom: 4,
              }}>
                {message}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={{ 
            paddingHorizontal: 20, 
            paddingBottom: 20,
            gap: 8,
          }}>
            {displayActions.map((action, index) => {
              const isDestructive = action.style === 'destructive';
              const isCancel = action.style === 'cancel';
              
              let buttonBg = colors.brand.primary;
              let buttonTextColor = '#fff';
              let buttonBorder = 'transparent';
              
              if (isDestructive) {
                buttonBg = colors.status.error;
              } else if (isCancel) {
                buttonBg = colors.neutral.lightest;
                buttonTextColor = colors.neutral.dark;
                buttonBorder = colors.neutral.light;
              }

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleAction(action)}
                  style={{
                    paddingVertical: 12,
                    backgroundColor: buttonBg,
                    borderRadius: 10,
                    alignItems: 'center',
                    borderWidth: isCancel ? 1 : 0,
                    borderColor: buttonBorder,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ 
                    color: buttonTextColor, 
                    fontWeight: '600',
                    fontSize: 15,
                  }}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;

