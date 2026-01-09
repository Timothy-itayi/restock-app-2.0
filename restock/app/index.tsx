import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { router, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getDashboardStyles } from '@styles/components/dashboard';

import {
  useSenderProfile,
  useSenderProfileHydrated,
  useSenderProfileStore
} from '../store/useSenderProfileStore';

import { useActiveSessions, useSessionStore, useSessions } from '../store/useSessionStore';
import { useCompanyStore } from '../store/useCompanyStore';

import { safeRead } from '../lib/helpers/errorHandling';
import { getJSON, setJSON } from '../lib/helpers/storage/utils';
import logger from '../lib/helpers/logger';

const TIPS_DISMISSED_KEY = '@restock/dashboard-tips-dismissed';

export default function DashboardScreen() {
  const [isChecking, setIsChecking] = useState(true);
  const [tipsDismissed, setTipsDismissed] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [isLoadingTips, setIsLoadingTips] = useState(true);
  const styles = useThemedStyles(getDashboardStyles);

  // PROFILE
  const senderProfile = useSenderProfile();
  const isSenderHydrated = useSenderProfileHydrated();
  const loadProfileFromStorage = useSenderProfileStore((s) => s.loadProfileFromStorage);

  // SESSIONS
  const allSessions = useSessions();
  const activeSessions = useActiveSessions();
  const loadSessionsFromStorage = useSessionStore((s) => s.loadSessionsFromStorage);
  const createSession = useSessionStore((s) => s.createSession);
  
  // Count sessions by status
  const activeCount = allSessions.filter(s => s.status === 'active').length;
  const pendingCount = allSessions.filter(s => s.status === 'pendingEmails').length;
  const readyToSendCount = allSessions.filter(s => s.status === 'pendingEmails').length;
  
  // Get most recent active session for progress bar
  const mostRecentActive = activeSessions.length > 0
    ? [...activeSessions].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))[0]
    : null;
  
  // Determine progress stages for most recent active session
  const hasStarted = mostRecentActive !== null;
  const hasLogged = mostRecentActive?.items && mostRecentActive.items.length > 0;
  const hasSent = mostRecentActive?.status === 'pendingEmails';

  // COMPANY
  const { link, loadFromStorage: loadCompanyFromStorage, isHydrated: isCompanyHydrated } = useCompanyStore();

  // HYDRATE PROFILE
  useEffect(() => {
    if (!isSenderHydrated) {
      loadProfileFromStorage().finally(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }
  }, [isSenderHydrated]);

  // HYDRATE SESSIONS & COMPANY
  useEffect(() => {
    if (isSenderHydrated) {
      loadSessionsFromStorage();
      if (!isCompanyHydrated) {
        loadCompanyFromStorage();
      }
    }
  }, [isSenderHydrated]);

  // LOAD TIPS DISMISSED STATE
  useEffect(() => {
    getJSON<boolean>(TIPS_DISMISSED_KEY).then((dismissed) => {
      const wasDismissed = dismissed === true;
      setTipsDismissed(wasDismissed);
      // Show tips by default if not dismissed
      setShowTips(!wasDismissed);
      setIsLoadingTips(false);
    }).catch(err => {
      logger.error('Failed to load tips dismissed state', err);
      setIsLoadingTips(false);
    });
  }, []);

  const handleDismissTips = async () => {
    setTipsDismissed(true);
    setShowTips(false);
    try {
      await setJSON(TIPS_DISMISSED_KEY, true);
    } catch (err) {
      logger.error('Failed to save tips dismissed state', err);
    }
  };

  const handleToggleTips = () => {
    setShowTips(!showTips);
  };

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!senderProfile) return <Redirect href="/welcome" />;

  const userName = safeRead(senderProfile.name, 'User');
  const userEmail = safeRead(senderProfile.email, 'Email');


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        
      <View style={styles.welcomeSection}>
        {/* TOP ROW: Welcome + Name + Help Icon */}
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeRowLeft}>
            <Text style={styles.welcomeTitle}>Welcome,</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity
            onPress={handleToggleTips}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.helpIconButton}
          >
            <Ionicons 
              name={showTips ? "information-circle" : "information-circle-outline"} 
              size={24} 
              style={styles.helpIcon} 
            />
          </TouchableOpacity>
        </View>

        {/* STORE */}
        {senderProfile.storeName && (
          <Text style={styles.welcomeLabel}>Store: {senderProfile.storeName}</Text>
        )}
      </View>

        {/* Session Progress Bar */}
        {mostRecentActive && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Today</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, hasStarted && styles.progressDotActive]} />
                <Text style={styles.progressLabel}>Started</Text>
              </View>
              <View style={[styles.progressLine, hasLogged && styles.progressLineActive]} />
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, hasLogged && styles.progressDotActive]} />
                <Text style={styles.progressLabel}>Logged</Text>
              </View>
              <View style={[styles.progressLine, hasSent && styles.progressLineActive]} />
              <View style={styles.progressStep}>
                <View style={[styles.progressDot, hasSent && styles.progressDotActive]} />
                <Text style={styles.progressLabel}>Sent</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sessions Ready to Send */}
        {readyToSendCount > 0 && (
          <View style={styles.readyToSendCard}>
            <Text style={styles.readyToSendText}>
              {readyToSendCount} session{readyToSendCount !== 1 ? 's' : ''} ready to send
            </Text>
            <TouchableOpacity
              style={styles.readyToSendButton}
              onPress={() => router.push('/sessions')}
            >
              <Text style={styles.readyToSendButtonText}>Review & Send</Text>
              <Ionicons name="chevron-forward" size={16} style={styles.readyToSendButtonIcon} />
            </TouchableOpacity>
          </View>
        )}

        {/* Status Chips Row */}
        <View style={styles.statusChipsRow}>
          {activeCount > 0 && (
            <TouchableOpacity
              style={styles.statusChipActive}
              onPress={() => router.push('/sessions')}
            >
              <Text style={styles.statusChipTextActive}>{activeCount} active</Text>
            </TouchableOpacity>
          )}
          {pendingCount > 0 && (
            <TouchableOpacity
              style={styles.statusChipPending}
              onPress={() => router.push('/sessions')}
            >
              <Text style={styles.statusChipTextPending}>{pendingCount} pending</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.historyChip}
            onPress={() => router.push('/sessions')}
          >
            <Text style={styles.historyChipText}>history</Text>
            <Ionicons name="chevron-forward" size={14} style={styles.historyChipIcon} />
          </TouchableOpacity>
        </View>

        {/* Primary Actions */}
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuCardGreen}
            onPress={() => {
              logger.info('[Dashboard] Creating new session');
              const s = createSession();
              router.push(`/sessions/${s.id}`);
            }}
          >
            <Ionicons name="add-circle-outline" size={24} style={styles.menuIconGreen} />
            <Text style={styles.menuCardTextGreen}>Start New Session</Text>
            <Ionicons name="chevron-forward" size={20} style={styles.menuChevronGreen} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuCardGreen}
            onPress={() => {
              logger.info('[Dashboard] Navigating to upload');
              router.push('/upload');
            }}
          >
            <Ionicons name="document-outline" size={24} style={styles.menuIconGreen} />
            <Text style={styles.menuCardTextGreen}>Upload Document</Text>
            <Ionicons name="chevron-forward" size={20} style={styles.menuChevronGreen} />
          </TouchableOpacity>
        </View>

        {/* Team Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Team</Text>
        </View>
        <View style={styles.menuList}>
          <TouchableOpacity
            style={styles.menuCard}
            onPress={() => {
              logger.info('[Dashboard] Navigating to company');
              router.push('/company');
            }}
          >
            <Ionicons name="people-outline" size={24} style={styles.menuIcon} />
            <Text style={styles.menuCardText}>
              {link ? `Team: ${link.code}` : 'Connect with Team'}
            </Text>
            <Ionicons name="chevron-forward" size={20} style={styles.menuChevron} />
          </TouchableOpacity>
        </View>

        {/* Manage Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Manage</Text>
        </View>
        <View style={styles.manageRow}>
          <TouchableOpacity
            style={styles.manageCard}
            onPress={() => {
              logger.info('[Dashboard] Navigating to suppliers');
              router.push('/suppliers');
            }}
          >
            <Ionicons name="business-outline" size={20} style={styles.menuIcon} />
            <Text style={styles.manageCardText}>Suppliers</Text>
            <Ionicons name="chevron-forward" size={16} style={styles.menuChevron} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manageCard}
            onPress={() => {
              logger.info('[Dashboard] Navigating to settings');
              router.push('/settings');
            }}
          >
            <Ionicons name="settings-outline" size={20} style={styles.menuIcon} />
            <Text style={styles.manageCardText}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} style={styles.menuChevron} />
          </TouchableOpacity>
        </View>

        {/* Tips Section */}
        {showTips && !isLoadingTips && (
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsHeaderLeft}>
                <Ionicons name="bulb-outline" size={14} style={styles.tipsIcon} />
                <Text style={styles.tipsTitle}>Tips</Text>
              </View>
              <TouchableOpacity
                onPress={handleDismissTips}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={14} style={styles.tipsCloseIcon} />
              </TouchableOpacity>
            </View>
            <View style={styles.tipsContent}>
              {activeCount > 0 && (
                <View style={styles.tipItem}>
                  <Text style={styles.tipTextCompact}>Tap this pill to see your current active session: </Text>
                  <View style={styles.tipPillExample}>
                    <View style={styles.statusChipActiveExample}>
                      <Text style={styles.statusChipTextActiveExample}>{activeCount} active</Text>
                    </View>
                  </View>
                </View>
              )}
              <View style={styles.tipItem}>
                <Text style={styles.tipTextCompact}>
                  Use <Text style={styles.tipHighlight}>Start New Session</Text> to log products manually or <Text style={styles.tipHighlight}>Upload Document</Text> to scan automatically.
                </Text>
              </View>
              {readyToSendCount > 0 && (
                <View style={styles.tipItem}>
                  <Text style={styles.tipTextCompact}>
                    Tap <Text style={styles.tipHighlight}>Review & Send</Text> to send pending sessions.
                  </Text>
                </View>
              )}
              {link && (
                <View style={styles.tipItem}>
                  <Text style={styles.tipTextCompact}>
                    Visit <Text style={styles.tipHighlight}>Team</Text> to view other stores.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}
