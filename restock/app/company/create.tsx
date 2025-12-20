import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useThemedStyles } from '../../styles/useThemedStyles';
import { getCompanyStyles } from '../../styles/components/company';
import { useSenderProfileStore } from '../../store/useSenderProfileStore';
import colors from '../../lib/theme/colors';

export default function CreateCompany() {
  const router = useRouter();
  const profile = useSenderProfileStore(s => s.profile);
  const [storeName, setStoreName] = useState(profile?.storeName || '');
  const { createCompany, isLoading } = useCompanyStore();
  const styles = useThemedStyles(getCompanyStyles);

  const handleCreate = async () => {
    if (!storeName.trim()) {
      Alert.alert('Error', 'Please enter a store name');
      return;
    }

    try {
      await createCompany(storeName.trim());
      router.replace('/company');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.stickyBackButton}
        >
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Create Company</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Your Store Name</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="e.g. Brighton Branch"
          placeholderTextColor="#666"
        />
        <Text style={styles.hint}>
          This name will identify your store to other managers in the company.
        </Text>

        <TouchableOpacity 
          style={[styles.button, !storeName.trim() && styles.disabledButton]}
          onPress={handleCreate}
          disabled={isLoading || !storeName.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create and Get Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

