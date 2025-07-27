import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { styles } from './styles';
import syncService from '../../../services/sync/syncService';
import SyncStatusIndicator from '../../SyncStatusIndicator';
import { COLORS } from '../../../constants';
import ConfirmModal from '../ConfirmModal';

const DataModal = ({
  visible,
  onClose,
  theme,
  onExportData,
  onImportData,
  onResetApp,
  showToast,
  onSyncStatusChange,
}) => {
  const insets = useSafeAreaInsets();
  
  // Sync state
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncId, setSyncId] = useState(null);
  const [syncRecoveryPhrase, setSyncRecoveryPhrase] = useState('');
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [showDisableSyncConfirm, setShowDisableSyncConfirm] = useState(false);
  const [showDeleteServerDataConfirm, setShowDeleteServerDataConfirm] = useState(false);

  useEffect(() => {
    if (visible) {
      checkSyncStatus();
    }
  }, [visible]);

  const checkSyncStatus = async () => {
    const enabled = await syncService.isEnabled();
    setSyncEnabled(enabled);
    if (onSyncStatusChange) {
      onSyncStatusChange(enabled);
    }
    if (enabled) {
      const status = syncService.getStatus();
      setSyncId(status.syncId);
      const phrase = await syncService.getRecoveryPhrase();
      setSyncRecoveryPhrase(phrase);
    }
  };

  const handleEnableSync = async () => {
    setSyncLoading(true);
    setSyncError('');
    try {
      const { syncId: newSyncId, recoveryPhrase } = await syncService.initialize();
      setSyncEnabled(true);
      if (onSyncStatusChange) {
        onSyncStatusChange(true);
      }
      setSyncId(newSyncId);
      setSyncRecoveryPhrase(recoveryPhrase);
      setShowRecoveryPhrase(true);
      showToast({ message: 'Sync enabled successfully!' });
    } catch (error) {
      setSyncError(error.message || 'Failed to enable sync');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleConnectSync = async () => {
    if (!recoveryInput.trim()) {
      setSyncError('Please enter a recovery phrase');
      return;
    }

    setSyncLoading(true);
    setSyncError('');
    try {
      const { syncId: newSyncId, recoveryPhrase } = await syncService.initialize(recoveryInput.trim());
      setSyncEnabled(true);
      if (onSyncStatusChange) {
        onSyncStatusChange(true);
      }
      setSyncId(newSyncId);
      setSyncRecoveryPhrase(recoveryPhrase);
      setShowRecoveryInput(false);
      setRecoveryInput('');
      showToast({ message: 'Connected to sync successfully!' });
    } catch (error) {
      setSyncError(error.message || 'Invalid recovery phrase');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDisableSync = () => {
    setShowDisableSyncConfirm(true);
  };

  const confirmDisableSync = async () => {
    await syncService.disable();
    setSyncEnabled(false);
    if (onSyncStatusChange) {
      onSyncStatusChange(false);
    }
    setSyncId(null);
    setSyncRecoveryPhrase('');
    showToast({ message: 'Sync disabled' });
  };

  const confirmDeleteServerData = async () => {
    setSyncLoading(true);
    try {
      await syncService.deleteFromServer();
      setSyncEnabled(false);
      if (onSyncStatusChange) {
        onSyncStatusChange(false);
      }
      setSyncId(null);
      setSyncRecoveryPhrase('');
      showToast({ message: 'All sync data permanently deleted from server' });
    } catch (error) {
      showToast({ message: error.message || 'Failed to delete sync data' });
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      {Platform.OS === 'android' && (
        <StatusBar 
          backgroundColor={theme.primary} 
          barStyle="light-content" 
          translucent={false}
        />
      )}
      <View style={[styles.modalContainer, { backgroundColor: theme.primary }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="cloud-sync" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Data Management</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Sync Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync</Text>
              <Text style={styles.sectionDescription}>
                Keep your StackMap data synchronized across all your devices.
              </Text>

              {syncEnabled ? (
                <>
                  <SyncStatusIndicator theme={theme} />

                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={() => setShowRecoveryPhrase(!showRecoveryPhrase)}
                  >
                    <Icon name={showRecoveryPhrase ? "visibility-off" : "visibility"} size={20} color="white" />
                    <Text style={styles.buttonText}>
                      {showRecoveryPhrase ? 'Hide' : 'Show'} Recovery Phrase
                    </Text>
                  </TouchableOpacity>

                  {showRecoveryPhrase && (
                    <View style={styles.recoveryPhraseContainer}>
                      <View style={styles.qrContainer}>
                        <QRCode
                          value={syncRecoveryPhrase}
                          size={200}
                          backgroundColor="#ffffff"
                          color="#000000"
                        />
                      </View>
                      <View style={styles.recoveryPhrase}>
                        <Text style={styles.recoveryPhraseText}>{syncRecoveryPhrase}</Text>
                      </View>
                      <Text style={styles.infoText}>
                        Save this phrase to connect other devices
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: '#e53e3e' }]}
                    onPress={handleDisableSync}
                  >
                    <Icon name="sync-disabled" size={20} color="white" />
                    <Text style={styles.buttonText}>Disable Sync</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {showRecoveryInput ? (
                    <>
                      <TextInput
                        style={styles.input}
                        value={recoveryInput}
                        onChangeText={setRecoveryInput}
                        placeholder="Enter recovery phrase"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {syncError ? (
                        <Text style={styles.errorText}>{syncError}</Text>
                      ) : null}
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={handleConnectSync}
                        disabled={syncLoading}
                      >
                        {syncLoading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Icon name="link" size={20} color="white" />
                            <Text style={styles.buttonText}>Connect</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#666' }]}
                        onPress={() => {
                          setShowRecoveryInput(false);
                          setRecoveryInput('');
                          setSyncError('');
                        }}
                      >
                        <Text style={styles.buttonText}>Cancel</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {/* Only show "Enable New Sync" button on web */}
                      {Platform.OS === 'web' && (
                        <TouchableOpacity
                          style={[styles.button, { backgroundColor: theme.primary }]}
                          onPress={handleEnableSync}
                          disabled={syncLoading}
                        >
                          {syncLoading ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <>
                              <Icon name="sync" size={20} color="white" />
                              <Text style={styles.buttonText}>Enable New Sync</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                      
                      {/* Show "Connect Existing Sync" on all platforms */}
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={() => setShowRecoveryInput(true)}
                      >
                        <Icon name="link" size={20} color="white" />
                        <Text style={styles.buttonText}>Connect Existing Sync</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>

            {/* Backup Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Backup</Text>
              <Text style={styles.sectionDescription}>
                Export and import your StackMap data for safekeeping or transfer.
              </Text>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={onExportData}
              >
                <Icon name="file-download" size={20} color="white" />
                <Text style={styles.buttonText}>Export Data</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={onImportData}
              >
                <Icon name="file-upload" size={20} color="white" />
                <Text style={styles.buttonText}>Import Data</Text>
              </TouchableOpacity>
            </View>

            {/* Danger Zone - Only show when sync is enabled */}
            {syncEnabled && (
              <View style={[styles.section, { borderBottomWidth: 0 }]}>
                <Text style={[styles.sectionTitle, { color: '#d32f2f' }]}>Danger Zone</Text>
                <Text style={styles.sectionDescription}>
                  Irreversible actions that affect your synced data.
                </Text>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: COLORS.error }]}
                  onPress={() => setShowDeleteServerDataConfirm(true)}
                  disabled={syncLoading}
                >
                  {syncLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon name="delete-forever" size={20} color="white" />
                      <Text style={styles.buttonText}>Delete All Server Data</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <View style={styles.warningContainer}>
                  <Text style={styles.warningText}>
                    ⚠️ This will permanently remove all your synced data from our servers. Your local data will remain untouched.
                  </Text>
                </View>
              </View>
            )}

            {/* Local Data Danger Zone - Always show */}
            <View style={[styles.section, { borderBottomWidth: 0, marginTop: syncEnabled ? 0 : 20 }]}>
              {!syncEnabled && (
                <>
                  <Text style={[styles.sectionTitle, { color: '#d32f2f' }]}>Danger Zone</Text>
                  <Text style={styles.sectionDescription}>
                    Irreversible actions that affect your local data.
                  </Text>
                </>
              )}
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.error }]}
                onPress={onResetApp}
              >
                <Icon name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Reset App</Text>
              </TouchableOpacity>
              
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  ⚠️ This will delete all local data and reset the app to its initial state. This action cannot be undone.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
      </View>
      
      {/* Disable Sync Confirmation Modal */}
      <ConfirmModal
        visible={showDisableSyncConfirm}
        onClose={() => setShowDisableSyncConfirm(false)}
        onConfirm={confirmDisableSync}
        theme={theme}
        title="Disable Sync"
        message="Are you sure you want to disable sync? Your local data will remain but will no longer sync with other devices."
        confirmText="Disable Sync"
        confirmButtonColor="#e53e3e"
        icon="sync-disabled"
        iconColor="#e53e3e"
      />
      
      {/* Delete Server Data Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteServerDataConfirm}
        onClose={() => setShowDeleteServerDataConfirm(false)}
        onConfirm={confirmDeleteServerData}
        theme={theme}
        title="Delete Sync Data"
        message="Are you sure you want to permanently delete all your sync data from the server? This will remove your data from all synced devices. This action cannot be undone."
        confirmText="Delete Forever"
        confirmButtonColor="#d32f2f"
        icon="delete-forever"
        iconColor="#d32f2f"
      />
    </Modal>
  );
};

export default DataModal;