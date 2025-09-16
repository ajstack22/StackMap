// @ts-check
import React, { useState, useEffect } from 'react';
import { Text } from '../../Typography';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import ConfirmModal from '../ConfirmModal';
import { TabbedModal, TabContent } from '../../../components';
import { FormInput, ModalButton } from '../../ModalUtilities';
import syncService from '../../../services/sync';
import useAppStore from '../../../stores/useAppStore';
import QRCode from 'react-native-qrcode-svg';
import DataExport from './DataExport';
import DataImport from './DataImport';
import ImportPreview from './ImportPreview';
import ImportConfirmation from './ImportConfirmation';
// Normalization removed - v3 support discontinued

// Import platform-specific modules moved to DataImport.js

const DataModal = ({
  visible,
  onClose,
  theme,
  users,
  currentUser,
  currentDay,
  libraryCategories,
  currentTheme,
  bannerPosition,
  hasSecurePin,
  showToast,
  onImportComplete,
  onSyncStatusChange,
  onShowSupport,
  onReset,
  isOnboarding = false,
  onboardingImportData = null,
  initialTab = 0,
}) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importMode, setImportMode] = useState('fresh'); // 'fresh' or 'merge'
  const [importSelections, setImportSelections] = useState({});

  // Sync state
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncId, setSyncId] = useState(null);
  const [syncRecoveryPhrase, setSyncRecoveryPhrase] = useState('');
  const [showRecoveryInput, setShowRecoveryInput] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [showDisableSyncConfirm, setShowDisableSyncConfirm] = useState(false);
  const [showDeleteServerDataConfirm, setShowDeleteServerDataConfirm] =
    useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [syncStatusChecked, setSyncStatusChecked] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [generatedSyncKey, setGeneratedSyncKey] = useState('');
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);

  // Share state
  const [shareLoading, setShareLoading] = useState(false);
  const [shareToken, setShareToken] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [expiresHours, setExpiresHours] = useState('168'); // Default to 1 week
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includeTomorrow, setIncludeTomorrow] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [activeShares, setActiveShares] = useState({});
  const [showActiveShares, setShowActiveShares] = useState(true);
  const [selectedShareUser, setSelectedShareUser] = useState(null);
  const [showShareQR, setShowShareQR] = useState(false);
  

  // Tabs configuration - filter out unnecessary tabs for onboarding
  const tabs = isOnboarding
    ? [{ key: 'import', label: 'Import', icon: 'file-download' }]
    : [
        { key: 'sync', label: 'Sync', icon: 'sync' },
        { key: 'share', label: 'Share', icon: 'share' },
        { key: 'import', label: 'Import', icon: 'file-download' },
        { key: 'export', label: 'Export', icon: 'file-upload' },
        { key: 'reset', label: 'Reset', icon: 'refresh' },
      ];

  const [activeTab, setActiveTab] = useState(initialTab); // Use initialTab or default to 0

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      // Reset import state
      handleResetImportState();
      setSyncError('');
      setShowRecoveryInput(false);
      setRecoveryInput('');
      setShareUrl('');
      setShareToken('');
      setRecipientName('');
      setShareNote('');
      setExpiresHours('168');
      setIncludeCompleted(true);
      setIncludeTomorrow(true);
      setAutoUpdate(true);
      setSelectedShareUser(null);
      // Reset to Import tab when modal closes
      setActiveTab(initialTab);
    } else {
      // If onboarding mode with import data, set it up
      if (isOnboarding && onboardingImportData) {
        handleFileSelected({
          file: { name: 'Imported Data' },
          data: onboardingImportData
        });
        setImportMode('fresh'); // Always fresh for onboarding
        setActiveTab(0); // Import is the only tab in onboarding
      }
      // When opening, load active shares
      if (!isOnboarding) {
        loadActiveShares();
      }
    }
  }, [visible, isOnboarding, onboardingImportData]);

  // Format time ago helper
  const formatTimeAgo = timestamp => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Check sync status on mount
  useEffect(() => {
    checkSyncStatus();
  }, [visible]);

  // Listen to sync status updates
  useEffect(() => {
    if (!syncEnabled) return;

    // Status listener not available in minimal sync service
    // Status updates are handled through the sync store instead
  }, [syncEnabled]);

  const checkSyncStatus = async () => {
    try {
      const enabled = await syncService.isEnabled();

      if (enabled) {
        // If sync is enabled locally, trust that state
        setSyncEnabled(true);
        
        const id = await syncService.getSyncId();
        // Got sync ID from service
        
        // Also check what's in AsyncStorage directly
        const storedId = await AsyncStorage.getItem('@sync_id');
        
        if (id !== storedId) {
          // MISMATCH: Service sync ID !== stored sync ID
        }
        
        let phrase = await syncService.getRecoveryPhrase();
        // Got recovery phrase from service
        
        // If no phrase from service, try direct AsyncStorage as fallback
        if (!phrase && id) {
          // No phrase from service, trying direct AsyncStorage lookup
          
          // Try multiple possible storage keys
          const possibleKeys = [
            `@sync_phrase_${id}`,
            `@sync_phrase`,
            `recovery_phrase_${id}`,
            '@sync_recovery_phrase'
          ];
          
          for (const key of possibleKeys) {
            try {
              const directPhrase = await AsyncStorage.getItem(key);
              if (directPhrase) {
                // Found phrase in AsyncStorage
                phrase = directPhrase;
                break;
              }
            } catch (e) {
              // Error checking key
            }
          }
        }
        
        // If phrase is null and we have a syncId, it means we have an orphaned sync
        // Show a clear message to the user about what's wrong
        if (!phrase && id) {
          // Store what we found for debugging
          const checkedKeys = [
            `@sync_phrase_${id}`,
            `@sync_phrase`,
            `recovery_phrase_${id}`,
            '@sync_recovery_phrase'
          ];
          const debugInfo = {
            syncId: id,
            checkedKeys: checkedKeys,
            localStorage: typeof window !== 'undefined' ? Object.keys(window.localStorage).filter(k => k.includes('sync')).join(', ') : 'N/A'
          };
          
          setSyncId(id);
          setSyncRecoveryPhrase(`ERROR: Recovery phrase not found. Sync ID: ${id.substring(0, 8)}... Please disable and recreate sync.`);
          setSyncEnabled(false);
          
          // Also store the debug info in a global variable for inspection
          if (typeof window !== 'undefined') {
            window.__syncDebugInfo = debugInfo;
          }
        } else {
          setSyncId(id);
          setSyncRecoveryPhrase(phrase || '');
        }
        
        // Optionally verify it exists on server in the background
        // but don't disable the UI if it fails (might just be creating)
        syncService.verifySyncExists().then(exists => {
          if (!exists && enabled) {
            // Sync is enabled but doesn't exist on server yet
            // This can happen when first creating a sync

          }
        });
      } else {
        setSyncEnabled(false);
        setSyncId('');
        setSyncRecoveryPhrase('');
      }

      setSyncStatusChecked(true);
    } catch (error) {
      setSyncStatusChecked(true);
    }
  };

  const loadActiveShares = async () => {
    try {
      const shares = await syncService.getActiveShares();
      const userShares = {};

      // Group shares by user
      if (shares && shares.length > 0) {
        // If shares don't have proper userId, group them under a generic "All Shares" category
        const hasUserIds = shares.some(share => share.userId && share.userId !== 'unknown');
        
        if (hasUserIds && users) {
          // Group by actual users
          Object.entries(users).forEach(([userId, user]) => {
            const userActiveShares = shares.filter(
              share => share.userId === userId,
            );
            if (userActiveShares.length > 0) {
              userShares[userId] = {
                user,
                shares: userActiveShares,
              };
            }
          });
        } else {
          // Group all shares together
          userShares['all'] = {
            user: { name: 'All Shares', icon: '📤' },
            shares: shares,
          };
        }
      }

      setActiveShares(userShares || {});
    } catch (error) {
    }
  };


  // Import state management
  const handleResetImportState = () => {
    setImportFile(null);
    setImportData(null);
    setImportMode('fresh');
    setImportSelections({});
  };

  const handleFileSelected = ({ file, data }) => {
    setImportFile(file);
    setImportData(data);
    // Selections will be initialized by ImportPreview component
  };

  const handleImportError = (error) => {
    Alert.alert('Import Error', error);
  };

  const handleImportModeChange = (mode) => {
    setImportMode(mode);
  };

  const handleImportSelectionsChange = (selections) => {
    setImportSelections(selections);
  };


  // File selection is now handled by DataImport component

  // Import selection is now handled by ImportPreview component

  // Import completion handler
  const handleImportComplete = async (dataToImport) => {
    await onImportComplete(dataToImport);
    onClose();
  };

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

  // Handle sync enable
  const handleEnableSync = async () => {
    // Set loading immediately to give instant feedback
    setSyncLoading(true);
    setSyncError('');

    // Use setTimeout to ensure the UI updates before the async operation
    setTimeout(async () => {
      try {
        // CRITICAL: Use create() for "Create New Sync" button
        // This ensures we get the right sync ID and recovery phrase
        const result = await syncService.create();
        
        // Immediately capture the frozen values to prevent any modification
        const finalSyncId = result.syncId;
        const finalRecoveryPhrase = result.recoveryPhrase;
        

        // Set state with captured values from the frozen result
        // CRITICAL: Make sure we're not swapping these!
        setSyncEnabled(true);
        setSyncId(finalSyncId);  // This sets the sync ID state
        setSyncRecoveryPhrase(finalRecoveryPhrase);  // This sets what gets DISPLAYED
        

        if (onSyncStatusChange) {
          onSyncStatusChange(true);
        }

        // Show appropriate message based on whether sync was new or restored
        if (result.isNewSync) {
          showToast({ message: 'Sync enabled successfully!' });
        } else {
          showToast({ message: 'Sync restored - displaying recovery phrase' });
        }
        
        // DON'T call checkSyncStatus here - it will overwrite the correct recovery phrase!
        // The result from create() is the source of truth
      } catch (error) {
        setSyncError(error.message || 'Failed to enable sync');
        // CRITICAL: Clear all sync state if there's an error
        setSyncEnabled(false);
        setSyncId('');
        setSyncRecoveryPhrase('');
        showToast({
          message: error.message || 'Failed to enable sync',
          type: 'error',
        });
      } finally {
        setSyncLoading(false);
      }
    }, 0);
  };

  // Handle sync restore
  const handleRestoreSync = async () => {
    // Set loading immediately to give instant feedback
    setSyncLoading(true);
    setSyncError('');

    // Use setTimeout to ensure the UI updates before the async operation
    setTimeout(async () => {
      try {
        if (!recoveryInput.trim()) {
          setSyncError('Please enter your sync key');
          setSyncLoading(false);
          return;
        }

        // Use joinSync method to join existing sync
        const result = await syncService.joinSync(recoveryInput.trim());

        setSyncId((typeof result === 'object' && result.syncId) || syncService.syncId);
        setSyncRecoveryPhrase(recoveryInput.trim());
        setSyncEnabled(true);
        setShowRecoveryInput(false);
        setRecoveryInput('');

        if (onSyncStatusChange) {
          onSyncStatusChange(true);
        }

        const message = (typeof result === 'object' && result.isNewSync)
          ? 'New sync created successfully!'
          : 'Joined existing sync successfully!';
        showToast({ message });
      } catch (error) {
        setSyncError(error.message || 'Failed to restore sync');
      } finally {
        setSyncLoading(false);
      }
    }, 0);
  };

  // Handle manual sync
  const handleManualSync = async () => {
    try {
      setSyncStatus('syncing');
      setSyncError('');
      
      const result = await syncService.performManualSync();
      
      if (result.success) {
        setLastSyncTime(Date.now());
        setSyncStatus('idle');
        showToast({ 
          message: 'Sync completed successfully',
          type: 'success'
        });
      } else {
        setSyncStatus('idle');
        setSyncError(result.message || 'Sync failed');
        showToast({ 
          message: result.message || 'Sync failed',
          type: 'error'
        });
      }
    } catch (error) {
      setSyncStatus('idle');
      setSyncError(error.message);
      showToast({ 
        message: `Sync failed: ${error.message}`,
        type: 'error'
      });
    }
  };

  // Handle sync disable
  const handleDisableSync = async () => {
    try {
      setSyncLoading(true);

      await syncService.disable();

      setSyncEnabled(false);
      setSyncId(null);
      setSyncRecoveryPhrase('');
      setShowDisableSyncConfirm(false);

      if (onSyncStatusChange) {
        onSyncStatusChange(false);
      }

      showToast({ message: 'Sync disabled' });
    } catch (error) {
      Alert.alert('Error', 'Failed to disable sync');
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle delete server data
  const handleDeleteServerData = async () => {
    
    // Close the modal immediately
    setShowDeleteServerDataConfirm(false);
    
    try {
      setSyncLoading(true);
      
      const currentSyncId = syncService.getSyncId ? syncService.getSyncId() :
                           syncService.syncId;
      
      if (!currentSyncId) {
        throw new Error('No sync ID available - sync may not be enabled');
      }
      
      
      // Delete all server data for this sync ID - checks both environments
      const deleteResult = await syncService.deleteFromServer();
      
      if (deleteResult && deleteResult.success) {
      }

      
      // Disable sync after deleting server data
      await syncService.disable();

      setSyncEnabled(false);
      setSyncId(null);
      setSyncRecoveryPhrase('');

      if (onSyncStatusChange) {
        onSyncStatusChange(false);
      }

      showToast({ message: 'Server data deleted and sync disabled', type: 'success' });
    } catch (error) {
      
      showToast({
        message: 'Unable to delete server data. Please contact support if this persists.',
        type: 'error',
      });
      
      // Re-check sync status in case of error
      checkSyncStatus();
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle app reset
  const handleReset = async () => {
    try {
      setLoading(true);

      // Call the onReset function passed from parent
      if (onReset) {
        await onReset();
      } else {
      }

      setShowResetConfirm(false);
      onClose();
    } catch (error) {
      showToast({
        message: error.message || 'Failed to reset app',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle share creation
  const handleCreateShare = async () => {
    if (!selectedShareUser) {
      showToast({ message: 'Please select a user to share', type: 'error' });
      return;
    }

    setShareLoading(true);
    try {
      // Generate token if not already generated
      let token = shareToken;
      if (!token) {
        token = syncService.generateShareToken(true);
        setShareToken(token);
      }

      const result = await syncService.createShareLink(selectedShareUser, {
        recipientName,
        shareNote,
        includeCompleted,
        includeTomorrow,
        autoUpdate,
        expiresHours: parseInt(expiresHours, 10),
        accessToken: token,
      });

      setShareUrl(result.share_url);
      setShareToken(result.access_token || token); // Save the token from the result
      showToast({ message: 'Share link created!' });
      loadActiveShares();
    } catch (error) {
      showToast({
        message: error.message || 'Failed to create share link',
        type: 'error',
      });
    } finally {
      setShareLoading(false);
    }
  };

  // Handle copy share URL
  const handleCopyShareUrl = () => {
    copyToClipboard(shareUrl, 'Link copied to clipboard!');
  };

  // Handle delete share
  const handleDeleteShare = async shareId => {
    try {
      await syncService.deleteShare(shareId);
      showToast({ message: 'Share deleted' });
      loadActiveShares();
    } catch (error) {
      showToast({
        message: error.message || 'Failed to delete share',
        type: 'error',
      });
    }
  };

  // Render import tab content
  const renderImportContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContainer}
    >
      {!importData ? (
        <DataImport
          theme={theme}
          onFileSelected={handleFileSelected}
          onError={handleImportError}
          loading={loading}
        />
      ) : (
        <>
          <ImportPreview
            theme={theme}
            importFile={importFile}
            importData={importData}
            importMode={importMode}
            importSelections={importSelections}
            isOnboarding={isOnboarding}
            onImportModeChange={handleImportModeChange}
            onSelectionChange={handleImportSelectionsChange}
            onRemoveFile={handleResetImportState}
            onGetSelectedCounts={() => {}} // Optional callback for selection counts
          />

          <View style={styles.inPanelButtonContainer}>
            <ImportConfirmation
              theme={theme}
              importData={importData}
              importMode={importMode}
              importSelections={importSelections}
              onImportComplete={handleImportComplete}
              onError={handleImportError}
              disabled={loading}
              showToast={showToast}
            />
          </View>
        </>
      )}
    </ScrollView>
  );

  // Render export tab content
  const renderExportContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContainer, { flexGrow: 1 }]}
      style={{ flex: 1 }}
    >
      <DataExport
        theme={theme}
        users={users}
        currentUser={currentUser}
        currentDay={currentDay}
        libraryCategories={libraryCategories}
        currentTheme={currentTheme}
        bannerPosition={bannerPosition}
        hasSecurePin={hasSecurePin}
        showToast={showToast}
      />
    </ScrollView>
  );

  // Render reset tab content
  const renderResetContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContainer, { flexGrow: 1 }]}
      style={{ flex: 1 }}
    >
      <View style={styles.section}>
        <View style={styles.resetWarningContainer}>
          <Icon name="warning" size={48} color="#ff9800" />
          <Text style={styles.resetWarningTitle}>Reset StackMap</Text>
          <Text style={styles.resetWarningText}>
            This will delete all data and return the app to its initial state
          </Text>
        </View>

        <View style={styles.resetInfoSection}>
          <Text style={styles.resetInfoTitle}>What will be deleted:</Text>
          <View style={styles.resetInfoList}>
            <View style={styles.resetInfoItem}>
              <Icon name="check-circle" size={16} color="#d32f2f" />
              <Text style={styles.resetInfoText}>All users and profiles</Text>
            </View>
            <View style={styles.resetInfoItem}>
              <Icon name="check-circle" size={16} color="#d32f2f" />
              <Text style={styles.resetInfoText}>All activity cards</Text>
            </View>
            <View style={styles.resetInfoItem}>
              <Icon name="check-circle" size={16} color="#d32f2f" />
              <Text style={styles.resetInfoText}>
                Activity library and categories
              </Text>
            </View>
            <View style={styles.resetInfoItem}>
              <Icon name="check-circle" size={16} color="#d32f2f" />
              <Text style={styles.resetInfoText}>
                All settings and preferences
              </Text>
            </View>
            <View style={styles.resetInfoItem}>
              <Icon name="check-circle" size={16} color="#d32f2f" />
              <Text style={styles.resetInfoText}>
                Sync configuration (if enabled)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resetNote}>
          <Icon name="info" size={16} color="#666" />
          <Text style={styles.resetNoteText}>
            Tip: Export your data before resetting if you want to keep a backup
          </Text>
        </View>

        <View style={styles.inPanelButtonContainer}>
          <ModalButton
            theme={theme}
            variant="danger"
            label="Reset App"
            icon="refresh"
            onPress={() => {
              // iOS 18.5 fix: Use Alert.alert instead of nested modal
              if (Platform.OS === 'ios') {
                Alert.alert(
                  'Reset StackMap',
                  'This will delete all data and return the app to its initial state. This action cannot be undone.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Reset App',
                      style: 'destructive',
                      onPress: () => {
                        handleReset();
                      },
                    },
                  ],
                );
              } else {
                // Android and Web: Use ConfirmModal as before
                setShowResetConfirm(true);
              }
            }}
            loading={loading}
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );

  // Render sync tab content
  const renderSyncContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContainer, { flexGrow: 1 }]}
      style={{ flex: 1 }}
    >
      {!syncEnabled ? (
        <View style={styles.section}>
          <View style={styles.standardTabContainer}>
            <Icon name="sync" size={48} color={theme.primary} />
            <Text style={styles.standardTabTitle}>Sync Your Data</Text>
            <Text style={styles.standardTabDescription}>
              Keep your data synchronized across devices with end-to-end
              encryption
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
                  onPress={() => {
                    handleEnableSync();
                  }}
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
                    onPress={() => {
                      handleRestoreSync();
                    }}
                    disabled={syncLoading || !recoveryInput.trim()}
                    loading={syncLoading}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.standardTabContainer}>
            <Icon name="cloud-done" size={48} color={theme.primary} />
            <Text style={styles.standardTabTitle}>Sync Enabled</Text>
            <Text style={styles.standardTabDescription}>
              Your data is syncing across devices
            </Text>
          </View>

          {/* Add Device Section */}
          <View style={styles.shareSection}>
            {!showGeneratedKey ? (
              <ModalButton
                theme={theme}
                variant="primary"
                label="Add Device"
                icon="add-circle"
                onPress={() => {
                  (async () => {
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
                  })();
                }}
                disabled={syncLoading}
                loading={syncLoading}
                fullWidth
              />
            ) : (
              <>
                {/* Generated Sync Key Display */}
                <View style={styles.syncKeyDisplay}>
                  <View style={[styles.shareField, { alignItems: 'center' }]}>
                    <Text style={[styles.shareFieldLabel, { textAlign: 'center', fontSize: 16 }]}>Device Invite</Text>
                  </View>
                  <Text style={[styles.syncKeyText, { textAlign: 'center', marginTop: 8, marginBottom: 4, fontWeight: 'bold' }]} selectable>
                    {(() => {
                      // Display just the key part (not the full URL)
                      const urlParts = generatedSyncKey.split('#');
                      const recoveryPhrase = urlParts[1];
                      const inviteCode = urlParts[0].split('/').pop();
                      return `${inviteCode}#${recoveryPhrase}`;
                    })()}
                  </Text>
                  <Text style={[styles.shareFieldHelper, { textAlign: 'center', marginBottom: 16 }]}>Valid for 24 hours • Max 5 uses</Text>
                  
                  {/* All Instructions Grouped Together */}
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
                  
                  {/* Action Buttons - Centered with wrapping */}
                  <View style={[styles.syncKeyActions, { justifyContent: 'center', flexWrap: 'wrap' }]}>
                    <ModalButton
                      theme={theme}
                      variant="primary"
                      label="Copy Key"
                      icon="content-copy"
                      onPress={() => {
                        // Extract just the invite code and recovery phrase (without the URL part)
                        const urlParts = generatedSyncKey.split('#');
                        const recoveryPhrase = urlParts[1];
                        const inviteCode = urlParts[0].split('/').pop();
                        const keyOnly = `${inviteCode}#${recoveryPhrase}`;
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
                        // generatedSyncKey already contains the full URL with fragment
                        copyToClipboard(generatedSyncKey, 'Sync URL copied!');
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
                      onPress={() => {
                        (async () => {
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
                        })();
                      }}
                      disabled={syncLoading}
                      loading={syncLoading}
                    />
                  </View>
                  
                </View>
              </>
            )}
          </View>

          <View style={styles.inPanelButtonContainer}>
            {/* Manual Sync Button - Secondary since it should rarely be needed */}
            <ModalButton
              theme={theme}
              variant="secondary"
              label="Sync Now"
              icon="sync"
              onPress={() => {
                handleManualSync();
              }}
              disabled={syncLoading || syncStatus === 'syncing'}
              loading={syncStatus === 'syncing'}
              fullWidth
            />
            
            <ModalButton
              theme={theme}
              variant="danger"
              label="Disable Sync"
              icon="sync-disabled"
              onPress={() => {
                // iOS: Use Alert.alert instead of nested modal
                if (Platform.OS === 'ios') {
                  Alert.alert(
                    'Disable Sync',
                    'This will stop syncing your data. Your local data will remain unchanged. You can re-enable sync later with your sync key.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Disable',
                        style: 'destructive',
                        onPress: () => {
                          handleDisableSync();
                        },
                      },
                    ],
                  );
                } else {
                  // Android and Web: Use ConfirmModal
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
                // iOS: Use Alert.alert instead of nested modal
                if (Platform.OS === 'ios') {
                  Alert.alert(
                    'Delete Server Data',
                    'This will permanently delete all your data from the server and disable sync. Your local data will remain unchanged. This action cannot be undone.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Delete Server Data',
                        style: 'destructive',
                        onPress: () => {
                          handleDeleteServerData();
                        },
                      },
                    ],
                  );
                } else {
                  // Android and Web: Use ConfirmModal
                  setShowDeleteServerDataConfirm(true);
                }
              }}
              fullWidth
            />
          </View>

          {/* Sync Status Info at bottom */}
          <View style={styles.syncStatusInfo}>
            <View style={styles.syncStatusRow}>
              <Icon
                name={syncStatus === 'syncing' ? 'sync' : 'cloud-done'}
                size={20}
                color={syncStatus === 'syncing' ? theme.primary : '#4caf50'}
              />
              <Text style={styles.syncStatusText}>
                {syncStatus === 'syncing'
                  ? 'Syncing...'
                  : lastSyncTime
                  ? `Last synced ${formatTimeAgo(lastSyncTime)}`
                  : 'Sync active'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  // Render share tab content
  const renderShareContent = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.scrollContainer, { flexGrow: 1 }]}
      style={{ flex: 1 }}
    >
      {!syncEnabled ? (
        <View style={styles.section}>
          <View style={styles.standardTabContainer}>
            <Icon name="sync-disabled" size={48} color="#ff9800" />
            <Text style={styles.standardTabTitle}>Sync Required</Text>
            <Text style={styles.standardTabDescription}>
              You need to enable sync before you can share your activities
            </Text>
            <ModalButton
              theme={theme}
              variant="primary"
              label="Go to Sync"
              icon="sync"
              onPress={() => setActiveTab(0)}
              style={{ marginTop: 20 }}
            />
          </View>
        </View>
      ) : !shareUrl ? (
        <View style={styles.section}>
          {/* Header */}
          <View style={styles.standardTabContainer}>
            <Icon name="share" size={48} color={theme.primary} />
            <Text style={styles.standardTabTitle}>Share Activities</Text>
            <Text style={styles.standardTabDescription}>
              Create a link to share your activities
            </Text>
          </View>

          {/* User Selection */}
          <View style={styles.shareSection}>
            <Text style={[styles.shareSectionTitle, { textAlign: 'center' }]}>
              Select User to Share
            </Text>
            <View
              style={[styles.userSelectionGrid, { justifyContent: 'center' }]}
            >
              {users &&
                Object.entries(users).map(([userId, user]) => (
                  <TouchableOpacity
                    key={userId}
                    style={[
                      styles.userSelectionCard,
                      selectedShareUser === userId &&
                        styles.userSelectionCardActive,
                    ]}
                    onPress={() => setSelectedShareUser(userId)}
                  >
                    {selectedShareUser === userId && (
                      <View style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Icon
                          name="check-circle"
                          size={20}
                          color={theme.primary}
                        />
                      </View>
                    )}
                    <Text style={styles.userSelectionEmoji}>
                      {user.icon || '😀'}
                    </Text>
                    <Text
                      style={[
                        styles.userSelectionName,
                        { textAlign: 'center' },
                      ]}
                    >
                      {user.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>

          {!!selectedShareUser && (
            <>
              {/* Share Settings */}
              <View style={styles.shareSection}>
                <Text style={styles.shareSectionTitle}>Share Settings</Text>

                <FormInput
                  label="Recipient Name (optional)"
                  value={recipientName}
                  onChangeText={setRecipientName}
                  placeholder="Enter recipient's name"
                  theme={theme}
                />

                <FormInput
                  label="Note (optional)"
                  value={shareNote}
                  onChangeText={setShareNote}
                  placeholder="Add a note for the recipient"
                  multiline
                  numberOfLines={3}
                  theme={theme}
                />

                <View style={styles.shareField}>
                  <Text style={styles.shareFieldLabel}>Expires After</Text>
                  <View style={styles.expirationOptions}>
                    {['24', '168', '720'].map(hours => (
                      <TouchableOpacity
                        key={hours}
                        style={[
                          styles.expirationOption,
                          expiresHours === hours &&
                            styles.expirationOptionActive,
                        ]}
                        onPress={() => setExpiresHours(hours)}
                      >
                        <Text
                          style={[
                            styles.expirationOptionText,
                            expiresHours === hours &&
                              styles.expirationOptionTextActive,
                          ]}
                        >
                          {hours === '24'
                            ? '1 Day'
                            : hours === '168'
                            ? '1 Week'
                            : '30 Days'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.shareOptions}>
                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => setIncludeCompleted(!includeCompleted)}
                  >
                    <Icon
                      name={
                        includeCompleted
                          ? 'check-box'
                          : 'check-box-outline-blank'
                      }
                      size={24}
                      color={theme.primary}
                    />
                    <Text style={styles.shareOptionText}>
                      Include completed status
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => setIncludeTomorrow(!includeTomorrow)}
                  >
                    <Icon
                      name={
                        includeTomorrow
                          ? 'check-box'
                          : 'check-box-outline-blank'
                      }
                      size={24}
                      color={theme.primary}
                    />
                    <Text style={styles.shareOptionText}>
                      Include tomorrow's activities
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => setAutoUpdate(!autoUpdate)}
                  >
                    <Icon
                      name={
                        autoUpdate ? 'check-box' : 'check-box-outline-blank'
                      }
                      size={24}
                      color={theme.primary}
                    />
                    <Text style={styles.shareOptionText}>
                      Auto-update when I make changes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inPanelButtonContainer}>
                <ModalButton
                  theme={theme}
                  variant="primary"
                  label="Create Share Link"
                  icon="share"
                  onPress={() => {
                    handleCreateShare();
                  }}
                  disabled={shareLoading}
                  loading={shareLoading}
                  fullWidth
                />
              </View>
            </>
          )}
        </View>
      ) : (
        // Share Created View
        <View style={styles.section}>
          <View style={styles.shareSuccessContainer}>
            <Icon name="check-circle" size={48} color="#4caf50" />
            <Text style={styles.shareSuccessTitle}>Share Link Created!</Text>

            <View style={styles.shareInfoBox}>
              <View style={[styles.shareField, { alignItems: 'center' }]}>
                <Text style={[styles.shareFieldLabel, { textAlign: 'center', fontSize: 16 }]}>Share Link Ready</Text>
              </View>
              <Text style={[styles.shareFieldHelper, { textAlign: 'center', marginTop: 8, marginBottom: 16 }]}>
                Expires in {expiresHours} hours • View-only access
              </Text>
              
              {/* Simple instruction */}
              <View style={[styles.shareInstructions, { alignItems: 'center' }]}>
                <View style={[styles.shareInstructionItem, { justifyContent: 'center' }]}>
                  <Icon name="visibility" size={16} color="#000" />
                  <Text style={styles.shareInstructionText}>Recipients can view your activities in their browser</Text>
                </View>
              </View>
              
              {/* Single Copy URL Button */}
              <View style={[styles.syncKeyActions, { justifyContent: 'center', marginTop: 16 }]}>
                <ModalButton
                  theme={theme}
                  variant="primary"
                  label="Copy Share Link"
                  icon="link"
                  onPress={() => {
                    copyToClipboard(shareUrl, 'Share link copied!');
                    showToast({ 
                      message: 'Share link copied to clipboard!', 
                      type: 'success' 
                    });
                  }}
                />
              </View>
            </View>

            {/* QR Code - Always visible */}
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={shareUrl}
                size={200}
                backgroundColor="#ffffff"
                color="#000000"
              />
            </View>

            <View style={styles.divider} />

            <View style={[styles.syncKeyActions, { justifyContent: 'center', marginTop: 20 }]}>
              <ModalButton
                theme={theme}
                variant="secondary"
                label="Create New Share"
                icon="add-circle"
                onPress={() => {
                  setShareUrl('');
                  setShareToken('');
                  setShowShareQR(false);
                  setSelectedShareUser(null);
                  setRecipientName('');
                  setShareNote('');
                  setExpiresHours('168');
                  setIncludeCompleted(true);
                  setIncludeTomorrow(true);
                  setAutoUpdate(true);
                }}
              />
            </View>
          </View>
        </View>
      )}
      
      {/* Active Shares - Show at bottom regardless of state */}
      {Object.keys(activeShares).length > 0 ? (
        <View style={[styles.shareSection, { marginTop: 20 }]}>
          <TouchableOpacity
            style={styles.shareSectionHeader}
            onPress={() => setShowActiveShares(!showActiveShares)}
          >
            <Text style={styles.shareSectionTitle}>Active Shares</Text>
            <Icon
              name={showActiveShares ? 'expand-less' : 'expand-more'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>

          {showActiveShares &&
            Object.entries(activeShares).map(
              ([userId, { user, shares }]) => (
                <View key={userId} style={styles.userSharesContainer}>
                  <View style={styles.userSharesHeader}>
                    <Text style={styles.userSharesEmoji}>
                      {user.icon || '😀'}
                    </Text>
                    <Text style={styles.userSharesName}>{user.name}</Text>
                    <Text style={styles.userSharesCount}>
                      {shares.length} active
                    </Text>
                  </View>
                  {shares.map(share => (
                    <View
                      key={share.shareId}
                      style={styles.activeShareCard}
                    >
                      <View style={styles.activeShareInfo}>
                        {!!share.recipientName && (
                          <Text style={styles.activeShareRecipient}>
                            To: {share.recipientName}
                          </Text>
                        )}
                        <Text style={styles.activeShareDate}>
                          Expires:{' '}
                          {share.expiresAt
                            ? new Date(share.expiresAt).toLocaleDateString()
                            : 'N/A'}
                        </Text>
                        {!!share.shareNote && (
                          <Text style={styles.activeShareInfo} numberOfLines={1}>
                            {share.shareNote}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          handleDeleteShare(share.shareId);
                        }}
                        style={styles.activeShareDelete}
                      >
                        <Icon name="delete" size={20} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ),
            )}
        </View>
      ) : (
        <View style={[styles.shareSection, { marginTop: 20, padding: 15 }]}>
          <Text style={[styles.shareSectionTitle, { textAlign: 'center', color: '#666' }]}>
            No active shares
          </Text>
          <Text style={[styles.shareFieldHelper, { textAlign: 'center', marginTop: 8 }]}>
            Create a share to see it listed here
          </Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <>
      <TabbedModal
        visible={visible}
        onClose={onClose}
        theme={theme}
        title="Data"
        icon="source"
        tabs={tabs}
        activeTab={activeTab}
        headerRight={null}
        onTabChange={newTab => {
          // Reset share state when leaving share tab
          if (activeTab === 1 && newTab !== 1) {
            setShareUrl('');
            setShareToken('');
            setSelectedShareUser(null);
            setRecipientName('');
            setShareNote('');
            setExpiresHours('168');
            setIncludeCompleted(true);
            setIncludeTomorrow(true);
            setAutoUpdate(true);
          }
          // Load active shares when switching to share tab
          if (newTab === 1) {
            loadActiveShares();
          }
          setActiveTab(newTab);
        }}
      >
        {isOnboarding ? (
          // In onboarding mode, only show import content
          <TabContent isActive={activeTab === 0} modalVisible={visible} onScrollStateChange={() => {}}>
            {renderImportContent()}
          </TabContent>
        ) : (
          // Normal mode with all tabs - wrapped in View to avoid Fragment prop issue
          [
            <TabContent
              key="sync"
              isActive={activeTab === 0}
              modalVisible={visible}
              onScrollStateChange={() => {}}
            >
              {renderSyncContent()}
            </TabContent>,
            <TabContent
              key="share"
              isActive={activeTab === 1}
              modalVisible={visible}
              onScrollStateChange={() => {}}
            >
              {renderShareContent()}
            </TabContent>,
            <TabContent
              key="import"
              isActive={activeTab === 2}
              modalVisible={visible}
              onScrollStateChange={() => {}}
            >
              {renderImportContent()}
            </TabContent>,
            <TabContent
              key="export"
              isActive={activeTab === 3}
              modalVisible={visible}
              onScrollStateChange={() => {}}
            >
              {renderExportContent()}
            </TabContent>,
            <TabContent
              key="reset"
              isActive={activeTab === 4}
              modalVisible={visible}
              onScrollStateChange={() => {}}
            >
              {renderResetContent()}
            </TabContent>,
          ]
        )}
      </TabbedModal>

      {/* Import confirmation is now handled by ImportConfirmation component */}

      <ConfirmModal
        visible={showDisableSyncConfirm}
        onClose={() => setShowDisableSyncConfirm(false)}
        onConfirm={handleDisableSync}
        theme={theme}
        title="Disable Sync"
        message="This will stop syncing your data. Your local data will remain unchanged. You can re-enable sync later with your sync key."
        confirmText="Disable"
        confirmButtonColor="#d32f2f"
        icon="sync-disabled"
        iconColor="#d32f2f"
      />

      <ConfirmModal
        visible={showDeleteServerDataConfirm}
        onClose={() => setShowDeleteServerDataConfirm(false)}
        onConfirm={handleDeleteServerData}
        theme={theme}
        title="Delete Server Data"
        message="This will permanently delete all your data from the server and disable sync. Your local data will remain unchanged. This action cannot be undone."
        confirmText="Delete Server Data"
        confirmButtonColor="#d32f2f"
        icon="delete-forever"
        iconColor="#d32f2f"
      />

      <ConfirmModal
        visible={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleReset}
        theme={theme}
        title="Reset StackMap"
        message="This will delete all data and return the app to its initial state. This action cannot be undone."
        confirmText="Reset App"
        confirmButtonColor="#d32f2f"
        icon="refresh"
        iconColor="#d32f2f"
      />
    </>
  );
};

export default DataModal;
