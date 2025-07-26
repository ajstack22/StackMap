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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { styles } from './styles';
import syncService from '../../../services/sync/syncService';
import SyncStatusIndicator from '../../SyncStatusIndicator';

const DataModal = ({
  visible,
  onClose,
  theme,
  onExportData,
  onImportData,
  showToast,
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

  useEffect(() => {
    if (visible) {
      checkSyncStatus();
    }
  }, [visible]);

  const checkSyncStatus = async () => {
    const enabled = await syncService.isEnabled();
    setSyncEnabled(enabled);
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
    Alert.alert(
      'Disable Sync',
      'Are you sure you want to disable sync? Your local data will remain but will no longer sync with other devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            await syncService.disable();
            setSyncEnabled(false);
            setSyncId(null);
            setSyncRecoveryPhrase('');
            showToast({ message: 'Sync disabled' });
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Data Management</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Sync Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync</Text>
              <Text style={styles.sectionDescription}>
                Keep your StackMap data synchronized across all your devices.
              </Text>

              {syncEnabled ? (
                <>
                  <View style={styles.statusContainer}>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Status</Text>
                      <View style={styles.connectedBadge}>
                        <Text style={styles.connectedText}>Connected</Text>
                      </View>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={styles.statusLabel}>Sync ID</Text>
                      <Text style={styles.statusValue}>{syncId?.substring(0, 8)}...</Text>
                    </View>
                  </View>

                  <SyncStatusIndicator />

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
                          backgroundColor="white"
                          color={theme.primary}
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
            <View style={[styles.section, { borderBottomWidth: 0 }]}>
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
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

export default DataModal;