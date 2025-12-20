import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useThemedStyles } from '../../styles/useThemedStyles';
import { getCompanyStyles } from '../../styles/components/company';
import colors from '../../lib/theme/colors';

export default function CompanyIndex() {
  const router = useRouter();
  const { link } = useCompanyStore();
  const styles = useThemedStyles(getCompanyStyles);

  if (link) {
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
          <Text style={styles.stickyHeaderTitle}>Your Company</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Connected to Team</Text>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Invite Code</Text>
            <Text style={styles.code}>{link.code}</Text>
            <Text style={styles.hint}>Share this code with other managers</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/company/stores')}
          >
            <Text style={styles.buttonText}>View Other Stores</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => useCompanyStore.getState().leaveCompany()}
          >
            <Text style={styles.secondaryButtonText}>Leave Company</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.stickyHeaderTitle}>Multi-Store Team</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Collaborate with other stores</Text>
        <Text style={styles.description}>
          Connect with other managers in your company to see each other's restock sessions.
        </Text>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/company/create')}
        >
          <Text style={styles.buttonText}>Create Company</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/company/join')}
        >
          <Text style={styles.secondaryButtonText}>Join with Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

