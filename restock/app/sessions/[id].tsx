import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  TextInput
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import colors from '@styles/theme/colors';
import { useSessionHydrated, useSessionStore } from '../../store/useSessionStore';
import { useSupplierStore } from '../../store/useSupplierStore';
import { groupBySupplier } from '../../lib/utils/groupBySupplier';
import { AlertModal } from '../../components/AlertModal';
import { useAlert } from '../../lib/hooks/useAlert';
import { useSessionNavigation } from '../../lib/hooks/useSessionNavigation';
import logger from '../../lib/helpers/logger';

export default function SessionDetailScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { alert, hideAlert, showError, showAlert } = useAlert();
  const sessionNavigation = useSessionNavigation();
  const [searchQuery, setSearchQuery] = useState('');

  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === id)
  );

  const isHydrated = useSessionHydrated();
  const loadSessions = useSessionStore((s) => s.loadSessionsFromStorage);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const updateSession = useSessionStore((s) => s.updateSession);

  useEffect(() => {
    if (!isHydrated) {
      loadSessions().catch((error) =>
        logger.warn('Failed to hydrate sessions before detail screen', error)
      );
    }
  }, [isHydrated, loadSessions]);

  // Group items by supplier and filter by search
  const supplierGroups = useMemo(() => {
    if (!session || !session.items.length) return [];
    
    let filteredItems = session.items;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredItems = session.items.filter(item => {
        const productMatch = item.productName?.toLowerCase().includes(query);
        const supplierMatch = suppliers
          .find(s => s.id === item.supplierId)
          ?.name?.toLowerCase().includes(query);
        return productMatch || supplierMatch;
      });
    }
    
    return groupBySupplier(filteredItems, suppliers);
  }, [session, suppliers, searchQuery]);

  if (!isHydrated) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyStateText}>Loading session...</Text>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={{ padding: 16 }} onPress={sessionNavigation.goToDashboard}>
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
      sessionNavigation.openEmailPreview(session.id);
    } catch (err) {
      logger.error('Failed finishing session', err);
      showError('Error', 'Could not proceed to email preview.');
    }
  };

  const handleViewEmailPreview = () => {
    sessionNavigation.openEmailPreview(session.id);
  };
      
  const handleCancel = () => {
    showAlert('confirm', 'Cancel Session?', 'This will mark the session as cancelled.', [
      { 
        text: 'Cancel Session', 
        style: 'destructive',
        onPress: () => {
          updateSession(session.id, { status: 'cancelled' });
          sessionNavigation.goToSessionList();
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
          sessionNavigation.goToSessionList();
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
        sessionNavigation.openEditProduct(session.id, item.id)
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

  const renderSupplierGroup = ({ item: group }: any) => {
    const isCompleted = session?.status === 'completed';
    const supplierEmail = suppliers.find(s => s.id === group.supplierId)?.email;

    return (
      <View style={{ marginBottom: 24 }}>
        <View style={{ 
          flexDirection: 'row',
          alignItems: 'baseline',
          paddingHorizontal: 0, 
          paddingVertical: 12, 
          marginBottom: 8,
          borderBottomWidth: 2,
          borderBottomColor: '#6B7F6B',
          backgroundColor: '#f9f9f9',
          paddingLeft: 8,
          borderRadius: 4,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '800', 
              color: '#6B7F6B',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}>
              {group.supplierName}
            </Text>
            {isCompleted && supplierEmail && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="mail-outline" size={12} color="#999" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, color: '#999' }}>{supplierEmail}</Text>
              </View>
            )}
          </View>
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
  };

  const itemCount = session.items.length;
  const supplierCount = supplierGroups.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={sessionNavigation.goBack} style={styles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={[styles.stickyHeaderTitle, { flex: 1 }]}>Session Details</Text>
        <TouchableOpacity 
          onPress={handleDelete}
          style={{ padding: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.status.error} />
        </TouchableOpacity>
      </View>

      {/* Sticky Action Bar */}
      <View style={{ 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      }}>
        {/* Search Bar */}
        {session.items.length > 0 && (
          <View style={{
            marginBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}>
            <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products or suppliers..."
              placeholderTextColor="#999"
              style={{
                flex: 1,
                fontSize: 15,
                color: '#333',
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        )}

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
              {supplierGroups.length} {supplierGroups.length === 1 ? 'supplier' : 'suppliers'}
            </Text>
            {searchQuery.trim() && (
              <>
                <Text style={{ fontSize: 14, color: '#999', marginHorizontal: 8 }}>•</Text>
                <Text style={{ fontSize: 14, color: '#999' }}>
                  {supplierGroups.reduce((sum, g) => sum + g.items.length, 0)} matching
                </Text>
              </>
            )}
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
            onPress={() => sessionNavigation.openAddProduct(session.id)}
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
            {session.status === 'active' && (
              <TouchableOpacity 
                style={[styles.primaryButton, { marginTop: 16 }]} 
                onPress={() => sessionNavigation.openAddProduct(session.id)}
              >
                <Text style={styles.primaryButtonText}>Add First Product</Text>
              </TouchableOpacity>
            )}
            {/* Cancel button for empty active sessions */}
            <View style={{ marginTop: 24, width: '100%', maxWidth: 300 }}>
              {session.status === 'active' && (
                <TouchableOpacity 
                  style={[styles.secondaryButton, { borderColor: '#999' }]} 
                  onPress={handleCancel}
                >
                  <Text style={[styles.secondaryButtonText, { color: '#666' }]}>Cancel Session</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : supplierGroups.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="search-outline" size={48} color="#ccc" />
            <Text style={[styles.emptyStateText, { marginTop: 12 }]}>
              {searchQuery.trim() ? `No items match "${searchQuery}"` : 'No items to display.'}
            </Text>
          </View>
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
