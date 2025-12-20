import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useThemedStyles } from '../../styles/useThemedStyles';
import { getCompanyStyles } from '../../styles/components/company';
import { useSenderProfileStore } from '../../store/useSenderProfileStore';
import colors from '../../lib/theme/colors';

export default function JoinCompany() {
  const router = useRouter();
  const profile = useSenderProfileStore(s => s.profile);
  const [code, setCode] = useState('');
  const [storeName, setStoreName] = useState(profile?.storeName || '');
  const { joinCompany, isLoading } = useCompanyStore();
  const styles = useThemedStyles(getCompanyStyles);

  const handleJoin = async () => {
    if (!code.trim() || !storeName.trim()) {
      Alert.alert('Error', 'Please enter both the code and your store name');
      return;
    }

    try {
      await joinCompany(code.trim().toUpperCase(), storeName.trim());
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
        <Text style={styles.stickyHeaderTitle}>Join Company</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Invite Code</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase())}
          placeholder="XXXX-XXXX"
          placeholderTextColor="#666"
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Your Store Name</Text>
        <TextInput
          style={styles.input}
          value={storeName}
          onChangeText={setStoreName}
          placeholder="e.g. Albert Park Branch"
          placeholderTextColor="#666"
        />

        <TouchableOpacity 
          style={[styles.button, (!code.trim() || !storeName.trim()) && styles.disabledButton]}
          onPress={handleJoin}
          disabled={isLoading || !code.trim() || !storeName.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Join Team</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

