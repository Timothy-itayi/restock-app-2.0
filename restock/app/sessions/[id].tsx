import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import { useSessionStore } from '../../store/useSessionStore';
import { useSupplierStore } from '../../store/useSupplierStore';
import { groupBySupplier } from '../../lib/utils/groupBySupplier';
import { AlertModal } from '../../components/AlertModal';
import { useAlert } from '../../lib/hooks/useAlert';

export default function SessionDetailScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alert, hideAlert, showError, showAlert } = useAlert();

  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === id)
  );

  const suppliers = useSupplierStore((s) => s.suppliers);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const updateSession = useSessionStore((s) => s.updateSession);

  // Group items by supplier
  const supplierGroups = useMemo(() => {
    if (!session || !session.items.length) return [];
    return groupBySupplier(session.items, suppliers);
  }, [session, suppliers]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={{ padding: 16 }} onPress={() => router.replace('/')}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.emptyStateText}>Session not found.</Text>
      </SafeAreaView>
    );
  }

  const isLocked = session.status !== 'active' && session.status !== 'pendingEmails';

  const statusColor =
    session.status === 'active'
      ? styles.statusActive.color
      : styles.statusInactive.color;

  const handleComplete = () => {
    try {
      updateSession(session.id, { status: 'pendingEmails' });
      router.push({
        pathname: `/sessions/${session.id}/email-preview`,
        params: { id: session.id }
      });
    } catch (err) {
      console.error('Failed finishing session', err);
      showError('Error', 'Could not proceed to email preview.');
    }
  };

  const handleViewEmailPreview = () => {
    router.push({
      pathname: `/sessions/${session.id}/email-preview`,
      params: { id: session.id }
    });
  };
      
  const handleCancel = () => {
    showAlert('confirm', 'Cancel Session?', 'This will mark the session as cancelled.', [
      { 
        text: 'Cancel Session', 
        style: 'destructive',
        onPress: () => {
          updateSession(session.id, { status: 'cancelled' });
          router.dismissAll();
          router.replace('/');
        }
      },
      { text: 'Keep Session', style: 'cancel' },
    ]);
  };

  const handleDelete = () => {
    showAlert('delete', 'Delete Session?', 'This action cannot be undone.', [
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          deleteSession(session.id);
          router.dismissAll();
          router.replace('/');
        }
      },
      { text: 'Keep', style: 'cancel' },
    ]);
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.itemRow,
        isLocked && { opacity: 0.5 }
      ]}
      disabled={isLocked}
      onPress={() =>
        router.push(`/sessions/${session.id}/edit-product/${item.id}`)
      }
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.itemName}>{item.productName}</Text>
      </View>

      <Text style={styles.itemQty}>x{item.quantity}</Text>

      {!isLocked && (
        <Ionicons name="create-outline" size={20} color="#333" />
      )}
    </TouchableOpacity>
  );

  const renderSupplierGroup = ({ item: group }: any) => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ 
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 0, 
        paddingVertical: 8, 
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
      }}>
        <Text style={{ 
          fontSize: 12, 
          fontWeight: '800', 
          color: '#a3a695',
          marginRight: 8,
          letterSpacing: 0.5
        }}>
          [ SUPPLIER ]
        </Text>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#6B7F6B',
          flex: 1
        }}>
          {group.supplierName}
        </Text>
      </View>

      <FlatList
        data={group.items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      />
    </View>
  );

  const itemCount = session.items.length;
  const supplierCount = supplierGroups.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Session Details</Text>
      </View>

      {/* Sticky Action Bar */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      }}>
        {/* Session Info */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.sessionTitle}>
            Session {new Date(session.createdAt).toLocaleDateString()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Text style={{ fontSize: 14, color: '#6B7F6B', fontWeight: '600' }}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </Text>
            <Text style={{ fontSize: 14, color: '#999', marginHorizontal: 8 }}>•</Text>
            <Text style={{ fontSize: 14, color: '#6B7F6B', fontWeight: '600' }}>
              {supplierCount} {supplierCount === 1 ? 'supplier' : 'suppliers'}
            </Text>
            <Text style={{ fontSize: 14, color: '#999', marginHorizontal: 8 }}>•</Text>
            <Text style={[{ fontSize: 14, fontWeight: '500' }, { color: statusColor }]}>
              {session.status}
            </Text>
          </View>
        </View>

        {/* Primary Action Button */}
        {session.status === 'active' && itemCount > 0 && (
          <TouchableOpacity 
            style={[styles.primaryButton, { marginBottom: 0 }]} 
            onPress={handleComplete}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Create Emails for Review</Text>
          </TouchableOpacity>
        )}

        {session.status === 'pendingEmails' && (
          <TouchableOpacity 
            style={[styles.primaryButton, { marginBottom: 0 }]} 
            onPress={handleViewEmailPreview}
          >
            <Ionicons name="mail-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>View Email Preview</Text>
          </TouchableOpacity>
        )}

        {/* Add Product Button for active sessions */}
        {session.status === 'active' && (
          <TouchableOpacity 
            style={[styles.secondaryButton, { marginTop: 8, marginBottom: 0 }]} 
            onPress={() => router.push(`/sessions/${session.id}/add-product`)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#6B7F6B" style={{ marginRight: 8 }} />
            <Text style={styles.secondaryButtonText}>Add More Products</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ITEM LIST - GROUPED BY SUPPLIER */}
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        {session.items.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="cube-outline" size={48} color="#ccc" />
            <Text style={[styles.emptyStateText, { marginTop: 12 }]}>No items in this session yet.</Text>
            <TouchableOpacity 
              style={[styles.primaryButton, { marginTop: 16 }]} 
              onPress={() => router.push(`/sessions/${session.id}/add-product`)}
            >
              <Text style={styles.primaryButtonText}>Add First Product</Text>
            </TouchableOpacity>
          </View>
        ) : supplierGroups.length === 0 ? (
          <Text style={styles.emptyStateText}>No items to display.</Text>
        ) : (
          <FlatList
            data={supplierGroups}
            keyExtractor={(group) => group.supplierId}
            renderItem={renderSupplierGroup}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
            ListFooterComponent={() => (
              <View style={{ paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#eee', marginTop: 20 }}>
                {/* Secondary Actions */}
                {session.status === 'active' && (
                  <TouchableOpacity 
                    style={[styles.secondaryButton, { borderColor: '#999' }]} 
                    onPress={handleCancel}
                  >
                    <Text style={[styles.secondaryButtonText, { color: '#666' }]}>Cancel Session</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: '#CC0000', marginTop: 12 }]}
                  onPress={handleDelete}
                >
                  <Text style={[styles.secondaryButtonText, { color: '#CC0000' }]}>
                    Delete Session
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {/* Alert Modal */}
      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        actions={alert.actions}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}
