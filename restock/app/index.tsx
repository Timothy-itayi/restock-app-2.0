import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
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

import {
  useActiveSessions,
  useSessionStore
} from '../store/useSessionStore';

import { safeRead } from '../lib/helpers/errorHandling';
import ActiveSessionGauge from './activeSessionGauge';
import colors from '@styles/theme/colors';

export default function DashboardScreen() {
  const [isChecking, setIsChecking] = useState(true);
  const styles = useThemedStyles(getDashboardStyles);

  // PROFILE
  const senderProfile = useSenderProfile();
  const isSenderHydrated = useSenderProfileHydrated();
  const loadProfileFromStorage = useSenderProfileStore((s) => s.loadProfileFromStorage);

  // SESSIONS
  const activeSessions = useActiveSessions();
  const loadSessionsFromStorage = useSessionStore((s) => s.loadSessionsFromStorage);
  const createSession = useSessionStore((s) => s.createSession);

  // HYDRATE PROFILE
  useEffect(() => {
    if (!isSenderHydrated) {
      loadProfileFromStorage().finally(() => setIsChecking(false));
    } else {
      setIsChecking(false);
    }
  }, [isSenderHydrated]);

  // HYDRATE SESSIONS
  useEffect(() => {
    if (isSenderHydrated) loadSessionsFromStorage();
  }, [isSenderHydrated]);

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

  const hasActive = activeSessions.length > 0;

  const menuItems = [
    {
      id: 'start-session',
      title: hasActive ? 'Continue Sessions' : 'Start New Session',
      icon: 'add-circle-outline',
      route: () => {
        const s = createSession();
        router.push(`/sessions/${s.id}`);
      },
      secondary: true,
    },
    { id: 'sessions', title: 'View Sessions', icon: 'list-outline', route: '/sessions' },
    { id: 'upload', title: 'Upload Document', icon: 'document-outline', route: '/upload' },
    { id: 'suppliers', title: 'Suppliers', icon: 'people-outline', route: '/suppliers' },
    { id: 'settings', title: 'Settings', icon: 'settings-outline', route: '/settings' }
  ];

  const handleNavigation = (item) => {
    if (typeof item.route === 'function') item.route();
    else router.push(item.route);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        
      <View style={styles.welcomeSection}>

{/* TOP ROW: Welcome + Name */}
<View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
  <Text style={styles.welcomeTitle}>Welcome,</Text>
  <Text style={styles.userName}>{userName}</Text>
</View>

{/* STORE */}
{senderProfile.storeName && (
  <>
    <Text style={styles.welcomeLabel}>Store</Text>
    <Text style={styles.welcomeValue}>{senderProfile.storeName}</Text>
  </>
)}

{/* EMAIL */}
<Text style={styles.welcomeLabel}>Email</Text>
<Text style={styles.welcomeValue}>{userEmail}</Text>

</View>



{hasActive && (
  <View style={styles.activeSessionCard}>
    <Text style={styles.activeSessionTitle}>Active Sessions</Text>

    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <ActiveSessionGauge
        count={activeSessions.length}
        colors={{
          track: colors.neutral.light,
          fill: colors.analytics.clay,
          center: colors.brand.secondary,
        }}
      />

      <View style={{ flex: 1 }}>
        <Text style={styles.activeSessionText}>
          {activeSessions.length} active session(s)
        </Text>
        <Text style={styles.activeSessionSubtext}>
          Your restock workflow is in progress.
        </Text>
      </View>
    </View>
  </View>
)}


        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigation(item)}
              style={[styles.menuCard, item.secondary && styles.menuCardPrimary]}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                style={[styles.menuIcon, item.secondary && styles.menuIconPrimary]}
              />
              <Text
                style={[styles.menuCardText, item.secondary && styles.menuCardTextPrimary]}
              >
                {item.title}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                style={[styles.menuChevron, item.secondary && styles.menuIconPrimary]}
              />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
