import { useEffect } from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { tabScreenOptions, tabBarOptions } from '../../styles/components/tabs';
import { useSenderProfileStore, useSenderProfileHydrated } from '../../store/useSenderProfileStore';

export default function TabLayout() {
  const senderProfile = useSenderProfileStore((state) => state.senderProfile);
  const isHydrated = useSenderProfileHydrated();
  const loadProfileFromStorage = useSenderProfileStore((state) => state.loadProfileFromStorage);

  useEffect(() => {
    if (!isHydrated) {
      loadProfileFromStorage();
    }
  }, [isHydrated, loadProfileFromStorage]);

  // If not hydrated yet, show nothing (will redirect once hydrated)
  if (!isHydrated) {
    return null;
  }

  // If no profile exists, redirect to setup
  if (!senderProfile) {
    return <Redirect href="/auth/sender-setup" />;
  }

  return (
    <Tabs screenOptions={tabBarOptions}>
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabScreenOptions.sessions.tabBarIcon.name as any} size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="upload"
        options={{
          title: 'Upload',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabScreenOptions.upload.tabBarIcon.name as any} size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Suppliers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabScreenOptions.suppliers.tabBarIcon.name as any} size={size} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-sharp" size={size} color={color} />
          )
        }}
      />

    </Tabs>
  );
}
