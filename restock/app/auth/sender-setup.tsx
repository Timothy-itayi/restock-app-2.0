import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { signUpStyles } from '../../styles/components/sign-up';

export default function SenderSetupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeName, setStoreName] = useState('');

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Missing information', 'Please enter your name.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Missing information', 'Please enter your email address.');
      return;
    }

    const senderProfile = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      storeName: storeName.trim() || null
    };

    try {
      await AsyncStorage.setItem('senderProfile', JSON.stringify(senderProfile));
      router.replace('/(tabs)/sessions');
    } catch (err) {
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={signUpStyles.container}
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
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={signUpStyles.input}
          placeholder="Email Address"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={signUpStyles.input}
          placeholder="Store Name (optional)"
          placeholderTextColor="#666"
          value={storeName}
          onChangeText={setStoreName}
        />

        <TouchableOpacity
          style={signUpStyles.button}
          onPress={handleContinue}
        >
          <Text style={signUpStyles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}
