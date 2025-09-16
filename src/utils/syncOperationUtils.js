// @ts-check

/**
 * Pure business logic functions for sync operations
 * Extracted from syncUtils.js and related modal components
 */

/**
 * Validate sync operation parameters
 * Checks if sync enable/restore parameters are valid
 *
 * @param {Object} params - Sync operation parameters
 * @param {string} params.type - Operation type ('enable', 'restore', 'disable')
 * @param {string} [params.recoveryPhrase] - Recovery phrase for restore operations
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export const validateSyncOperationParams = (params) => {
  if (!params || typeof params !== 'object' || Array.isArray(params)) {
    return {
      isValid: false,
      error: 'Sync operation parameters are required'
    };
  }

  const { type, recoveryPhrase } = params;

  // Validate operation type
  const validTypes = ['enable', 'restore', 'disable', 'manual', 'deleteServer'];
  if (!type || !validTypes.includes(type)) {
    return {
      isValid: false,
      error: `Invalid operation type. Must be one of: ${validTypes.join(', ')}`
    };
  }

  // Validate recovery phrase for restore operations
  if (type === 'restore') {
    if (!recoveryPhrase || typeof recoveryPhrase !== 'string') {
      return {
        isValid: false,
        error: 'Recovery phrase is required for restore operations'
      };
    }

    const trimmed = recoveryPhrase.trim();
    if (trimmed.length === 0) {
      return {
        isValid: false,
        error: 'Recovery phrase cannot be empty'
      };
    }

    // Basic hex validation (32 chars)
    if (trimmed.length !== 32 || !/^[a-fA-F0-9]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Recovery phrase must be a 32-character hexadecimal string'
      };
    }
  }

  return { isValid: true };
};

/**
 * Generate sync operation result
 * Creates standardized result object for sync operations
 *
 * @param {Object} params - Result parameters
 * @param {boolean} params.success - Whether operation succeeded
 * @param {string} [params.message] - Success/error message
 * @param {string} [params.syncId] - Generated sync ID (for successful enable/restore)
 * @param {string} [params.recoveryPhrase] - Recovery phrase (for successful enable)
 * @param {boolean} [params.isNewSync] - Whether this created a new sync
 * @param {Object} [params.data] - Additional operation data
 * @returns {Object} Standardized sync operation result
 */
export const createSyncOperationResult = (params) => {
  const {
    success,
    message = '',
    syncId = null,
    recoveryPhrase = null,
    isNewSync = false,
    data = null
  } = params;

  const result = {
    success: Boolean(success),
    message: String(message),
    timestamp: Date.now()
  };

  // Add optional fields only if they have values
  if (syncId) result.syncId = syncId;
  if (recoveryPhrase) result.recoveryPhrase = recoveryPhrase;

  // Only include isNewSync for successful operations with sync data
  if (success && (syncId || recoveryPhrase) && isNewSync !== undefined) {
    result.isNewSync = Boolean(isNewSync);
  }

  if (data) result.data = data;

  return result;
};

/**
 * Validate sync state update
 * Ensures sync state updates have valid structure
 *
 * @param {Object} stateUpdate - State update object
 * @returns {{isValid: boolean, error?: string, sanitized?: Object}} Validation result
 */
export const validateSyncStateUpdate = (stateUpdate) => {
  if (!stateUpdate || typeof stateUpdate !== 'object' || Array.isArray(stateUpdate)) {
    return {
      isValid: false,
      error: 'State update must be an object'
    };
  }

  const validFields = [
    'syncEnabled',
    'syncId',
    'syncRecoveryPhrase',
    'syncStatus',
    'lastSyncTime',
    'syncStatusChecked'
  ];

  const sanitized = {};
  const errors = [];

  for (const [key, value] of Object.entries(stateUpdate)) {
    if (!validFields.includes(key)) {
      errors.push(`Invalid field: ${key}`);
      continue;
    }

    // Validate field types
    switch (key) {
      case 'syncEnabled':
      case 'syncStatusChecked':
        if (typeof value !== 'boolean') {
          errors.push(`${key} must be a boolean`);
        } else {
          sanitized[key] = value;
        }
        break;

      case 'syncId':
      case 'syncRecoveryPhrase':
      case 'syncStatus':
        if (value !== null && typeof value !== 'string') {
          errors.push(`${key} must be a string or null`);
        } else {
          sanitized[key] = value;
        }
        break;

      case 'lastSyncTime':
        if (value !== null && (typeof value !== 'number' || value < 0)) {
          errors.push(`${key} must be a positive number or null`);
        } else {
          sanitized[key] = value;
        }
        break;

      default:
        sanitized[key] = value;
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('; ')
    };
  }

  return {
    isValid: true,
    sanitized
  };
};

