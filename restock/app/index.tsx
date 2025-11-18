import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, Text } from 'react-native';
import { useSenderProfileStore, useSenderProfileHydrated } from '../store/useSenderProfileStore';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const senderProfile = useSenderProfileStore((state) => state.senderProfile);
  const isHydrated = useSenderProfileHydrated();
  const loadProfileFromStorage = useSenderProfileStore((state) => state.loadProfileFromStorage);

  useEffect(() => {
    const checkProfile = async () => {
      if (!isHydrated) {
        await loadProfileFromStorage();
      }
      setIsChecking(false);
    };
    checkProfile();
  }, [isHydrated, loadProfileFromStorage]);

  if (isChecking || !isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // If profile exists, go to tabs; otherwise go to welcome
  if (senderProfile) {
    return <Redirect href="/(tabs)/sessions" />;
  }

  return <Redirect href="/welcome" />;
}