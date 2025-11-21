import React, { useMemo, useState, useEffect } from 'react';
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
import { sendEmail } from '../../../lib/api/sendEmail';

import { EmailsSummary } from '../../../components/emails/EmailsSummary';
import { EmailCard } from '../../../components/emails/EmailCard';
import  {EmailEditModal } from '../../../components/emails/EmailEditModal';
import { SendConfirmationModal } from '../../../components/emails/SendConfirmationModal';
import { SuccessModal } from '../../../components/emails/SuccessModal';
import { EmailDetailModal } from '../../../components/emails/EmailEditModal';
import { Toast } from '../../../components/Toast';
import { useToast } from '../../../lib/hooks/useToast';

export default function EmailPreviewScreen() {
  const styles = useThemedStyles(getEmailsStyles);
  const sessionStyles = useThemedStyles(getSessionsStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const session = useSessionStore((s) => s.getSession(id));
  const updateSession = useSessionStore((s) => s.updateSession);
  const suppliers = useSupplierStore((s) => s.suppliers);
  const senderProfile = useSenderProfile();

  const [selectedDraft, setSelectedDraft] = useState<any | null>(null);
  const [editDraft, setEditDraft] = useState<any | null>(null);
  const [editedDrafts, setEditedDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast, showError, hideToast } = useToast();

  // Handle session deletion - navigate away if session is deleted
  useEffect(() => {
    if (!session && id) {
      // Session was deleted, navigate back to sessions list
      router.replace('/sessions');
    }
  }, [session, id]);

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
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={sessionStyles.title}>Email Preview</Text>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={sessionStyles.emptyStateText}>Session not found.</Text>
        </View>
      </SafeAreaView>
    );
  }


  const handleSendAll = async () => {
    console.log('[EmailPreview] handleSendAll called');
    setShowConfirm(false);
    setSending(true);

    try {
      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      // Get sender email for replyTo
      const replyToEmail = senderProfile?.email;
      console.log('[EmailPreview] Sender profile:', {
        email: replyToEmail,
        name: senderProfile?.name,
        storeName: senderProfile?.storeName,
      });
      
      if (!replyToEmail) {
        console.error('[EmailPreview] No sender email found in profile');
        setSending(false);
        showError(
          'Sender email required',
          'Please set your email in settings before sending emails.'
        );
        return;
      }

      console.log(`[EmailPreview] Starting to send ${emailDrafts.length} emails`);
      
      for (const draft of emailDrafts) {
        console.log(`[EmailPreview] Sending email to ${draft.supplierName} (${draft.supplierEmail})`);
        console.log('[EmailPreview] Draft details:', {
          supplierName: draft.supplierName,
          supplierEmail: draft.supplierEmail,
          subject: draft.subject,
          bodyLength: draft.body.length,
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
          
          console.log('[EmailPreview] Email request:', {
            to: emailRequest.to,
            replyTo: emailRequest.replyTo,
            subject: emailRequest.subject,
            textLength: emailRequest.text.length,
            itemsCount: emailRequest.items.length,
            storeName: emailRequest.storeName,
          });
          
          const result = await sendEmail(emailRequest);
          
          console.log(`[EmailPreview] Email result for ${draft.supplierName}:`, {
            success: result.success,
            message: result.message,
            error: result.error,
          });

          if (!result.success) {
            failureCount++;
            const errorMsg = `${draft.supplierName}: ${result.message || result.error || 'Failed to send'}`;
            console.error(`[EmailPreview] Failed to send to ${draft.supplierName}:`, errorMsg);
            errors.push(errorMsg);
          } else {
            successCount++;
            console.log(`[EmailPreview] Successfully sent to ${draft.supplierName}`);
          }
        } catch (draftError: any) {
          failureCount++;
          const errorMsg = `${draft.supplierName}: ${draftError.message || 'Network error'}`;
          console.error(`[EmailPreview] Exception sending to ${draft.supplierName}:`, draftError);
          errors.push(errorMsg);
        }
      }
      
      console.log(`[EmailPreview] Send complete: ${successCount} succeeded, ${failureCount} failed`);

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
        console.log(`[EmailPreview] Updated session ${id} status to completed`);
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
