import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Linking,
  Clipboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import styles from './styles';
import syncService from '../../../services/sync/syncService';
import encryptionService from '../../../services/sync/encryptionService';

const CreateSyncModal = ({ visible, onClose, onSyncCreated, theme }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncData, setSyncData] = useState(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [hasCreatedSync, setHasCreatedSync] = useState(false);
  const insets = useSafeAreaInsets();

  // Create sync when modal opens
  useEffect(() => {
    if (visible && !hasCreatedSync) {
      createNewSync();
      setHasCreatedSync(true);
    }
  }, [visible, hasCreatedSync]);

  const createNewSync = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate recovery phrase
      const recoveryPhrase = encryptionService.generateRecoveryPhrase();
      
      // Generate sync ID from recovery phrase
      const syncId = await syncService.generateSyncId(recoveryPhrase);
      
      // For creating a sync code without initializing actual sync
      // We'll just generate the code and display it
      // The actual sync will happen when the user enters this code on their device
      
      setSyncData({
        recoveryPhrase,
        syncId,
        qrData: `stackmap://sync/${recoveryPhrase}`,
      });
      
      if (onSyncCreated) {
        onSyncCreated(recoveryPhrase);
      }
    } catch (err) {
      console.error('Error creating sync:', err);
      setError('Failed to create sync. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (syncData?.recoveryPhrase) {
      Clipboard.setString(syncData.recoveryPhrase);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    }
  };

  const handleVisitSupport = () => {
    Linking.openURL('https://stackmap.app?supportus');
  };

  const handleClose = () => {
    // Don't reset syncData to prevent re-triggering createNewSync
    setError(null);
    onClose();
  };
  
  // Reset sync data when modal becomes invisible
  useEffect(() => {
    if (!visible && hasCreatedSync) {
      // Reset after a delay to prevent flashing
      const timer = setTimeout(() => {
        setSyncData(null);
        setError(null);
        setHasCreatedSync(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [visible, hasCreatedSync]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modal, { backgroundColor: theme.background }]}>
        <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="close" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>New App Sync</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.text }]}>
                  Creating sync code...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={48} color="#e53e3e" />
                <Text style={[styles.errorText, { color: '#e53e3e' }]}>{error}</Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: theme.primary }]}
                  onPress={createNewSync}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : syncData ? (
              <>
                <Text style={[styles.description, { color: theme.text }]}>
                  Use this sync code on your device to connect your existing StackMap data to the cloud.
                </Text>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  <QRCode
                    value={syncData.qrData}
                    size={200}
                    color={theme.text}
                    backgroundColor={theme.background}
                  />
                </View>

                {/* Recovery Phrase */}
                <View style={[styles.codeContainer, { backgroundColor: theme.card }]}>
                  <Text style={[styles.codeLabel, { color: theme.textSecondary }]}>
                    Sync Code
                  </Text>
                  <Text style={[styles.codeText, { color: theme.text }]}>
                    {syncData.recoveryPhrase}
                  </Text>
                  <TouchableOpacity
                    style={[styles.copyButton, { backgroundColor: theme.primary }]}
                    onPress={handleCopyCode}
                  >
                    <Icon name="content-copy" size={18} color="white" />
                    <Text style={styles.copyButtonText}>Copy Code</Text>
                  </TouchableOpacity>
                </View>

                {/* Instructions */}
                <View style={styles.instructionsContainer}>
                  <Text style={[styles.instructionsTitle, { color: theme.text }]}>
                    How to sync your device:
                  </Text>
                  <View style={styles.instructionItem}>
                    <Text style={[styles.instructionNumber, { color: theme.primary }]}>1</Text>
                    <Text style={[styles.instructionText, { color: theme.text }]}>
                      Open StackMap on your device
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Text style={[styles.instructionNumber, { color: theme.primary }]}>2</Text>
                    <Text style={[styles.instructionText, { color: theme.text }]}>
                      Go to Settings → Data Management
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Text style={[styles.instructionNumber, { color: theme.primary }]}>3</Text>
                    <Text style={[styles.instructionText, { color: theme.text }]}>
                      Enable Sync and enter this code
                    </Text>
                  </View>
                </View>

                {/* Support Button */}
                <TouchableOpacity
                  style={[styles.supportButton, { backgroundColor: theme.primary }]}
                  onPress={handleVisitSupport}
                >
                  <Icon name="favorite" size={20} color="white" />
                  <Text style={styles.supportButtonText}>Support StackMap</Text>
                </TouchableOpacity>

                <Text style={[styles.supportText, { color: theme.textSecondary }]}>
                  Keep StackMap free for families everywhere
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Toast */}
        {showCopiedToast && (
          <View style={styles.toastContainer}>
            <View style={[styles.toast, { backgroundColor: theme.primary }]}>
              <Icon name="check" size={20} color="white" />
              <Text style={styles.toastText}>Copied to clipboard!</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default CreateSyncModal;