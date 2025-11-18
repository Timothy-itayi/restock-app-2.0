import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {  tabScreenOptions, tabBarOptions } from '../../styles/components/tabs';

export default function TabLayout() {
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
