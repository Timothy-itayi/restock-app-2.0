import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemedStyles } from '../../../styles/useThemedStyles';
import { getEmailsStyles } from '../../../styles/components/emails';
import { getSessionsStyles } from '../../../styles/components/sessions';
import { useThemeStore } from '../../../lib/store/useThemeStore';
import colors from '../../../lib/theme/colors';

import { useSessionStore } from '../../../store/useSessionStore';
import { useSupplierStore } from '../../../store/useSupplierStore';
import { useSenderProfile } from '../../../store/useSenderProfileStore';
import { AlertModal } from '../../../components/AlertModal';
import { useAlert } from '../../../lib/hooks/useAlert';

import { groupBySupplier } from '../../../lib/utils/groupBySupplier';
import { sendEmail } from '../../../lib/api/sendEmail';

import { EmailsSummary } from '../../../components/emails/EmailsSummary';
import { EmailCard } from '../../../components/emails/EmailCard';
import  {EmailEditModal } from '../../../components/emails/EmailEditModal';
import { SendConfirmationModal } from '../../../components/emails/SendConfirmationModal';
import { EmailDetailModal } from '../../../components/emails/EmailEditModal';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../lib/hooks/useToast';
import { useSessionNavigation } from '../../../lib/hooks/useSessionNavigation';
import logger from '../../../lib/helpers/logger';

