// @ts-check
import React, { useState, useEffect } from 'react';
import { Text, TextInput } from '../../Typography';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { SPACING, COLORS } from '../../../constants';
import ConfirmModal from '../ConfirmModal';
import { TabbedModal, TabContent } from '../../../components';
import { FormInput, ModalFooter, ModalButton } from '../../ModalUtilities';
import SyncStatusIndicator from '../../SyncStatusIndicator';
import syncService from '../../../services/sync/syncServiceSimple';
import useAppStore from '../../../stores/useAppStore';
import QRCode from 'react-native-qrcode-svg';
// Normalization removed - v3 support discontinued

// Import platform-specific modules
let DocumentPicker = null;
let RNFS = null;

// Lazy load file system modules to avoid module-level Platform.OS access
const loadFileSystemModules = () => {
  if (!RNFS || !DocumentPicker) {
    if (Platform.OS === 'web') {
      // Use web polyfills
      RNFS = require('../../../utils/platformHelpers.web').default;
      DocumentPicker =
        require('../../../utils/platformHelpers.web').DocumentPicker;
    } else {
      // Use native modules - wrap in try/catch for missing modules
      try {
        DocumentPicker = require('react-native-document-picker').default;
      } catch (e) {
        DocumentPicker = null;
      }
      RNFS = require('react-native-fs');
    }
  }
  return { RNFS, DocumentPicker };
};

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

  // Export state
  const [exportSelections, setExportSelections] = useState({
    users: true,
    activityCards: true,
    activityLibrary: true,
  });

  // Import state
  const [importFile, setImportFile] = useState(null);
  const [importData, setImportData] = useState(null);
  const [importMode, setImportMode] = useState('fresh'); // 'fresh' or 'merge'
  const [importSelections, setImportSelections] = useState({});
  const [showImportConfirm, setShowImportConfirm] = useState(false);

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
  const [showDeleteServerDataConfirm, setShowDeleteServerDataConfirm] =
    useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [syncStatusChecked, setSyncStatusChecked] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');

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
  const [activeShares, setActiveShares] = useState([]);
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
      setImportFile(null);
      setImportData(null);
      setImportMode('fresh');
      setImportSelections({});
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
        setImportFile({ name: 'Imported Data' });
        setImportData(onboardingImportData);
        setImportMode('fresh'); // Always fresh for onboarding
        initializeImportSelections(onboardingImportData);
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

    const unsubscribe = syncService.addStatusListener(status => {
      setSyncStatus(status.status);
      if (status.lastSuccess) {
        setLastSyncTime(status.lastSuccess);
      }
    });

    return () => unsubscribe();
  }, [syncEnabled]);

  const checkSyncStatus = async () => {
    try {
      const enabled = await syncService.isEnabled();

      if (enabled) {
        // Sync is enabled locally, get the credentials
        const id = await syncService.getSyncId();
        const phrase = await syncService.getRecoveryPhrase();
        
        // If we have valid credentials, sync is enabled
        // Don't disable sync just because server doesn't have data yet
        if (id && phrase) {
          setSyncEnabled(true);
          setSyncId(id);
          setSyncRecoveryPhrase(phrase);
        } else {
          // Only disable if we don't have valid credentials
          setSyncEnabled(false);
        }
      } else {
        setSyncEnabled(false);
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
      if (users) {
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
      }

      setActiveShares(userShares);
    } catch (error) {}
  };

  // Toggle export selection
  const toggleExportSelection = key => {
    setExportSelections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Initialize import selections based on file data
  const initializeImportSelections = parsedData => {
    const selections = {};

    if (parsedData.users) {
      Object.entries(parsedData.users).forEach(([userId, user]) => {
        selections[`user_${userId}`] = true;
      });
    }

    if (parsedData.activityCards) {
      parsedData.activityCards.forEach(activity => {
        selections[`activity_${activity.id}`] = true;
      });
    }

    // v4 only - no templates support
    if (parsedData.library && parsedData.library.categories) {
      parsedData.library.categories.forEach(category => {
        selections[`category_${category.id}`] = true;
        if (category.activities) {
          category.activities.forEach(activity => {
            selections[`template_${category.id}_${activity.id}`] = true;
          });
        }
      });
    }

    setImportSelections(selections);
  };

  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);

      // Build export data based on selections
      const exportData = {
        version: 4,
        exportDate: new Date().toISOString(),
        exportedItems: {
          users: exportSelections.users,
          activityCards: exportSelections.activityCards,
          activityLibrary: exportSelections.activityLibrary,
        },
      };

      // Add selected data
      if (exportSelections.users) {
        exportData.users = users;
        exportData.currentDay = currentDay;
        exportData.currentUser = currentUser; // Add current user to export
      }

      if (exportSelections.activityCards) {
        // Extract all activity cards from users
        const allActivities = {};
        Object.entries(users).forEach(([userId, user]) => {
          if (user.days?.today?.activities) {
            user.days.today.activities.forEach(activity => {
              allActivities[activity.id] = activity;
            });
          }
          if (user.days?.tomorrow?.activities) {
            user.days.tomorrow.activities.forEach(activity => {
              allActivities[activity.id] = activity;
            });
          }
        });
        exportData.activityCards = Object.values(allActivities);
      }

      if (exportSelections.activityLibrary) {
        // Get library data from store
        const { library, libraryTemplates } = useAppStore.getState();

        // Include v4 library structure ONLY
        exportData.library = library || {
          categories: libraryCategories || [
            {
              id: 'my-templates',
              name: 'My Templates',
              icon: '⭐',
              activities: [],
            },
          ],
          userAddedActivityIds: [],
        };

        exportData.libraryTemplates = libraryTemplates || [];
      }

      // Add global settings
      // Handle hasSecurePin being either a function or a boolean
      let pinEnabled = false;
      if (typeof hasSecurePin === 'function') {
        pinEnabled = await hasSecurePin();
      } else if (typeof hasSecurePin === 'boolean') {
        pinEnabled = hasSecurePin;
      }

      exportData.globalSettings = {
        currentTheme,
        bannerPosition,
        defaultView: 'normal',
        displayMode: 'numbers',
        enableDayManagement: true,
        pinEnabled,
      };

      // Convert to JSON
      const jsonData = JSON.stringify(exportData, null, 2);

      // Generate filename
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
      const fileName = `stackmap-export-${dateStr}-${timeStr}.json`;

      // Platform-specific export
      if (Platform.OS === 'android') {
        try {
          // Load file system modules
          const modules = loadFileSystemModules();
          if (!modules.RNFS) {
            throw new Error('File system not available');
          }

          const downloadsPath = modules.RNFS.DownloadDirectoryPath;
          const filePath = `${downloadsPath}/${fileName}`;

          await modules.RNFS.writeFile(filePath, jsonData, 'utf8');

          // Show success message
          showToast({
            message: `Data exported to Downloads/${fileName}`,
            type: 'success',
          });

          // Auto-share the file
          setTimeout(async () => {
            const { Share } = require('react-native');
            try {
              await Share.share({
                url: `file://${filePath}`,
                title: fileName,
              });
            } catch (shareError) {}
          }, 500);
        } catch (error) {
          // Fallback to share
          const { Share } = require('react-native');
          await Share.share({
            message: jsonData,
            title: fileName,
          });
        }
      } else if (Platform.OS === 'web') {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast({ message: 'Export downloaded successfully!' });
      } else {
        // iOS - use share sheet

        try {
          const { Share } = require('react-native');
          // Load file system modules
          const modules = loadFileSystemModules();
          if (!modules.RNFS) {
            throw new Error('File system not available');
          }

          const documentsPath = modules.RNFS.DocumentDirectoryPath;
          const filePath = `${documentsPath}/${fileName}`;

          await modules.RNFS.writeFile(filePath, jsonData, 'utf8');

          // Verify file was written
          const fileExists = await modules.RNFS.exists(filePath);

          if (!fileExists) {
            throw new Error('File was not created successfully');
          }

          const shareResult = await Share.share({
            url: `file://${filePath}`,
            title: fileName,
          });

          // Show feedback based on share result
          if (shareResult.action === Share.sharedAction) {
            showToast({ message: 'Export shared successfully!' });
          } else if (shareResult.action === Share.dismissedAction) {
            showToast({ message: 'Export cancelled' });
          }

          // Clean up the temp file after a delay to ensure it was used
          setTimeout(async () => {
            try {
              await modules.RNFS.unlink(filePath);
            } catch (err) {}
          }, 5000);
        } catch (iosError) {
          showToast({
            message: `Failed to export: ${iosError.message}`,
            type: 'error',
          });
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      if (Platform.OS === 'web') {
        showToast({
          message: `Failed to export: ${error.message}`,
          type: 'error',
        });
      } else {
        Alert.alert('Export Error', 'Failed to export data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleSelectFile = async () => {
    // Load file system modules at function start for error handling
    const modules = loadFileSystemModules();

    try {
      setLoading(true);

      // Android uses file system search
      if (Platform.OS === 'android') {
        if (!modules.RNFS) {
          throw new Error('File system not available');
        }

        // Search for StackMap export files in various directories
        let jsonFiles = [];

        const searchPaths = [
          modules.RNFS.DownloadDirectoryPath,
          modules.RNFS.ExternalDirectoryPath,
          `${modules.RNFS.ExternalDirectoryPath}/Documents`,
          modules.RNFS.DocumentDirectoryPath,
        ];

        for (const path of searchPaths) {
          try {
            const files = await modules.RNFS.readDir(path);
            const foundFiles = files.filter(
              f =>
                f.name.endsWith('.json') &&
                f.name.toLowerCase().includes('stackmap'),
            );
            jsonFiles = jsonFiles.concat(foundFiles);
          } catch (e) {
            // Skip paths we can't access
          }
        }

        // Remove duplicates based on file name
        const uniqueFiles = Array.from(
          new Map(jsonFiles.map(f => [f.name, f])).values(),
        );

        if (uniqueFiles.length === 0) {
          Alert.alert(
            'No StackMap Files Found',
            'To import data:\n\n1. First export your data using the Export button\n2. The file will be saved to your Downloads folder\n3. Try importing again\n\nNote: On newer Android versions, apps have limited file access.',
            [{ text: 'OK' }],
          );
          setLoading(false);
          return;
        }

        // Sort files by modified time (newest first)
        uniqueFiles.sort((a, b) => b.mtime - a.mtime);

        // Helper function to load a file
        const loadFile = async file => {
          try {
            const fileContent = await modules.RNFS.readFile(file.path, 'utf8');
            let parsedData = JSON.parse(fileContent);

            if (!parsedData.version) {
              Alert.alert('Error', 'Invalid StackMap export file');
              return;
            }

            // No normalization - v3 support removed

            setImportFile({ name: file.name, path: file.path });
            setImportData(parsedData);
            initializeImportSelections(parsedData);
          } catch (error) {
            Alert.alert('Error', 'Failed to read file: ' + error.message);
          }
        };

        // If multiple files, show picker
        if (uniqueFiles.length > 1) {
          // Android Alert can only show 3 buttons max
          if (uniqueFiles.length > 2) {
            // Show only the 2 most recent files
            const recentFiles = uniqueFiles.slice(0, 2);
            const fileOptions = recentFiles.map(f => {
              const match = f.name.match(
                /stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/,
              );
              let displayName = f.name;

              if (match) {
                const date = match[1];
                const time = match[2] ? match[2].replace(/-/g, ':') : '';
                displayName = time ? `${date} at ${time}` : date;
                const sizeKB = Math.round(f.size / 1024);
                displayName += ` (${sizeKB} KB)`;
              }

              return {
                text: displayName,
                onPress: () => loadFile(f),
              };
            });

            Alert.alert(
              'Select Backup to Import',
              `Found ${uniqueFiles.length} backups. Showing 2 most recent:`,
              [
                ...fileOptions,
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => setLoading(false),
                },
              ],
            );
          } else {
            // 2 or fewer files, show them all
            const fileOptions = uniqueFiles.map(f => {
              const match = f.name.match(
                /stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/,
              );
              let displayName = f.name;

              if (match) {
                const date = match[1];
                const time = match[2] ? match[2].replace(/-/g, ':') : '';
                displayName = time ? `${date} at ${time}` : date;
                const sizeKB = Math.round(f.size / 1024);
                displayName += ` (${sizeKB} KB)`;
              }

              return {
                text: displayName,
                onPress: () => loadFile(f),
              };
            });

            Alert.alert(
              'Select Backup to Import',
              `Found ${uniqueFiles.length} StackMap backups:`,
              [
                ...fileOptions,
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => setLoading(false),
                },
              ],
            );
          }
        } else {
          // Single file found - load it directly
          await loadFile(uniqueFiles[0]);
        }

        setLoading(false);
        return;
      }

      // iOS and Web use DocumentPicker
      if (!modules.DocumentPicker || !modules.DocumentPicker.pick) {
        Alert.alert('Error', 'File picker is not available on this platform.');
        setLoading(false);
        return;
      }

      const result = await modules.DocumentPicker.pick({
        type:
          Platform.OS === 'web'
            ? 'application/json'
            : [modules.DocumentPicker.types.json],
        copyTo: 'cachesDirectory',
      });

      let fileContent;

      if (Platform.OS === 'web' && result[0]?.content) {
        fileContent = result[0].content;
      } else if (result[0]?.fileCopyUri) {
        fileContent = await modules.RNFS.readFile(
          result[0].fileCopyUri,
          'utf8',
        );
        await modules.RNFS.unlink(result[0].fileCopyUri);
      } else {
        Alert.alert('Error', 'Could not read the selected file');
        return;
      }

      // Parse and validate
      let parsedData = JSON.parse(fileContent);

      // Validate data structure
      if (!parsedData.version) {
        Alert.alert('Error', 'Invalid StackMap export file');
        return;
      }

      // No normalization - v3 support removed

      setImportFile(result[0]);
      setImportData(parsedData);
      initializeImportSelections(parsedData);
    } catch (error) {
      if (
        error.code !== modules.DocumentPicker?.errorCodes?.cancelled &&
        error.code !== 'DOCUMENT_PICKER_CANCELED'
      ) {
        Alert.alert('Error', 'Failed to select file. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Toggle import selection
  const toggleImportSelection = key => {
    setImportSelections(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Handle import confirmation
  const handleImportConfirm = async () => {
    try {
      setLoading(true);

      // Prepare imported data based on selections
      const dataToImport = {
        mode: importMode,
        users: {},
        activityCards: [],
        library: null,
        libraryTemplates: [],
        globalSettings: importData.globalSettings || {},
      };

      // Process selected users with validation
      if (importData.users) {
        Object.entries(importData.users).forEach(([userId, user]) => {
          if (importSelections[`user_${userId}`]) {
            // Validate user data before adding to import
            const validatedUser = { ...user };

            // Ensure name is a string
            if (!validatedUser.name || typeof validatedUser.name !== 'string') {
              if (
                typeof validatedUser.name === 'object' &&
                validatedUser.name !== null
              ) {
                // Try to extract name from object
                validatedUser.name =
                  validatedUser.name.name || validatedUser.name.text || 'User';
              } else {
                validatedUser.name = 'User';
              }
            }

            // Normalize icon field - always use 'icon', not 'emoji'
            if (!validatedUser.icon || typeof validatedUser.icon !== 'string') {
              if (
                validatedUser.emoji &&
                typeof validatedUser.emoji === 'string'
              ) {
                // Legacy support - migrate emoji to icon
                validatedUser.icon = validatedUser.emoji;
              } else {
                console.warn(
                  `Import: User ${userId} has no valid icon, using default`,
                );
                validatedUser.icon = '👤';
              }
            }

            // Remove redundant emoji field to prevent confusion
            if (validatedUser.emoji) {
              delete validatedUser.emoji;
            }

            dataToImport.users[userId] = validatedUser;
          }
        });
      }

      // Process selected activity cards
      if (importData.activityCards) {
        importData.activityCards.forEach(activity => {
          if (importSelections[`activity_${activity.id}`]) {
            dataToImport.activityCards.push(activity);
          }
        });
      }

      // Process selected library (v4 only)
      if (importData.library && importData.library.categories) {
        const selectedCategories = [];
        importData.library.categories.forEach(category => {
          if (importSelections[`category_${category.id}`]) {
            const categoryToImport = { ...category, activities: [] };

            if (category.activities) {
              category.activities.forEach(activity => {
                if (
                  importSelections[`template_${category.id}_${activity.id}`]
                ) {
                  categoryToImport.activities.push(activity);
                }
              });
            }

            selectedCategories.push(categoryToImport);
          }
        });
        dataToImport.library = {
          categories: selectedCategories,
          userAddedActivityIds: importData.library.userAddedActivityIds || [],
        };
      }

      if (importData.libraryTemplates) {
        dataToImport.libraryTemplates = importData.libraryTemplates;
      }

      // Call parent import handler
      await onImportComplete(dataToImport);

      showToast({
        message:
          importMode === 'fresh'
            ? 'Data imported successfully!'
            : 'Data merged successfully!',
      });

      onClose();
    } catch (error) {
      Alert.alert('Import Error', 'Failed to import data. Please try again.');
    } finally {
      setLoading(false);
      setShowImportConfirm(false);
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
        const result = await syncService.enable();

        setSyncEnabled(true);
        setSyncId(result.syncId);
        setSyncRecoveryPhrase(result.recoveryPhrase);
        setShowRecoveryPhrase(true);

        if (onSyncStatusChange) {
          onSyncStatusChange(true);
        }

        showToast({ message: 'Sync enabled successfully!' });
      } catch (error) {
        setSyncError(error.message || 'Failed to enable sync');
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

        // Use enable method with recovery phrase to join existing sync
        const result = await syncService.enable(recoveryInput.trim());

        setSyncId(result.syncId);
        setSyncRecoveryPhrase(result.recoveryPhrase);
        setSyncEnabled(true);
        setShowRecoveryInput(false);
        setRecoveryInput('');

        if (onSyncStatusChange) {
          onSyncStatusChange(true);
        }

        const message = result.isNewSync
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
    try {
      setSyncLoading(true);

      // Delete all server data for this sync ID
      await syncService.deleteFromServer();

      // Disable sync after deleting server data
      await syncService.disable();

      setSyncEnabled(false);
      setSyncId(null);
      setSyncRecoveryPhrase('');
      setShowDeleteServerDataConfirm(false);

      if (onSyncStatusChange) {
        onSyncStatusChange(false);
      }

      showToast({ message: 'Server data deleted and sync disabled' });
    } catch (error) {
      showToast({
        message: error.message || 'Failed to delete server data',
        type: 'error',
      });
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
        console.error('[DataModal] No onReset function provided!');
      }

      setShowResetConfirm(false);
      onClose();
    } catch (error) {
      console.error('[DataModal] Reset error:', error);
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
        expiresHours: parseInt(expiresHours),
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
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(shareUrl);
    } else {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString(shareUrl);
    }
    showToast({ message: 'Link copied to clipboard!' });
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
        <>
          <View style={styles.section}>
            <View style={styles.standardTabContainer}>
              <Icon name="file-download" size={48} color={theme.primary} />
              <Text style={styles.standardTabTitle}>Import Data</Text>
              <Text style={styles.standardTabDescription}>
                {Platform.OS === 'android'
                  ? 'Will search Downloads folder for export files'
                  : 'Import your saved StackMap data from a backup file'}
              </Text>
            </View>

            <View style={styles.inPanelButtonContainer}>
              <ModalButton
                theme={theme}
                variant="primary"
                label={
                  Platform.OS === 'android' ? 'Search for Files' : 'Select File'
                }
                icon="folder-open"
                onPress={handleSelectFile}
                disabled={loading}
                loading={loading}
                fullWidth
              />
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.section}>
            <View style={styles.fileInfoCard}>
              <Icon name="insert-drive-file" size={24} color={theme.primary} />
              <View style={styles.fileInfoContent}>
                <Text style={styles.fileInfoName} numberOfLines={1}>
                  {importFile.name}
                </Text>
                <Text style={styles.fileInfoDate}>
                  Exported:{' '}
                  {new Date(importData.exportDate).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setImportFile(null);
                  setImportData(null);
                  setImportSelections({});
                }}
              >
                <Icon name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {!isOnboarding && (
              <View style={styles.importModeContainer}>
                <Text style={styles.importModeTitle}>Import Mode</Text>
                <View style={styles.importModeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.importModeOption,
                      importMode === 'fresh' && styles.importModeOptionActive,
                    ]}
                    onPress={() => setImportMode('fresh')}
                  >
                    <Icon
                      name="refresh"
                      size={20}
                      color={importMode === 'fresh' ? theme.primary : '#666'}
                    />
                    <Text
                      style={[
                        styles.importModeText,
                        importMode === 'fresh' && styles.importModeTextActive,
                      ]}
                    >
                      Start Fresh
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.importModeOption,
                      importMode === 'merge' && styles.importModeOptionActive,
                    ]}
                    onPress={() => setImportMode('merge')}
                  >
                    <Icon
                      name="merge-type"
                      size={20}
                      color={importMode === 'merge' ? theme.primary : '#666'}
                    />
                    <Text
                      style={[
                        styles.importModeText,
                        importMode === 'merge' && styles.importModeTextActive,
                      ]}
                    >
                      Merge with Existing
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.importModeDescription}>
                  {importMode === 'fresh'
                    ? 'Clear all existing data, then add only the selected items'
                    : 'Keep existing data and add selected items'}
                </Text>
              </View>
            )}

            <View style={styles.importSelectionsContainer}>
              <Text style={styles.sectionTitle}>Select Items to Import</Text>

              {importData.users && Object.keys(importData.users).length > 0 && (
                <View style={styles.importCategory}>
                  <Text style={styles.importCategoryTitle}>Users</Text>
                  {Object.entries(importData.users).map(([userId, user]) => (
                    <TouchableOpacity
                      key={userId}
                      style={styles.importItem}
                      onPress={() => toggleImportSelection(`user_${userId}`)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name={
                          importSelections[`user_${userId}`]
                            ? 'check-box'
                            : 'check-box-outline-blank'
                        }
                        size={20}
                        color={
                          importSelections[`user_${userId}`]
                            ? theme.primary
                            : '#999'
                        }
                      />
                      <Text style={styles.importItemEmoji}>
                        {user.icon || '😀'}
                      </Text>
                      <Text style={styles.importItemText}>{user.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {importData.activityCards &&
                importData.activityCards.length > 0 && (
                  <View style={styles.importCategory}>
                    <Text style={styles.importCategoryTitle}>
                      Activity Cards ({importData.activityCards.length})
                    </Text>
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      onPress={() => {
                        const allSelected = importData.activityCards.every(
                          a => importSelections[`activity_${a.id}`],
                        );
                        const newSelections = { ...importSelections };
                        importData.activityCards.forEach(activity => {
                          newSelections[`activity_${activity.id}`] =
                            !allSelected;
                        });
                        setImportSelections(newSelections);
                      }}
                    >
                      <Text style={styles.selectAllText}>
                        {importData.activityCards.every(
                          a => importSelections[`activity_${a.id}`],
                        )
                          ? 'Deselect All'
                          : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

              {importData.library &&
                importData.library.categories &&
                importData.library.categories.length > 0 && (
                  <View style={styles.importCategory}>
                    <Text style={styles.importCategoryTitle}>
                      Activity Library
                    </Text>
                    {importData.library.categories.map(category => (
                      <View key={category.id}>
                        <TouchableOpacity
                          style={styles.importItem}
                          onPress={() =>
                            toggleImportSelection(`category_${category.id}`)
                          }
                          activeOpacity={0.7}
                        >
                          <Icon
                            name={
                              importSelections[`category_${category.id}`]
                                ? 'check-box'
                                : 'check-box-outline-blank'
                            }
                            size={20}
                            color={
                              importSelections[`category_${category.id}`]
                                ? theme.primary
                                : '#999'
                            }
                          />
                          <Icon
                            name="folder"
                            size={16}
                            color="#666"
                            style={{ marginLeft: 8 }}
                          />
                          <Text style={styles.importItemText}>
                            {category.name}
                          </Text>
                          <Text style={styles.importItemCount}>
                            ({category.activities?.length || 0})
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
            </View>

            {importData && (
              <View style={styles.inPanelButtonContainer}>
                <ModalButton
                  theme={theme}
                  variant="primary"
                  label="Import Selected Items"
                  icon="file-download"
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      // Use native iOS alert
                      Alert.alert(
                        importMode === 'fresh'
                          ? 'Start Fresh Import'
                          : 'Merge Import',
                        importMode === 'fresh'
                          ? 'This will DELETE all your current data and replace it with only the selected items. This action cannot be undone.'
                          : 'This will add the selected items to your existing data. Duplicate items will be skipped.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Import',
                            style: 'destructive',
                            onPress: handleImportConfirm,
                          },
                        ],
                      );
                    } else {
                      // Use ConfirmModal for Android/Web
                      setShowImportConfirm(true);
                    }
                  }}
                  disabled={
                    !Object.values(importSelections).some(v => v) || loading
                  }
                  loading={loading}
                  fullWidth
                />
              </View>
            )}
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
      <View style={styles.section}>
        <View style={styles.standardTabContainer}>
          <Icon name="file-upload" size={48} color={theme.primary} />
          <Text style={styles.standardTabTitle}>Export Data</Text>
          <Text style={styles.standardTabDescription}>
            Select data to save as a backup file
          </Text>
        </View>

        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => toggleExportSelection('users')}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxContainer}>
            <Icon
              name={
                exportSelections.users ? 'check-box' : 'check-box-outline-blank'
              }
              size={24}
              color={exportSelections.users ? theme.primary : '#999'}
            />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionTitle}>Users</Text>
            <Text style={styles.selectionDescription}>
              All user profiles and their assigned activities
            </Text>
          </View>
          <View style={styles.selectionCount}>
            <Text style={styles.countText}>
              {users ? Object.keys(users).length : 0}
            </Text>
            <Icon name="person" size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => toggleExportSelection('activityCards')}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxContainer}>
            <Icon
              name={
                exportSelections.activityCards
                  ? 'check-box'
                  : 'check-box-outline-blank'
              }
              size={24}
              color={exportSelections.activityCards ? theme.primary : '#999'}
            />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionTitle}>Activity Cards</Text>
            <Text style={styles.selectionDescription}>
              All current activity cards from all users
            </Text>
          </View>
          <View style={styles.selectionCount}>
            <Text style={styles.countText}>
              {users
                ? Object.values(users).reduce(
                    (count, user) =>
                      count +
                      (user.days?.today?.activities?.length || 0) +
                      (user.days?.tomorrow?.activities?.length || 0),
                    0,
                  )
                : 0}
            </Text>
            <Icon name="dashboard" size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => toggleExportSelection('activityLibrary')}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxContainer}>
            <Icon
              name={
                exportSelections.activityLibrary
                  ? 'check-box'
                  : 'check-box-outline-blank'
              }
              size={24}
              color={exportSelections.activityLibrary ? theme.primary : '#999'}
            />
          </View>
          <View style={styles.selectionContent}>
            <Text style={styles.selectionTitle}>Activity Library</Text>
            <Text style={styles.selectionDescription}>
              All categories and routine templates
            </Text>
          </View>
          <View style={styles.selectionCount}>
            <Text style={styles.countText}>
              {libraryCategories
                ? libraryCategories.reduce(
                    (count, category) =>
                      count + (category.activities?.length || 0),
                    0,
                  )
                : 0}
            </Text>
            <Icon name="folder" size={16} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={styles.inPanelButtonContainer}>
          <ModalButton
            theme={theme}
            variant="primary"
            label="Export Selected Data"
            icon="file-upload"
            onPress={handleExport}
            disabled={!Object.values(exportSelections).some(v => v) || loading}
            loading={loading}
            fullWidth
          />
        </View>
      </View>
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
                      onPress: handleReset,
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

            {syncError && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={16} color="#d32f2f" />
                <Text style={styles.errorText}>{syncError}</Text>
              </View>
            )}

            {showRecoveryInput && (
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
                {Platform.OS === 'web' && (
                  <ModalButton
                    theme={theme}
                    variant="primary"
                    label="Create New Sync"
                    icon="add-circle"
                    onPress={handleEnableSync}
                    disabled={syncLoading}
                    loading={syncLoading}
                    fullWidth
                  />
                )}

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
                    onPress={handleRestoreSync}
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

          {showRecoveryPhrase && (
            <View style={styles.recoveryPhraseCard}>
              <Icon name="warning" size={20} color="#ff9800" />
              <Text style={styles.recoveryPhraseWarning}>
                Save this sync key! You'll need it to sync other devices.
              </Text>
              <View style={styles.recoveryPhraseContainer}>
                <Text style={styles.recoveryPhrase} selectable>
                  {syncRecoveryPhrase}
                </Text>
              </View>

              <View style={styles.keyActionButtons}>
                <TouchableOpacity
                  style={styles.keyActionButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      navigator.clipboard.writeText(syncRecoveryPhrase);
                    } else {
                      const Clipboard =
                        require('@react-native-clipboard/clipboard').default;
                      Clipboard.setString(syncRecoveryPhrase);
                    }
                    showToast({ message: 'Sync key copied!' });
                  }}
                >
                  <Icon name="content-copy" size={18} color={theme.primary} />
                  <Text style={styles.keyActionButtonText}>Copy Key</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyActionButton}
                  onPress={() => {
                    let syncUrl;
                    if (
                      Platform.OS === 'web' &&
                      typeof window !== 'undefined'
                    ) {
                      const basePath = window.location.pathname.endsWith('/')
                        ? window.location.pathname
                        : window.location.pathname + '/';
                      syncUrl = `${
                        window.location.origin
                      }${basePath}?sync=${encodeURIComponent(
                        syncRecoveryPhrase,
                      )}`;
                      navigator.clipboard.writeText(syncUrl);
                    } else {
                      // For mobile, use a fixed URL
                      syncUrl = `https://stackmap.app/?sync=${encodeURIComponent(
                        syncRecoveryPhrase,
                      )}`;
                      const Clipboard =
                        require('@react-native-clipboard/clipboard').default;
                      Clipboard.setString(syncUrl);
                    }
                    showToast({ message: 'Sync URL copied!' });
                  }}
                >
                  <Icon name="link" size={18} color={theme.primary} />
                  <Text style={styles.keyActionButtonText}>Copy URL</Text>
                </TouchableOpacity>
              </View>

              {/* QR Code - Always visible */}
              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={(() => {
                    if (
                      Platform.OS === 'web' &&
                      typeof window !== 'undefined'
                    ) {
                      // Ensure path ends with trailing slash to avoid redirects
                      const basePath = window.location.pathname.endsWith('/')
                        ? window.location.pathname
                        : window.location.pathname + '/';
                      return `${
                        window.location.origin
                      }${basePath}?sync=${encodeURIComponent(
                        syncRecoveryPhrase,
                      )}`;
                    } else {
                      // For mobile, use a fixed URL
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
          )}

          <View style={styles.inPanelButtonContainer}>
            <ModalButton
              theme={theme}
              variant="secondary"
              label={showRecoveryPhrase ? 'Hide Sync Key' : 'Show Sync Key'}
              icon="key"
              onPress={() => setShowRecoveryPhrase(!showRecoveryPhrase)}
              fullWidth
            />

            <ModalButton
              theme={theme}
              variant="primary"
              label="Manual Sync (Debug)"
              icon="refresh"
              onPress={() => {
                console.log('[DataModal] Manual sync button clicked!');
                console.log('[DataModal] syncService exists?', !!syncService);
                console.log('[DataModal] syncService type:', typeof syncService);
                console.log('[DataModal] syncService keys:', Object.keys(syncService || {}));
                
                // Try calling sync directly without async/await first
                try {
                  console.log('[DataModal] Attempting to call syncService.isEnabled...');
                  const isEnabledFunc = syncService?.isEnabled;
                  console.log('[DataModal] isEnabled function exists?', !!isEnabledFunc);
                  console.log('[DataModal] isEnabled type:', typeof isEnabledFunc);
                  
                  if (typeof isEnabledFunc === 'function') {
                    console.log('[DataModal] Calling isEnabled...');
                    isEnabledFunc().then(enabled => {
                      console.log('[DataModal] isEnabled result:', enabled);
                      
                      if (enabled) {
                        console.log('[DataModal] Sync is enabled, calling sync...');
                        const syncFunc = syncService?.sync;
                        if (typeof syncFunc === 'function') {
                          syncFunc().then(result => {
                            console.log('[DataModal] Sync result:', result);
                            showToast({ 
                              message: result.success 
                                ? 'Sync completed!' 
                                : `Sync failed: ${result.error}`
                            });
                          }).catch(err => {
                            console.error('[DataModal] Sync error:', err);
                            showToast({ message: `Sync error: ${err.message}` });
                          });
                        } else {
                          console.error('[DataModal] sync is not a function!');
                        }
                      } else {
                        console.log('[DataModal] Sync not enabled');
                        showToast({ message: 'Sync is not enabled!' });
                      }
                    }).catch(err => {
                      console.error('[DataModal] isEnabled error:', err);
                    });
                  } else {
                    console.error('[DataModal] isEnabled is not a function!');
                    console.log('[DataModal] Available methods:', Object.getOwnPropertyNames(syncService));
                  }
                } catch (error) {
                  console.error('[DataModal] Sync button error:', error);
                  showToast({ message: `Error: ${error.message}` });
                }
              }}
              loading={syncLoading}
              disabled={syncLoading}
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
                        onPress: handleDisableSync,
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
                        onPress: handleDeleteServerData,
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
            
            {/* Debug Info */}
            <View style={[styles.syncStatusRow, { marginTop: 8, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }]}>
              <Text style={[styles.syncStatusText, { fontSize: 11, fontFamily: 'monospace' }]}>
                Debug: Service initialized: {syncService.initialized ? 'YES' : 'NO'} | 
                Enabled: {syncService.syncEnabled ? 'YES' : 'NO'} | 
                ID: {syncService.syncId ? syncService.syncId.substring(0, 8) + '...' : 'NONE'}
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

          {selectedShareUser && (
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
                  onPress={handleCreateShare}
                  disabled={shareLoading}
                  loading={shareLoading}
                  fullWidth
                />
              </View>
            </>
          )}

          {/* Active Shares */}
          {Object.keys(activeShares).length > 0 && (
            <View style={styles.shareSection}>
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
                            {share.recipientName && (
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
                            {share.autoUpdate && (
                              <View style={styles.activeShareBadge}>
                                <Icon name="sync" size={12} color="#4caf50" />
                                <Text style={styles.activeShareBadgeText}>
                                  Auto-update
                                </Text>
                              </View>
                            )}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteShare(share.shareId)}
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
          )}
        </View>
      ) : (
        // Share Created View
        <View style={styles.section}>
          <View style={styles.shareSuccessContainer}>
            <Icon name="check-circle" size={48} color="#4caf50" />
            <Text style={styles.shareSuccessTitle}>Share Link Created!</Text>

            <View style={styles.shareInfoBox}>
              <Text style={styles.shareInfoLabel}>Share Key:</Text>
              <Text style={styles.shareInfoValue} selectable numberOfLines={1}>
                {shareToken}
              </Text>
              <View style={styles.keyActionButtons}>
                <TouchableOpacity
                  style={styles.keyActionButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      navigator.clipboard.writeText(shareToken);
                    } else {
                      const Clipboard =
                        require('@react-native-clipboard/clipboard').default;
                      Clipboard.setString(shareToken);
                    }
                    showToast({ message: 'Share key copied!' });
                  }}
                >
                  <Icon name="content-copy" size={18} color={theme.primary} />
                  <Text style={styles.keyActionButtonText}>Copy Key</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keyActionButton}
                  onPress={handleCopyShareUrl}
                >
                  <Icon name="link" size={18} color={theme.primary} />
                  <Text style={styles.keyActionButtonText}>Copy URL</Text>
                </TouchableOpacity>
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

            <ModalButton
              theme={theme}
              variant="secondary"
              label="Create Another Share"
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
              style={{ marginTop: 20 }}
            />
          </View>
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
          setActiveTab(newTab);
        }}
      >
        {isOnboarding ? (
          // In onboarding mode, only show import content
          <TabContent isActive={activeTab === 0} modalVisible={visible}>
            {renderImportContent()}
          </TabContent>
        ) : (
          // Normal mode with all tabs - wrapped in View to avoid Fragment prop issue
          [
            <TabContent
              key="sync"
              isActive={activeTab === 0}
              modalVisible={visible}
            >
              {renderSyncContent()}
            </TabContent>,
            <TabContent
              key="share"
              isActive={activeTab === 1}
              modalVisible={visible}
            >
              {renderShareContent()}
            </TabContent>,
            <TabContent
              key="import"
              isActive={activeTab === 2}
              modalVisible={visible}
            >
              {renderImportContent()}
            </TabContent>,
            <TabContent
              key="export"
              isActive={activeTab === 3}
              modalVisible={visible}
            >
              {renderExportContent()}
            </TabContent>,
            <TabContent
              key="reset"
              isActive={activeTab === 4}
              modalVisible={visible}
            >
              {renderResetContent()}
            </TabContent>,
          ]
        )}
      </TabbedModal>

      <ConfirmModal
        visible={showImportConfirm}
        onClose={() => setShowImportConfirm(false)}
        onConfirm={handleImportConfirm}
        theme={theme}
        title={importMode === 'fresh' ? 'Start Fresh Import' : 'Merge Import'}
        message={
          importMode === 'fresh'
            ? 'This will DELETE all your current data and replace it with only the selected items. This action cannot be undone.'
            : 'This will add the selected items to your existing data. Duplicate items will be skipped.'
        }
        confirmText="Import"
        confirmButtonColor={theme.primary}
        icon="file-download"
        iconColor={theme.primary}
      />

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
