import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../../styles/useThemedStyles';
import { getEmailsStyles } from '../../../styles/components/emails';
import { getSessionsStyles } from '../../../styles/components/sessions';

import { useSessionStore } from '../../../store/useSessionStore';
import { useSupplierStore } from '../../../store/useSupplierStore';
import { useSenderProfile } from '../../../store/useSenderProfileStore';

import { groupBySupplier } from '../../../lib/utils/groupBySupplier';

import { EmailsSummary } from '../../../components/emails/EmailsSummary';
import { EmailCard } from '../../../components/emails/EmailCard';
import  {EmailEditModal } from '../../../components/emails/EmailEditModal';
import { SendConfirmationModal } from '../../../components/emails/SendConfirmationModal';
import { EmailDetailModal } from '../../../components/emails/EmailEditModal';

const SEND_EMAIL_URL = 'https://your-domain.com/send-email';

export default function EmailPreviewScreen() {
  const styles = useThemedStyles(getEmailsStyles);
  const sessionStyles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const session = useSessionStore((s) => s.getSession(id));
  const suppliers = useSupplierStore((s) => s.suppliers);
  const senderProfile = useSenderProfile();

  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [editDraft, setEditDraft] = useState<any | null>(null);
  const [editedDrafts, setEditedDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!session) {
    return <Text>Session not found.</Text>;
  }

  // Build supplier → items grouping using centralized utility
  const emailDrafts = useMemo(() => {
    // Helper function to format product list for email body
    const formatProductList = (items: typeof session.items) => {
      if (items.length === 0) return '';
      
      return items.map((item, index) => {
        return `${index + 1}. ${item.productName}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`;
      }).join('\n');
    };

    // Helper function to generate default email body
    const generateEmailBody = (supplierName: string, items: typeof session.items) => {
      const productList = formatProductList(items);
      const storeName = senderProfile?.storeName || 'our store';
      
      return `Hi ${supplierName || 'there'},

I'd like to place an order for the following items:

${productList}

Please let me know if you have any questions or if any items are unavailable.

Thank you,
${senderProfile?.name || 'Customer'}`;
    };

    // Use centralized grouping utility
    const supplierGroups = groupBySupplier(session.items, suppliers);
    const storeName = senderProfile?.storeName || 'our store';

    // Transform groups into email drafts
    return supplierGroups.map((group) => {
      const edited = editedDrafts[group.supplierId];
      
      return {
        supplierId: group.supplierId,
        supplierName: group.supplierName,
        supplierEmail: group.supplierEmail,
        subject: edited?.subject || `Restock Order from ${storeName}`,
        body: edited?.body || generateEmailBody(group.supplierName, group.items),
        items: group.items
      };
    });
  }, [session, suppliers, editedDrafts, senderProfile]);


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
            storeName: senderProfile?.storeName || senderProfile?.name || 'Restock App'
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={sessionStyles.title}>Email Preview</Text>
      </View>

      <EmailsSummary 
        emailCount={emailDrafts.length} 
        senderName={senderProfile?.name || ''} 
        senderEmail={senderProfile?.email || ''}
        storeName={senderProfile?.storeName || undefined}
      />

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
        editingEmail={editDraft ? {
          supplierName: editDraft.supplierName,
          supplierEmail: editDraft.supplierEmail,
          subject: editDraft.subject,
          body: editDraft.body,
          items: editDraft.items
        } : null}
        onSave={(updated) => {
          if (editDraft) {
            setEditedDrafts(prev => ({
              ...prev,
              [editDraft.supplierId]: {
                subject: updated.subject,
                body: updated.body
              }
            }));
          }
          setEditDraft(null);
        }}
        onCancel={() => setEditDraft(null)}
      />

      <EmailDetailModal
        visible={!!selectedDraft}
        email={selectedDraft ? {
          supplierName: selectedDraft.supplierName,
          supplierEmail: selectedDraft.supplierEmail,
          subject: selectedDraft.subject,
          body: selectedDraft.body,
          items: selectedDraft.items
        } : null}
        onClose={() => setSelectedDraft(null)}
        onEdit={(email) => {
          setEditDraft(selectedDraft);
          setSelectedDraft(null);
        }}
      />
    </SafeAreaView>
  );
}
