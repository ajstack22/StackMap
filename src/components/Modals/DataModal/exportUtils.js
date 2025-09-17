// @ts-check
import { Platform, Alert } from 'react-native';
import useAppStore from '../../../stores/useAppStore';

// Import platform-specific modules
let RNFS = null;

// Lazy load file system modules to avoid module-level Platform.OS access
const loadFileSystemModules = () => {
  if (!RNFS) {
    if (Platform.OS === 'web') {
      // Use web polyfills
      RNFS = require('../../../utils/platformHelpers.web').default;
    } else {
      RNFS = require('react-native-fs');
    }
  }
  return { RNFS };
};

/**
 * Builds export data based on user selections
 * @param {Object} selections - Export selections object
 * @param {Object} data - Data needed for export (users, currentUser, currentDay, etc.)
 * @returns {Promise<Object>} - Formatted export data
 */
export const buildExportData = async (selections, data) => {
  const {
    users,
    currentUser,
    currentDay,
    libraryCategories,
    currentTheme,
    bannerPosition,
    hasSecurePin,
  } = data;

  // Build export data based on selections
  const exportData = {
    version: 4,
    exportDate: new Date().toISOString(),
    exportedItems: {
      users: selections.users,
      activityCards: selections.activityCards,
      activityLibrary: selections.activityLibrary,
    },
  };

  // Add selected data
  if (selections.users) {
    exportData.users = users;
    exportData.currentDay = currentDay;
    exportData.currentUser = currentUser; // Add current user to export
  }

  if (selections.activityCards) {
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

  if (selections.activityLibrary) {
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

  return exportData;
};

/**
 * Generates a filename for the export
 * @returns {string} - Formatted filename
 */
export const generateFileName = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `stackmap-export-${dateStr}-${timeStr}.json`;
};

/**
 * Handles Android export to Downloads folder
 * @param {string} jsonData - JSON string to export
 * @param {string} fileName - File name
 * @param {Function} showToast - Toast function
 * @returns {Promise<void>}
 */
export const handleAndroidExport = async (jsonData, fileName, showToast) => {
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

    // Show success message
    Alert.alert(
      'Export Successful! ✅',
      `Your data has been saved to:
📁 Downloads/${fileName}

To use this file:
• Import it back into StackMap using the Import button
• Share it via your file manager app
• Transfer it to another device via email or cloud storage

The file will remain in your Downloads folder until you delete it.`,
      [
        {
          text: 'Got it!',
          style: 'default',
          onPress: () => {
            showToast({ message: '✅ Export saved to Downloads' });
          },
        },
      ],
    );
  } catch (error) {
    Alert.alert('Export Error', 'Failed to save file: ' + error.message);
  }
};

/**
 * Handles web export via download
 * @param {string} jsonData - JSON string to export
 * @param {string} fileName - File name
 * @param {Function} showToast - Toast function
 * @returns {void}
 */
export const handleWebExport = (jsonData, fileName, showToast) => {
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
};

/**
 * Handles iOS export via share sheet
 * @param {string} jsonData - JSON string to export
 * @param {string} fileName - File name
 * @param {Function} showToast - Toast function
 * @returns {Promise<void>}
 */
export const handleIosExport = async (jsonData, fileName, showToast) => {
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
      } catch (err) {
        // Silently ignore file cleanup errors as they're non-critical
        // File will be cleaned up by the OS if needed
      }
    }, 5000);
  } catch (iosError) {
    showToast({
      message: `Failed to export: ${iosError.message}`,
      type: 'error',
    });
  }
};

/**
 * Main export handler that orchestrates the entire export process
 * @param {Object} selections - Export selections
 * @param {Object} data - All data needed for export
 * @param {Function} showToast - Toast function
 * @returns {Promise<void>}
 */
export const handleExport = async (selections, data, showToast) => {
  try {
    // Build export data
    const exportData = await buildExportData(selections, data);

    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);

    // Generate filename
    const fileName = generateFileName();

    // Platform-specific export
    if (Platform.OS === 'android') {
      await handleAndroidExport(jsonData, fileName, showToast);
    } else if (Platform.OS === 'web') {
      handleWebExport(jsonData, fileName, showToast);
    } else {
      // iOS
      await handleIosExport(jsonData, fileName, showToast);
    }
  } catch (error) {
    if (Platform.OS === 'web') {
      showToast({
        message: `Failed to export: ${error.message}`,
        type: 'error',
      });
    } else {
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    }
    throw error; // Re-throw so calling component can handle loading state
  }
};