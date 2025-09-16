// @ts-check
import React from 'react';
import { Text } from '../../Typography';
import { View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { ModalButton } from '../../ModalUtilities';
import syncService from '../../../services/sync';

/**
 * Device invite functionality for sync operations
 */

/**
 * Generate device invite code
 */
export const generateDeviceInvite = async ({
  syncRecoveryPhrase,
  setSyncLoading,
  setSyncError,
  setGeneratedSyncKey,
  setShowGeneratedKey,
  showToast
}) => {
  try {
    setSyncLoading(true);
    setSyncError('');

    // Try to get recovery phrase from multiple sources
    let currentPhrase = syncRecoveryPhrase;

    if (!currentPhrase) {
      currentPhrase = syncService.getRecoveryPhrase();
    }

    if (!currentPhrase) {
      throw new Error('Recovery phrase not available. Please disable and re-enable sync.');
    }

    const result = await syncService.createInviteCode(24, 5, 'Manual invite');

    if (result && result.inviteCode) {
      // The inviteUrl already includes the recovery phrase as a fragment
      const fullSyncKey = result.inviteUrl;
      setGeneratedSyncKey(fullSyncKey);
      setShowGeneratedKey(true);
      showToast({
        message: 'Sync key generated! Valid for 24 hours.',
        type: 'success'
      });
    } else {
      throw new Error('Failed to generate invite code');
    }
  } catch (error) {
    showToast({
      message: error.message || 'Failed to generate sync key',
      type: 'error'
    });
  } finally {
    setSyncLoading(false);
  }
};

/**
 * Regenerate device invite code
 */
export const regenerateDeviceInvite = async ({
  syncRecoveryPhrase,
  generatedSyncKey,
  setSyncLoading,
  setGeneratedSyncKey,
  showToast
}) => {
  try {
    setSyncLoading(true);

    // Get recovery phrase - extract from current key if needed
    let currentPhrase = syncRecoveryPhrase || syncService.getRecoveryPhrase();
    if (!currentPhrase && generatedSyncKey) {
      // Extract recovery phrase from the URL format
      const parts = generatedSyncKey.split('#');
      currentPhrase = parts[1]; // Recovery phrase is after the #
    }

    const result = await syncService.createInviteCode(24, 5, 'Manual invite');

    if (result && result.inviteCode) {
      // The inviteUrl already includes the recovery phrase as a fragment
      const fullSyncKey = result.inviteUrl;
      setGeneratedSyncKey(fullSyncKey);
      showToast({
        message: 'New sync key generated!',
        type: 'success'
      });
    }
  } catch (error) {
    showToast({
      message: 'Failed to generate new key',
      type: 'error'
    });
  } finally {
    setSyncLoading(false);
  }
};

/**
 * Extract sync key parts for display
 */
export const getSyncKeyParts = (generatedSyncKey) => {
  if (!generatedSyncKey) return null;

  const urlParts = generatedSyncKey.split('#');
  const recoveryPhrase = urlParts[1];
  const inviteCode = urlParts[0].split('/').pop();
  return {
    keyOnly: `${inviteCode}#${recoveryPhrase}`,
    fullUrl: generatedSyncKey,
    inviteCode,
    recoveryPhrase
  };
};

/**
 * Render add device section with generated key
 */
export const renderAddDeviceSection = ({
  theme,
  showGeneratedKey,
  syncLoading,
  generatedSyncKey,
  copyToClipboard,
  showToast,
  generateDeviceInviteHandler,
  regenerateDeviceInviteHandler
}) => (
  <View style={styles.shareSection}>
    {!showGeneratedKey ? (
      <ModalButton
        theme={theme}
        variant="primary"
        label="Add Device"
        icon="add-circle"
        onPress={generateDeviceInviteHandler}
        disabled={syncLoading}
        loading={syncLoading}
        fullWidth
      />
    ) : (
      <View style={styles.syncKeyDisplay}>
        <View style={[styles.shareField, { alignItems: 'center' }]}>
          <Text style={[styles.shareFieldLabel, { textAlign: 'center', fontSize: 16 }]}>
            Device Invite
          </Text>
        </View>

        <Text style={[styles.syncKeyText, { textAlign: 'center', marginTop: 8, marginBottom: 4, fontWeight: 'bold' }]} selectable>
          {getSyncKeyParts(generatedSyncKey)?.keyOnly}
        </Text>

        <Text style={[styles.shareFieldHelper, { textAlign: 'center', marginBottom: 16 }]}>
          Valid for 24 hours • Max 5 uses
        </Text>

        {/* Instructions */}
        <View style={[styles.shareInstructions, { alignItems: 'center' }]}>
          <View style={[styles.shareInstructionItem, { justifyContent: 'center' }]}>
            <Icon name="language" size={16} color="#000" />
            <Text style={styles.shareInstructionText}>Use the URL for browser access</Text>
          </View>
          <View style={[styles.shareInstructionItem, { justifyContent: 'center' }]}>
            <Icon name="smartphone" size={16} color="#000" />
            <Text style={styles.shareInstructionText}>Copy sync key for mobile apps</Text>
          </View>
          <View style={[styles.shareInstructionItem, { justifyContent: 'center' }]}>
            <Icon name="refresh" size={16} color="#000" />
            <Text style={styles.shareInstructionText}>Regenerate key if key above has expired</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={[styles.syncKeyActions, { justifyContent: 'center', flexWrap: 'wrap' }]}>
          <ModalButton
            theme={theme}
            variant="primary"
            label="Copy Key"
            icon="content-copy"
            onPress={() => {
              const keyOnly = getSyncKeyParts(generatedSyncKey)?.keyOnly;
              copyToClipboard(keyOnly, 'Sync key copied!');
              showToast({
                message: 'Sync key copied to clipboard!',
                type: 'success'
              });
            }}
            compact
          />

          <ModalButton
            theme={theme}
            variant="secondary"
            label="Copy URL"
            icon="link"
            onPress={() => {
              const fullUrl = getSyncKeyParts(generatedSyncKey)?.fullUrl;
              copyToClipboard(fullUrl, 'Sync URL copied!');
              showToast({
                message: 'Sync URL copied to clipboard!',
                type: 'success'
              });
            }}
            compact
          />

          <ModalButton
            theme={theme}
            variant="secondary"
            label="Regenerate Key"
            icon="refresh"
            onPress={regenerateDeviceInviteHandler}
            disabled={syncLoading}
            loading={syncLoading}
          />
        </View>
      </View>
    )}
  </View>
);