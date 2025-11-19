import { Modal, TouchableOpacity, View, Text } from "react-native";
import React from 'react';


export const SendConfirmationModal = ({
    visible,
    emailCount,
    onConfirm,
    onCancel
  }) => {
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
              maxWidth: 380
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
              Send {emailCount} Emails?
            </Text>
  
            <Text style={{ color: theme.neutral.medium, marginBottom: 24 }}>
              This will send your restock order emails to all suppliers.
            </Text>
  
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={onCancel}
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: theme.neutral.lighter,
                  borderRadius: 8
                }}
              >
                <Text style={{ color: theme.neutral.dark, textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
  
              <TouchableOpacity
                onPress={onConfirm}
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: theme.brand.primary,
                  borderRadius: 8
                }}
              >
                <Text style={{ color: 'white', textAlign: 'center' }}>Send All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  export default SendConfirmationModal;

function useThemeStore(): { theme: any; } {
    throw new Error("Function not implemented.");
}