/**
 * Calculate sync retry delay
 * Implements exponential backoff for sync retry attempts
 *
 * @param {number} attemptCount - Current attempt number (1-based)
 * @param {number} baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} maxDelay - Maximum delay in milliseconds (default: 30000)
 * @returns {number} Delay in milliseconds
 */
export const calculateSyncRetryDelay = (attemptCount, baseDelay = 1000, maxDelay = 30000) => {
  if (typeof attemptCount !== 'number' || attemptCount < 1) {
    return baseDelay;
  }

  if (typeof baseDelay !== 'number' || baseDelay < 0) {
    baseDelay = 1000;
  }

  if (typeof maxDelay !== 'number' || maxDelay < baseDelay) {
    maxDelay = 30000;
  }

  // Exponential backoff: 2^(attempt-1) * baseDelay
  const delay = Math.pow(2, attemptCount - 1) * baseDelay;

  // Cap at maximum delay
  return Math.min(delay, maxDelay);
};

/**
 * Validate sync preview data
 * Checks sync preview data structure from SyncPreviewModal
 *
 * @param {Object} previewData - Preview data to validate
 * @returns {{isValid: boolean, error?: string, summary?: Object}} Validation result
 */
export const validateSyncPreviewData = (previewData) => {
  if (!previewData || typeof previewData !== 'object' || Array.isArray(previewData)) {
    return {
      isValid: false,
      error: 'Preview data is required'
    };
  }

  const errors = [];
  const summary = {
    totalUsers: 0,
    totalActivities: 0,
    totalLibraryItems: 0,
    hasValidStructure: false
  };

  // Check for users array
  if (previewData.users && Array.isArray(previewData.users)) {
    summary.totalUsers = previewData.users.length;

    previewData.users.forEach((user, index) => {
      if (!user.name || typeof user.name !== 'string') {
        errors.push(`User at index ${index} missing valid name`);
      }
      if (typeof user.activityCount === 'number' && user.activityCount >= 0) {
        summary.totalActivities += user.activityCount;
      }
    });
  }

  // Check for library items count
  if (typeof previewData.totalLibraryItems === 'number' && previewData.totalLibraryItems >= 0) {
    summary.totalLibraryItems = previewData.totalLibraryItems;
  }

  // Check for last updated timestamp
  if (previewData.lastUpdated) {
    const timestamp = new Date(previewData.lastUpdated).getTime();
    if (isNaN(timestamp)) {
      errors.push('Invalid lastUpdated timestamp');
    }
  }

  // Determine if structure is valid
  summary.hasValidStructure = summary.totalUsers > 0 || summary.totalLibraryItems > 0;

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('; '),
      summary
    };
  }

  if (!summary.hasValidStructure) {
    return {
      isValid: false,
      error: 'Preview data contains no importable content',
      summary
    };
  }

  return {
    isValid: true,
    summary
  };
};

/**
 * Sanitize sync error messages
 * Removes sensitive information from error messages
 *
 * @param {string} errorMessage - Raw error message
 * @returns {string} Sanitized error message
 */
