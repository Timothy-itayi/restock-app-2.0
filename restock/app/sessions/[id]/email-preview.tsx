import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
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
import { SuccessModal } from '../../../components/emails/SuccessModal';
import { EmailDetailModal } from '../../../components/emails/EmailEditModal';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../lib/hooks/useToast';

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
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast, showError, hideToast } = useToast();

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
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const draft of emailDrafts) {
        try {
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
          if (!json.success) {
            failureCount++;
            errors.push(`${draft.supplierName}: ${json.error || 'Failed to send'}`);
          } else {
            successCount++;
          }
        } catch (draftError: any) {
          failureCount++;
          errors.push(`${draft.supplierName}: ${draftError.message || 'Network error'}`);
        }
      }

      setSending(false);

      // If all failed, show error toast
      if (successCount === 0) {
        showError(
          'Failed to send emails',
          errors.length > 0 ? errors.slice(0, 2).join(', ') : 'Please try again'
        );
        return;
      }

      // If some failed, show warning toast
      if (failureCount > 0) {
        showError(
          `${failureCount} ${failureCount === 1 ? 'email' : 'emails'} failed to send`,
          errors.slice(0, 2).join(', ')
        );
      }

      // Show success modal if at least one succeeded
      if (successCount > 0) {
        setShowSuccess(true);
      }

    } catch (err: any) {
      setSending(false);
      showError(
        'Error sending emails',
        err.message || 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.replace('/sessions');
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

      {/* Edit Products Button */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <TouchableOpacity
          style={[sessionStyles.secondaryButton, { marginBottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          onPress={() => router.push(`/sessions/${id}`)}
        >
          <Ionicons name="create-outline" size={18} color="#666" style={{ marginRight: 8 }} />
          <Text style={sessionStyles.secondaryButtonText}>Edit Products</Text>
        </TouchableOpacity>
      </View>

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
      {!sending && !showSuccess && (
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

      {/* Modals */}
      <SendConfirmationModal
        visible={showConfirm}
        emailCount={emailDrafts.length}
        onConfirm={handleSendAll}
        onCancel={() => setShowConfirm(false)}
      />

      <SuccessModal
        visible={showSuccess}
        emailCount={emailDrafts.length}
        onClose={handleSuccessClose}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        subtext={toast.subtext}
        type={toast.type}
        onClose={hideToast}
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
