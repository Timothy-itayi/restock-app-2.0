import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionStore } from '../../store/useSessionStore';

export default function SessionDetailScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();

  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === id)
  );

  const deleteSession = useSessionStore((s) => s.deleteSession);
  const updateSession = useSessionStore((s) => s.updateSession);
  const hasAutoNavigated = useRef(false);

  useEffect(() => {
    if (!session) {
      console.warn('Session not found:', id);
      return;
    }
    
    // Auto-navigate to email preview if session is in pendingEmails status (only once on mount/reload)
    if (session.status === 'pendingEmails' && !hasAutoNavigated.current) {
      hasAutoNavigated.current = true;
      router.push({
        pathname: `/sessions/${session.id}/email-preview`,
        params: { id: session.id }
      });
    }
  }, [session, id]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.emptyStateText}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const isLocked = session.status !== 'active' && session.status !== 'pendingEmails'; // Allow pendingEmails to access email preview

  const statusColor =
    session.status === 'active'
      ? styles.statusActive.color
      : styles.statusInactive.color;

  const handleComplete = () => {
    try {
      // Move session to pending-email state
      updateSession(session.id, { status: 'pendingEmails' });
  
      // Navigate to email preview
      router.push({
        pathname: `/sessions/${session.id}/email-preview`,
        params: { id: session.id }
      });
      
    } catch (err) {
      console.error('Failed finishing session', err);
      Alert.alert('Error', 'Could not proceed to email preview.');
    }
  };

  const handleViewEmailPreview = () => {
    router.push({
      pathname: `/sessions/${session.id}/email-preview`,
      params: { id: session.id }
    });
  };
      
  const handleCancel = () => {
    updateSession(session.id, { status: 'cancelled' });
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Session?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteSession(session.id);
          router.back();
        }
      }
    ]);
  };

  // Disable edit if locked
  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.itemRow,
        isLocked && { opacity: 0.5 } // visual cue that it's disabled
      ]}
      disabled={isLocked} // <-- BLOCK EDIT TAP
      onPress={() =>
        router.push(`/sessions/${session.id}/edit-product/${item.id}`)
      }
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.productName}</Text>
        <Text style={styles.itemSupplier}>{item.supplierName}</Text>
      </View>

      <Text style={styles.itemQty}>x{item.quantity}</Text>

      {!isLocked && (
        <Ionicons name="create-outline" size={20} color="#333" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Session Details</Text>
      </View>

      {/* SESSION INFO */}
      <View style={styles.contentContainer}>
        <Text style={styles.sessionTitle}>
          Session {new Date(session.createdAt).toLocaleDateString()}
        </Text>

        <Text style={[styles.sessionSubtitle, { color: statusColor }]}>
          {session.items.length} items • {session.status}
        </Text>

        {/* ITEM LIST */}
        {session.items.length === 0 ? (
          <Text style={styles.emptyStateText}>No items in this session yet.</Text>
        ) : (
          <FlatList
            data={session.items}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 12 }}
          />
        )}

        {/* ADD PRODUCT BUTTON - ONLY IF ACTIVE */}
        {!isLocked && (
          <View style={{ marginTop: 14 }}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push(`/sessions/${session.id}/add-product`)}
            >
              <Text style={styles.primaryButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SESSION ACTIONS */}
        {session.status === 'active' && (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleComplete}>
              <Text style={styles.primaryButtonText}>View Email Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
              <Text style={styles.secondaryButtonText}>Cancel Session</Text>
            </TouchableOpacity>
          </>
        )}

        {/* EMAIL PREVIEW BUTTON FOR PENDING EMAILS */}
        {session.status === 'pendingEmails' && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewEmailPreview}>
            <Text style={styles.primaryButtonText}>View Email Preview</Text>
          </TouchableOpacity>
        )}

        {/* DELETE ALWAYS AVAILABLE */}
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: '#CC0000', marginTop: 20 }]}
          onPress={handleDelete}
        >
          <Text style={[styles.secondaryButtonText, { color: '#CC0000' }]}>
            Delete Session
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}
