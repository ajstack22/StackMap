// @ts-check

/**
 * Pure business logic functions for file processing and format operations
 * Extracted from DataImport, DataExport, and related modal components
 */

/**
 * Extract file extension from filename
 * Safely extracts file extension regardless of path format
 *
 * @param {string} filename - The filename to process
 * @returns {string} File extension in lowercase (without dot)
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }

  return filename.slice(lastDotIndex + 1).toLowerCase();
};

/**
 * Validate file type for import operations
 * Checks if file type is supported for import
 *
 * @param {string} filename - The filename to validate
 * @param {string[]} allowedExtensions - Allowed file extensions (default: ['json'])
 * @returns {{isValid: boolean, extension: string, error?: string}}
 */
export const validateFileType = (filename, allowedExtensions = ['json']) => {
  const extension = getFileExtension(filename);

  if (!extension) {
    return {
      isValid: false,
      extension: '',
      error: 'File has no extension'
    };
  }

  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      extension,
      error: `Unsupported file type. Allowed: ${allowedExtensions.join(', ')}`
    };
  }

  return {
    isValid: true,
    extension
  };
};

/**
 * Generate export filename with timestamp
 * Creates consistent filename format for exports
 *
 * @param {string} prefix - Filename prefix (default: 'stackmap-export')
 * @param {Date} [timestamp] - Custom timestamp (default: current time)
 * @param {boolean} includeTime - Whether to include time in filename (default: true)
 * @returns {string} Generated filename
 */
export const generateExportFilename = (prefix = 'stackmap-export', timestamp, includeTime = true) => {
  const date = timestamp || new Date();

  // Format: YYYY-MM-DD
  const dateStr = date.toISOString().slice(0, 10);

  if (!includeTime) {
    return `${prefix}-${dateStr}.json`;
  }

  // Format: HH-MM-SS (use UTC to avoid timezone issues)
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '-');

  return `${prefix}-${dateStr}-${timeStr}.json`;
};

/**
 * Parse StackMap export filename
 * Extracts information from StackMap export filename format
 *
 * @param {string} filename - The filename to parse
 * @returns {{isStackMapExport: boolean, date?: string, time?: string, prefix?: string}}
 */
export const parseStackMapFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return { isStackMapExport: false };
  }

  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

  // Match pattern: prefix-YYYY-MM-DD[-HH-MM-SS]
  // eslint-disable-next-line security/detect-unsafe-regex -- Simple date/time pattern on bounded filename input
  const match = nameWithoutExt.match(/^(.+)-(\d{4}-\d{2}-\d{2})(?:-(\d{2}-\d{2}-\d{2}))?$/);

  if (!match) {
    return { isStackMapExport: false };
  }

  const [, prefix, date, time] = match;

  // Check if prefix contains 'stackmap'
  if (!prefix.toLowerCase().includes('stackmap')) {
    return { isStackMapExport: false };
  }

  // Basic date validation
  const [year, month, day] = date.split('-').map(Number);
  if (year < 2020 || year > 2050 || month < 1 || month > 12 || day < 1 || day > 31) {
    return { isStackMapExport: false };
  }

  return {
    isStackMapExport: true,
    prefix,
    date,
    time: time ? time.replace(/-/g, ':') : undefined
  };
};

/**
 * Calculate file size display string
 * Converts bytes to human-readable format
 *
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Human-readable size string
 */
