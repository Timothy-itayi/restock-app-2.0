import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCompanyStore } from '../../store/useCompanyStore';
import { useThemedStyles } from '../../styles/useThemedStyles';
import { getCompanyStyles } from '../../styles/components/company';
import colors from '../../lib/theme/colors';

export default function StoreList() {
  const router = useRouter();
  const { getStores, link } = useCompanyStore();
  const [stores, setStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const styles = useThemedStyles(getCompanyStyles);

  useEffect(() => {
    getStores()
      .then(setStores)
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }: { item: string }) => {
    const isMe = item === link?.storeName;
    return (
      <TouchableOpacity 
        style={styles.item}
        onPress={() => router.push(`/company/${encodeURIComponent(item)}`)}
      >
        <View>
          <Text style={styles.itemName}>{item}</Text>
          {isMe && <Text style={styles.meTag}>This Device</Text>}
        </View>
        <Text style={styles.chevron}>→</Text>
      </TouchableOpacity>
    );
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
        <Text style={styles.stickyHeaderTitle}>Company Stores</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={stores}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No other stores found</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

