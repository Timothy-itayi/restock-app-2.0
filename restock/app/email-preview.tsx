import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../styles/useThemedStyles';
import { getEmailsStyles } from '../styles/components/emails';

import { useSessionStore } from '../store/useSessionStore';
import { useSupplierStore } from '../store/useSupplierStore';

import { EmailsSummary } from '../components/emails/EmailsSummary';
import { EmailCard } from '../components/emails/EmailCard';
import  {EmailEditModal } from '../components/emails/EmailEditModal';
import { SendConfirmationModal } from '../components/emails/SendConfirmationModal';
import { EmailDetailModal } from '../components/emails/EmailEditModal';

const SEND_EMAIL_URL = 'https://your-domain.com/send-email';

export default function EmailPreviewScreen() {
  const styles = useThemedStyles(getEmailsStyles);
  const { sessionId } = useLocalSearchParams();
  
  const session = useSessionStore((s) => s.getSession(sessionId as string));
  const suppliers = useSupplierStore((s) => s.suppliers);

  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [editDraft, setEditDraft] = useState<any | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!session) {
    return <Text>Session not found.</Text>;
  }

  // Build supplier → items grouping
  const emailDrafts = useMemo(() => {
    const map: Record<string, any> = {};

    for (const item of session.items) {
      const supplierId = item.supplierId || 'unknown';

      if (!map[supplierId]) {
        const supplier = suppliers.find((s) => s.id === supplierId);

        map[supplierId] = {
          supplierId,
          supplierName: supplier?.name || 'Unknown Supplier',
          supplierEmail: supplier?.email || '',
          subject: `Restock Order from ${session.createdAt}`,
          body: `Hi ${supplier?.name || ''},\n\nI'd like to place an order for the following items:\n`,
          items: []
        };
      }

      map[supplierId].items.push(item);
    }

    return Object.values(map);
  }, [session, suppliers]);


  const handleSendAll = async () => {
    setShowConfirm(false);
    setSending(true);

    try {
      for (const draft of emailDrafts) {
        const res = await fetch(SEND_EMAIL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierEmail: draft.supplierEmail,
            replyTo: 'noreply@restock.email',
            subject: draft.subject,
            body: draft.body,
            items: draft.items,
            storeName: 'Restock App'
          })
        });

        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }

      setSending(false);
      setSuccess(true);

      setTimeout(() => {
        router.replace('/sessions');
      }, 1500);

    } catch (err: any) {
      setSending(false);
      Alert.alert('Error sending emails', err.message);
    }
  };


  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Preview</Text>
      </View>

      <EmailsSummary emailCount={emailDrafts.length} senderName={''} senderEmail={''} />

      <ScrollView style={{ padding: 16 }}>
        {emailDrafts.map((draft) => (
          <EmailCard
            key={draft.supplierId}
            email={draft}
            onEdit={() => setEditDraft(draft)}
            onTap={() => setSelectedDraft(draft)}
          />
        ))}
      </ScrollView>

      {/* Send All */}
      {!sending && !success && (
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => setShowConfirm(true)}
          >
            <Text style={styles.doneButtonText}>Send All Emails</Text>
          </TouchableOpacity>
        </View>
      )}

      {sending && (
        <View style={styles.sendingOverlay}>
          <Text>Sending...</Text>
        </View>
      )}

      {success && (
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={48} color="green" />
          <Text>Emails Sent!</Text>
        </View>
      )}

      {/* Modals */}
      <SendConfirmationModal
        visible={showConfirm}
        emailCount={emailDrafts.length}
        onConfirm={handleSendAll}
        onCancel={() => setShowConfirm(false)}
      />

      <EmailEditModal
        visible={!!editDraft}
        editingEmail={editDraft}
        onSave={(updated) => {
          editDraft.subject = updated.subject;
          editDraft.body = updated.body;
          setEditDraft(null);
        }}
        onCancel={() => setEditDraft(null)}
      />

      <EmailDetailModal
        visible={!!selectedDraft}
        email={selectedDraft}
        onClose={() => setSelectedDraft(null)}
        onEdit={() => {}}
      />
    </View>
  );
}