export const formatFileSize = (bytes, decimals = 1) => {
  if (typeof bytes !== 'number' || bytes < 0) {
    return '0 B';
  }

  if (bytes === 0) {
    return '0 B';
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  if (i >= sizes.length) {
    return `${(bytes / Math.pow(k, sizes.length - 1)).toFixed(dm)} ${sizes[sizes.length - 1]}`;
  }

  return `${(bytes / Math.pow(k, i)).toFixed(dm)} ${sizes[i]}`;
};

/**
 * Validate file size limits
 * Checks if file size is within acceptable limits
 *
 * @param {number} bytes - File size in bytes
 * @param {number} maxSizeMB - Maximum size in MB (default: 10)
 * @returns {{isValid: boolean, size: string, error?: string}}
 */
export const validateFileSize = (bytes, maxSizeMB = 10) => {
  const sizeString = formatFileSize(bytes);

  if (typeof bytes !== 'number' || bytes < 0) {
    return {
      isValid: false,
      size: sizeString,
      error: 'Invalid file size'
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;

  if (bytes > maxBytes) {
    return {
      isValid: false,
      size: sizeString,
      error: `File too large (${sizeString}). Maximum: ${maxSizeMB} MB`
    };
  }

  return {
    isValid: true,
    size: sizeString
  };
};

/**
 * Extract file info from File object or file metadata
 * Normalizes file information from different sources
 *
 * @param {Object} file - File object or metadata
 * @returns {{name: string, size: number, type?: string, lastModified?: number}}
 */
export const extractFileInfo = (file) => {
  if (!file || typeof file !== 'object') {
    return {
      name: '',
      size: 0
    };
  }

  // Handle File object (browser)
  if (file instanceof File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
  }

  // Handle file metadata object
  return {
    name: file.name || '',
    size: file.size || 0,
    type: file.type,
    lastModified: file.lastModified || file.mtime
  };
};

/**
 * Validate JSON file content structure
 * Checks if JSON content has valid structure for import
 *
 * @param {string} content - JSON file content
 * @returns {{isValid: boolean, data?: Object, error?: string, info?: Object}}
 */
export const validateJsonFileContent = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      isValid: false,
      error: 'No content provided'
    };
  }

  let parsedData;
  try {
    parsedData = JSON.parse(content);
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid JSON: ${error.message}`
    };
  }

  if (!parsedData || typeof parsedData !== 'object') {
    return {
      isValid: false,
      error: 'JSON does not contain valid data object'
    };
  }

  // Check for StackMap export structure
  if (!parsedData.version) {
    return {
      isValid: false,
      error: 'Missing version field - not a valid StackMap export'
    };
  }

  // Check for importable data
  const hasUsers = parsedData.users && Object.keys(parsedData.users).length;
  const hasLibrary = !!(parsedData.library && parsedData.library.categories);
  const hasActivityCards = parsedData.activityCards && parsedData.activityCards.length;

  if (!hasUsers && !hasLibrary && !hasActivityCards) {
    return {
      isValid: false,
      error: 'No importable data found in file'
    };
  }

  // Extract file info
  const info = {
    version: parsedData.version,
    exportDate: parsedData.exportDate,
    userCount: hasUsers ? Object.keys(parsedData.users).length : 0,
    hasLibrary,
    activityCardCount: hasActivityCards ? parsedData.activityCards.length : 0,
    size: content.length
  };

  return {
    isValid: true,
    data: parsedData,
    info
  };
};

/**
 * Add version information to preview
 * @private
 */
const addVersionInfo = (fileData, details, warnings) => {
  if (fileData.version) {
    details.push(`Version: ${fileData.version}`);
  } else {
    warnings.push('Missing version information');
  }
};

/**
 * Add user count to preview
 * @private
 */
const addUserInfo = (fileData, details, warnings) => {
  if (fileData.users) {
    const userCount = Object.keys(fileData.users).length;
    details.push(`Users: ${userCount}`);

    if (userCount === 0) {
      warnings.push('No users in export');
    }
  }
};

/**
 * Add library information to preview
 * @private
 */
const addLibraryInfo = (fileData, details) => {
  if (fileData.library && fileData.library.categories) {
    const categoryCount = Array.isArray(fileData.library.categories)
      ? fileData.library.categories.length
      : Object.keys(fileData.library.categories).length;

    details.push(`Library categories: ${categoryCount}`);
  }
};

/**
 * Add activity cards and settings to preview
 * @private
 */
const addActivityAndSettingsInfo = (fileData, details) => {
  if (fileData.activityCards) {
    details.push(`Activity cards: ${fileData.activityCards.length}`);
  }

  if (fileData.settings || fileData.currentTheme || fileData.bannerPosition) {
    details.push('Includes app settings');
  }
};

/**
 * Generate summary text for preview
 * @private
 */
const generatePreviewSummary = (fileData) => {
  const userCount = fileData.users ? Object.keys(fileData.users).length : 0;
  const hasLibrary = !!(fileData.library && fileData.library.categories);
  const hasSettings = !!(fileData.settings || fileData.currentTheme);

  let summary = `StackMap export with ${userCount} user${userCount !== 1 ? 's' : ''}`;
  if (hasLibrary) summary += ', activity library';
  if (hasSettings) summary += ', app settings';

  return summary;
};

/**
 * Generate file preview information
 * Creates display-friendly preview of file contents
 *
 * @param {Object} fileData - Parsed file data
 * @returns {{summary: string, details: string[], warnings: string[]}}
 */
export const generateFilePreview = (fileData) => {
  if (!fileData || typeof fileData !== 'object') {
    return {
      summary: 'No data to preview',
      details: [],
      warnings: ['Invalid file data']
    };
  }

  const details = [];
  const warnings = [];

  addVersionInfo(fileData, details, warnings);

  if (fileData.exportDate) {
    details.push(`Exported: ${fileData.exportDate}`);
  }

  addUserInfo(fileData, details, warnings);
  addLibraryInfo(fileData, details);
  addActivityAndSettingsInfo(fileData, details);

  return {
    summary: generatePreviewSummary(fileData),
    details,
    warnings
  };
};

/**
 * Sanitize filename for safe export
 * Removes invalid characters and ensures valid filename
 *
 * @param {string} filename - Original filename
 * @param {string} defaultName - Default name if original is invalid
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename, defaultName = 'export') => {
  if (!filename || typeof filename !== 'string') {
    return `${defaultName}.json`;
  }

  // Remove or replace invalid characters
  let sanitized = filename
    .replace(/[<>:"/\\|?*]/g, '-') // Replace invalid chars with dash
    .replace(/\s+/g, '-') // Replace spaces with dash
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .replace(/(^-)|(-$)/g, ''); // Remove leading/trailing dashes (fully grouped)

  // Ensure it has valid length
  if (!sanitized.length) {
    sanitized = defaultName;
  } else if (sanitized.length > 200) {
    sanitized = sanitized.slice(0, 200);
  }

  // Ensure .json extension only if no extension exists
  if (!sanitized.includes('.')) {
    sanitized += '.json';
  }

  return sanitized;
};

/**
 * Generate unique filename if file already exists
 * Adds incrementing number to avoid filename conflicts
 *
 * @param {string} baseFilename - Base filename
 * @param {string[]} existingFilenames - Array of existing filenames
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (baseFilename, existingFilenames = []) => {
  if (!existingFilenames.includes(baseFilename)) {
    return baseFilename;
  }

  const ext = getFileExtension(baseFilename);
  const nameWithoutExt = ext.length
    ? baseFilename.slice(0, -(ext.length + 1))
    : baseFilename;

  let counter = 1;
  let uniqueName;

  do {
    uniqueName = ext.length
      ? `${nameWithoutExt} (${counter}).${ext}`
      : `${nameWithoutExt} (${counter}).`;
    counter++;
  } while (existingFilenames.includes(uniqueName) && counter <= 1000);

  return uniqueName;
};