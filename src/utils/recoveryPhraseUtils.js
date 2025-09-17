// @ts-check

/**
 * Pure business logic functions for recovery phrase and clipboard operations
 * Extracted from RecoveryPhrase and DataModal components
 */

/**
 * Generate a cryptographically secure random recovery phrase
 * Creates a 32-character hexadecimal string
 *
 * @returns {string} 32-character hex recovery phrase
 */
export const generateRecoveryPhrase = () => {
  const chars = '0123456789abcdef';
  let result = '';

  // Require crypto.getRandomValues for security
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16); // 16 bytes = 32 hex chars
    crypto.getRandomValues(array);

    for (let i = 0; i < array.length; i++) {
      result += chars[Math.floor(array[i] / 16)];
      result += chars[array[i] % 16];
    }
  } else {
    // No fallback - crypto is required for secure recovery phrases
    throw new Error('Crypto API not available. Recovery phrase generation requires a secure random number generator.');
  }

  return result;
};

/**
 * Validate if a string is a valid recovery phrase format
 * Checks for exact 32-character hexadecimal string
 *
 * @param {string} phrase - The phrase to validate
 * @returns {{isValid: boolean, error?: string}} Validation result
 */
export const isValidRecoveryPhrase = (phrase) => {
  if (!phrase || typeof phrase !== 'string') {
    return { isValid: false, error: 'Recovery phrase is required' };
  }

  const trimmed = phrase.trim();

  // Check hexadecimal first to catch invalid characters regardless of length
  const hexRegex = /^[a-fA-F0-9]+$/;
  if (!hexRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Recovery phrase must contain only hexadecimal characters (0-9, a-f)'
    };
  }

  if (trimmed.length !== 32) {
    return {
      isValid: false,
      error: 'Recovery phrase must be exactly 32 characters'
    };
  }

  return { isValid: true };
};

/**
 * Extract sync key parts from device invite URL
 * Parses URL format: https://stackmap.app/sync/invite123#recoveryPhrase
 *
 * @param {string} syncKeyOrUrl - Either a URL or just the key portion
 * @returns {{keyOnly?: string, fullUrl?: string, inviteCode?: string, recoveryPhrase?: string} | null}
 */
export const parseSyncKey = (syncKeyOrUrl) => {
  if (!syncKeyOrUrl || typeof syncKeyOrUrl !== 'string') {
    return null;
  }

  const trimmed = syncKeyOrUrl.trim();

  // Check if it's a URL format
  if (trimmed.startsWith('http')) {
    const urlParts = trimmed.split('#');
    if (urlParts.length === 2) {
      const baseUrl = urlParts[0];
      const recoveryPhrase = urlParts[1];
      const inviteCode = baseUrl.split('/').pop();

      // Validate the recovery phrase portion
      if (!isValidRecoveryPhrase(recoveryPhrase).isValid) {
        return null;
      }

      return {
        keyOnly: `${inviteCode}#${recoveryPhrase}`,
        fullUrl: trimmed,
        inviteCode,
        recoveryPhrase
      };
    }
  }

  // Check if it's a key-only format (inviteCode#recoveryPhrase)
  const keyParts = trimmed.split('#');
  if (keyParts.length === 2) {
    const [inviteCode, recoveryPhrase] = keyParts;

    // Validate the recovery phrase portion
    if (!isValidRecoveryPhrase(recoveryPhrase).isValid) {
      return null;
    }

    return {
      keyOnly: trimmed,
      fullUrl: null,
      inviteCode,
      recoveryPhrase
    };
  }

  // Single string might be just a recovery phrase
  if (isValidRecoveryPhrase(trimmed).isValid) {
    return {
      keyOnly: trimmed,
      fullUrl: null,
      inviteCode: null,
      recoveryPhrase: trimmed
    };
  }

  return null;
};

/**
 * Format recovery phrase for display with proper spacing
 * Adds spaces every 8 characters for readability
 *
 * @param {string} phrase - The recovery phrase to format
 * @returns {string} Formatted phrase with spaces
 */
export const formatRecoveryPhraseDisplay = (phrase) => {
  if (!phrase || typeof phrase !== 'string') {
    return '';
  }

  const cleaned = phrase.replace(/\s/g, ''); // Remove existing spaces

  if (cleaned.length !== 32) {
    return phrase; // Return as-is if not 32 chars
  }

  // Add space every 8 characters
  return cleaned.match(/.{1,8}/g)?.join(' ') || phrase;
};

/**
 * Create device invite URL from recovery phrase and invite code
 * Constructs the full URL format for sharing
 *
 * @param {string} recoveryPhrase - The recovery phrase
 * @param {string} inviteCode - The temporary invite code
 * @param {string} baseUrl - Base URL (defaults to stackmap.app)
 * @returns {string} Complete invite URL
 */
