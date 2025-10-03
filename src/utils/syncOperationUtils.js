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
    if (!trimmed.length) {
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

// Field type validators
const FIELD_VALIDATORS = {
  'syncEnabled': (value) => ({ valid: typeof value === 'boolean', error: 'must be a boolean' }),
  'syncStatusChecked': (value) => ({ valid: typeof value === 'boolean', error: 'must be a boolean' }),
  'syncId': (value) => ({ valid: value === null || typeof value === 'string', error: 'must be a string or null' }),
  'syncRecoveryPhrase': (value) => ({ valid: value === null || typeof value === 'string', error: 'must be a string or null' }),
  'syncStatus': (value) => ({ valid: value === null || typeof value === 'string', error: 'must be a string or null' }),
  'lastSyncTime': (value) => ({ valid: value === null || (typeof value === 'number' && value >= 0), error: 'must be a positive number or null' })
};

/**
 * Validate sync state update
 * Ensures sync state updates have valid structure
 *
 * @description Validates and sanitizes sync state update objects
 * @param {Object} stateUpdate - State update object
 * @returns {{isValid: boolean, error?: string, sanitized?: Object}} Validation result
 */
export const validateSyncStateUpdate = (stateUpdate) => {
  // Early return for invalid input
  if (!isValidStateUpdateObject(stateUpdate)) {
    return {
      isValid: false,
      error: 'State update must be an object'
    };
  }

  return validateAndSanitizeFields(stateUpdate);
};

/**
 * @description Check if state update is a valid object
 * @param {*} stateUpdate - Value to check
 * @returns {boolean} True if valid object
 * @private
 */
const isValidStateUpdateObject = (stateUpdate) => {
  return stateUpdate && typeof stateUpdate === 'object' && !Array.isArray(stateUpdate);
};

/**
 * @description Validate and sanitize state update fields
 * @param {Object} stateUpdate - State update to process
 * @returns {{isValid: boolean, error?: string, sanitized?: Object}} Result
 * @private
 */
const validateAndSanitizeFields = (stateUpdate) => {
  const sanitized = {};
  const errors = [];
  const validFields = Object.keys(FIELD_VALIDATORS);

  for (const [key, value] of Object.entries(stateUpdate)) {
    // Check if field is valid
    if (!validFields.includes(key)) {
      errors.push(`Invalid field: ${key}`);
      continue;
    }

    // Validate field value
    const validator = FIELD_VALIDATORS[key];
    const validation = validator(value);

    if (!validation.valid) {
      errors.push(`${key} ${validation.error}`);
    } else {
      sanitized[key] = value;
    }
  }

  // Return result based on errors
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

  if (errors.length) {
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

// Sanitization patterns for sensitive data
// NOTE: Order matters! More specific patterns (longer/stricter) must come first
const SANITIZATION_PATTERNS = [
  { pattern: /\b[a-fA-F0-9]{32}\b/g, replacement: '[REDACTED_PHRASE]' }, // Recovery phrases (32 chars hex)
  { pattern: /\b[a-fA-F0-9]{15,16}\b/g, replacement: '[REDACTED_ID]' }, // Sync IDs (15-16 chars hex)
  { pattern: /\bnot-a-valid-url\b/g, replacement: '[REDACTED_URL]' }, // Malformed URLs
  { pattern: /\b[A-Za-z0-9]{17,}\b/g, replacement: '[REDACTED_TOKEN]' } // API tokens (17+ alphanumeric) - must be last
];

/**
 * Sanitize sync error messages
 * Removes sensitive information from error messages
 *
 * @description Sanitizes error messages by removing sensitive data
 * @param {string} errorMessage - Raw error message
 * @returns {string} Sanitized error message
 */
export const sanitizeSyncErrorMessage = (errorMessage) => {
  // Handle invalid input
  if (!isValidErrorMessage(errorMessage)) {
    return getDefaultErrorMessage(errorMessage);
  }

  // Apply sanitization
  const sanitized = applySanitizationPatterns(errorMessage);

  // Validate result
  return validateSanitizedMessage(sanitized);
};

/**
 * @description Check if error message is valid string
 * @param {*} errorMessage - Message to validate
 * @returns {boolean} True if valid string with content
 * @private
 */
const isValidErrorMessage = (errorMessage) => {
  return typeof errorMessage === 'string' && errorMessage.trim().length > 0;
};

/**
 * @description Get default error message based on input type
 * @param {*} errorMessage - Original message
 * @returns {string} Default error message
 * @private
 */
const getDefaultErrorMessage = (errorMessage) => {
  if (typeof errorMessage !== 'string') {
    return 'Unknown sync error';
  }
  return 'Sync operation failed';
};

/**
 * @description Apply all sanitization patterns to message
 * @param {string} message - Message to sanitize
 * @returns {string} Sanitized message
 * @private
 */
const applySanitizationPatterns = (message) => {
  let sanitized = message;

  // Apply standard patterns
  for (const { pattern, replacement } of SANITIZATION_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }

  // Handle URLs specially
  sanitized = sanitizeUrls(sanitized);

  return sanitized;
};

/**
 * @description Sanitize URLs while preserving domain info
 * @param {string} message - Message containing URLs
 * @returns {string} Message with sanitized URLs
 * @private
 */
const sanitizeUrls = (message) => {
  return message.replace(/https?:\/\/[^\s]+/g, (match) => {
    try {
      const url = new URL(match);
      return `${url.protocol}//${url.hostname}[REDACTED_PATH]`;
    } catch {
      return '[REDACTED_URL]';
    }
  });
};

/**
 * @description Validate sanitized message has content
 * @param {string} sanitized - Sanitized message
 * @returns {string} Valid message or default
 * @private
 */
const validateSanitizedMessage = (sanitized) => {
  const trimmed = sanitized.trim();

  // Check if message is empty or only contains redaction tokens
  if (!trimmed.length ||
      trimmed === '[REDACTED_PHRASE]' ||
      trimmed === '[REDACTED_TOKEN]' ||
      trimmed === '[REDACTED_ID]') {
    return 'Sync operation failed';
  }

  return trimmed;
};

/**
 * Validate expiration hours parameter
 * @private
 */
const validateExpirationHours = (expirationHours, normalized, errors) => {
  if (expirationHours !== undefined) {
    if (typeof expirationHours !== 'number' || expirationHours <= 0 || expirationHours > 8760) {
      errors.push('Expiration hours must be between 1 and 8760 (1 year)');
    } else {
      normalized.expirationHours = expirationHours;
    }
  }
};

/**
 * Validate max uses parameter
 * @private
 */
const validateMaxUses = (maxUses, normalized, errors) => {
  if (maxUses !== undefined) {
    if (typeof maxUses !== 'number' || maxUses < 1 || maxUses > 100) {
      errors.push('Max uses must be between 1 and 100');
    } else {
      normalized.maxUses = Math.floor(maxUses);
    }
  }
};

/**
 * Validate description parameter
 * @private
 */
const validateDescription = (description, normalized, errors) => {
  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push('Description must be a string');
    } else {
      const trimmed = description.trim();
      if (trimmed.length > 100) {
        errors.push('Description must be 100 characters or less');
      } else {
        normalized.description = trimmed || 'Device invite';
      }
    }
  }
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

  validateExpirationHours(params.expirationHours, normalized, errors);
  validateMaxUses(params.maxUses, normalized, errors);
  validateDescription(params.description, normalized, errors);

  if (errors.length) {
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

// Rate limit intervals for different operation types (in milliseconds)
const RATE_LIMIT_INTERVALS = {
  manual: 5000,      // 5 seconds between manual syncs
  enable: 10000,     // 10 seconds between enable attempts
  restore: 10000,    // 10 seconds between restore attempts
  disable: 2000,     // 2 seconds between disable attempts
  default: 5000      // Default interval
};

/**
 * Check if sync operation is rate limited
 * Implements basic rate limiting for sync operations
 *
 * @description Checks if sufficient time has passed since last operation
 * @param {Object} params - Rate limit parameters
 * @param {number} params.lastOperationTime - Timestamp of last operation
 * @param {number} [params.minIntervalMs] - Minimum interval between operations (default: 5000ms)
 * @param {string} [params.operationType] - Type of operation for specific limits
 * @returns {{isRateLimited: boolean, waitTimeMs?: number}} Rate limit result
 */
export const checkSyncOperationRateLimit = (params) => {
  const { lastOperationTime, minIntervalMs = 5000, operationType = 'default' } = params;

  // Early return for invalid timestamp
  if (!isValidTimestamp(lastOperationTime)) {
    return { isRateLimited: false };
  }

  // Calculate time since last operation
  const timeSinceLastOp = calculateTimeSince(lastOperationTime);

  // Handle time anomalies
  if (timeSinceLastOp < 0) {
    return { isRateLimited: false };
  }

  // Check against interval
  const interval = getIntervalForOperation(operationType, minIntervalMs);
  return checkAgainstInterval(timeSinceLastOp, interval);
};

/**
 * @description Validate timestamp
 * @param {*} timestamp - Timestamp to validate
 * @returns {boolean} True if valid timestamp
 * @private
 */
const isValidTimestamp = (timestamp) => {
  return typeof timestamp === 'number' && timestamp > 0;
};

/**
 * @description Calculate time since given timestamp
 * @param {number} timestamp - Past timestamp
 * @returns {number} Milliseconds since timestamp
 * @private
 */
const calculateTimeSince = (timestamp) => {
  return Date.now() - timestamp;
};

/**
 * @description Get interval for operation type
 * @param {string} operationType - Type of operation
 * @param {number} customInterval - Custom interval if default not found
 * @returns {number} Interval in milliseconds
 * @private
 */
const getIntervalForOperation = (operationType, customInterval) => {
  // Use custom interval if provided and operation type is default or unknown
  if (customInterval && (operationType === 'default' || !RATE_LIMIT_INTERVALS[operationType])) {
    return customInterval;
  }
  return RATE_LIMIT_INTERVALS[operationType] || RATE_LIMIT_INTERVALS.default;
};

/**
 * @description Check if time is within rate limit interval
 * @param {number} timeSince - Time since last operation
 * @param {number} interval - Required interval
 * @returns {{isRateLimited: boolean, waitTimeMs?: number}} Result
 * @private
 */
const checkAgainstInterval = (timeSince, interval) => {
  if (timeSince < interval) {
    return {
      isRateLimited: true,
      waitTimeMs: interval - timeSince
    };
  }
  return { isRateLimited: false };
};