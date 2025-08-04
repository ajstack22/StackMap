import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';
import { SPACING, COLORS } from '../../../constants';
import ConfirmModal from '../ConfirmModal';

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

const ImportExportModal = ({
  visible,
  onClose,
  theme,
  users,
  currentDay,
  templates,
  currentTheme,
  bannerPosition,
  hasSecurePin,
  showToast,
  onImportComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('export'); // 'export' or 'import'
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
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setActiveTab('export');
      setImportFile(null);
      setImportData(null);
      setImportMode('fresh');
      setImportSelections({});
    }
  }, [visible]);
  
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
        exportData.templates = templates;
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
          onClose();
        } catch (error) {
          // Fallback to share
          const { Share } = require('react-native');
          await Share.share({
            message: jsonData,
            title: fileName,
          });
          onClose();
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
        onClose();
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
        onClose();
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
      if (error.code !== DocumentPicker.errorCodes.cancelled) {
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
  
  // Render export tab content
  const renderExportContent = () => (
    <View style={styles.tabContent}>
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
            <Text style={styles.countText}>{Object.keys(users).length}</Text>
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
              {Object.values(users).reduce((count, user) => 
                count + (user.days?.today?.activities?.length || 0) + 
                (user.days?.tomorrow?.activities?.length || 0), 0
              )}
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
            <Text style={styles.countText}>{Object.keys(templates).length}</Text>
            <Icon name="folder" size={16} color="#666" />
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { 
            backgroundColor: theme.primary,
            opacity: Object.values(exportSelections).some(v => v) ? 1 : 0.5
          }]}
          onPress={handleExport}
          disabled={!Object.values(exportSelections).some(v => v) || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="file-download" size={20} color="white" />
              <Text style={styles.buttonText}>Export Selected Data</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render import tab content
  const renderImportContent = () => (
    <View style={styles.tabContent}>
      {!importData ? (
        <View style={styles.section}>
          <View style={styles.emptyStateContainer}>
            <Icon name="file-upload" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>
              Select a StackMap export file to import
            </Text>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary, marginTop: 20 }]}
              onPress={handleSelectFile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Icon name="folder-open" size={20} color="white" />
                  <Text style={styles.buttonText}>Select File</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
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
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { 
                backgroundColor: theme.primary,
                opacity: Object.values(importSelections).some(v => v) ? 1 : 0.5
              }]}
              onPress={() => setShowImportConfirm(true)}
              disabled={!Object.values(importSelections).some(v => v) || loading}
            >
              <Icon name="file-upload" size={20} color="white" />
              <Text style={styles.buttonText}>Import Selected Items</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.light }]}>
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.primary, height: StatusBar.currentHeight || 24 }} />
        )}
        <SafeAreaView style={{ backgroundColor: theme.primary }}>
          <View style={[styles.modalHeader, { backgroundColor: theme.primary }]}>
            <View style={styles.headerLeft}>
              <Icon name="import-export" size={24} color="white" style={styles.headerIcon} />
              <Text style={styles.modalTitle}>Import & Export</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="close" size={20} color="white" />
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={[styles.tabContainer, { backgroundColor: theme.primary }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'export' && styles.tabActive
              ]}
              onPress={() => setActiveTab('export')}
            >
              <Icon 
                name="file-upload" 
                size={20} 
                color={activeTab === 'export' ? theme.primary : 'rgba(255,255,255,0.7)'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'export' && styles.tabTextActive
              ]}>
                Export
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'import' && styles.tabActive
              ]}
              onPress={() => setActiveTab('import')}
            >
              <Icon 
                name="file-download" 
                size={20} 
                color={activeTab === 'import' ? theme.primary : 'rgba(255,255,255,0.7)'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === 'import' && styles.tabTextActive
              ]}>
                Import
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        
        <View style={{ flex: 1, backgroundColor: theme.light }}>
          <ScrollView 
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          >
            {activeTab === 'export' ? renderExportContent() : renderImportContent()}
          </ScrollView>
        </View>
        
        {Platform.OS === 'android' && (
          <View style={{ backgroundColor: theme.light, height: Math.max(insets.bottom, 20) }} />
        )}
      </View>
      
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
    </Modal>
  );
};

export default ImportExportModal;