import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signUpStyles } from '../../styles/components/sign-up';
import { useSenderProfileStore } from '../../store/useSenderProfileStore';
import colors from '../../lib/theme/colors';

export default function SenderSetupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');
  const setSenderProfile = useSenderProfileStore((state) => state.setSenderProfile);
  const saveProfileToStorage = useSenderProfileStore((state) => state.saveProfileToStorage);

  const validateEmail = (email: string): boolean => {
    return email.includes('@') && email.trim().length > 0;
  };

  const handleContinue = async () => {
    // Input validation
    if (!name.trim()) {
      Alert.alert('Missing information', 'Please enter your name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing information', 'Please enter your email address.');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    const senderProfile = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      storeName: storeName.trim() || null
    };

    try {
      setSenderProfile(senderProfile);
      await saveProfileToStorage(); // Persist to AsyncStorage
      router.replace('/');
    } catch (err) {
      console.error('Failed to save sender profile:', err);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.lighter }}>
      {/* Back Button (Fixed Header) */}
      <View style={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10, zIndex: 10 }}>
         <TouchableOpacity 
           onPress={() => router.back()} 
           style={{ 
             width: 40, 
             height: 40, 
             justifyContent: 'center', 
             alignItems: 'flex-start'
           }}
         >
           <Ionicons name="arrow-back" size={28} color={colors.neutral.darkest} />
         </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center', paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={signUpStyles.titleContainer}>
            <Text style={signUpStyles.title}>Set up your details</Text>
            <Text style={signUpStyles.subtitle}>
              These details will be used when sending restock emails
            </Text>
          </View>

          <TextInput
            style={signUpStyles.input}
            placeholder="Your Name"
            placeholderTextColor={colors.neutral.medium}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={signUpStyles.input}
            placeholder="Email Address"
            placeholderTextColor={colors.neutral.medium}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={signUpStyles.input}
            placeholder="Store Name (optional)"
            placeholderTextColor={colors.neutral.medium}
            value={storeName}
            onChangeText={setStoreName}
          />

          <TouchableOpacity
            style={[signUpStyles.button, { marginTop: 20 }]}
            onPress={handleContinue}
          >
            <Text style={signUpStyles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
