// components/emails/EmailCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../styles/useThemeStore';

interface EmailCardProps {
  email: {
    supplierId: string;
    supplierName: string;
    supplierEmail: string;
    subject: string;
    body: string;
  };
  onEdit: () => void;
  onTap?: () => void;
}

export function EmailCard({ email, onEdit, onTap }: EmailCardProps) {
  const { theme } = useThemeStore();

  const preview = email.body.split('\n')[0];

  return (
    <TouchableOpacity
      onPress={onTap}
      activeOpacity={0.7}
      style={{
        backgroundColor: theme.neutral.lightest,
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.neutral.light,
        marginBottom: 10
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: theme.neutral.darkest }}>
            {email.supplierName}
          </Text>
          <Text style={{ fontSize: 13, color: theme.neutral.medium, fontFamily: 'monospace' }}>
            {email.supplierEmail}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onEdit}
          style={{
            padding: 6,
            backgroundColor: theme.neutral.lighter,
            borderRadius: 6
          }}
        >
          <Ionicons name="pencil" size={16} color={theme.neutral.medium} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 10 }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: theme.neutral.dark }}>
          {email.subject}
        </Text>
        <Text
          numberOfLines={1}
          style={{ marginTop: 4, color: theme.neutral.medium, fontSize: 13 }}
        >
          {preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
