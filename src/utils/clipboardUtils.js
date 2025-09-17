// @ts-check

/**
 * Pure business logic functions for clipboard operations
 * Extracted from DataModal and RecoveryPhrase components
 * Platform-agnostic clipboard utilities focused on business logic
 */

/**
 * Validate clipboard text for different content types
 * Determines what type of sync-related content is in clipboard
 *
 * @param {string} text - Text content to validate
 * @returns {{isValid: boolean, type: string, metadata?: Object, error?: string}}
 */
export const validateClipboardText = (text) => {
  if (typeof text !== 'string') {
    return {
      isValid: false,
      type: 'unknown',
      error: 'Invalid text content'
    };
  }

  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return {
      isValid: false,
      type: 'unknown',
      error: 'Content is not a recognized sync format'
    };
  }

  // Check for URL format (device invite)
  if (trimmed.startsWith('http')) {
    return validateSyncUrl(trimmed);
  }

  // Check for key format (inviteCode#recoveryPhrase)
  if (trimmed.includes('#')) {
    return validateSyncKey(trimmed);
  }

  // Check for recovery phrase format
  if (isRecoveryPhrase(trimmed)) {
    return {
      isValid: true,
      type: 'recovery_phrase',
      metadata: {
        phrase: trimmed,
        length: trimmed.length
      }
    };
  }

  // Check for JSON data (export file content)
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return validateJsonData(trimmed);
  }

  return {
    isValid: false,
    type: 'unknown',
    error: 'Content is not a recognized sync format'
  };
};

/**
 * Validate sync URL format
 * Internal helper for URL validation
 *
 * @param {string} url - URL to validate
 * @returns {{isValid: boolean, type: string, metadata?: Object, error?: string}}
 */
const validateSyncUrl = (url) => {
  try {
    const urlObj = new URL(url);
    const fragment = urlObj.hash.substring(1); // Remove # prefix

    if (!fragment) {
      return {
        isValid: false,
        type: 'url',
        error: 'URL missing recovery phrase fragment'
      };
    }

    if (!isRecoveryPhrase(fragment)) {
      return {
        isValid: false,
        type: 'url',
        error: 'URL contains invalid recovery phrase'
      };
    }

    const pathParts = urlObj.pathname.split('/');
    const inviteCode = pathParts[pathParts.length - 1];

    return {
      isValid: true,
      type: 'invite_url',
      metadata: {
        domain: urlObj.hostname,
        inviteCode,
        recoveryPhrase: fragment,
        fullUrl: url
      }
    };
  } catch (error) {
    return {
      isValid: false,
      type: 'url',
      error: 'Invalid URL format'
    };
  }
};

/**
 * Validate sync key format (inviteCode#recoveryPhrase)
 * Internal helper for key validation
 *
 * @param {string} key - Key to validate
 * @returns {{isValid: boolean, type: string, metadata?: Object, error?: string}}
 */
const validateSyncKey = (key) => {
  const parts = key.split('#');

  if (parts.length !== 2) {
    return {
      isValid: false,
      type: 'key',
      error: 'Invalid key format - must contain exactly one # separator'
    };
  }

  const [inviteCode, recoveryPhrase] = parts;

  if (!inviteCode || inviteCode.trim().length === 0) {
    return {
      isValid: false,
      type: 'key',
      error: 'Missing invite code'
    };
  }

  if (!isRecoveryPhrase(recoveryPhrase)) {
    return {
      isValid: false,
      type: 'key',
      error: 'Invalid recovery phrase format'
    };
  }

  return {
    isValid: true,
    type: 'sync_key',
    metadata: {
      inviteCode: inviteCode.trim(),
      recoveryPhrase,
      fullKey: key
    }
  };
};

/**
 * Validate JSON data format
 * Internal helper for JSON validation
 *
 * @param {string} jsonText - JSON text to validate
 * @returns {{isValid: boolean, type: string, metadata?: Object, error?: string}}
 */
const validateJsonData = (jsonText) => {
  try {
    const data = JSON.parse(jsonText);

    // Check if it looks like StackMap export data
    if (data.version && (data.users || data.library || data.activityCards)) {
      const metadata = {
        version: data.version,
        hasUsers: !!data.users,
        hasLibrary: !!data.library,
        hasActivityCards: !!data.activityCards,
        exportDate: data.exportDate,
        size: jsonText.length
      };

      return {
        isValid: true,
        type: 'export_data',
        metadata
      };
    }

    return {
      isValid: false,
      type: 'json',
      error: 'JSON does not appear to be StackMap export data'
    };
  } catch (error) {
    return {
      isValid: false,
      type: 'json',
      error: 'Invalid JSON format'
    };
  }
};

/**
 * Check if text is a valid recovery phrase
 * Internal helper for recovery phrase validation
 *
 * @param {string} text - Text to check
 * @returns {boolean}
 */
const isRecoveryPhrase = (text) => {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length === 32 && /^[a-fA-F0-9]+$/.test(trimmed);
};

/**
 * Extract relevant data from validated clipboard content
 * Extracts actionable information from clipboard validation result
 *
 * @param {Object} validationResult - Result from validateClipboardText
 * @returns {{recoveryPhrase?: string, inviteCode?: string, url?: string, data?: Object} | null}
 */
