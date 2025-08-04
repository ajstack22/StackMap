import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { SPACING, COLORS } from '../../../constants';
import ConfirmModal from '../ConfirmModal';
import { TabbedModal, TabContent } from '../../../components';
import { FormInput, ModalFooter, ModalButton } from '../../ModalUtilities';
import SyncStatusIndicator from '../../SyncStatusIndicator';
import syncService from '../../../services/sync/syncService';
import QRCode from 'react-native-qrcode-svg';

// Import platform-specific modules
let DocumentPicker = null;
let RNFS = null;

if (Platform.OS === 'web') {
  // Use web polyfills
  RNFS = require('../../../utils/platformHelpers.web').default;
  DocumentPicker = require('../../../utils/platformHelpers.web').DocumentPicker;
} else {
  // Use native modules
  DocumentPicker = require('react-native-document-picker').default;
  RNFS = require('react-native-fs');
}

const DataModal = ({
  visible,
  onClose,
  theme,
  users,
  currentDay,
  templates,
  activityCategories,
  currentTheme,
  bannerPosition,
  hasSecurePin,
  showToast,
  onImportComplete,
  onSyncStatusChange,
  onShowSupport,
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
  const [syncStatusChecked, setSyncStatusChecked] = useState(false);
  const [showSyncQR, setShowSyncQR] = useState(false);
  
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
  
  // Tabs configuration
  const tabs = [
    { key: 'sync', label: 'Sync', icon: 'sync' },
    { key: 'share', label: 'Share', icon: 'share' },
    { key: 'import', label: 'Import', icon: 'file-download' },
    { key: 'export', label: 'Export', icon: 'file-upload' },
  ];
  
  const [activeTab, setActiveTab] = useState(0); // Default to Sync tab
  
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
      setRecipientName('');
      setShareNote('');
      setExpiresHours('168');
      setIncludeCompleted(true);
      setIncludeTomorrow(true);
      setAutoUpdate(true);
      setSelectedShareUser(null);
      // Reset to Import tab when modal closes
      setActiveTab(0);
    } else {
      // When opening, generate new share token and load active shares
      const token = syncService.generateShareToken(true);
      setShareToken(token);
      loadActiveShares();
    }
  }, [visible]);
  
  // Check sync status on mount
  useEffect(() => {
    checkSyncStatus();
  }, []);
  
  const checkSyncStatus = async () => {
    try {
      const enabled = await syncService.isEnabled();
      setSyncEnabled(enabled);
      
      if (enabled) {
        const id = await syncService.getSyncId();
        const phrase = await syncService.getRecoveryPhrase();
        setSyncId(id);
        setSyncRecoveryPhrase(phrase);
      }
      setSyncStatusChecked(true);
    } catch (error) {
      console.error('Error checking sync status:', error);
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
        const userActiveShares = shares.filter(share => share.userId === userId);
        if (userActiveShares.length > 0) {
          userShares[userId] = {
            user,
            shares: userActiveShares
          };
        }
        });
      }
      
      setActiveShares(userShares);
    } catch (error) {
      console.error('Error loading active shares:', error);
    }
  };
  
  // Toggle export selection
  const toggleExportSelection = (key) => {
    setExportSelections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      setLoading(true);
      
      // Build export data based on selections
      const exportData = {
        version: 3,
        exportDate: new Date().toISOString(),
        exportedItems: {
          users: exportSelections.users,
          activityCards: exportSelections.activityCards,
          activityLibrary: exportSelections.activityLibrary,
        }
      };
      
      // Add selected data
      if (exportSelections.users) {
        exportData.users = users;
        exportData.currentDay = currentDay;
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
        // Transform activityCategories array to templates object format
        const templatesObject = {};
        if (activityCategories && Array.isArray(activityCategories)) {
          activityCategories.forEach(category => {
            templatesObject[category.id] = {
              name: category.name,
              activities: (category.activities || []).map(activity => ({
                id: activity.id,
                text: activity.name,
                icon: activity.emoji
              }))
            };
          });
        }
        exportData.templates = templatesObject;
      }
      
      // Add global settings
      exportData.globalSettings = {
        currentTheme,
        bannerPosition,
        defaultView: 'normal',
        displayMode: 'numbers',
        enableDayManagement: true,
        pinEnabled: await hasSecurePin()
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
          const downloadsPath = RNFS.DownloadDirectoryPath;
          const filePath = `${downloadsPath}/${fileName}`;
          await RNFS.writeFile(filePath, jsonData, 'utf8');
          
          showToast({ message: `Exported to Downloads/${fileName}` });
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
        const { Share } = require('react-native');
        const documentsPath = RNFS.DocumentDirectoryPath;
        const filePath = `${documentsPath}/${fileName}`;
        await RNFS.writeFile(filePath, jsonData, 'utf8');
        
        await Share.share({
          url: `file://${filePath}`,
          title: fileName,
        });
        
        await RNFS.unlink(filePath);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle file selection
  const handleSelectFile = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.pick({
        type: Platform.OS === 'web' ? 'application/json' : [DocumentPicker.types.json],
        copyTo: 'cachesDirectory',
      });
      
      let fileContent;
      
      if (Platform.OS === 'web' && result[0]?.content) {
        fileContent = result[0].content;
      } else if (result[0]?.fileCopyUri) {
        fileContent = await RNFS.readFile(result[0].fileCopyUri, 'utf8');
        await RNFS.unlink(result[0].fileCopyUri);
      } else {
        Alert.alert('Error', 'Could not read the selected file');
        return;
      }
      
      // Parse and validate
      const parsedData = JSON.parse(fileContent);
      
      // Validate data structure
      if (!parsedData.version) {
        Alert.alert('Error', 'Invalid StackMap export file');
        return;
      }
      
      setImportFile(result[0]);
      setImportData(parsedData);
      
      // Initialize import selections based on what's in the file
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
      
      if (parsedData.templates) {
        Object.entries(parsedData.templates).forEach(([categoryId, category]) => {
          selections[`category_${categoryId}`] = true;
          if (category.activities) {
            category.activities.forEach(activity => {
              selections[`template_${categoryId}_${activity.id}`] = true;
            });
          }
        });
      }
      
      setImportSelections(selections);
      
    } catch (error) {
      if (error.code !== DocumentPicker.errorCodes?.cancelled && error.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('File selection error:', error);
        Alert.alert('Error', 'Failed to select file. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle import selection
  const toggleImportSelection = (key) => {
    setImportSelections(prev => ({
      ...prev,
      [key]: !prev[key]
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
        templates: {},
        globalSettings: importData.globalSettings || {},
      };
      
      // Process selected users
      if (importData.users) {
        Object.entries(importData.users).forEach(([userId, user]) => {
          if (importSelections[`user_${userId}`]) {
            dataToImport.users[userId] = user;
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
      
      // Process selected templates
      if (importData.templates) {
        Object.entries(importData.templates).forEach(([categoryId, category]) => {
          if (importSelections[`category_${categoryId}`]) {
            const categoryToImport = { ...category, activities: [] };
            
            if (category.activities) {
              category.activities.forEach(activity => {
                if (importSelections[`template_${categoryId}_${activity.id}`]) {
                  categoryToImport.activities.push(activity);
                }
              });
            }
            
            dataToImport.templates[categoryId] = categoryToImport;
          }
        });
      }
      
      // Call parent import handler
      await onImportComplete(dataToImport);
      
      showToast({ 
        message: importMode === 'fresh' 
          ? 'Data imported successfully!' 
          : 'Data merged successfully!' 
      });
      
      onClose();
      
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Import Error', 'Failed to import data. Please try again.');
    } finally {
      setLoading(false);
      setShowImportConfirm(false);
    }
  };
  
  // Handle sync enable
  const handleEnableSync = async () => {
    try {
      setSyncLoading(true);
      setSyncError('');
      
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
  };
  
  // Handle sync restore
  const handleRestoreSync = async () => {
    try {
      setSyncLoading(true);
      setSyncError('');
      
      if (!recoveryInput.trim()) {
        setSyncError('Please enter your recovery phrase');
        return;
      }
      
      await syncService.restore(recoveryInput.trim());
      
      const id = await syncService.getSyncId();
      setSyncId(id);
      setSyncRecoveryPhrase(recoveryInput.trim());
      setSyncEnabled(true);
      setShowRecoveryInput(false);
      setRecoveryInput('');
      
      if (onSyncStatusChange) {
        onSyncStatusChange(true);
      }
      
      showToast({ message: 'Sync restored successfully!' });
    } catch (error) {
      setSyncError(error.message || 'Failed to restore sync');
    } finally {
      setSyncLoading(false);
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
  
  // Handle share creation
  const handleCreateShare = async () => {
    if (!selectedShareUser) {
      showToast({ message: 'Please select a user to share', type: 'error' });
      return;
    }
    
    setShareLoading(true);
    try {
      const result = await syncService.createShareLink(selectedShareUser, {
        recipientName,
        shareNote,
        includeCompleted,
        includeTomorrow,
        autoUpdate,
        expiresHours: parseInt(expiresHours),
        accessToken: shareToken
      });

      setShareUrl(result.share_url);
      showToast({ message: 'Share link created!' });
      loadActiveShares();
    } catch (error) {
      showToast({ 
        message: error.message || 'Failed to create share link',
        type: 'error'
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
  const handleDeleteShare = async (shareId) => {
    try {
      await syncService.deleteShare(shareId);
      showToast({ message: 'Share deleted' });
      loadActiveShares();
    } catch (error) {
      showToast({ 
        message: error.message || 'Failed to delete share',
        type: 'error'
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
            <View style={styles.emptyStateContainer}>
              <Icon name="file-upload" size={48} color={theme.primary} />
              <Text style={styles.emptyStateText}>
                Select a StackMap export file to import
              </Text>
              <Text style={styles.emptyStateDescription}>
                Import your saved StackMap data from a backup file
              </Text>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <ModalButton
              theme={theme}
              variant="primary"
              label="Select File"
              icon="folder-open"
              onPress={handleSelectFile}
              disabled={loading}
              loading={loading}
            />
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
                  Exported: {new Date(importData.exportDate).toLocaleDateString()}
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
            
            <View style={styles.importModeContainer}>
              <Text style={styles.importModeTitle}>Import Mode</Text>
              <View style={styles.importModeOptions}>
                <TouchableOpacity
                  style={[
                    styles.importModeOption,
                    importMode === 'fresh' && styles.importModeOptionActive
                  ]}
                  onPress={() => setImportMode('fresh')}
                >
                  <Icon 
                    name="refresh" 
                    size={20} 
                    color={importMode === 'fresh' ? theme.primary : '#666'} 
                  />
                  <Text style={[
                    styles.importModeText,
                    importMode === 'fresh' && styles.importModeTextActive
                  ]}>
                    Start Fresh
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.importModeOption,
                    importMode === 'merge' && styles.importModeOptionActive
                  ]}
                  onPress={() => setImportMode('merge')}
                >
                  <Icon 
                    name="merge-type" 
                    size={20} 
                    color={importMode === 'merge' ? theme.primary : '#666'} 
                  />
                  <Text style={[
                    styles.importModeText,
                    importMode === 'merge' && styles.importModeTextActive
                  ]}>
                    Merge with Existing
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.importModeDescription}>
                {importMode === 'fresh' 
                  ? 'Replace all current data with imported data'
                  : 'Keep existing data and add selected items'}
              </Text>
            </View>
            
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
                        name={importSelections[`user_${userId}`] ? "check-box" : "check-box-outline-blank"} 
                        size={20} 
                        color={importSelections[`user_${userId}`] ? theme.primary : '#999'} 
                      />
                      <Text style={styles.importItemEmoji}>{user.icon || '😀'}</Text>
                      <Text style={styles.importItemText}>{user.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              {importData.activityCards && importData.activityCards.length > 0 && (
                <View style={styles.importCategory}>
                  <Text style={styles.importCategoryTitle}>
                    Activity Cards ({importData.activityCards.length})
                  </Text>
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={() => {
                      const allSelected = importData.activityCards.every(a => 
                        importSelections[`activity_${a.id}`]
                      );
                      const newSelections = { ...importSelections };
                      importData.activityCards.forEach(activity => {
                        newSelections[`activity_${activity.id}`] = !allSelected;
                      });
                      setImportSelections(newSelections);
                    }}
                  >
                    <Text style={styles.selectAllText}>
                      {importData.activityCards.every(a => importSelections[`activity_${a.id}`]) 
                        ? 'Deselect All' 
                        : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {importData.templates && Object.keys(importData.templates).length > 0 && (
                <View style={styles.importCategory}>
                  <Text style={styles.importCategoryTitle}>Activity Library</Text>
                  {Object.entries(importData.templates).map(([categoryId, category]) => (
                    <View key={categoryId}>
                      <TouchableOpacity
                        style={styles.importItem}
                        onPress={() => toggleImportSelection(`category_${categoryId}`)}
                        activeOpacity={0.7}
                      >
                        <Icon 
                          name={importSelections[`category_${categoryId}`] ? "check-box" : "check-box-outline-blank"} 
                          size={20} 
                          color={importSelections[`category_${categoryId}`] ? theme.primary : '#999'} 
                        />
                        <Icon name="folder" size={16} color="#666" style={{ marginLeft: 8 }} />
                        <Text style={styles.importItemText}>{category.name}</Text>
                        <Text style={styles.importItemCount}>
                          ({category.activities?.length || 0})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </>
      )}
      
      {importData && (
        <View style={styles.buttonContainer}>
          <ModalButton
            theme={theme}
            variant="primary"
            label="Import Selected Items"
            icon="file-download"
            onPress={() => setShowImportConfirm(true)}
            disabled={!Object.values(importSelections).some(v => v) || loading}
            loading={loading}
          />
        </View>
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
        <View style={styles.sectionHeader}>
          <Icon name="file-download" size={20} color={theme.primary} />
          <Text style={styles.sectionTitle}>Select Data to Export</Text>
        </View>
        
        <TouchableOpacity
          style={styles.selectionCard}
          onPress={() => toggleExportSelection('users')}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxContainer}>
            <Icon 
              name={exportSelections.users ? "check-box" : "check-box-outline-blank"} 
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
            <Text style={styles.countText}>{users ? Object.keys(users).length : 0}</Text>
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
              name={exportSelections.activityCards ? "check-box" : "check-box-outline-blank"} 
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
              {users ? Object.values(users).reduce((count, user) => 
                count + (user.days?.today?.activities?.length || 0) + 
                (user.days?.tomorrow?.activities?.length || 0), 0
              ) : 0}
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
              name={exportSelections.activityLibrary ? "check-box" : "check-box-outline-blank"} 
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
              {activityCategories ? activityCategories.reduce((count, category) => 
                count + (category.activities?.length || 0), 0
              ) : 0}
            </Text>
            <Icon name="folder" size={16} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <ModalButton
          theme={theme}
          variant="primary"
          label="Export Selected Data"
          icon="file-upload"
          onPress={handleExport}
          disabled={!Object.values(exportSelections).some(v => v) || loading}
          loading={loading}
        />
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
        <>
          <View style={styles.section}>
            <View style={styles.syncInfoContainer}>
              <Icon name="sync" size={48} color={theme.primary} />
              <Text style={styles.syncTitle}>Sync Your Data</Text>
              <Text style={styles.syncDescription}>
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
              
              {syncError && (
                <View style={styles.errorContainer}>
                  <Icon name="error-outline" size={16} color="#d32f2f" />
                  <Text style={styles.errorText}>{syncError}</Text>
                </View>
              )}
              
              {showRecoveryInput && (
                <View style={styles.recoveryInputContainer}>
                  <FormInput
                    value={recoveryInput}
                    onChangeText={setRecoveryInput}
                    placeholder="Enter your recovery phrase"
                    multiline
                    numberOfLines={3}
                    autoCapitalize="none"
                    autoCorrect={false}
                    theme={theme}
                  />
                </View>
              )}
            </View>
          </View>
          
          {!showRecoveryInput ? (
            <View style={styles.buttonContainer}>
              <ModalButton
                theme={theme}
                variant="primary"
                label="Create New Sync"
                icon="add-circle"
                onPress={handleEnableSync}
                disabled={syncLoading}
                loading={syncLoading}
              />
              
              <ModalButton
                theme={theme}
                variant="secondary"
                label="Restore from Recovery Phrase"
                icon="restore"
                onPress={() => setShowRecoveryInput(true)}
                style={{ marginTop: SPACING.sm }}
              />
            </View>
          ) : (
            <View style={styles.buttonContainer}>
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
        </>
      ) : (
          <View style={styles.section}>
            <View style={styles.syncStatusCard}>
              <View style={styles.syncStatusHeader}>
                <SyncStatusIndicator theme={theme} size="large" />
                <View style={styles.syncStatusInfo}>
                  <Text style={styles.syncStatusTitle}>Sync Enabled</Text>
                  <Text style={styles.syncStatusId}>ID: {syncId}</Text>
                </View>
              </View>
              
              {showRecoveryPhrase && (
                <View style={styles.recoveryPhraseCard}>
                  <Icon name="warning" size={20} color="#ff9800" />
                  <Text style={styles.recoveryPhraseWarning}>
                    Save this recovery phrase! You'll need it to sync other devices.
                  </Text>
                  <View style={styles.recoveryPhraseContainer}>
                    <Text style={styles.recoveryPhrase} selectable>
                      {syncRecoveryPhrase}
                    </Text>
                  </View>
                  
                  <View style={styles.syncActionsContainer}>
                    {Platform.OS === 'web' ? (
                      <>
                        <ModalButton
                          theme={theme}
                          variant="primary"
                          label="Show QR Code"
                          icon="qr-code-2"
                          onPress={() => setShowSyncQR(!showSyncQR)}
                          compact
                        />
                        <ModalButton
                          theme={theme}
                          variant="secondary"
                          label="Copy Phrase"
                          icon="content-copy"
                          onPress={() => {
                            if (Platform.OS === 'web') {
                              navigator.clipboard.writeText(syncRecoveryPhrase);
                            } else {
                              const Clipboard = require('@react-native-clipboard/clipboard').default;
                              Clipboard.setString(syncRecoveryPhrase);
                            }
                            showToast({ message: 'Recovery phrase copied to clipboard!' });
                          }}
                          compact
                        />
                        <ModalButton
                          theme={theme}
                          variant="secondary"
                          label="Copy URL"
                          icon="link"
                          onPress={() => {
                            const syncUrl = `${window.location.origin}/sync?phrase=${encodeURIComponent(syncRecoveryPhrase)}`;
                            if (Platform.OS === 'web') {
                              navigator.clipboard.writeText(syncUrl);
                            } else {
                              const Clipboard = require('@react-native-clipboard/clipboard').default;
                              Clipboard.setString(syncUrl);
                            }
                            showToast({ message: 'Sync URL copied to clipboard!' });
                          }}
                          compact
                        />
                      </>
                    ) : (
                      <View style={styles.mobileSyncActions}>
                        <ModalButton
                          theme={theme}
                          variant="secondary"
                          label="Copy Phrase"
                          icon="content-copy"
                          onPress={() => {
                            const Clipboard = require('@react-native-clipboard/clipboard').default;
                            Clipboard.setString(syncRecoveryPhrase);
                            showToast({ message: 'Recovery phrase copied to clipboard!' });
                          }}
                        />
                        <ModalButton
                          theme={theme}
                          variant="secondary"
                          label="Copy URL"
                          icon="link"
                          onPress={() => {
                            const syncUrl = `${window.location.origin}/sync?phrase=${encodeURIComponent(syncRecoveryPhrase)}`;
                            const Clipboard = require('@react-native-clipboard/clipboard').default;
                            Clipboard.setString(syncUrl);
                            showToast({ message: 'Sync URL copied to clipboard!' });
                          }}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}
                  </View>
                  
                  {(Platform.OS !== 'web' || showSyncQR) && (
                    <View style={styles.qrCodeContainer}>
                      <Text style={styles.qrCodeLabel}>Sync QR Code:</Text>
                      <QRCode
                        value={`${window.location.origin}/sync?phrase=${encodeURIComponent(syncRecoveryPhrase)}`}
                        size={200}
                        backgroundColor="white"
                        color="black"
                      />
                    </View>
                  )}
                  
                  <View style={styles.divider} />
                  
                  <ModalButton
                    theme={theme}
                    variant="primary"
                    label="I've Saved It"
                    onPress={() => {
                      setShowRecoveryPhrase(false);
                      setShowSyncQR(false);
                    }}
                    style={{ marginTop: 10 }}
                  />
                </View>
              )}
              
              <View style={styles.syncActions}>
                <TouchableOpacity
                  style={styles.syncActionButton}
                  onPress={() => setShowRecoveryPhrase(!showRecoveryPhrase)}
                >
                  <Icon name="key" size={20} color={theme.primary} />
                  <Text style={styles.syncActionText}>
                    {showRecoveryPhrase ? 'Hide' : 'Show'} Recovery Phrase
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.syncActionButton, styles.dangerButton]}
                  onPress={() => setShowDisableSyncConfirm(true)}
                >
                  <Icon name="sync-disabled" size={20} color="#d32f2f" />
                  <Text style={[styles.syncActionText, { color: '#d32f2f' }]}>
                    Disable Sync
                  </Text>
                </TouchableOpacity>
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
          <View style={styles.syncRequiredContainer}>
            <Icon name="sync-disabled" size={48} color="#ff9800" />
            <Text style={styles.syncRequiredTitle}>Sync Required</Text>
            <Text style={styles.syncRequiredText}>
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
          {/* User Selection */}
          <View style={styles.shareSection}>
            <Text style={styles.shareSectionTitle}>Select User to Share</Text>
            <View style={styles.userSelectionGrid}>
              {users && Object.entries(users).map(([userId, user]) => (
                <TouchableOpacity
                  key={userId}
                  style={[
                    styles.userSelectionCard,
                    selectedShareUser === userId && styles.userSelectionCardActive
                  ]}
                  onPress={() => setSelectedShareUser(userId)}
                >
                  <Text style={styles.userSelectionEmoji}>{user.icon || '😀'}</Text>
                  <Text style={styles.userSelectionName}>{user.name}</Text>
                  {selectedShareUser === userId && (
                    <Icon name="check-circle" size={20} color={theme.primary} />
                  )}
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
                          expiresHours === hours && styles.expirationOptionActive
                        ]}
                        onPress={() => setExpiresHours(hours)}
                      >
                        <Text style={[
                          styles.expirationOptionText,
                          expiresHours === hours && styles.expirationOptionTextActive
                        ]}>
                          {hours === '24' ? '1 Day' : hours === '168' ? '1 Week' : '30 Days'}
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
                      name={includeCompleted ? "check-box" : "check-box-outline-blank"} 
                      size={24} 
                      color={theme.primary} 
                    />
                    <Text style={styles.shareOptionText}>Include completed status</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => setIncludeTomorrow(!includeTomorrow)}
                  >
                    <Icon 
                      name={includeTomorrow ? "check-box" : "check-box-outline-blank"} 
                      size={24} 
                      color={theme.primary} 
                    />
                    <Text style={styles.shareOptionText}>Include tomorrow's activities</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.shareOption}
                    onPress={() => setAutoUpdate(!autoUpdate)}
                  >
                    <Icon 
                      name={autoUpdate ? "check-box" : "check-box-outline-blank"} 
                      size={24} 
                      color={theme.primary} 
                    />
                    <Text style={styles.shareOptionText}>Auto-update when I make changes</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <ModalFooter
                theme={theme}
                primaryButton={{
                  label: 'Create Share Link',
                  icon: 'share',
                  onPress: handleCreateShare,
                  disabled: shareLoading
                }}
                loading={shareLoading}
                showOnDesktop={true}
              />
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
                  name={showActiveShares ? "expand-less" : "expand-more"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              {showActiveShares && Object.entries(activeShares).map(([userId, { user, shares }]) => (
                <View key={userId} style={styles.userSharesContainer}>
                  <View style={styles.userSharesHeader}>
                    <Text style={styles.userSharesEmoji}>{user.icon || '😀'}</Text>
                    <Text style={styles.userSharesName}>{user.name}</Text>
                    <Text style={styles.userSharesCount}>{shares.length} active</Text>
                  </View>
                  {shares.map(share => (
                    <View key={share.share_id} style={styles.activeShareCard}>
                      <View style={styles.activeShareInfo}>
                        {share.recipient_name && (
                          <Text style={styles.activeShareRecipient}>
                            To: {share.recipient_name}
                          </Text>
                        )}
                        <Text style={styles.activeShareDate}>
                          Expires: {new Date(share.expires_at).toLocaleDateString()}
                        </Text>
                        {share.auto_update && (
                          <View style={styles.activeShareBadge}>
                            <Icon name="sync" size={12} color="#4caf50" />
                            <Text style={styles.activeShareBadgeText}>Auto-update</Text>
                          </View>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDeleteShare(share.share_id)}
                        style={styles.activeShareDelete}
                      >
                        <Icon name="delete" size={20} color="#d32f2f" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}
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
              <Text style={styles.shareInfoLabel}>Share Token:</Text>
              <Text style={styles.shareInfoValue} selectable numberOfLines={1}>
                {shareToken}
              </Text>
            </View>
            
            <View style={styles.shareInfoBox}>
              <Text style={styles.shareInfoLabel}>Share URL:</Text>
              <Text style={styles.shareInfoValue} selectable numberOfLines={2}>
                {shareUrl}
              </Text>
            </View>
            
            <View style={styles.shareActionsContainer}>
              {Platform.OS === 'web' ? (
                <>
                  <ModalButton
                    theme={theme}
                    variant="primary"
                    label="Show QR Code"
                    icon="qr-code-2"
                    onPress={() => setShowShareQR(!showShareQR)}
                    compact
                  />
                  <ModalButton
                    theme={theme}
                    variant="secondary"
                    label="Copy Token"
                    icon="content-copy"
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        navigator.clipboard.writeText(shareToken);
                      } else {
                        const Clipboard = require('@react-native-clipboard/clipboard').default;
                        Clipboard.setString(shareToken);
                      }
                      showToast({ message: 'Token copied to clipboard!' });
                    }}
                    compact
                  />
                  <ModalButton
                    theme={theme}
                    variant="secondary"
                    label="Copy URL"
                    icon="link"
                    onPress={handleCopyShareUrl}
                    compact
                  />
                </>
              ) : (
                <View style={styles.mobileShareActions}>
                  <ModalButton
                    theme={theme}
                    variant="secondary"
                    label="Copy Token"
                    icon="content-copy"
                    onPress={() => {
                      const Clipboard = require('@react-native-clipboard/clipboard').default;
                      Clipboard.setString(shareToken);
                      showToast({ message: 'Token copied to clipboard!' });
                    }}
                  />
                  <ModalButton
                    theme={theme}
                    variant="secondary"
                    label="Copy URL"
                    icon="link"
                    onPress={handleCopyShareUrl}
                    style={{ marginTop: 10 }}
                  />
                </View>
              )}
            </View>
            
            {(Platform.OS !== 'web' || showShareQR) && (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.qrCodeLabel}>Share QR Code:</Text>
                <QRCode
                  value={shareUrl}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
            )}
            
            <View style={styles.divider} />
            
            <ModalButton
              theme={theme}
              variant="secondary"
              label="Create Another Share"
              icon="add-circle"
              onPress={() => {
                setShareUrl('');
                setShowShareQR(false);
                const token = syncService.generateShareToken(true);
                setShareToken(token);
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
        onTabChange={setActiveTab}
      >
        <TabContent isActive={activeTab === 0} modalVisible={visible}>
          {renderSyncContent()}
        </TabContent>
        <TabContent isActive={activeTab === 1} modalVisible={visible}>
          {renderShareContent()}
        </TabContent>
        <TabContent isActive={activeTab === 2} modalVisible={visible}>
          {renderImportContent()}
        </TabContent>
        <TabContent isActive={activeTab === 3} modalVisible={visible}>
          {renderExportContent()}
        </TabContent>
      </TabbedModal>
      
      <ConfirmModal
        visible={showImportConfirm}
        onClose={() => setShowImportConfirm(false)}
        onConfirm={handleImportConfirm}
        theme={theme}
        title={importMode === 'fresh' ? 'Start Fresh Import' : 'Merge Import'}
        message={
          importMode === 'fresh'
            ? 'This will replace all your current data with the selected items. This action cannot be undone.'
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
        message="This will stop syncing your data. Your local data will remain unchanged. You can re-enable sync later with your recovery phrase."
        confirmText="Disable"
        confirmButtonColor="#d32f2f"
        icon="sync-disabled"
        iconColor="#d32f2f"
      />
    </>
  );
};

export default DataModal;