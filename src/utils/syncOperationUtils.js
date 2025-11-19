// @ts-check

/**
 * Pure business logic functions for sync operations
 * Extracted from syncUtils.js and related modal components
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


const isValidStateUpdateObject = (stateUpdate) => {
  return stateUpdate && typeof stateUpdate === 'object' && !Array.isArray(stateUpdate);
};


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


const isValidErrorMessage = (errorMessage) => {
  return typeof errorMessage === 'string' && errorMessage.trim().length > 0;
};


const getDefaultErrorMessage = (errorMessage) => {
  if (typeof errorMessage !== 'string') {
    return 'Unknown sync error';
  }
  return 'Sync operation failed';
};


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


const validateExpirationHours = (expirationHours, normalized, errors) => {
  if (expirationHours !== undefined) {
    if (typeof expirationHours !== 'number' || expirationHours <= 0 || expirationHours > 8760) {
      errors.push('Expiration hours must be between 1 and 8760 (1 year)');
    } else {
      normalized.expirationHours = expirationHours;
    }
  }
};


const validateMaxUses = (maxUses, normalized, errors) => {
  if (maxUses !== undefined) {
    if (typeof maxUses !== 'number' || maxUses < 1 || maxUses > 100) {
      errors.push('Max uses must be between 1 and 100');
    } else {
      normalized.maxUses = Math.floor(maxUses);
    }
  }
};


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


const isValidTimestamp = (timestamp) => {
  return typeof timestamp === 'number' && timestamp > 0;
};


const calculateTimeSince = (timestamp) => {
  return Date.now() - timestamp;
};


const getIntervalForOperation = (operationType, customInterval) => {
  // Use custom interval if provided and operation type is default or unknown
  if (customInterval && (operationType === 'default' || !RATE_LIMIT_INTERVALS[operationType])) {
    return customInterval;
  }
  return RATE_LIMIT_INTERVALS[operationType] || RATE_LIMIT_INTERVALS.default;
};


const checkAgainstInterval = (timeSince, interval) => {
  if (timeSince < interval) {
    return {
      isRateLimited: true,
      waitTimeMs: interval - timeSince
    };
  }
  return { isRateLimited: false };
};