/**
 * Field accessor utilities for consistent data access patterns
 *
 * These helpers provide a single source of truth for accessing fields
 * with fallback chains, preventing bugs from inconsistent field access.
 *
 * Based on patterns established in src/utils/dataNormalizer.js
 */

/**
 * Get activity text field with fallback chain
 * Activities should use 'text' as primary field, but historically
 * used 'name' or 'title'. This helper ensures consistent access.
 *
 * @param {Object} activity - Activity object
 * @returns {string} Activity text or empty string
 */
export const getActivityText = (activity) => {
  if (!activity) return '';
  return activity.text || activity.name || activity.title || '';
};

/**
 * Get activity icon with fallback chain
 * Activities should use 'icon' as primary field, but historically
 * used 'emoji'. This helper ensures consistent access.
 *
 * @param {Object} activity - Activity object
 * @returns {string} Activity icon/emoji or default
 */
export const getActivityIcon = (activity) => {
  if (!activity) return '🎯';
  return activity.icon || activity.emoji || '🎯';
};

/**
 * Get user icon with fallback chain
 * Users should use 'icon' as primary field, but historically
 * used 'emoji'. This helper ensures consistent access.
 *
 * @param {Object} user - User object
 * @returns {string} User icon/emoji or default
 */
export const getUserIcon = (user) => {
  if (!user) return '👤';
  return user.icon || user.emoji || '👤';
};

/**
 * Get user name
 * Users store name as string (not object like old migrations)
 *
 * @param {Object} user - User object
 * @returns {string} User name or empty string
 */
export const getUserName = (user) => {
  if (!user) return '';
  // Handle legacy object format from old migrations
  if (typeof user.name === 'object' && user.name?.text) {
    return user.name.text;
  }
  return user.name || '';
};

/**
 * Normalize activity object to standard format
 * Ensures 'text' and 'icon' fields are populated correctly
 *
 * @param {Object} activity - Activity object
 * @returns {Object} Normalized activity with text and icon fields
 */
export const normalizeActivity = (activity) => {
  if (!activity) return null;

  return {
    ...activity,
    text: getActivityText(activity),
    icon: getActivityIcon(activity),
  };
};

/**
 * Normalize user object to standard format
 * Ensures 'name' and 'icon' fields are populated correctly
 *
 * @param {Object} user - User object
 * @returns {Object} Normalized user with name and icon fields
 */
export const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    name: getUserName(user),
    icon: getUserIcon(user),
  };
};
