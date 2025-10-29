// @ts-check
import React, { useState } from 'react';
import { Text } from '../../Typography';
import { View, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { styles } from './styles';
import { ModalButton } from '../../ModalUtilities';

/**
 * RecoveryPhrase component handles recovery phrase functionality including:
 * - Recovery phrase display with proper formatting
 * - Copy to clipboard functionality
 * - QR code display for sync URL
 * - Show/hide toggle for sync key
 * - Copy Key and Copy URL buttons
 * - Security warnings and instructions
 */
const RecoveryPhrase = ({
  theme,
  showToast,
  syncRecoveryPhrase,
  syncEnabled
}) => {
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(true);

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

  // Render recovery phrase display with QR code (production UI)
  const renderRecoveryPhraseDisplay = () => {
    if (!syncRecoveryPhrase || syncRecoveryPhrase.startsWith('ERROR:')) {
      return null;
    }

    return (
      <View style={styles.recoveryPhraseCard}>
        <View style={styles.syncKeyHeader}>
          <Icon name="warning" size={20} color="#ff9800" />
          <Text style={styles.recoveryPhraseWarning}>
            Save this sync key! You'll need it to sync other devices.
          </Text>
        </View>

        {/* Key text with toggle */}
        {showRecoveryPhrase && (
          <View style={styles.recoveryPhraseContainer}>
            <Text style={styles.recoveryPhrase} selectable>
              {syncRecoveryPhrase || (
                syncEnabled
                  ? 'Recovery phrase unavailable. Try refreshing the browser or disable and re-enable sync.'
                  : 'Loading sync key...'
              )}
            </Text>
          </View>
        )}

        {/* Toggle button for key visibility */}
        <View style={styles.keyToggleContainer}>
          <ModalButton
            theme={theme}
            variant="secondary"
            label={showRecoveryPhrase ? 'Hide Key' : 'Show Key'}
            icon={showRecoveryPhrase ? "visibility-off" : "visibility"}
            onPress={() => setShowRecoveryPhrase(!showRecoveryPhrase)}
            compact
          />
        </View>

        {/* Action buttons - Always visible */}
        <View style={styles.keyActionButtonRow}>
          <ModalButton
            theme={theme}
            variant="primary"
            label="Copy Key"
            icon="content-copy"
            onPress={() => {
              if (!syncRecoveryPhrase) {
                showToast({ message: 'Sync key not available', type: 'error' });
                return;
              }
              copyToClipboard(syncRecoveryPhrase, 'Sync key copied!');
            }}
            style={styles.syncActionButton}
          />
          <ModalButton
            theme={theme}
            variant="primary"
            label="Copy URL"
            icon="link"
            onPress={() => {
              if (!syncRecoveryPhrase) {
                showToast({ message: 'Sync key not available', type: 'error' });
                return;
              }
              let syncUrl;
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                const basePath = window.location.pathname.endsWith('/')
                  ? window.location.pathname
                  : window.location.pathname + '/';
                syncUrl = `${window.location.origin}${basePath}?sync=${encodeURIComponent(
                  syncRecoveryPhrase,
                )}`;
              } else {
                syncUrl = `https://stackmap.app/?sync=${encodeURIComponent(
                  syncRecoveryPhrase,
                )}`;
              }
              copyToClipboard(syncUrl, 'Sync URL copied!');
            }}
            style={styles.syncActionButton}
          />
        </View>

        {/* QR Code - Always visible */}
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={(() => {
              if (!syncRecoveryPhrase) {
                return 'https://stackmap.app';
              }
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                const basePath = window.location.pathname.endsWith('/')
                  ? window.location.pathname
                  : window.location.pathname + '/';
                return `${window.location.origin}${basePath}?sync=${encodeURIComponent(
                  syncRecoveryPhrase,
                )}`;
              } else {
                return `https://stackmap.app/?sync=${encodeURIComponent(
                  syncRecoveryPhrase,
                )}`;
              }
            })()}
            size={200}
            backgroundColor="#ffffff"
            color="#000000"
          />
        </View>
      </View>
    );
  };

  // Render security warnings
  const renderSecurityWarnings = () => (
    <View style={[styles.shareSection, { paddingTop: 0, marginTop: 16 }]}>
      <View style={styles.shareInstructionItem}>
        <Icon name="security" size={14} color="#4caf50" />
        <Text style={[styles.shareInstructionText, { fontSize: 12, color: '#666' }]}>
          End-to-end encrypted - only you can decrypt your data
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