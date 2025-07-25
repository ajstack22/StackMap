import React, { useRef, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import QRCode from 'react-native-qrcode-svg';
import { COLORS } from '../../../constants';
import { styles } from './styles';
import syncService from '../../../services/sync/syncService';
import SyncStatusIndicator from '../../SyncStatusIndicator';

const EditModeSettingsModal = ({
  visible,
  onClose,
  theme,
  insets,
  // Settings
  users,
  currentUser,
  dayMode,
  setDayMode,
  hasPinProtection,
  // Settings key
  settingsScrollKey,
  // Actions
  onUserSelect,
  onUserEdit,
  onUserDelete,
  onAddUser,
  onPinChange,
  onPinRemove,
  onPinEnable,
  onExportData,
  onImportData,
  onResetApp,
  // Share function
  onShareUser,
  // Toast
  showToast,
  // Android specific
  getAndroidModalBottomHeight,
  // Sync setup from URL
  syncSetupPhrase,
}) => {
  const settingsScrollRef = useRef(null);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncId, setSyncId] = useState(null);
  const [syncRecoveryPhrase, setSyncRecoveryPhrase] = useState('');
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [showRecoveryPhrase, setShowRecoveryPhrase] = useState(false);

  useEffect(() => {
    if (visible) {
      checkSyncStatus();
      
      // If we have a sync setup phrase from URL, populate it
      if (syncSetupPhrase && !syncEnabled) {
        setRecoveryInput(syncSetupPhrase);
        setShowRecoveryInput(true);
      }
    }
  }, [visible, syncSetupPhrase, syncEnabled]);

  const checkSyncStatus = async () => {
    const enabled = await syncService.isEnabled();
    setSyncEnabled(enabled);
    if (enabled) {
      const status = syncService.getStatus();
      setSyncId(status.syncId);
    }
  };

  const handleUserSelect = (userId) => {
    onUserSelect(userId);
  };

  const handleUserDelete = (userId, userName) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Are you sure you want to delete ${userName}? This will permanently remove the user and all their activity cards for all days.`
      );
      if (confirmed) {
        onUserDelete(userId);
      }
    } else {
      Alert.alert(
        'Delete User',
        `Are you sure you want to delete ${userName}? This will permanently remove the user and all their activity cards for all days.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => onUserDelete(userId)
          }
        ]
      );
    }
  };

  const handlePinRemove = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to remove PIN protection?');
      if (confirmed) {
        await onPinRemove();
      }
    } else {
      Alert.alert(
        'Remove PIN',
        'Are you sure you want to remove PIN protection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: onPinRemove
          }
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
      onShow={() => {
        // Force layout update on Android to fix scrolling
        if (Platform.OS === 'android') {
          setTimeout(() => {
            settingsScrollRef.current?.scrollTo({ y: 0, animated: false });
          }, 0);
        }
      }}
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
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <ScrollView 
          key={settingsScrollKey}
          ref={settingsScrollRef}
          style={{ flex: 1, backgroundColor: theme.light }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          collapsable={false}
          nestedScrollEnabled={true}
        >
            {/* User Management Section */}
            <Text style={styles.sectionTitle}>Users</Text>
            <View style={styles.usersList}>
              {Object.entries(users)
                .filter(([userId, user]) => !user.deleted)
                .map(([userId, user]) => (
                <TouchableOpacity
                  key={userId}
                  style={[
                    styles.userItem,
                    currentUser === userId && styles.userItemActive
                  ]}
                  onPress={() => handleUserSelect(userId)}
                >
                  <Text style={styles.userItemEmoji}>{user.icon}</Text>
                  <Text style={[
                    styles.userItemName,
                    currentUser === userId && styles.userItemNameActive
                  ]}>
                    {user.name}
                  </Text>
                  {currentUser === userId && (
                    <Icon name="check" size={20} color={theme.primary} />
                  )}
                  <TouchableOpacity
                    style={styles.editUserButton}
                    onPress={() => onUserEdit(userId, user.name, user.icon)}
                  >
                    <Icon name="edit" size={18} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteUserButton}
                    onPress={() => handleUserDelete(userId, user.name)}
                  >
                    <Icon name="delete" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.addUserButton}
                onPress={onAddUser}
              >
                <Icon name="add" size={24} color={theme.primary} />
                <Text style={styles.addUserText}>Add User</Text>
              </TouchableOpacity>
            </View>
            
            {/* Day Mode Section */}
            <Text style={styles.sectionTitle}>Day Mode</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggle, dayMode === 'today' && styles.toggleActive]}
                onPress={() => setDayMode('today')}
              >
                <Text style={[styles.toggleText, dayMode === 'today' && styles.toggleTextActive]}>
                  Today Only
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggle, dayMode === 'both' && styles.toggleActive]}
                onPress={() => setDayMode('both')}
              >
                <Text style={[styles.toggleText, dayMode === 'both' && styles.toggleTextActive]}>
                  Today & Tomorrow
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Edit Mode PIN Section */}
            <Text style={styles.sectionTitle}>PIN Protection</Text>
            <View style={styles.pinSection}>
              {hasPinProtection ? (
                <>
                  <Text style={styles.pinStatus}>PIN protection is enabled</Text>
                  <View style={styles.pinButtons}>
                    <TouchableOpacity
                      style={[styles.pinButton, { backgroundColor: theme.primary }]}
                      onPress={onPinChange}
                    >
                      <Text style={styles.pinButtonText}>Change PIN</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pinButton, { backgroundColor: '#f56565' }]}
                      onPress={handlePinRemove}
                    >
                      <Text style={styles.pinButtonText}>Remove PIN</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.pinStatus}>No PIN set</Text>
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]}
                    onPress={onPinEnable}
                  >
                    <Icon name="lock" size={20} color="white" />
                    <Text style={styles.buttonText}>Enable PIN</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            {/* Local Data Section */}
            <Text style={styles.sectionTitle}>Local Data</Text>
            <View style={styles.settingsSection}>
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary, marginBottom: 10 }]}
                onPress={onExportData}
              >
                <Icon name="save-alt" size={20} color="white" />
                <Text style={styles.buttonText}>Export Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={onImportData}
              >
                <Icon name="folder-open" size={20} color="white" />
                <Text style={styles.buttonText}>Import Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, { backgroundColor: COLORS.error, marginTop: 20 }]}
                onPress={onResetApp}
              >
                <Icon name="refresh" size={20} color="white" />
                <Text style={styles.buttonText}>Reset App</Text>
              </TouchableOpacity>
            </View>
            
            {/* Sync Section */}
            <Text style={styles.sectionTitle}>Cross-Device Sync</Text>
            <View style={styles.settingsSection}>
              {syncEnabled ? (
                <>
                  <SyncStatusIndicator theme={theme} showDetails={true} />
                  
                  {showRecoveryPhrase ? (
                    <View style={styles.recoveryPhraseContainer}>
                      <Text style={styles.recoveryPhraseLabel}>Your Recovery Phrase:</Text>
                      
                      {/* QR Code for recovery phrase */}
                      <View style={styles.qrCodeContainer}>
                        <QRCode
                          value={(() => {
                            const baseUrl = Platform.OS === 'web' 
                              ? `${window.location.origin}${window.location.pathname}`
                              : `https://stackmap.app`;
                            const fullUrl = `${baseUrl}?sync=${encodeURIComponent(syncRecoveryPhrase)}`;
                            console.log('[QR Code] Generated URL:', fullUrl);
                            return fullUrl;
                          })()}
                          size={180}
                          color="#000"
                          backgroundColor="#fff"
                        />
                      </View>
                      <Text style={styles.qrCodeHint}>Scan to sync on another device</Text>
                      
                      <Text style={styles.recoveryPhrase}>{syncRecoveryPhrase}</Text>
                      <Text style={styles.recoveryPhraseWarning}>
                        ⚠️ Save this phrase securely. You'll need it to sync on other devices.
                      </Text>
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary, marginTop: 10 }]}
                        onPress={() => setShowRecoveryPhrase(false)}
                      >
                        <Text style={styles.buttonText}>Hide</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: theme.primary, marginBottom: 10 }]}
                      onPress={async () => {
                        try {
                          // Get recovery phrase from service
                          const encryptionService = require('../../../services/sync/encryptionService').default;
                          const storedPhrase = await encryptionService.getStoredRecoveryPhrase(syncId);
                          if (storedPhrase) {
                            setSyncRecoveryPhrase(storedPhrase);
                            setShowRecoveryPhrase(true);
                          } else {
                            showToast('Recovery phrase not found', 'error');
                          }
                        } catch (error) {
                          showToast('Failed to retrieve recovery phrase', 'error');
                        }
                      }}
                    >
                      <Icon name="vpn-key" size={20} color="white" />
                      <Text style={styles.buttonText}>Show Recovery Phrase</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Share Button - Add spacing to avoid overlap with Show/Hide button */}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, marginTop: showRecoveryPhrase ? 0 : 15, marginBottom: 15 }]}
                    onPress={() => {
                      console.log('Share button pressed', { onShareUser: !!onShareUser, currentUser });
                      if (onShareUser) {
                        onShareUser(currentUser);
                      }
                    }}
                  >
                    <Icon name="share" size={20} color="white" />
                    <Text style={styles.buttonText}>Share Progress</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary, marginBottom: 10 }]}
                    onPress={async () => {
                      setSyncLoading(true);
                      try {
                        await syncService.requestSync({ immediate: true, priority: 'high' });
                        showToast('Sync completed successfully', 'success');
                        setLastSyncTime(new Date());
                      } catch (error) {
                        showToast(error.message || 'Sync failed', 'error');
                      } finally {
                        setSyncLoading(false);
                      }
                    }}
                    disabled={syncLoading}
                  >
                    {syncLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Icon name="sync" size={20} color="white" />
                    )}
                    <Text style={styles.buttonText}>Sync Now</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.dangerZone}>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: '#ff9800', marginBottom: 10 }]}
                      onPress={async () => {
                        if (Platform.OS === 'web') {
                          const confirmed = window.confirm('Are you sure you want to disable sync? Your data will remain on this device.');
                          if (confirmed) {
                            await syncService.disable();
                            setSyncEnabled(false);
                            setSyncId(null);
                            setSyncRecoveryPhrase('');
                            showToast('Sync disabled', 'success');
                          }
                        } else {
                          Alert.alert(
                            'Disable Sync',
                            'Are you sure you want to disable sync? Your data will remain on this device.',
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
                                  showToast('Sync disabled', 'success');
                                }
                              }
                            ]
                          );
                        }
                      }}
                    >
                      <Icon name="sync-disabled" size={20} color="white" />
                      <Text style={styles.buttonText}>Disable Sync Locally</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: COLORS.error }]}
                      onPress={async () => {
                        const message = 'Are you sure you want to permanently delete all your sync data from the server? This will remove your data from all synced devices. This action cannot be undone.';
                        
                        if (Platform.OS === 'web') {
                          const confirmed = window.confirm(message);
                          if (confirmed) {
                            const doubleConfirm = window.confirm('This will DELETE all your synced data from the server. Are you absolutely sure?');
                            if (doubleConfirm) {
                              setSyncLoading(true);
                              try {
                                await syncService.deleteFromServer();
                                setSyncEnabled(false);
                                setSyncId(null);
                                setSyncRecoveryPhrase('');
                                showToast('All sync data permanently deleted from server', 'success');
                              } catch (error) {
                                showToast(error.message || 'Failed to delete sync data', 'error');
                              } finally {
                                setSyncLoading(false);
                              }
                            }
                          }
                        } else {
                          Alert.alert(
                            '⚠️ Delete Sync Data',
                            message,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete Forever',
                                style: 'destructive',
                                onPress: () => {
                                  Alert.alert(
                                    '⚠️ Final Confirmation',
                                    'This will DELETE all your synced data from the server. Are you absolutely sure?',
                                    [
                                      { text: 'Cancel', style: 'cancel' },
                                      {
                                        text: 'Delete Everything',
                                        style: 'destructive',
                                        onPress: async () => {
                                          setSyncLoading(true);
                                          try {
                                            await syncService.deleteFromServer();
                                            setSyncEnabled(false);
                                            setSyncId(null);
                                            setSyncRecoveryPhrase('');
                                            showToast('All sync data permanently deleted from server', 'success');
                                          } catch (error) {
                                            showToast(error.message || 'Failed to delete sync data', 'error');
                                          } finally {
                                            setSyncLoading(false);
                                          }
                                        }
                                      }
                                    ]
                                  );
                                }
                              }
                            ]
                          );
                        }
                      }}
                      disabled={syncLoading}
                    >
                      {syncLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Icon name="delete-forever" size={20} color="white" />
                      )}
                      <Text style={styles.buttonText}>Delete from Server</Text>
                    </TouchableOpacity>
                    
                    <Text style={styles.dangerZoneText}>
                      Delete from Server will permanently remove all your synced data from our servers. 
                      Your local data will remain untouched.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.syncDescription}>
                    Sync your StackMap data across devices without creating an account.
                  </Text>
                  
                  {showRecoveryInput ? (
                    <View style={styles.recoveryInputContainer}>
                      <Text style={styles.recoveryInputLabel}>Enter Recovery Phrase:</Text>
                      <TextInput
                        style={styles.recoveryInput}
                        value={recoveryInput}
                        onChangeText={setRecoveryInput}
                        placeholder="Enter your recovery phrase"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={styles.qrScanHint}>
                        <Icon name="qr-code-scanner" size={14} color="#666" /> Or scan the QR code from your other device
                      </Text>
                      {syncError ? (
                        <Text style={styles.errorText}>{syncError}</Text>
                      ) : null}
                      <View style={styles.recoveryInputButtons}>
                        <TouchableOpacity
                          style={[styles.button, { backgroundColor: theme.primary, flex: 1, marginRight: 5 }]}
                          onPress={async () => {
                            setSyncLoading(true);
                            setSyncError('');
                            try {
                              const { syncId: newSyncId, recoveryPhrase } = await syncService.initialize(recoveryInput.trim());
                              setSyncEnabled(true);
                              setSyncId(newSyncId);
                              setSyncRecoveryPhrase(recoveryPhrase);
                              setShowRecoveryInput(false);
                              setRecoveryInput('');
                              showToast('Successfully connected to sync!', 'success');
                            } catch (error) {
                              setSyncError(error.message || 'Invalid recovery phrase');
                            } finally {
                              setSyncLoading(false);
                            }
                          }}
                          disabled={syncLoading || !recoveryInput.trim()}
                        >
                          {syncLoading ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text style={styles.buttonText}>Connect</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.button, { backgroundColor: '#666', flex: 1, marginLeft: 5 }]}
                          onPress={() => {
                            setShowRecoveryInput(false);
                            setRecoveryInput('');
                            setSyncError('');
                          }}
                        >
                          <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary, marginBottom: 10 }]}
                        onPress={async () => {
                          setSyncLoading(true);
                          try {
                            const { syncId: newSyncId, recoveryPhrase } = await syncService.initialize();
                            setSyncEnabled(true);
                            setSyncId(newSyncId);
                            setSyncRecoveryPhrase(recoveryPhrase);
                            setShowRecoveryPhrase(true);
                            showToast('Sync enabled! Save your recovery phrase.', 'success');
                          } catch (error) {
                            showToast(error.message || 'Failed to enable sync', 'error');
                          } finally {
                            setSyncLoading(false);
                          }
                        }}
                        disabled={syncLoading}
                      >
                        {syncLoading ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <>
                            <Icon name="add-circle" size={20} color="white" />
                            <Text style={styles.buttonText}>Enable New Sync</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }]}
                        onPress={() => setShowRecoveryInput(true)}
                      >
                        <Icon name="sync" size={20} color="white" />
                        <Text style={styles.buttonText}>Connect to Existing Sync</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}
            </View>
        </ScrollView>
        <SafeAreaView style={{ backgroundColor: theme.light }} />
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: getAndroidModalBottomHeight(insets) }} />
        )}
      </View>
    </Modal>
  );
};

export default React.memo(EditModeSettingsModal);