export const extractClipboardData = (validationResult) => {
  if (!validationResult || !validationResult.isValid || !validationResult.metadata) {
    return null;
  }

  const { type, metadata } = validationResult;

  switch (type) {
    case 'recovery_phrase':
      return {
        recoveryPhrase: metadata.phrase
      };

    case 'sync_key':
      return {
        recoveryPhrase: metadata.recoveryPhrase,
        inviteCode: metadata.inviteCode
      };

    case 'invite_url':
      return {
        recoveryPhrase: metadata.recoveryPhrase,
        inviteCode: metadata.inviteCode,
        url: metadata.fullUrl
      };

    case 'export_data':
      return {
        data: metadata // Contains parsed export information
      };

    default:
      return null;
  }
};

/**
 * Format text for clipboard copy operations
 * Ensures consistent formatting for different content types
 *
 * @param {string} text - Text to format
 * @param {string} type - Type of content ('phrase', 'key', 'url', 'json')
 * @returns {string} Formatted text ready for clipboard
 */
export const formatTextForClipboard = (text, type) => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  switch (type) {
    case 'phrase':
      // Remove any existing spaces and add consistent formatting
      return text.replace(/\s/g, '').toLowerCase();

    case 'key':
      // Ensure proper format: inviteCode#recoveryPhrase
      if (text.includes('#')) {
        const [code, phrase] = text.split('#');
        return `${code.trim()}#${phrase.replace(/\s/g, '').toLowerCase()}`;
      }
      return text.trim();

    case 'url':
      // Ensure URL is properly formatted
      return text.trim();

    case 'json':
      // Minify JSON for clipboard
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed);
      } catch {
        return text.trim();
      }

    default:
      return text.trim();
  }
};

/**
 * Generate clipboard success/error messages
 * Creates user-friendly messages for clipboard operations
 *
 * @param {string} operation - Operation type ('copy', 'paste', 'validate')
 * @param {string} contentType - Content type ('phrase', 'key', 'url', 'data')
 * @param {boolean} success - Whether operation succeeded
 * @param {string} [error] - Error message if failed
 * @returns {string} User-friendly message
 */
export const generateClipboardMessage = (operation, contentType, success, error) => {
  const contentLabels = {
    phrase: 'recovery phrase',
    key: 'sync key',
    url: 'invite URL',
    data: 'export data',
    unknown: 'content'
  };

  const label = contentLabels[contentType] || contentLabels.unknown;

  if (success) {
    switch (operation) {
      case 'copy':
        return `${label.charAt(0).toUpperCase() + label.slice(1)} copied to clipboard!`;
      case 'paste':
        return `${label.charAt(0).toUpperCase() + label.slice(1)} pasted successfully!`;
      case 'validate':
        return `Valid ${label} detected`;
      default:
        return 'Operation completed successfully';
    }
  } else {
    switch (operation) {
      case 'copy':
        return error || `Failed to copy ${label}. Please try selecting and copying manually.`;
      case 'paste':
        return error || `Failed to paste ${label}. Please try again.`;
      case 'validate':
        return error || `Invalid ${label} format`;
      default:
        return error || 'Operation failed';
    }
  }
};

/**
 * Sanitize clipboard content for logging/debugging
 * Removes sensitive information while preserving structure for debugging
 *
 * @param {string} content - Content to sanitize
 * @returns {string} Sanitized content safe for logging
 */
export const sanitizeClipboardContent = (content) => {
  if (!content || typeof content !== 'string') {
    return '[INVALID_CONTENT]';
  }

  // First, sanitize invite codes before replacing recovery phrases
  let sanitized = content
    // Sanitize invite codes in URLs
    .replace(
      /(https?:\/\/[^\/]+\/[^\/]*?)([a-zA-Z0-9]{6,})(#[a-fA-F0-9]{32})/g,
      '$1[INVITE_CODE]$3'
    )
    // Sanitize invite codes in keys
    .replace(
      /\b([a-zA-Z0-9]{6,})#([a-fA-F0-9]{32})\b/g,
      '[INVITE_CODE]#$2'
    )
    // Then sanitize recovery phrases
    .replace(/\b[a-fA-F0-9]{32}\b/g, '[RECOVERY_PHRASE]');

  // Sanitize JSON user data
  if (sanitized.includes('{') && sanitized.includes('}')) {
    try {
      const data = JSON.parse(content);
      if (data.users) {
        sanitized = JSON.stringify({
          ...data,
          users: '[SANITIZED_USER_DATA]'
        });
      }
    } catch {
      // If not valid JSON, just return the string-sanitized version
    }
  }

  return sanitized;
};

/**
 * Validate clipboard content size limits
 * Checks if clipboard content is within reasonable size limits
 *
 * @param {string} content - Content to validate
 * @param {number} maxSizeKB - Maximum size in KB (default: 1024)
 * @returns {{isValid: boolean, size: number, error?: string}}
 */
export const validateClipboardSize = (content, maxSizeKB = 1024) => {
  if (typeof content !== 'string') {
    return {
      isValid: false,
      size: 0,
      error: 'No content provided'
    };
  }

  const sizeBytes = new Blob([content]).size;
  const sizeKB = sizeBytes / 1024;

  if (sizeKB > maxSizeKB) {
    return {
      isValid: false,
      size: sizeKB,
      error: `Content too large (${Math.round(sizeKB)}KB). Maximum allowed: ${maxSizeKB}KB`
    };
  }

  return {
    isValid: true,
    size: sizeKB
  };
};