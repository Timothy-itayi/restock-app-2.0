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
import { SuccessModal } from '../../../components/emails/SuccessModal';
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
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast, showError, hideToast } = useToast();
  const { goToSessionList, goBack } = useSessionNavigation();

  // Note: Session deletion navigation is handled explicitly in handleDelete.
  // We don't use useEffect here to avoid race conditions with duplicate navigations.

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

  // Early return after all hooks are called - but handle gracefully
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={sessionStyles.stickyHeader}>
          <TouchableOpacity onPress={goBack} style={sessionStyles.stickyBackButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={sessionStyles.stickyHeaderTitle}>Email Preview</Text>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={sessionStyles.emptyStateText}>Session not found.</Text>
        </View>
      </SafeAreaView>
    );
  }


  const handleSendAll = async () => {
    logger.info('[EmailPreview] handleSendAll called', { sessionId: id, draftCount: emailDrafts.length });
    setShowConfirm(false);
    setSending(true);

    try {
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      // Get sender email for replyTo
      const replyToEmail = senderProfile?.email;
      
      if (!replyToEmail) {
        logger.error('[EmailPreview] No sender email found in profile');
        setSending(false);
        showError(
          'Sender email required',
          'Please set your email in settings before sending emails.'
        );
        return;
      }

      logger.info(`[EmailPreview] Starting to send ${emailDrafts.length} emails`);
      
      for (const draft of emailDrafts) {
        logger.debug(`[EmailPreview] Sending email to ${draft.supplierName}`, {
          supplierEmail: draft.supplierEmail,
          subject: draft.subject,
          itemsCount: draft.items.length,
        });
        
        try {
          // Use the sendEmail API client
          // Send items so backend can format HTML version
          const emailRequest = {
            to: draft.supplierEmail,
            replyTo: replyToEmail,
            subject: draft.subject,
            text: draft.body,
            items: draft.items.map(item => ({
              productName: item.productName,
              quantity: item.quantity || 1,
            })),
            storeName: senderProfile?.storeName || senderProfile?.name || 'Restock App',
          };
          
          const result = await sendEmail(emailRequest);
          
          if (!result.success) {
            failureCount++;
            const errorMsg = `${draft.supplierName}: ${result.message || result.error || 'Failed to send'}`;
            logger.error(`[EmailPreview] Failed to send to ${draft.supplierName}`, { errorMsg });
            errors.push(errorMsg);
          } else {
            successCount++;
            logger.info(`[EmailPreview] Successfully sent to ${draft.supplierName}`);
          }
        } catch (draftError: any) {
          failureCount++;
          const errorMsg = `${draft.supplierName}: ${draftError.message || 'Network error'}`;
          logger.error(`[EmailPreview] Exception sending to ${draft.supplierName}`, draftError);
          errors.push(errorMsg);
        }
      }
      
      logger.info(`[EmailPreview] Send complete`, { successCount, failureCount });

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
        // Update session status to completed
        updateSession(id, { status: 'completed' });
        logger.info(`[EmailPreview] Updated session status to completed`, { sessionId: id });
        setShowSuccess(true);
      }

    } catch (err: any) {
      logger.error('[EmailPreview] Fatal error in handleSendAll', err);
      setSending(false);
      showError(
        'Error sending emails',
        err.message || 'An unexpected error occurred. Please try again.'
      );
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
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
        <Text style={sessionStyles.stickyHeaderTitle}>Email Preview</Text>
      </View>

      <EmailsSummary 
        emailCount={emailDrafts.length} 
        senderName={senderProfile?.name || ''} 
        senderEmail={senderProfile?.email || ''}
        storeName={senderProfile?.storeName || undefined}
      />

      {/* Edit Products and Delete Buttons */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <TouchableOpacity
          style={[sessionStyles.secondaryButton, { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          onPress={() => router.push(`/sessions/${id}/edit-product`)}
        >
          <Ionicons name="create-outline" size={18} color="#666" style={{ marginRight: 8 }} />
          <Text style={sessionStyles.secondaryButtonText}>Edit Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sessionStyles.secondaryButton, { borderColor: '#CC0000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#CC0000" style={{ marginRight: 8 }} />
          <Text style={[sessionStyles.secondaryButtonText, { color: '#CC0000' }]}>Delete Session</Text>
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
