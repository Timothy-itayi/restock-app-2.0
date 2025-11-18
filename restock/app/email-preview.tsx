import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useThemedStyles } from '@styles/useThemedStyles';
import { getEmailsStyles } from '@styles/components/emails';
import { useActiveSession, useSessionStore } from '../store/useSessionStore';
import { useSenderProfile, useSenderProfileHydrated } from '../store/useSenderProfileStore';
import type { SessionItem } from '../lib/helpers/storage/sessions';
import { generateEmailBody, sendEmail, type EmailItem } from '../lib/api/sendEmail';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SupplierGroup = {
  supplierName: string;
  supplierEmail: string;
  items: SessionItem[];
  subject: string;
  body: string;
  isGenerating: boolean;
};

export default function EmailPreviewScreen() {
  const styles = useThemedStyles(getEmailsStyles);
  const activeSession = useActiveSession();
  const senderProfile = useSenderProfile();
  const isSenderHydrated = useSenderProfileHydrated();
  const completeSession = useSessionStore((state) => state.completeSession);
  
  const [supplierGroups, setSupplierGroups] = useState<SupplierGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [supplierEmails, setSupplierEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isSenderHydrated) {
      return;
    }

    // Check sender profile
    if (!senderProfile) {
      Alert.alert(
        'Sender Profile Required',
        'Please set up your sender profile before sending emails.',
        [
          {
            text: 'Go to Setup',
            onPress: () => router.replace('/auth/sender-setup')
          }
        ]
      );
      return;
    }

    // Check active session
    if (!activeSession || activeSession.items.length === 0) {
      Alert.alert(
        'No Active Session',
        'Please add items to your session before sending emails.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
      return;
    }

    initializeEmailGroups();
  }, [isSenderHydrated, senderProfile, activeSession]);

  const initializeEmailGroups = async () => {
    if (!activeSession || !senderProfile) return;

    setLoading(true);

    try {
      // Load supplier emails from storage
      const stored = await AsyncStorage.getItem('suppliers');
      const suppliers = stored ? JSON.parse(stored) : {};
      const emailMap: Record<string, string> = {};

      // Group items by supplier
      const grouped: Record<string, SessionItem[]> = {};
      activeSession.items.forEach(item => {
        const supplier = item.supplierName || 'Unknown Supplier';
        if (!grouped[supplier]) {
          grouped[supplier] = [];
          emailMap[supplier] = suppliers[supplier]?.email || '';
        }
        grouped[supplier].push(item);
      });

      // Check if we have at least one supplier
      const suppliersList = Object.keys(grouped);
      if (suppliersList.length === 0) {
        Alert.alert('No Suppliers', 'Please assign suppliers to your items.');
        router.back();
        return;
      }

      setSupplierEmails(emailMap);

      // Create supplier groups with default subject
      const groups: SupplierGroup[] = suppliersList.map(supplierName => ({
        supplierName,
        supplierEmail: emailMap[supplierName] || '',
        items: grouped[supplierName],
        subject: `Order Request - ${new Date().toLocaleDateString()}`,
        body: '',
        isGenerating: true,
      }));

      setSupplierGroups(groups);

      // Generate email bodies for each supplier
      for (const group of groups) {
        await generateEmailForSupplier(group);
      }
    } catch (error) {
      console.error('Failed to initialize email groups:', error);
      Alert.alert('Error', 'Failed to prepare emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateEmailForSupplier = async (group: SupplierGroup) => {
    if (!senderProfile) return;

    setSupplierGroups(prev => prev.map(g => 
      g.supplierName === group.supplierName 
        ? { ...g, isGenerating: true }
        : g
    ));

    try {
      const emailItems: EmailItem[] = group.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
      }));

      const body = await generateEmailBody(
        group.supplierName,
        emailItems,
        senderProfile.name,
        senderProfile.storeName || undefined
      );

      setSupplierGroups(prev => prev.map(g => 
        g.supplierName === group.supplierName 
          ? { ...g, body, isGenerating: false }
          : g
      ));
    } catch (error) {
      console.error('Failed to generate email body:', error);
      setSupplierGroups(prev => prev.map(g => 
        g.supplierName === group.supplierName 
          ? { ...g, isGenerating: false }
          : g
      ));
    }
  };

  const updateGroup = (supplierName: string, updates: Partial<SupplierGroup>) => {
    setSupplierGroups(prev => prev.map(g => 
      g.supplierName === supplierName 
        ? { ...g, ...updates }
        : g
    ));
  };

  const updateSupplierEmail = (supplierName: string, email: string) => {
    setSupplierEmails(prev => ({ ...prev, [supplierName]: email }));
    updateGroup(supplierName, { supplierEmail: email });
  };

  const handleSendEmails = async () => {
    if (!senderProfile || !activeSession) return;

    // Validate all supplier emails
    const missingEmails: string[] = [];
    supplierGroups.forEach(group => {
      if (!group.supplierEmail || !group.supplierEmail.trim()) {
        missingEmails.push(group.supplierName);
      }
    });

    if (missingEmails.length > 0) {
      Alert.alert(
        'Missing Supplier Emails',
        `Please enter email addresses for: ${missingEmails.join(', ')}`
      );
      return;
    }

    // Validate at least one supplier
    if (supplierGroups.length === 0) {
      Alert.alert('No Suppliers', 'At least one supplier is required.');
      return;
    }

    setSending(true);

    try {
      // Send all emails
      const sendPromises = supplierGroups.map(group => {
        const emailItems: EmailItem[] = group.items.map(item => ({
          productName: item.productName,
          quantity: item.quantity,
        }));

        return sendEmail({
          to: group.supplierEmail,
          replyTo: senderProfile.email,
          subject: group.subject,
          text: group.body,
        });
      });

      const results = await Promise.all(sendPromises);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        const errorMessages = failed
          .map(f => f.message || 'Unknown error')
          .filter((msg, idx, arr) => arr.indexOf(msg) === idx); // Unique messages
        
        const errorDetails = errorMessages.length === 1 
          ? errorMessages[0]
          : `${failed.length} email(s) failed:\n${errorMessages.slice(0, 3).join('\n')}${errorMessages.length > 3 ? '\n...' : ''}`;

        Alert.alert(
          'Some Emails Failed',
          errorDetails,
          [{ text: 'OK' }]
        );
        setSending(false);
        return;
      }

      // Save supplier emails to storage
      const stored = await AsyncStorage.getItem('suppliers');
      const suppliers = stored ? JSON.parse(stored) : {};
      supplierGroups.forEach(group => {
        suppliers[group.supplierName] = { email: group.supplierEmail };
      });
      await AsyncStorage.setItem('suppliers', JSON.stringify(suppliers));

      // Complete the session
      completeSession(activeSession.id);

      Alert.alert(
        'Emails Sent',
        `Successfully sent ${supplierGroups.length} email(s).`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/sessions')
          }
        ]
      );
    } catch (error) {
      console.error('Failed to send emails:', error);
      Alert.alert('Error', 'Failed to send emails. Please try again.');
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6B7F6B" />
          <Text style={[styles.headerSubtitle, { marginTop: 16 }]}>Preparing emails...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!senderProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={styles.headerTitle}>Sender Profile Required</Text>
          <Text style={styles.headerSubtitle}>
            Please set up your sender profile before sending emails.
          </Text>
          <TouchableOpacity
            style={[styles.emailCard, { marginTop: 20, padding: 16 }]}
            onPress={() => router.replace('/auth/sender-setup')}
          >
            <Text style={{ color: '#6B7F6B', fontWeight: '600' }}>Go to Setup</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Email Preview</Text>
        <Text style={styles.headerSubtitle}>
          Review and edit emails before sending
        </Text>
      </View>

      <ScrollView style={styles.emailList} showsVerticalScrollIndicator={false}>
        {supplierGroups.map((group) => (
          <View key={group.supplierName} style={styles.emailCard}>
            <Text style={[styles.headerTitle, { fontSize: 18, marginBottom: 12 }]}>
              {group.supplierName}
            </Text>

            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' }}>
              Supplier Email *
            </Text>
            <TextInput
              placeholder="supplier@example.com"
              value={group.supplierEmail}
              onChangeText={(email) => updateSupplierEmail(group.supplierName, email)}
              style={[
                {
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  backgroundColor: '#fff',
                },
                !group.supplierEmail?.trim() && { borderColor: '#FFC107' }
              ]}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' }}>
              Subject
            </Text>
            <TextInput
              value={group.subject}
              onChangeText={(subject) => updateGroup(group.supplierName, { subject })}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                backgroundColor: '#fff',
              }}
            />

            <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' }}>
              Body
            </Text>
            {group.isGenerating ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#6B7F6B" />
                <Text style={{ marginTop: 8, color: '#666', fontSize: 12 }}>
                  Generating email body...
                </Text>
              </View>
            ) : (
              <TextInput
                value={group.body}
                onChangeText={(body) => updateGroup(group.supplierName, { body })}
                multiline
                numberOfLines={10}
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  backgroundColor: '#fff',
                  minHeight: 150,
                  textAlignVertical: 'top',
                }}
              />
            )}

            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                Items ({group.items.length}):
              </Text>
              {group.items.map((item) => (
                <Text key={item.id} style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                  • {item.productName} (Qty: {item.quantity})
                </Text>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          onPress={handleSendEmails}
          disabled={sending || supplierGroups.some(g => g.isGenerating)}
          style={[
            {
              backgroundColor: '#6B7F6B',
              padding: 16,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 20,
              marginBottom: 40,
            },
            (sending || supplierGroups.some(g => g.isGenerating)) && { opacity: 0.6 }
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              Send All Emails ({supplierGroups.length})
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

