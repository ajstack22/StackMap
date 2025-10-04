// @ts-check
import React from 'react';
import { Text } from '../../Typography';
import { View, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { ModalButton } from '../../ModalUtilities';

/**
 * RecoveryPhrase component handles recovery phrase functionality including:
 * - Recovery phrase display with proper formatting
 * - Copy to clipboard functionality
 * - Security warnings and instructions
 */
const RecoveryPhrase = ({
  theme,
  showToast,
  syncRecoveryPhrase
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

  // Render recovery phrase display
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
          <View style={styles.shareInstructionItem}>
            <Icon name="info" size={16} color="#2196f3" />
            <Text style={styles.shareInstructionText}>
              To add another device: Open StackMap → Settings → Sync → Join Sync → Enter this recovery phrase.
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render security warnings
  const renderSecurityWarnings = () => (
    <View style={styles.shareSection}>
      <Text style={styles.shareSectionTitle}>Security Notes</Text>

      <View style={styles.shareInstructionItem}>
        <Icon name="security" size={16} color="#4caf50" />
        <Text style={styles.shareInstructionText}>
          Your data is encrypted end-to-end. Only you can decrypt it with your recovery phrase.
        </Text>
      </View>

      <View style={styles.shareInstructionItem}>
        <Icon name="info" size={16} color="#2196f3" />
        <Text style={styles.shareInstructionText}>
          Keep your recovery phrase safe. Anyone with it can access your sync data.
        </Text>
      </View>
    </View>
  );

  return {
    renderRecoveryPhraseDisplay,
    renderSecurityWarnings,
    copyToClipboard
  };
};

export default RecoveryPhrase;