export const createInviteUrl = (recoveryPhrase, inviteCode, baseUrl = 'https://stackmap.app') => {
  if (!recoveryPhrase || !inviteCode) {
    throw new Error('Recovery phrase and invite code are required');
  }

  const validation = isValidRecoveryPhrase(recoveryPhrase);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return `${baseUrl}/sync/${inviteCode}#${recoveryPhrase}`;
};

/**
 * Validate clipboard content for sync operations
 * Checks if clipboard content is a valid sync key or URL
 *
 * @param {string} content - Clipboard content to validate
 * @returns {{isValid: boolean, type: 'url' | 'key' | 'phrase' | 'invalid', error?: string}}
 */
export const validateClipboardSyncContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { isValid: false, type: 'invalid', error: 'No content provided' };
  }

  const trimmed = content.trim();

  // Check if it's a URL
  if (trimmed.startsWith('http')) {
    const parsed = parseSyncKey(trimmed);
    if (parsed && parsed.recoveryPhrase) {
      const phraseValidation = isValidRecoveryPhrase(parsed.recoveryPhrase);
      if (phraseValidation.isValid) {
        return { isValid: true, type: 'url' };
      } else {
        return { isValid: false, type: 'invalid', error: phraseValidation.error };
      }
    } else {
      return { isValid: false, type: 'invalid', error: 'Invalid invite URL format' };
    }
  }

  // Check if it's a key format (inviteCode#phrase)
  if (trimmed.includes('#')) {
    const parsed = parseSyncKey(trimmed);
    if (parsed && parsed.recoveryPhrase) {
      const phraseValidation = isValidRecoveryPhrase(parsed.recoveryPhrase);
      if (phraseValidation.isValid) {
        return { isValid: true, type: 'key' };
      } else {
        return { isValid: false, type: 'invalid', error: phraseValidation.error };
      }
    } else {
      return { isValid: false, type: 'invalid', error: 'Invalid key format' };
    }
  }

  // Check if it's just a recovery phrase
  const phraseValidation = isValidRecoveryPhrase(trimmed);
  if (phraseValidation.isValid) {
    return { isValid: true, type: 'phrase' };
  }

  return {
    isValid: false,
    type: 'invalid',
    error: 'Content is not a valid sync key, URL, or recovery phrase'
  };
};

/**
 * Extract recovery phrase from any valid sync content
 * Handles URLs, keys, or direct phrases
 *
 * @param {string} content - The content to extract from
 * @returns {string | null} The recovery phrase or null if invalid
 */
export const extractRecoveryPhrase = (content) => {
  const validation = validateClipboardSyncContent(content);
  if (!validation.isValid) {
    return null;
  }

  const parsed = parseSyncKey(content);
  return parsed ? parsed.recoveryPhrase : null;
};

/**
 * Generate secure device invite code
 * Creates a random alphanumeric code for temporary device access
 *
 * @param {number} length - Length of the invite code (default: 8)
 * @returns {string} Random invite code
 */
export const generateInviteCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // No fallback - crypto is required for secure invite codes
    throw new Error('Crypto API not available. Invite code generation requires a secure random number generator.');
  }

  return result;
};

/**
 * Calculate expiration time for invite codes
 * Returns timestamp for when an invite should expire
 *
 * @param {number} hoursFromNow - Hours until expiration
 * @returns {number} Expiration timestamp in milliseconds
 */
export const calculateInviteExpiration = (hoursFromNow = 24) => {
  if (typeof hoursFromNow !== 'number' || hoursFromNow <= 0) {
    throw new Error('Hours must be a positive number');
  }

  return Date.now() + (hoursFromNow * 60 * 60 * 1000);
};

/**
 * Check if an invite has expired
 * Compares current time with expiration timestamp
 *
 * @param {number} expirationTimestamp - When the invite expires
 * @returns {boolean} True if expired
 */
export const isInviteExpired = (expirationTimestamp) => {
  if (typeof expirationTimestamp !== 'number') {
    return true; // Treat invalid timestamps as expired
  }

  return Date.now() > expirationTimestamp;
};

/**
 * Format remaining time until expiration
 * Returns human-readable time remaining
 *
 * @param {number} expirationTimestamp - When the invite expires
 * @returns {string} Time remaining or "Expired"
 */
export const formatTimeUntilExpiration = (expirationTimestamp) => {
  if (typeof expirationTimestamp !== 'number') {
    return 'Invalid expiration';
  }

  const now = Date.now();
  if (now >= expirationTimestamp) {
    return 'Expired';
  }

  const diff = expirationTimestamp - now;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
};