// components/emails/EmailCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../lib/store/useThemeStore';

interface EmailCardProps {
  email: {
    supplierId: string;
    supplierName: string;
    supplierEmail: string;
    subject: string;
    body: string;
  };
  onEdit: () => void;
  onSend?: () => void;
  onTap?: () => void;
  isSending?: boolean;
  isSent?: boolean;
}

export function EmailCard({ email, onEdit, onSend, onTap, isSending, isSent }: EmailCardProps) {
  const { theme } = useThemeStore();

  const preview = email.body.split('\n')[0];

  return (
    <TouchableOpacity
      onPress={onTap}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.neutral.lightest,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isSent ? theme.status.success : theme.neutral.light,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.neutral.darkest }}>
              {email.supplierName}
            </Text>
            {isSent && (
              <View style={{ 
                marginLeft: 8, 
                backgroundColor: theme.status.success, 
                paddingHorizontal: 6, 
                paddingVertical: 2, 
                borderRadius: 4 
              }}>
                <Text style={{ fontSize: 10, color: '#fff', fontWeight: '700' }}>SENT</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 13, color: theme.neutral.medium, marginTop: 2 }}>
            {email.supplierEmail}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onEdit}
            disabled={isSent || isSending}
            style={{
              padding: 8,
              backgroundColor: theme.neutral.lighter,
              borderRadius: 8,
              opacity: isSent ? 0.5 : 1
            }}
          >
            <Ionicons name="pencil" size={18} color={theme.neutral.medium} />
          </TouchableOpacity>

          {onSend && (
            <TouchableOpacity
              onPress={onSend}
              disabled={isSent || isSending}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: isSent ? theme.neutral.light : theme.brand.primary,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 70,
              }}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons 
                    name={isSent ? "checkmark-circle" : "send-outline"} 
                    size={16} 
                    color="#fff" 
                    style={{ marginRight: 4 }} 
                  />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                    {isSent ? 'Sent' : 'Send'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.neutral.lighter }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: theme.neutral.dark }}>
          {email.subject}
        </Text>
        <Text
          numberOfLines={2}
          style={{ marginTop: 6, color: theme.neutral.medium, fontSize: 13, lineHeight: 18 }}
        >
          {preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
