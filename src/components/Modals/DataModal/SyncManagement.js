// @ts-check
import React, { useState, useEffect } from 'react';
import { Text } from '../../Typography';
import { View, Platform, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { FormInput, ModalButton } from '../../ModalUtilities';
import SyncQRScanner from './SyncQRScanner';
import {
  handleEnableSync,
  handleRestoreSync,
  handleManualSync,
  handleDisableSync,
  handleDeleteServerData,
  showSyncConfirmation
} from './syncUtils';

/**
 * SyncManagement component handles all sync operations including:
 * - Enabling/disabling sync
 * - Creating new sync
 * - Restoring from recovery phrase
 * - Manual sync operations
 * - Sync error handling
 * - QR code scanning for sync restoration
 */
const SyncManagement = ({
  theme,
  showToast,
  onSyncStatusChange,
  onSyncStateUpdate,
  syncEnabled,
  syncLoading,
  setSyncLoading,
  syncError,
  setSyncError,
  showRecoveryInput,
  setShowRecoveryInput,
  recoveryInput,
  setRecoveryInput,
  showDisableSyncConfirm,
  setShowDisableSyncConfirm,
  showDeleteServerDataConfirm,
  setShowDeleteServerDataConfirm
}) => {
  // State for collapsible Advanced Options section
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // State for QR scanner modal
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Handle sync enable - creates new sync
  const handleSyncEnable = () => handleEnableSync({
    setSyncLoading,
    setSyncError,
    onSyncStateUpdate,
    onSyncStatusChange,
    showToast
  });

  // Handle sync restore from recovery phrase
  const handleSyncRestore = () => handleRestoreSync({
    recoveryInput,
    setSyncLoading,
    setSyncError,
    onSyncStateUpdate,
    setShowRecoveryInput,
    setRecoveryInput,
    onSyncStatusChange,
    showToast
  });

  // Handle manual sync
  const handleSyncManual = () => handleManualSync({
    onSyncStateUpdate,
    setSyncError,
    showToast
  });

  // Handle sync disable
  const handleSyncDisable = () => handleDisableSync({
    setSyncLoading,
    onSyncStateUpdate,
    setShowDisableSyncConfirm,
    onSyncStatusChange,
    showToast
  });

  // Handle delete server data
  const handleServerDataDelete = () => handleDeleteServerData({
    setShowDeleteServerDataConfirm,
    setSyncLoading,
    onSyncStateUpdate,
    onSyncStatusChange,
    showToast
  });

  // Render sync not enabled view
  const renderSyncDisabled = () => (
    <View style={styles.section}>
      <View style={styles.standardTabContainer}>
        <Icon name="sync" size={48} color={theme.primary} />
        <Text style={styles.standardTabTitle}>Sync Your Data</Text>
        <Text style={styles.standardTabDescription}>
          Keep your data synchronized across devices with end-to-end encryption
        </Text>

        <View style={styles.syncFeatures}>
          <View style={styles.syncFeature}>
            <Icon name="security" size={20} color={theme.primary} />
            <Text style={styles.syncFeatureText}>End-to-end encrypted</Text>
          </View>
          <View style={styles.syncFeature}>
            <Icon name="devices" size={20} color={theme.primary} />
            <Text style={styles.syncFeatureText}>Multi-device support</Text>
          </View>
          <View style={styles.syncFeature}>
            <Icon name="cloud-off" size={20} color={theme.primary} />
            <Text style={styles.syncFeatureText}>Works offline</Text>
          </View>
        </View>

        {!!syncError && (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={16} color="#d32f2f" />
            <Text style={styles.errorText}>{syncError}</Text>
          </View>
        )}

        {!!showRecoveryInput && (
          <>
            <View style={styles.recoveryInputContainer}>
              <Text style={styles.inputLabel}>Enter your sync key:</Text>
              <Text style={styles.inputHelperText}>
                Your sync key is a 32-character code that looks like:
                a1b2c3d4e5f6789012345678901234567
              </Text>
              <FormInput
                value={recoveryInput}
                onChangeText={setRecoveryInput}
                placeholder="Paste sync key"
                multiline
                numberOfLines={2}
                autoCapitalize="none"
                autoCorrect={false}
                inputStyle={styles.recoveryInput}
                theme={theme}
              />
              <ModalButton
                theme={theme}
                variant="secondary"
                label="Scan QR Code"
                icon="qr-code-scanner"
                onPress={() => setShowQRScanner(true)}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </View>
          </>
        )}

        {!showRecoveryInput ? (
          <View style={styles.inPanelButtonContainer}>
            <ModalButton
              theme={theme}
              variant="primary"
              label="Create New Sync"
              icon="add-circle"
              onPress={handleSyncEnable}
              disabled={syncLoading}
              loading={syncLoading}
              fullWidth
            />

            <ModalButton
              theme={theme}
              variant="secondary"
              label="Restore from Sync Key"
              icon="restore"
              onPress={() => setShowRecoveryInput(true)}
              fullWidth
            />
          </View>
        ) : (
          <View style={styles.inPanelButtonContainer}>
            <View style={styles.buttonRow}>
              <ModalButton
                theme={theme}
                variant="secondary"
                label="Cancel"
                onPress={() => {
                  setShowRecoveryInput(false);
                  setRecoveryInput('');
                  setSyncError('');
                }}
                compact
              />

              <ModalButton
                theme={theme}
                variant="primary"
                label="Restore"
                onPress={handleSyncRestore}
                disabled={syncLoading || !recoveryInput.trim()}
                loading={syncLoading}
              />
            </View>
          </View>
        )}
      </View>

      {/* QR Scanner Modal */}
      <SyncQRScanner
        visible={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={(syncKey) => {
          setRecoveryInput(syncKey);
          setShowQRScanner(false);
          showToast({ message: 'QR code scanned successfully!', type: 'success' });
        }}
        theme={theme}
      />
    </View>
  );

  // Render sync enabled controls
  const renderSyncControls = () => (
    <View style={styles.inPanelButtonContainer}>
      {/* Primary Action: Sync Now */}
      <ModalButton
        theme={theme}
        variant="primary"
        label="Sync Now"
        icon="sync"
        onPress={handleSyncManual}
        disabled={syncLoading}
        fullWidth
      />

      {/* Collapsible Advanced Options */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity
          style={styles.collapsibleHeader}
          onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          <Text style={styles.collapsibleHeaderText}>Advanced Options</Text>
          <Icon
            name={showAdvancedOptions ? 'expand-less' : 'expand-more'}
            size={20}
            color="#666"
          />
        </TouchableOpacity>

        {showAdvancedOptions && (
          <View style={styles.collapsibleContent}>
            <ModalButton
              theme={theme}
              variant="danger"
              label="Disable Sync"
              icon="sync-disabled"
              onPress={() => {
                if (Platform.OS === 'ios') {
                  showSyncConfirmation('disable', handleSyncDisable);
                } else {
                  setShowDisableSyncConfirm(true);
                }
              }}
              fullWidth
            />

            <ModalButton
              theme={theme}
              variant="danger"
              label="Delete Server Data"
              icon="delete-forever"
              onPress={() => {
                if (Platform.OS === 'ios') {
                  showSyncConfirmation('delete', handleServerDataDelete);
                } else {
                  setShowDeleteServerDataConfirm(true);
                }
              }}
              fullWidth
            />
          </View>
        )}
      </View>
    </View>
  );

  return {
    renderSyncDisabled,
    renderSyncControls,
    handleEnableSync: handleSyncEnable,
    handleRestoreSync: handleSyncRestore,
    handleManualSync: handleSyncManual,
    handleDisableSync: handleSyncDisable,
    handleDeleteServerData: handleServerDataDelete
  };
};

export default SyncManagement;