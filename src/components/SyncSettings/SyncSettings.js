import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Clipboard from '@react-native-clipboard/clipboard';
import syncService from '../../services/sync/syncService';
import { styles } from './styles';

const SyncSettings = ({ theme, onClose }) => {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);
  const [inputRecoveryPhrase, setInputRecoveryPhrase] = useState('');
  const [showJoinSync, setShowJoinSync] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showReenterPhrase, setShowReenterPhrase] = useState(false);
  const [reenterPhrase, setReenterPhrase] = useState('');

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const enabled = await syncService.isEnabled();
      setSyncEnabled(enabled);
      
      if (enabled) {
        const status = syncService.getStatus();
        setSyncStatus(status);
        
        // Load last sync time
        const lastSync = await AsyncStorage.getItem('@last_sync_time');
        if (lastSync) {
          setLastSyncTime(new Date(lastSync));
        }
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const handleEnableSync = async () => {
    setIsLoading(true);
    try {
      const { syncId, recoveryPhrase: phrase, isNewSync } = await syncService.initialize();
      
      if (isNewSync) {
        setRecoveryPhrase(phrase);
        setShowRecoveryPhrase(true);
        Alert.alert(
          'Sync Enabled',
          'Save your recovery phrase! You\'ll need it to sync other devices.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Sync Enabled', 'Successfully connected to existing sync group.');
      }
      
      setSyncEnabled(true);
      setSyncStatus(syncService.getStatus());
      
      // Perform initial sync
      await handleManualSync();
    } catch (error) {
      Alert.alert('Sync Error', error.message || 'Failed to enable sync');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableSync = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Disable Sync?\n\nThis will stop syncing on this device. Your data will remain but won\'t sync anymore.');
      if (confirmed) {
        await syncService.disable();
        setSyncEnabled(false);
        setSyncStatus(null);
        setRecoveryPhrase('');
        setShowRecoveryPhrase(false);
        setShowReenterPhrase(false);
        setReenterPhrase('');
      }
    } else {
      Alert.alert(
        'Disable Sync?',
        'This will stop syncing on this device. Your data will remain but won\'t sync anymore.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await syncService.disable();
              setSyncEnabled(false);
              setSyncStatus(null);
              setRecoveryPhrase('');
              setShowRecoveryPhrase(false);
              setShowReenterPhrase(false);
              setReenterPhrase('');
            }
          }
        ]
      );
    }
  };

  const handleJoinSync = async () => {
    if (!inputRecoveryPhrase.trim()) {
      Alert.alert('Error', 'Please enter a recovery phrase');
      return;
    }

    setIsLoading(true);
    try {
      const { syncId } = await syncService.initialize(inputRecoveryPhrase.trim());
      
      if (Platform.OS === 'web') {
        alert('Successfully connected to sync group!');
      } else {
        Alert.alert('Success', 'Connected to sync group!');
      }
      setSyncEnabled(true);
      setSyncStatus(syncService.getStatus());
      setShowJoinSync(false);
      setInputRecoveryPhrase('');
      
      // Perform initial sync
      await handleManualSync();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert(error.message || 'Invalid recovery phrase or sync group not found');
      } else {
        Alert.alert('Sync Error', error.message || 'Invalid recovery phrase or sync group not found');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSync = async () => {
    console.log('Manual sync triggered');
    setIsSyncing(true);
    try {
      const result = await syncService.sync();
      console.log('Sync result:', result);
      
      // Update last sync time
      const now = new Date();
      setLastSyncTime(now);
      await AsyncStorage.setItem('@last_sync_time', now.toISOString());
      
      // Update status
      setSyncStatus(syncService.getStatus());
      
      // Show success feedback
      if (Platform.OS === 'web') {
        alert('Sync completed successfully!');
      } else {
        Alert.alert('Success', 'Sync completed successfully!');
      }
    } catch (error) {
      console.error('Sync error:', error);
      
      // Check if it's an encryption error
      if (error.message.includes('Encryption not initialized')) {
        setShowReenterPhrase(true);
        if (Platform.OS === 'web') {
          alert('Please re-enter your recovery phrase to continue syncing.');
        } else {
          Alert.alert('Recovery Phrase Needed', 'Please re-enter your recovery phrase to continue syncing.');
        }
      } else {
        if (Platform.OS === 'web') {
          alert(`Sync Failed: ${error.message || 'Failed to sync data'}`);
        } else {
          Alert.alert('Sync Failed', error.message || 'Failed to sync data');
        }
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const copyRecoveryPhrase = () => {
    Clipboard.setString(recoveryPhrase);
    if (Platform.OS === 'web') {
      alert('Recovery phrase copied to clipboard!');
    } else {
      Alert.alert('Copied', 'Recovery phrase copied to clipboard');
    }
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Never';
    
    const now = new Date();
    const diff = now - lastSyncTime;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return lastSyncTime.toLocaleDateString();
  };

  const handleReenterPhrase = async () => {
    if (!reenterPhrase.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter your recovery phrase');
      } else {
        Alert.alert('Error', 'Please enter your recovery phrase');
      }
      return;
    }

    setIsLoading(true);
    try {
      await syncService.restoreEncryption(reenterPhrase.trim());
      
      setShowReenterPhrase(false);
      setReenterPhrase('');
      
      // Try to sync again
      await handleManualSync();
    } catch (error) {
      if (Platform.OS === 'web') {
        alert('Invalid recovery phrase. Please try again.');
      } else {
        Alert.alert('Error', 'Invalid recovery phrase. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Cross-Device Sync</Text>
      
      {!syncEnabled ? (
        <>
          <Text style={styles.description}>
            Sync your activities across all your devices. No account required!
          </Text>
          
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleEnableSync}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Icon name="sync" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.primaryButtonText}>Enable Sync</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowJoinSync(!showJoinSync)}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
              Join Existing Sync
            </Text>
          </TouchableOpacity>

          {showJoinSync && (
            <View style={styles.joinSyncContainer}>
              <Text style={styles.inputLabel}>Enter Recovery Phrase</Text>
              <TextInput
                style={[styles.input, { borderColor: theme.primary }]}
                value={inputRecoveryPhrase}
                onChangeText={setInputRecoveryPhrase}
                placeholder="Enter your recovery phrase"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.joinButton, { backgroundColor: theme.primary }]}
                onPress={handleJoinSync}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>Connect</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <Icon name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.statusText}>Sync Enabled</Text>
            </View>
            
            {syncStatus && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  Sync ID: {syncStatus.syncId?.substring(0, 8)}...
                </Text>
                <Text style={styles.statsText}>
                  Version: {syncStatus.version}
                </Text>
                <Text style={styles.statsText}>
                  Last Sync: {formatLastSync()}
                </Text>
              </View>
            )}
          </View>

          {showRecoveryPhrase && recoveryPhrase && (
            <View style={[styles.recoveryContainer, { backgroundColor: theme.light }]}>
              <Text style={styles.recoveryTitle}>Your Recovery Phrase</Text>
              <Text style={styles.recoveryWarning}>
                Save this phrase! You'll need it to sync other devices.
              </Text>
              <TouchableOpacity onPress={copyRecoveryPhrase}>
                <View style={styles.recoveryPhraseBox}>
                  <Text style={styles.recoveryPhrase}>{recoveryPhrase}</Text>
                  <Icon name="content-copy" size={20} color="#666" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.hideButton}
                onPress={() => setShowRecoveryPhrase(false)}
              >
                <Text style={[styles.hideButtonText, { color: theme.primary }]}>
                  Hide Recovery Phrase
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.syncButton, { backgroundColor: theme.primary }]}
              onPress={handleManualSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="refresh" size={20} color="white" style={styles.buttonIcon} />
                  <Text style={styles.primaryButtonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>

            {!showRecoveryPhrase && recoveryPhrase && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowRecoveryPhrase(true)}
              >
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                  Show Recovery Phrase
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleDisableSync}
            >
              <Text style={styles.dangerButtonText}>Disable Sync</Text>
            </TouchableOpacity>
          </View>

          {showReenterPhrase && (
            <View style={[styles.recoveryContainer, { backgroundColor: theme.light }]}>
              <Text style={styles.recoveryTitle}>Re-enter Recovery Phrase</Text>
              <Text style={styles.recoveryWarning}>
                Your encryption key needs to be restored. Please enter your recovery phrase.
              </Text>
              <TextInput
                style={[styles.input, { borderColor: theme.primary }]}
                value={reenterPhrase}
                onChangeText={setReenterPhrase}
                placeholder="Enter your recovery phrase"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.reenterButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { flex: 1 }]}
                  onPress={() => {
                    setShowReenterPhrase(false);
                    setReenterPhrase('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.joinButton, { backgroundColor: theme.primary, flex: 1 }]}
                  onPress={handleReenterPhrase}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Restore</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <View style={styles.infoContainer}>
        <Icon name="info-outline" size={16} color="#666" />
        <Text style={styles.infoText}>
          Your data is encrypted end-to-end. We never see your activities or personal information.
        </Text>
      </View>
    </View>
  );
};

export default SyncSettings;