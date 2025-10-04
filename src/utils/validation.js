/**
 * Validation utilities for sanitizing user input and preventing XSS attacks
 */

/**
 * Sanitize a string by removing potential XSS vectors
 * @param {string} str - The string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
export function sanitizeString(str, maxLength = 100) {
  if (typeof str !== 'string') return '';

  // Remove HTML tags and script content
  let sanitized = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]+>/g, '');

  // Remove dangerous characters and patterns
  sanitized = sanitized.replace(/[<>\"'`]/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

/**
 * Sanitize emoji input
 * @param {string} emoji - The emoji to validate
 * @returns {string} Valid emoji or default
 */
export function sanitizeEmoji(emoji) {
  if (!emoji || typeof emoji !== 'string') return '👤';

  // Check if it's a valid emoji (basic check)
  const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\p{Emoji_Component})+$/u;

  // Take only first few characters to prevent long strings
  const trimmed = emoji.substring(0, 4);

  // Return validated emoji or default
  return emojiRegex.test(trimmed) ? trimmed : '👤';
}

/**
 * Sanitize user ID to prevent injection
 * @param {string} id - The user ID to validate
 * @returns {string} Sanitized ID
 */
export function sanitizeUserId(id) {
  if (!id || typeof id !== 'string') return '';

  // Allow only alphanumeric, underscore, and hyphen
  return id.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50);
}

/**
 * Sanitize a complete user object
 * @param {Object} user - The user object to sanitize
 * @returns {Object} Sanitized user object
 */
export function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return null;

  return {
    id: sanitizeUserId(user.id || ''),
    name: sanitizeString(user.name || '', 50),
    icon: sanitizeEmoji(user.icon || user.emoji || '👤'),
    emoji: sanitizeEmoji(user.emoji || user.icon || '👤'),
    activities: user.activities || {},
    settings: user.settings || {}
  };
}

/**
 * Sanitize a users object (multiple users)
 * @param {Object} users - Object containing multiple users
 * @returns {Object} Sanitized users object
 */
export function sanitizeUsers(users) {
  if (!users || typeof users !== 'object') return {};

  const sanitized = {};

  for (const [key, user] of Object.entries(users)) {
    const sanitizedKey = sanitizeUserId(key);
    const sanitizedUser = sanitizeUser(user);

    if (sanitizedKey && sanitizedUser) {
      sanitized[sanitizedKey] = sanitizedUser;
    }
  }

  return sanitized;
}