import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getSessionsStyles } from '@styles/components/sessions';
import {
  useSessions,
  useSessionHydrated,
  useSessionStore,
  useActiveSessions
} from '../../store/useSessionStore';
import { useSupplierStore } from '../../store/useSupplierStore';
import type { Session } from '../../lib/helpers/storage/sessions';
import colors from '@styles/theme/colors';
import { AlertModal } from '../../components/AlertModal';
import { useAlert } from '../../lib/hooks/useAlert';

export default function SessionsScreen() {
  const styles = useThemedStyles(getSessionsStyles);
  const sessions = useSessions();
  const isHydrated = useSessionHydrated();
  const activeSessions = useActiveSessions();
  const suppliers = useSupplierStore((state) => state.suppliers);
  const loadSessionsFromStorage = useSessionStore((state) => state.loadSessionsFromStorage);
  const createSession = useSessionStore((state) => state.createSession);
  const deleteSession = useSessionStore((state) => state.deleteSession);
  const deleteSessionsByStatus = useSessionStore((state) => state.deleteSessionsByStatus);
  const { alert, hideAlert, showAlert } = useAlert();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) {
      loadSessionsFromStorage().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isHydrated, loadSessionsFromStorage]);

  // Group sessions by status
  const groupedSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt);
    return {
      active: sorted.filter(s => s.status === 'active'),
      pendingEmails: sorted.filter(s => s.status === 'pendingEmails'),
      completed: sorted.filter(s => s.status === 'completed'),
      cancelled: sorted.filter(s => s.status === 'cancelled'),
    };
  }, [sessions]);

  const startSession = () => {
    const newSession = createSession();
    router.push({
      pathname: '/sessions/[id]/add-product',
      params: { id: newSession.id }
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          bgColor: colors.cypress.soft,
          textColor: colors.cypress.deep,
          borderColor: colors.cypress.muted,
          icon: 'flash-outline' as const,
        };
      case 'pendingEmails':
        return {
          label: 'Pending Emails',
          bgColor: colors.analytics.clay,
          textColor: '#fff',
          borderColor: colors.analytics.clay,
          icon: 'mail-outline' as const,
        };
      case 'completed':
        return {
          label: 'Completed',
          bgColor: colors.brand.primary,
          textColor: '#fff',
          borderColor: colors.brand.primary,
          icon: 'checkmark-circle-outline' as const,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bgColor: colors.neutral.medium,
          textColor: '#fff',
          borderColor: colors.neutral.medium,
          icon: 'close-circle-outline' as const,
        };
      default:
        return {
          label: status,
          bgColor: colors.neutral.light,
          textColor: colors.neutral.dark,
          borderColor: colors.neutral.medium,
          icon: 'help-circle-outline' as const,
        };
    }
  };

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const handleDeleteSession = (session: Session, e: any) => {
    e.stopPropagation();
    const sessionLabel = session.items.length === 0 
      ? 'this empty session' 
      : `session with ${session.items.length} item${session.items.length !== 1 ? 's' : ''}`;
    
    showAlert('delete', 'Delete Session?', `Are you sure you want to delete ${sessionLabel}? This action cannot be undone.`, [
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          deleteSession(session.id);
          setExpandedSessionId(null);
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleChevronPress = (sessionId: string, e: any) => {
    e.stopPropagation();
    // Toggle: if already expanded, close it; otherwise expand this one (closing any other)
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
  };

  const handleClearStatus = (status: Session['status'], label: string) => {
    showAlert('delete', `Clear all ${label}?`, `This will permanently delete all ${label} sessions.`, [
      { 
        text: 'Clear All', 
        style: 'destructive',
        onPress: () => deleteSessionsByStatus(status)
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSessionPress = (item: Session) => {
    // Close expanded state when navigating
    setExpandedSessionId(null);
    
    if (item.status === 'pendingEmails') {
      router.push({
        pathname: '/sessions/[id]/email-preview',
        params: { id: item.id }
      });
    } else {
      router.push({
        pathname: '/sessions/[id]',
        params: { id: item.id }
      });
    }
  };

  const renderSessionItem = ({ item, index, totalCount }: { item: Session; index: number; totalCount: number }) => {
    const statusConfig = getStatusConfig(item.status);
    const itemCount = item.items.length;
    const isCompleted = item.status === 'completed';
    const canDelete = true; // Allow delete for all types now
    const isExpanded = expandedSessionId === item.id;

    // For completed sessions, get supplier names and emails
    const supplierInfo = isCompleted ? Array.from(new Set(item.items.map(i => i.supplierId).filter(Boolean)))
      .map(id => suppliers.find(s => s.id === id))
      .filter(Boolean) : [];

    return (
      <View>
        <TouchableOpacity
          style={{
            backgroundColor: colors.neutral.lightest,
            paddingVertical: 16,
            paddingHorizontal: 16,
          }}
          onPress={() => handleSessionPress(item)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Session Info */}
            <View style={{ flex: 1 }}>
              {/* Date Label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons 
                  name="calendar-outline" 
                  size={12} 
                  color={colors.neutral.medium} 
                  style={{ marginRight: 4 }} 
                />
                <Text style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: colors.neutral.medium,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                }}>
                  {new Date(item.createdAt).toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              {/* Session Title */}
              <Text style={{
                fontSize: 17,
                fontWeight: '700',
                color: colors.neutral.darkest,
                marginBottom: 6,
              }}>
                Session #{item.id.slice(-6).toUpperCase()}
              </Text>

              {/* Items Count and Supplier info */}
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons 
                    name="cube-outline" 
                    size={14} 
                    color={colors.cypress.muted} 
                    style={{ marginRight: 4 }} 
                  />
                  <Text style={{
                    fontSize: 13,
                    color: colors.neutral.dark,
                    fontWeight: '500',
                  }}>
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </Text>
                </View>

                {isCompleted && supplierInfo.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                    {supplierInfo.map((s, idx) => (
                      <View key={s?.id || idx} style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center',
                        backgroundColor: colors.neutral.lighter,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}>
                        <Ionicons name="mail-outline" size={10} color={colors.neutral.medium} style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 10, color: colors.neutral.medium }} numberOfLines={1}>
                          {s?.email || s?.name}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Status Badge + Actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  backgroundColor: statusConfig.bgColor,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 6,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons 
                  name={statusConfig.icon} 
                  size={12} 
                  color={statusConfig.textColor} 
                  style={{ marginRight: 4 }} 
                />
                <Text style={{ 
                  color: statusConfig.textColor, 
                  fontSize: 11, 
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}>
                  {statusConfig.label}
                </Text>
              </View>
              {isExpanded && (
                <TouchableOpacity
                  onPress={(e) => handleDeleteSession(item, e)}
                  style={{
                    padding: 6,
                    borderRadius: 6,
                    backgroundColor: colors.status.error + '15',
                    marginRight: 4,
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.status.error} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={(e) => handleChevronPress(item.id, e)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={isExpanded ? "chevron-back" : "chevron-forward"} 
                  size={18} 
                  color={colors.neutral.medium} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        {index < totalCount - 1 && (
          <View style={{
            height: 1,
            backgroundColor: colors.neutral.light,
            marginHorizontal: 16,
          }} />
        )}
      </View>
    );
  };

  const renderSessionGroup = (
    title: string, 
    sessionsList: Session[], 
    accentColor: string,
    icon: string,
    statusToClear?: Session['status']
  ) => {
    if (sessionsList.length === 0) return null;

    return (
      <View style={{ marginBottom: 24 }}>
        {/* Section Header */}
        <View style={{
          paddingHorizontal: 16,
          paddingBottom: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 4,
                height: 20,
                backgroundColor: accentColor,
                borderRadius: 2,
                marginRight: 10,
              }} />
              <Ionicons name={icon as any} size={16} color={accentColor} style={{ marginRight: 6 }} />
              <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: accentColor,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
                {title}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {statusToClear && sessionsList.length > 0 && (
                <TouchableOpacity 
                  onPress={() => handleClearStatus(statusToClear, title)}
                  style={{
                    backgroundColor: colors.status.error + '15',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Ionicons name="trash-outline" size={12} color={colors.status.error} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.status.error }}>
                    CLEAR ALL
                  </Text>
                </TouchableOpacity>
              )}
              <View style={{
                backgroundColor: accentColor + '20',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: accentColor,
                }}>
                  {sessionsList.length}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Sessions List */}
        <View style={{
          backgroundColor: colors.neutral.lightest,
          marginHorizontal: 16,
          borderRadius: 12,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.neutral.light,
        }}>
          {sessionsList.map((session, index) => (
            <View key={session.id}>
              {renderSessionItem({ item: session, index, totalCount: sessionsList.length })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={styles.stickyHeaderTitle}>Restock Sessions</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Start New Session Button */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <TouchableOpacity
            style={[styles.primaryButton, { 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: 0,
            }]}
            onPress={startSession}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Start New Session</Text>
          </TouchableOpacity>
        </View>

        {/* Sessions Summary */}
        {!loading && sessions.length > 0 && (
          <View style={{
            marginHorizontal: 16,
            marginTop: 12,
            marginBottom: 20,
            padding: 16,
            backgroundColor: colors.cypress.pale,
            borderRadius: 12,
            flexDirection: 'row',
            justifyContent: 'space-around',
          }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.cypress.deep }}>
                {sessions.length}
              </Text>
              <Text style={{ fontSize: 11, color: colors.neutral.medium, fontWeight: '600', marginTop: 2 }}>
                Total
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.neutral.light }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.brand.primary }}>
                {groupedSessions.active.length}
              </Text>
              <Text style={{ fontSize: 11, color: colors.neutral.medium, fontWeight: '600', marginTop: 2 }}>
                Active
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.neutral.light }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.analytics.clay }}>
                {groupedSessions.pendingEmails.length}
              </Text>
              <Text style={{ fontSize: 11, color: colors.neutral.medium, fontWeight: '600', marginTop: 2 }}>
                Pending
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.neutral.light }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.status.success }}>
                {groupedSessions.completed.length}
              </Text>
              <Text style={{ fontSize: 11, color: colors.neutral.medium, fontWeight: '600', marginTop: 2 }}>
                Done
              </Text>
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.neutral.medium, fontSize: 14 }}>Loading sessions...</Text>
          </View>
        )}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <View style={{ 
            padding: 40, 
            alignItems: 'center',
            backgroundColor: colors.cypress.pale,
            marginHorizontal: 16,
            borderRadius: 12,
            marginTop: 20,
          }}>
            <Ionicons name="layers-outline" size={48} color={colors.neutral.medium} />
            <Text style={{ 
              color: colors.neutral.dark, 
              fontSize: 16, 
              fontWeight: '600',
              marginTop: 12,
            }}>
              No sessions yet
            </Text>
            <Text style={{ 
              color: colors.neutral.medium, 
              fontSize: 14, 
              textAlign: 'center',
              marginTop: 6,
              paddingHorizontal: 20,
            }}>
              Start a new session to begin tracking your restock items.
            </Text>
          </View>
        )}

        {/* Session Groups */}
        {!loading && sessions.length > 0 && (
          <View style={{ paddingTop: 8 }}>
            {renderSessionGroup(
              'Active Sessions', 
              groupedSessions.active, 
              colors.cypress.deep,
              'flash-outline'
            )}
            {renderSessionGroup(
              'Pending Emails', 
              groupedSessions.pendingEmails, 
              colors.analytics.olive,
              'mail-outline'
            )}
            {renderSessionGroup(
              'Completed', 
              groupedSessions.completed, 
              colors.brand.primary,
              'checkmark-circle-outline',
              'completed'
            )}
            {renderSessionGroup(
              'Cancelled', 
              groupedSessions.cancelled, 
              colors.neutral.medium,
              'close-circle-outline',
              'cancelled'
            )}
          </View>
        )}
      </ScrollView>

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
