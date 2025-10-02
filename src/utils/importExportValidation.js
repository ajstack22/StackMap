// @ts-check

/**
 * Pure business logic functions for import/export validation
 * Extracted from DataImport and DataExport modal components
 */

/**
 * Format file display name from StackMap export file name
 * Extracts date/time information and file size for user-friendly display
 *
 * @param {Object} file - File object with name and size properties
 * @param {string} file.name - The file name to format
 * @param {number} file.size - The file size in bytes
 * @returns {string} Formatted display name
 */
export const formatFileDisplayName = (file) => {
  if (!file?.name) {
    return 'Unknown file';
  }

  const match = file.name.match(
    /stackmap-export-(\d{4}-\d{2}-\d{2})-?(\d{2}-\d{2}-\d{2})?/,
  );
  let displayName = file.name;

  if (match) {
    const date = match[1];
    const time = match[2] ? match[2].replace(/-/g, ':') : '';
    displayName = time ? `${date} at ${time}` : date;

    if (file.size !== undefined && typeof file.size === 'number') {
      const sizeKB = Math.round(file.size / 1024);
      displayName += ` (${sizeKB} KB)`;
    }
  }

  return displayName;
};

/**
 * Validate StackMap export file structure
 * Checks for required fields and data integrity
 *
 * @param {any} data - Parsed JSON data from import file
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export const validateImportData = (data) => {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      error: 'Invalid data format'
    };
  }

  // Check for version field
  if (!data.version) {
    return {
      isValid: false,
      error: 'Invalid StackMap export file'
    };
  }

  // Check for at least one importable data type
  if (!data.users && !data.activityCards && !data.library) {
    return {
      isValid: false,
      error: 'Export file contains no importable data'
    };
  }

  return { isValid: true };
};

/**
 * Parse and validate import file content
 * Combines JSON parsing with validation
 *
 * @param {string} fileContent - Raw file content as string
 * @param {Object} fileInfo - File metadata
 * @returns {{data?: any, error?: string}} Parse result
 */
export const parseImportFile = (fileContent, fileInfo = {}) => {
  try {
    const parsedData = JSON.parse(fileContent);
    const validation = validateImportData(parsedData);

    if (!validation.isValid) {
      return { error: validation.error };
    }

    return { data: parsedData };
  } catch (error) {
    return {
      error: `Invalid JSON file: ${error.message}`
    };
  }
};

/**
 * Extract preview information from import data
 * Creates summary for user preview before import
 *
 * @param {Object} data - Validated import data
 * @returns {Object} Preview information
 */
export const extractImportPreview = (data) => {
  const preview = {
    users: [],
    totalActivities: 0,
    totalLibraryItems: 0,
    hasSettings: false,
    version: data.version || 'Unknown'
  };

  // Extract user information
  if (data.users) {
    Object.entries(data.users).forEach(([userId, user]) => {
      let activityCount = 0;
      if (user.days) {
        Object.values(user.days).forEach(day => {
          activityCount += (day.activities || []).length;
        });
      }

      preview.users.push({
        id: userId,
        name: user.name || 'Unnamed User',
        icon: user.icon || user.emoji || '👤',
        activityCount,
      });

      preview.totalActivities += activityCount;
    });
  }

  // Count library items
  if (data.library && data.library.categories) {
    if (Array.isArray(data.library.categories)) {
      data.library.categories.forEach(category => {
        preview.totalLibraryItems += (category.activities || []).length;
      });
    } else if (typeof data.library.categories === 'object') {
      Object.values(data.library.categories).forEach(category => {
        preview.totalLibraryItems += (category.activities || []).length;
      });
    }
  }

  // Check for settings
  preview.hasSettings = !!(data.settings || data.currentTheme || data.bannerPosition);

  return preview;
};

/**
 * Validate sync key format
 * Checks if a string is a valid recovery phrase format
 *
 * @param {string} syncKey - The sync key to validate
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export const validateSyncKey = (syncKey) => {
  if (!syncKey || typeof syncKey !== 'string') {
    return {
      isValid: false,
      error: 'Sync key is required'
    };
  }

  const trimmed = syncKey.trim();

  // Check if it's a URL format (device invite)
  if (trimmed.startsWith('http')) {
    const urlParts = trimmed.split('#');
    if (urlParts.length === 2) {
      const phrase = urlParts[1];
      return validateRecoveryPhrase(phrase);
    } else {
      return {
        isValid: false,
        error: 'Invalid invite URL format'
      };
    }
  }

  // Otherwise, validate as recovery phrase
  return validateRecoveryPhrase(trimmed);
};

/**
 * Validate recovery phrase format
 * Checks for 32-character hexadecimal format
 *
 * @param {string} phrase - The recovery phrase to validate
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export const validateRecoveryPhrase = (phrase) => {
  if (!phrase || typeof phrase !== 'string') {
    return {
      isValid: false,
      error: 'Recovery phrase is required'
    };
  }

  const trimmed = phrase.trim();

  // Check if hexadecimal first (to catch non-hex chars regardless of length)
  const hexRegex = /^[a-fA-F0-9]+$/;
  if (!hexRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Recovery phrase must contain only hexadecimal characters (0-9, a-f)'
    };
  }

  // Check length (32 characters)
  if (trimmed.length !== 32) {
    return {
      isValid: false,
      error: 'Recovery phrase must be exactly 32 characters'
    };
  }

  return { isValid: true };
};

/**
 * Format time ago from timestamp
 * Converts millisecond timestamp to human-readable relative time
 *
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Unknown time';
  }

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

/**
 * Validate export selections
 * Checks if user has selected valid data for export
 *
 * @param {Object} selections - Export selection options
 * @param {Object} availableData - Available data to export
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export const validateExportSelections = (selections, availableData) => {
  if (!selections || typeof selections !== 'object') {
    return {
      isValid: false,
      error: 'Export selections are required'
    };
  }

  // Check if at least one data type is selected
  const hasUserSelection = selections.users && Object.keys(selections.users).some(id => selections.users[id]);
  const hasLibrarySelection = selections.library;
  const hasSettingsSelection = selections.settings;

  if (!hasUserSelection && !hasLibrarySelection && !hasSettingsSelection) {
    return {
      isValid: false,
      error: 'Please select at least one item to export'
    };
  }

  // Validate user selections exist in available data
  if (hasUserSelection && availableData.users) {
    const selectedUserIds = Object.keys(selections.users).filter(id => selections.users[id]);
    const invalidIds = selectedUserIds.filter(id => !availableData.users[id]);

    if (invalidIds.length > 0) {
      return {
        isValid: false,
        error: `Selected users not found: ${invalidIds.join(', ')}`
      };
    }
  }

  return { isValid: true };
};