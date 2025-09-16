// @ts-check
import React, { useState } from 'react';
import { Text } from '../../Typography';
import { View, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { ModalButton } from '../../ModalUtilities';
import {
  generateDeviceInvite,
  regenerateDeviceInvite,
  getSyncKeyParts,
  renderAddDeviceSection
} from './deviceInvite';

/**
 * RecoveryPhrase component handles recovery phrase functionality including:
 * - Recovery phrase display with proper formatting
 * - Copy to clipboard functionality
 * - Recovery phrase generation for device invites
 * - Security warnings and instructions
 * - Device sync key management
 */
const RecoveryPhrase = ({
  theme,
  showToast,
  syncRecoveryPhrase,
  generatedSyncKey,
  setGeneratedSyncKey,
  showGeneratedKey,
  setShowGeneratedKey,
  syncLoading,
  setSyncLoading,
  setSyncError
}) => {

  // Safe clipboard copy helper
  const copyToClipboard = async (text, successMessage) => {
    try {
      if (Platform.OS === 'web') {
        // Web: Use a safer approach that handles focus issues
        if (navigator.clipboard && window.isSecureContext) {
          // Modern approach with fallback
          await navigator.clipboard.writeText(text).catch(() => {
            // Fallback: Create temporary textarea
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
          });
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
        }
      } else {
        // Mobile: Use React Native clipboard
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        Clipboard.setString(text);
      }
      showToast({ message: successMessage });
    } catch (error) {
      showToast({ message: 'Failed to copy. Please select and copy manually.', type: 'error' });
    }
  };

  // Generate device invite code
  const handleGenerateDeviceInvite = () => generateDeviceInvite({
    syncRecoveryPhrase,
    setSyncLoading,
    setSyncError,
    setGeneratedSyncKey,
    setShowGeneratedKey,
    showToast
  });

  // Regenerate device invite code
  const handleRegenerateDeviceInvite = () => regenerateDeviceInvite({
    syncRecoveryPhrase,
    generatedSyncKey,
    setSyncLoading,
    setGeneratedSyncKey,
    showToast
  });

  // Extract sync key parts for display - using utility function
  const getKeyParts = () => getSyncKeyParts(generatedSyncKey);

  // Render recovery phrase display (permanent phrase)
  const renderRecoveryPhraseDisplay = () => {
    if (!syncRecoveryPhrase || syncRecoveryPhrase.startsWith('ERROR:')) {
      return null;
    }

    return (
      <View style={styles.shareSection}>
        <Text style={styles.shareSectionTitle}>Your Sync Key</Text>
        <Text style={styles.shareFieldHelper}>
          Keep this key safe. You'll need it to sync with other devices.
        </Text>

        <View style={styles.recoveryPhraseContainer}>
          <Text style={styles.syncKeyText} selectable>
            {syncRecoveryPhrase}
          </Text>
        </View>

        <View style={styles.syncKeyActions}>
          <ModalButton
            theme={theme}
            variant="secondary"
            label="Copy Key"
            icon="content-copy"
            onPress={() => copyToClipboard(syncRecoveryPhrase, 'Recovery phrase copied!')}
            compact
          />
        </View>

        <View style={styles.shareInstructions}>
          <View style={styles.shareInstructionItem}>
            <Icon name="warning" size={16} color="#ff9800" />
            <Text style={styles.shareInstructionText}>
              Store this key securely. If you lose it, you won't be able to sync with other devices.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render add device section - using utility function
  const handleRenderAddDeviceSection = () => renderAddDeviceSection({
    theme,
    showGeneratedKey,
    syncLoading,
    generatedSyncKey,
    copyToClipboard,
    showToast,
    generateDeviceInviteHandler: handleGenerateDeviceInvite,
    regenerateDeviceInviteHandler: handleRegenerateDeviceInvite
  });

  // Render security warnings
  const renderSecurityWarnings = () => (
    <View style={styles.shareSection}>
      <Text style={styles.shareSectionTitle}>Security Notes</Text>

      <View style={styles.shareInstructionItem}>
        <Icon name="security" size={16} color="#4caf50" />
        <Text style={styles.shareInstructionText}>
          Your data is encrypted end-to-end. Only you can decrypt it with your sync key.
        </Text>
      </View>

      <View style={styles.shareInstructionItem}>
        <Icon name="info" size={16} color="#2196f3" />
        <Text style={styles.shareInstructionText}>
          Device invites expire automatically and have limited uses for security.
        </Text>
      </View>

      <View style={styles.shareInstructionItem}>
        <Icon name="warning" size={16} color="#ff9800" />
        <Text style={styles.shareInstructionText}>
          Never share your permanent sync key publicly. Use device invites instead.
        </Text>
      </View>
    </View>
  );

  return {
    renderRecoveryPhraseDisplay,
    renderAddDeviceSection: handleRenderAddDeviceSection,
    renderSecurityWarnings,
    copyToClipboard,
    generateDeviceInvite: handleGenerateDeviceInvite,
    regenerateDeviceInvite: handleRegenerateDeviceInvite,
    getSyncKeyParts: getKeyParts
  };
};

export default RecoveryPhrase;