export const sanitizeSyncErrorMessage = (errorMessage) => {
  if (typeof errorMessage !== 'string') {
    return 'Unknown sync error';
  }

  if (errorMessage.trim().length === 0) {
    return 'Sync operation failed';
  }

  // Remove potential sensitive information
  let sanitized = errorMessage
    // Remove recovery phrases (32-char hex strings)
    .replace(/\b[a-fA-F0-9]{32}\b/g, '[REDACTED_PHRASE]')
    // Remove sync IDs (15-16 char hex strings)
    .replace(/\b[a-fA-F0-9]{15,16}\b/g, '[REDACTED_ID]')
    // Remove API keys or tokens (longer than 16 chars)
    .replace(/\b[A-Za-z0-9]{17,}\b/g, '[REDACTED_TOKEN]')
    // Remove URLs but keep domain info
    .replace(/https?:\/\/[^\s]+/g, (match) => {
      try {
        const url = new URL(match);
        return `${url.protocol}//${url.hostname}[REDACTED_PATH]`;
      } catch {
        return '[REDACTED_URL]';
      }
    })
    // Handle any remaining malformed URLs or protocols
    .replace(/\bnot-a-valid-url\b/g, '[REDACTED_URL]');

  // Ensure message isn't empty after sanitization
  if (sanitized.trim().length === 0 || sanitized.trim() === '[REDACTED_PHRASE]') {
    return 'Sync operation failed';
  }

  return sanitized.trim();
};

/**
 * Validate device invite parameters
 * Checks parameters for device invite creation
 *
 * @param {Object} params - Invite parameters
 * @param {number} [params.expirationHours] - Hours until expiration
 * @param {number} [params.maxUses] - Maximum number of uses
 * @param {string} [params.description] - Invite description
 * @returns {{isValid: boolean, error?: string, normalized?: Object}} Validation result
 */
export const validateDeviceInviteParams = (params = {}) => {
  const normalized = {
    expirationHours: 24,
    maxUses: 5,
    description: 'Device invite'
  };

  const errors = [];

  // Validate expiration hours
  if (params.expirationHours !== undefined) {
    if (typeof params.expirationHours !== 'number' || params.expirationHours <= 0 || params.expirationHours > 8760) {
      errors.push('Expiration hours must be between 1 and 8760 (1 year)');
    } else {
      normalized.expirationHours = params.expirationHours;
    }
  }

  // Validate max uses
  if (params.maxUses !== undefined) {
    if (typeof params.maxUses !== 'number' || params.maxUses < 1 || params.maxUses > 100) {
      errors.push('Max uses must be between 1 and 100');
    } else {
      normalized.maxUses = Math.floor(params.maxUses);
    }
  }

  // Validate description
  if (params.description !== undefined) {
    if (typeof params.description !== 'string') {
      errors.push('Description must be a string');
    } else {
      const trimmed = params.description.trim();
      if (trimmed.length > 100) {
        errors.push('Description must be 100 characters or less');
      } else {
        normalized.description = trimmed || 'Device invite';
      }
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('; ')
    };
  }

  return {
    isValid: true,
    normalized
  };
};

/**
 * Check if sync operation is rate limited
 * Implements basic rate limiting for sync operations
 *
 * @param {Object} params - Rate limit parameters
 * @param {number} params.lastOperationTime - Timestamp of last operation
 * @param {number} [params.minIntervalMs] - Minimum interval between operations (default: 5000ms)
 * @param {string} [params.operationType] - Type of operation for specific limits
 * @returns {{isRateLimited: boolean, waitTimeMs?: number}} Rate limit result
 */
export const checkSyncOperationRateLimit = (params) => {
  const { lastOperationTime, minIntervalMs = 5000, operationType = 'default' } = params;

  if (typeof lastOperationTime !== 'number' || lastOperationTime <= 0) {
    return { isRateLimited: false };
  }

  // Different intervals for different operation types
  const intervals = {
    manual: 5000,      // 5 seconds between manual syncs
    enable: 10000,     // 10 seconds between enable attempts
    restore: 10000,    // 10 seconds between restore attempts
    disable: 2000,     // 2 seconds between disable attempts
    default: minIntervalMs
  };

  const interval = intervals[operationType] || intervals.default;
  const now = Date.now();
  const timeSinceLastOp = now - lastOperationTime;

  if (timeSinceLastOp < interval) {
    return {
      isRateLimited: true,
      waitTimeMs: interval - timeSinceLastOp
    };
  }

  return { isRateLimited: false };
};