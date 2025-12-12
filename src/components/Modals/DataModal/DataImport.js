// @ts-check
import React, { useState } from 'react';
import { Text } from '../../Typography';
import { View, Platform } from 'react-native';
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
  // NOTE: On Android 11+ (SDK 30+), scoped storage prevents directory scanning.
  // We use DocumentPicker on all platforms for consistent, permission-safe file access.
  const handleSelectFile = async () => {
    const modules = loadFileSystemModules();

    try {
      setInternalLoading(true);
      // Use DocumentPicker on all platforms (including Android)
      // This uses Storage Access Framework which works with scoped storage
      await handleDocumentPickerSelection(modules);
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
            ? 'Select your StackMap export file from Downloads'
            : 'Import your saved StackMap data from a backup file'}
        </Text>
      </View>

      <View style={styles.inPanelButtonContainer}>
        <ModalButton
          theme={theme}
          variant="primary"
          label="Select File"
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