import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../styles/useThemedStyles';
import { getEmailsStyles } from '../../styles/components/emails';
import logger from '../../lib/helpers/logger';

interface SuccessModalProps {
  visible: boolean;
  emailCount: number;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ visible, emailCount, onClose }) => {
  const styles = useThemedStyles(getEmailsStyles);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I just sent ${emailCount} restock orders using Restock app!`,
      });
    } catch (err) {
      logger.error('Failed to share success message', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          
          <Text style={styles.modalTitle}>Emails Sent!</Text>
          <Text style={styles.modalDescription}>
            Successfully sent {emailCount} {emailCount === 1 ? 'order' : 'orders'} to your suppliers.
          </Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color="#fff" style={styles.shareButtonIcon} />
            <Text style={styles.shareButtonText}>Share with Team</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
