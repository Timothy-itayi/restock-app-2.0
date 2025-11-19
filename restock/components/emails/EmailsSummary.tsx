// components/emails/EmailsSummary.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../styles/useThemeStore';

interface EmailsSummaryProps {
  emailCount: number;
  senderName: string;
  senderEmail: string;
  storeName?: string;
}

export function EmailsSummary({ emailCount, senderName, senderEmail, storeName }: EmailsSummaryProps) {
  const { theme } = useThemeStore();

  return (
    <View style={{ padding: 16 }}>
      {/* Header */}
      <View
        style={{
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: theme.neutral.light,
          backgroundColor: theme.neutral.lightest,
          marginBottom: 16
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: theme.brand.primary,
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12
            }}
          >
            <Ionicons name="mail" size={20} color={theme.neutral.lightest} />
          </View>

          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.neutral.darkest }}>
              {emailCount} Emails Ready
            </Text>
            <Text style={{ fontSize: 13, color: theme.neutral.medium }}>
              Review and send restock orders
            </Text>
          </View>
        </View>

        {/* Sender */}
        <View>
          {storeName ? (
            <Text style={{ fontSize: 15, fontWeight: '600', marginBottom: 2 }}>
              {storeName}
            </Text>
          ) : null}

          <Text style={{ fontSize: 14, color: theme.neutral.medium }}>{senderName}</Text>

          <Text style={{ fontSize: 13, color: theme.neutral.medium, fontFamily: 'monospace' }}>
            {senderEmail}
          </Text>
        </View>
      </View>
    </View>
  );
}
