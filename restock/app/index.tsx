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
  useActiveSession,
  useSessionStore
} from '../store/useSessionStore';

import { safeRead } from '../lib/helpers/errorHandling';

export default function DashboardScreen() {
  const [isChecking, setIsChecking] = useState(true);
  const styles = useThemedStyles(getDashboardStyles);

  const senderProfile = useSenderProfile();
  const isSenderHydrated = useSenderProfileHydrated();
  const loadProfileFromStorage = useSenderProfileStore((s) => s.loadProfileFromStorage);

  const activeSession = useActiveSession();
  const createSession = useSessionStore((s) => s.createSession);
  const loadSessionsFromStorage = useSessionStore((s) => s.loadSessionsFromStorage);

  useEffect(() => {
    const checkProfile = async () => {
      if (!isSenderHydrated) {
        await loadProfileFromStorage();
      }
      setIsChecking(false);
    };
    checkProfile();
  }, [isSenderHydrated, loadProfileFromStorage]);

  useEffect(() => {
    if (isSenderHydrated) {
      loadSessionsFromStorage();
    }
  }, [isSenderHydrated, loadSessionsFromStorage]);

  if (isChecking || !isSenderHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!senderProfile) {
    return <Redirect href="/welcome" />;
  }

  const userName = safeRead(senderProfile?.name, 'User');
  const userEmail = safeRead(senderProfile?.email, 'Email');
  const hasActiveSession = !!activeSession;

  const menuItems = [
    {
      id: 'start-session',
      title: hasActiveSession ? 'Continue Active Session' : 'Start New Session',
      icon: 'add-circle-outline',
      route: hasActiveSession
        ? '/sessions'
        : () => {
            createSession();
            router.push('/sessions');
          },
      secondary: true,
    },
    {
      id: 'view-sessions',
      title: 'View Sessions',
      icon: 'list-outline',
      route: '/sessions',
    },
    {
      id: 'upload',
      title: 'Upload Document',
      icon: 'document-outline',
      route: '/upload',
    },
    {
      id: 'suppliers',
      title: 'Suppliers',
      icon: 'people-outline',
      route: '/suppliers',
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: 'settings-outline',
      route: '/settings',
    },
  ];

  const handleNavigation = (item) => {
    if (typeof item.route === 'function') {
      item.route();
    } else {
      router.push(item.route);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
  contentContainerStyle={styles.contentContainer}
  showsVerticalScrollIndicator={false}
  bounces={true}

      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome, <Text style={styles.userName}>{userName}</Text>
          </Text>

          <Text style={styles.welcomeEmail}>{userEmail}</Text>

          {senderProfile?.storeName && (
            <Text style={styles.welcomeSubtitle}>{senderProfile.storeName}</Text>
          )}
        </View>

        {/* MENU BUTTONS */}
        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavigation(item)}
              style={[
                styles.menuCard,
                item.secondary && styles.menuCardPrimary
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={24}
                style={[
                  styles.menuIcon,
                  item.secondary && styles.menuIconPrimary
                ]}
              />

              <Text
                style={[
                  styles.menuCardText,
                  item.secondary && styles.menuCardTextPrimary
                ]}
              >
                {item.title}
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                style={[
                  styles.menuChevron,
                  item.secondary && styles.menuIconPrimary
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ACTIVE SESSION CARD */}
        {hasActiveSession && (
          <View style={styles.activeSessionCard}>
            <Text style={styles.activeSessionTitle}>Active Session</Text>
            <Text style={styles.activeSessionText}>
              {activeSession?.items?.length ?? 0} item(s) in progress
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
