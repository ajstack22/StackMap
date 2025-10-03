// @ts-check
import React, { useState } from 'react';
import { Text } from '../../Typography';
import { View, TouchableOpacity, Platform, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { styles } from './styles';
import { ModalButton } from '../../ModalUtilities';

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
        DocumentPicker = require('react-native-document-picker');
      } catch (e) {
        DocumentPicker = null;
      }
      RNFS = require('react-native-fs');
    }
  }
  return { RNFS, DocumentPicker };
};

// Helper function to format file display name
const formatFileDisplayName = (file) => {
  const match = file.name.match(
    // eslint-disable-next-line security/detect-unsafe-regex -- Simple date/time pattern on bounded filename input
    /stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/,
  );
  let displayName = file.name;

  if (match) {
    const date = match[1];
    const time = match[2] ? match[2].replace(/-/g, ':') : '';
    displayName = time ? `${date} at ${time}` : date;
    const sizeKB = Math.round(file.size / 1024);
    displayName += ` (${sizeKB} KB)`;
  }

  return displayName;
};

// Helper function to show Android file picker
const showAndroidFilePicker = (uniqueFiles, loadFile, setInternalLoading) => {
  const filesToShow = uniqueFiles.length > 2 ? uniqueFiles.slice(0, 2) : uniqueFiles;
  const fileOptions = filesToShow.map(f => ({
    text: formatFileDisplayName(f),
    onPress: () => loadFile(f),
  }));

  const title = uniqueFiles.length > 2
    ? `Found ${uniqueFiles.length} backups. Showing 2 most recent:`
    : `Found ${uniqueFiles.length} StackMap backups:`;

  Alert.alert('Select Backup to Import', title, [
    ...fileOptions,
    {
      text: 'Cancel',
      style: 'cancel',
      onPress: () => setInternalLoading(false),
    },
  ]);
};

/**
 * DataImport Component
 * Handles file selection and initial parsing for importing StackMap data
 */
const DataImport = ({
  theme,
  onFileSelected,
  onError,
  loading = false,
  disabled = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  // Search for StackMap JSON files in Android directories
  const searchAndroidFiles = async (modules) => {
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

    // Remove duplicates based on file name and sort by modified time
    const uniqueFiles = Array.from(
      new Map(jsonFiles.map(f => [f.name, f])).values(),
    );
    uniqueFiles.sort((a, b) => b.mtime - a.mtime);

    return uniqueFiles;
  };

  // Show help when no files found on Android
  const showAndroidNoFilesHelp = (setInternalLoading) => {
    Alert.alert(
      'How to Import Your Data 📱',
      'Your exported StackMap files are saved in the Downloads folder.\n\nTo access them:\n\n1. Open your phone\'s Files app\n2. Navigate to Downloads\n3. Look for files starting with "stackmap-export"\n4. You can open them with StackMap from there\n\nOr use the Export button first to create a backup file.',
      [
        {
          text: 'Open Files App',
          onPress: () => {
            if (Platform.OS === 'android') {
              const { Linking } = require('react-native');
              Linking.openURL('content://com.android.documentsui.documents/root/downloads');
            }
          }
        },
        { text: 'OK', style: 'cancel' }
      ],
    );
    setInternalLoading(false);
  };

  // Create file loader function for Android
  const createAndroidFileLoader = (modules) => {
    return async (file) => {
      try {
        const fileContent = await modules.RNFS.readFile(file.path, 'utf8');
        const parsedData = await parseImportFile(fileContent, file);

        if (parsedData) {
          onFileSelected({
            file: { name: file.name, path: file.path },
            data: parsedData
          });
        }
      } catch (error) {
        onError('Failed to read file: ' + error.message);
      }
    };
  };

  // Handle Android file selection flow
  const handleAndroidFileSelection = async (modules) => {
    if (!modules.RNFS) {
      throw new Error('File system not available');
    }

    const uniqueFiles = await searchAndroidFiles(modules);

    if (uniqueFiles.length === 0) {
      showAndroidNoFilesHelp(setInternalLoading);
      return;
    }

    const loadFile = createAndroidFileLoader(modules);

    if (uniqueFiles.length > 1) {
      showAndroidFilePicker(uniqueFiles, loadFile, setInternalLoading);
    } else {
      await loadFile(uniqueFiles[0]);
    }

    setInternalLoading(false);
  };

  // Read file content from DocumentPicker result
  const readDocumentPickerFile = async (result, modules) => {
    if (Platform.OS === 'web' && result[0]?.content) {
      return result[0].content;
    }

    if (result[0]?.fileCopyUri) {
      const fileContent = await modules.RNFS.readFile(
        result[0].fileCopyUri,
        'utf8',
      );
      await modules.RNFS.unlink(result[0].fileCopyUri);
      return fileContent;
    }

    throw new Error('Could not read the selected file');
  };

  // Handle iOS/Web file selection flow
  const handleDocumentPickerSelection = async (modules) => {
    if (!modules.DocumentPicker || !modules.DocumentPicker.pick) {
      onError('File picker is not available on this platform.');
      setInternalLoading(false);
      return;
    }

    const result = await modules.DocumentPicker.pick({
      type:
        Platform.OS === 'web'
          ? 'application/json'
          : [modules.DocumentPicker.types.json],
      copyTo: 'cachesDirectory',
    });

    const fileContent = await readDocumentPickerFile(result, modules);
    const parsedData = await parseImportFile(fileContent, result[0]);

    if (parsedData) {
      onFileSelected({
        file: result[0],
        data: parsedData
      });
    }
  };

  // Handle file selection
  const handleSelectFile = async () => {
    const modules = loadFileSystemModules();

    try {
      setInternalLoading(true);

      if (Platform.OS === 'android') {
        await handleAndroidFileSelection(modules);
      } else {
        await handleDocumentPickerSelection(modules);
      }
    } catch (error) {
      if (
        error.code !== modules.DocumentPicker?.errorCodes?.cancelled &&
        error.code !== 'DOCUMENT_PICKER_CANCELED'
      ) {
        onError('Failed to select file. Please try again.');
      }
    } finally {
      setInternalLoading(false);
    }
  };

  // Parse and validate import file
  const parseImportFile = async (fileContent, fileInfo) => {
    try {
      const parsedData = JSON.parse(fileContent);

      // Validate data structure
      if (!parsedData.version) {
        onError('Invalid StackMap export file');
        return null;
      }

      // Additional validation can be added here
      if (!parsedData.users && !parsedData.activityCards && !parsedData.library) {
        onError('Export file contains no importable data');
        return null;
      }

      return parsedData;
    } catch (error) {
      onError('Invalid JSON file: ' + error.message);
      return null;
    }
  };

  const isLoading = loading || internalLoading;

  return (
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
          disabled={disabled || isLoading}
          loading={isLoading}
          fullWidth
        />
      </View>
    </View>
  );
};

export default DataImport;