export default function EmailPreviewScreen() {
  const styles = useThemedStyles(getEmailsStyles);
  const sessionStyles = useThemedStyles(getSessionsStyles);
  const { theme } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const session = useSessionStore((s) => s.getSession(id));
  const updateSession = useSessionStore((s) => s.updateSession);
  const deleteSession = useSessionStore((s) => s.deleteSession);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const senderProfile = useSenderProfile();
  const { alert, hideAlert, showAlert } = useAlert();

  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [editDraft, setEditDraft] = useState<any | null>(null);
  const [editedDrafts, setEditedDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [individualSending, setIndividualSending] = useState<Record<string, boolean>>({});
  const [sentDrafts, setSentDrafts] = useState<Set<string>>(new Set());
  const { toast, showError, hideToast } = useToast();
  const { goToSessionList, goBack } = useSessionNavigation();

  // Build supplier → items grouping using centralized utility
  const emailDrafts = useMemo(() => {
    // Return empty array if session is not available
    if (!session) {
      return [];
    }
    
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
      const userName = senderProfile?.name || 'Customer';
      const storeNameDisplay = senderProfile?.storeName ? ` from ${senderProfile.storeName}` : '';
      
      return `Hi ${supplierName || 'there'},\n\nI'd like to place an order for the following items:\n\n${productList}\n\nPlease let me know if you have any questions or if any items are unavailable.\n\nThank you,\n${userName}${storeNameDisplay}`;
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

  // Reusable individual send logic
  const sendIndividualEmail = async (draft: any) => {
    const replyToEmail = senderProfile?.email;
    if (!replyToEmail) {
      showError('Sender email required', 'Please set your email in settings before sending.');
      return false;
    }

    try {
      const emailRequest = {
        to: draft.supplierEmail,
        replyTo: replyToEmail,
        subject: draft.subject,
        text: draft.body,
        items: draft.items.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity || 1,
        })),
        storeName: senderProfile?.storeName || senderProfile?.name || 'Restock App',
      };

      const result = await sendEmail(emailRequest);
      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to send');
      }
      return true;
    } catch (err: any) {
      logger.error(`[EmailPreview] Individual send failed for ${draft.supplierName}`, err);
      throw err;
    }
  };

  const handleSendSingle = async (draft: any) => {
    setIndividualSending(prev => ({ ...prev, [draft.supplierId]: true }));
    try {
      const success = await sendIndividualEmail(draft);
      if (success) {
        setSentDrafts(prev => new Set([...prev, draft.supplierId]));
        
        // If all drafts are now sent, complete the session
        const allSent = emailDrafts.every(d => 
          d.supplierId === draft.supplierId || sentDrafts.has(d.supplierId)
        );
        
        if (allSent) {
          updateSession(id, { status: 'completed' });
          showAlert('success', 'Emails Sent!', 'Successfully sent all orders to your suppliers.', [
            { text: 'Done', onPress: handleSuccessClose }
          ]);
        }
      }
    } catch (err: any) {
      showAlert('error', 'Send Failed', `Failed to send to ${draft.supplierName}: ${err.message}`);
    } finally {
      setIndividualSending(prev => ({ ...prev, [draft.supplierId]: false }));
    }
  };

  const handleSendAll = async () => {
    logger.info('[EmailPreview] handleSendAll called', { sessionId: id, draftCount: emailDrafts.length });
    setShowConfirm(false);
    setSending(true);

    try {
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      for (const draft of emailDrafts) {
        // Skip already sent
        if (sentDrafts.has(draft.supplierId)) {
          successCount++;
          continue;
        }

        try {
          const success = await sendIndividualEmail(draft);
          if (success) {
            successCount++;
            setSentDrafts(prev => new Set([...prev, draft.supplierId]));
          } else {
            failureCount++;
            errors.push(`${draft.supplierName}: Failed to send`);
          }
        } catch (err: any) {
          failureCount++;
          errors.push(`${draft.supplierName}: ${err.message}`);
        }
      }
      
      setSending(false);

      if (successCount > 0) {
        updateSession(id, { status: 'completed' });
        const message = failureCount > 0 
          ? `Successfully sent ${successCount} orders, but ${failureCount} failed.`
          : `Successfully sent ${successCount} ${successCount === 1 ? 'order' : 'orders'} to your suppliers.`;
        
        showAlert(failureCount > 0 ? 'warning' : 'success', 'Emails Sent', message, [
          { text: 'Done', onPress: handleSuccessClose }
        ]);
      } else if (failureCount > 0) {
        showAlert('error', 'Send Failed', `All ${failureCount} emails failed to send. Please check your connection and try again.`);
      }
    } catch (err: any) {
      setSending(false);
      showAlert('error', 'System Error', err.message || 'An unexpected error occurred.');
    }
  };

  const handleSuccessClose = () => {
    goToSessionList();
  };

  // Handle back navigation - prevent going back after session is completed
  const handleBackPress = () => {
    if (session?.status === 'completed') {
      goToSessionList();
    } else {
      goBack();
    }
  };

  const handleDelete = () => {
    if (!session) return;
    const sessionLabel = session.items.length === 0 
      ? 'this empty session' 
      : `session with ${session.items.length} item${session.items.length !== 1 ? 's' : ''}`;
    
    showAlert('delete', 'Delete Session?', `Are you sure you want to delete ${sessionLabel}? This action cannot be undone.`, [
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: () => {
          logger.info('[EmailPreview] Deleting session', { sessionId: session.id });
          deleteSession(session.id);
          // Navigate directly to home, replacing the entire stack to avoid blank screens
          router.dismissAll();
          router.replace('/');
        }
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={sessionStyles.stickyHeader}>
        <TouchableOpacity onPress={handleBackPress} style={sessionStyles.stickyBackButton}>
          <Ionicons name="chevron-back" size={24} color={colors.neutral.darkest} />
        </TouchableOpacity>
        <Text style={[sessionStyles.stickyHeaderTitle, { flex: 1 }]}>Email Preview</Text>
        <TouchableOpacity 
          onPress={handleDelete}
          style={{ padding: 8 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.status.error} />
        </TouchableOpacity>
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
          onPress={() => router.push(`/sessions/${id}/edit-product`)}
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
            onSend={() => handleSendSingle(draft)}
            onTap={() => setSelectedDraft(draft)}
            isSending={individualSending[draft.supplierId]}
            isSent={sentDrafts.has(draft.supplierId)}
          />
        ))}
      </ScrollView>

      {/* Send All */}
      {!sending && (
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
          <View style={styles.sendingContainer}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
            <Text style={styles.sendingTitle}>Sending emails...</Text>
          </View>
        </View>
      )}

      {/* Modals */}
      <SendConfirmationModal
        visible={showConfirm}
        emailCount={emailDrafts.length}
        onConfirm={handleSendAll}
        onCancel={() => setShowConfirm(false)}
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
        sessionId={id}
        editingEmail={editDraft ? {
          supplierName: editDraft.supplierName,
          supplierEmail: editDraft.supplierEmail,
          subject: editDraft.subject,
          body: editDraft.body,
          items: editDraft.items.map(item => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity
          }))
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
        sessionId={id}
        email={selectedDraft ? {
          supplierName: selectedDraft.supplierName,
          supplierEmail: selectedDraft.supplierEmail,
          subject: selectedDraft.subject,
          body: selectedDraft.body,
          items: selectedDraft.items.map(item => ({
            id: item.id,
            productName: item.productName,
            quantity: item.quantity
          }))
        } : null}
        onClose={() => setSelectedDraft(null)}
        onEdit={(email) => {
          setEditDraft(selectedDraft);
          setSelectedDraft(null);
        }}
      />

      {/* Alert Modal */}
      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        actions={alert.actions}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}
