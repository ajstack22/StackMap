// @ts-check
import React from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity, Platform, Share } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { styles } from './styles';
import { ModalButton } from '../../ModalUtilities';

/**
 * SyncQRCode utility handles QR code functionality including:
 * - QR code generation for sync keys and share URLs
 * - Share URL display and management
 * - Copy link functionality with platform detection
 * - Mobile share sheet integration
 * - QR code styling and customization
 */
const SyncQRCode = ({
  theme,
  showToast,
  qrValue,
  qrTitle,
  qrDescription,
  qrSize = 200,
  showCopyButton = true,
  showShareButton = true,
  customActions = [],
  qrError = false,
  setQrError = () => {}
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

  // Handle native share
  const handleNativeShare = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: Use Web Share API if available, fallback to clipboard
        if (navigator.share) {
          await navigator.share({
            title: qrTitle || 'StackMap Share',
            text: qrDescription || 'Check out my StackMap activities',
            url: qrValue
          });
        } else {
          // Fallback to copy
          await copyToClipboard(qrValue, 'Link copied to clipboard!');
        }
      } else {
        // Mobile: Use React Native Share
        await Share.share({
          message: Platform.OS === 'ios' ? qrDescription || qrTitle || qrValue : qrValue,
          url: Platform.OS === 'ios' ? qrValue : undefined,
          title: qrTitle || 'StackMap Share'
        });
      }
    } catch (error) {
      if (error.message !== 'User did not share') {
        showToast({
          message: 'Failed to share. Link copied instead.',
          type: 'warning'
        });
        await copyToClipboard(qrValue, 'Link copied to clipboard!');
      }
    }
  };

  // Handle QR code error
  const handleQRError = () => {
    setQrError(true);
  };

  // Render QR code with fallback
  const renderQRCode = () => {
    if (qrError || !qrValue) {
      return (
        <View style={[styles.qrCodeContainer, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', height: qrSize, width: qrSize }]}>
          <Icon name="qr-code" size={48} color="#ccc" />
          <Text style={[styles.errorText, { marginTop: 8, textAlign: 'center' }]}>
            QR code unavailable
          </Text>
        </View>
      );
    }

    try {
      return (
        <View style={styles.qrCodeContainer}>
          <QRCode
            value={qrValue}
            size={qrSize}
            backgroundColor="#ffffff"
            color="#000000"
          />
        </View>
      );
    } catch (error) {
      return (
        <View style={[styles.qrCodeContainer, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center', height: qrSize, width: qrSize }]}>
          <Icon name="error" size={48} color="#d32f2f" />
          <Text style={[styles.errorText, { marginTop: 8, textAlign: 'center' }]}>
            QR generation failed
          </Text>
        </View>
      );
    }
  };

  // Render QR code header
  const renderQRHeader = () => {
    if (!qrTitle && !qrDescription) return null;

    return (
      <View style={styles.shareSection}>
        {qrTitle && (
          <Text style={styles.shareSectionTitle}>{qrTitle}</Text>
        )}
        {qrDescription && (
          <Text style={styles.shareFieldHelper}>{qrDescription}</Text>
        )}
      </View>
    );
  };

  // Render action buttons
  const renderActionButtons = () => {
    const buttons = [];

    if (showCopyButton) {
      buttons.push(
        <ModalButton
          key="copy"
          theme={theme}
          variant="primary"
          label="Copy Link"
          icon="content-copy"
          onPress={() => copyToClipboard(qrValue, 'Link copied to clipboard!')}
          compact
        />
      );
    }

    if (showShareButton && Platform.OS !== 'web') {
      buttons.push(
        <ModalButton
          key="share"
          theme={theme}
          variant="secondary"
          label="Share"
          icon="share"
          onPress={handleNativeShare}
          compact
        />
      );
    }

    // Add custom actions
    customActions.forEach((action, index) => {
      buttons.push(
        <ModalButton
          key={`custom-${index}`}
          theme={theme}
          variant={action.variant || 'secondary'}
          label={action.label}
          icon={action.icon}
          onPress={action.onPress}
          disabled={action.disabled}
          loading={action.loading}
          compact
        />
      );
    });

    if (buttons.length === 0) return null;

    return (
      <View style={[styles.syncKeyActions, { justifyContent: 'center', flexWrap: 'wrap' }]}>
        {buttons}
      </View>
    );
  };

  // Render complete QR code section
  const renderQRCodeSection = () => (
    <View style={styles.shareSection}>
      {renderQRHeader()}
      {renderQRCode()}
      {renderActionButtons()}
    </View>
  );

  // Render minimal QR code (just the code, no actions)
  const renderMinimalQRCode = () => (
    <View style={styles.qrCodeContainer}>
      {renderQRCode()}
    </View>
  );

  // Render share instructions
  const renderShareInstructions = () => (
    <View style={styles.shareInstructions}>
      <View style={styles.shareInstructionItem}>
        <Icon name="qr-code-scanner" size={16} color="#000" />
        <Text style={styles.shareInstructionText}>
          Scan QR code with any device camera
        </Text>
      </View>
      <View style={styles.shareInstructionItem}>
        <Icon name="link" size={16} color="#000" />
        <Text style={styles.shareInstructionText}>
          Or copy and share the link directly
        </Text>
      </View>
      {Platform.OS !== 'web' && (
        <View style={styles.shareInstructionItem}>
          <Icon name="share" size={16} color="#000" />
          <Text style={styles.shareInstructionText}>
            Use native share to send via messaging apps
          </Text>
        </View>
      )}
    </View>
  );

  // Create share content object for external use
  const getShareContent = () => ({
    title: qrTitle || 'StackMap Share',
    message: qrDescription || 'Check out my StackMap activities',
    url: qrValue
  });

  return {
    renderQRCodeSection,
    renderMinimalQRCode,
    renderQRHeader,
    renderActionButtons,
    renderShareInstructions,
    copyToClipboard,
    handleNativeShare,
    getShareContent
  };
};

export default SyncQRCode;