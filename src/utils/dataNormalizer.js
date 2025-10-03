// @ts-check
/**
 * Data normalizer utility to ensure consistent field naming across sync
 * Critical for preventing sync inconsistencies
 */

/**
 * Normalize activity fields to use standard naming
 * Activities should use 'text' and 'icon' (not 'name', 'title', or 'emoji')
 *
 * @description Normalizes activity fields to standardized names (text/icon)
 * @param {Object} activity - Activity object to normalize
 * @returns {Object} Normalized activity with standard field names
 */
export const normalizeActivity = (activity) => {
  if (!activity) return activity;

  const normalized = { ...activity };

  // Normalize text field using helper function
  normalizeActivityTextField(normalized);

  // Normalize icon field using helper function
  normalizeActivityIconField(normalized);

  return normalized;
};

/**
 * @description Helper to normalize activity text field
 * @param {Object} activity - Activity object to modify
 * @private
 */
const normalizeActivityTextField = (activity) => {
  // Early return if text already exists
  if (activity.text) return;

  // Prefer 'name' over 'title'
  if (activity.name) {
    activity.text = activity.name;
    delete activity.name;
    return;
  }

  if (activity.title) {
    activity.text = activity.title;
    delete activity.title;
  }
};

/**
 * @description Helper to normalize activity icon field
 * @param {Object} activity - Activity object to modify
 * @private
 */
const normalizeActivityIconField = (activity) => {
  // Handle icon field normalization
  if (!activity.icon && activity.emoji) {
    activity.icon = activity.emoji;
  }

  // Remove redundant emoji field if it exists
  if (activity.emoji) {
    delete activity.emoji;
  }
};

/**
 * Normalize user fields to use standard naming
 * Users should use 'name' (string) and 'icon' (not 'emoji')
 *
 * @description Normalizes user fields to standardized format
 * @param {Object} user - User object to normalize
 * @returns {Object} Normalized user with standard field names
 */
export const normalizeUser = (user) => {
  if (!user) return user;

  const normalized = { ...user };

  // Normalize name field using helper
  normalizeUserNameField(normalized);

  // Normalize icon field using helper
  normalizeUserIconField(normalized);

  // Normalize days if present
  normalizeUserDays(normalized);

  return normalized;
};

/**
 * @description Helper to normalize user name field to string
 * @param {Object} user - User object to modify
 * @private
 */
const normalizeUserNameField = (user) => {
  // Handle object type name field
  if (user.name && typeof user.name === 'object') {
    user.name = extractNameFromObject(user.name);
    return;
  }

  // Ensure name is a string
  if (!user.name || typeof user.name !== 'string') {
    user.name = 'User';
  }
};

/**
 * @description Extract string name from object
 * @param {Object} nameObj - Object containing name data
 * @returns {string} Extracted name or default
 * @private
 */
const extractNameFromObject = (nameObj) => {
  if (nameObj.name && typeof nameObj.name === 'string') {
    return nameObj.name;
  }

  if (nameObj.text && typeof nameObj.text === 'string') {
    return nameObj.text;
  }

  return 'User';
};

/**
 * @description Helper to normalize user icon field
 * @param {Object} user - User object to modify
 * @private
 */
const normalizeUserIconField = (user) => {
  // Set icon from emoji if not present
  if (!user.icon) {
    user.icon = user.emoji || '👤';
  }

  // Clean up redundant emoji field
  if (user.emoji) {
    delete user.emoji;
  }
};

/**
 * @description Helper to normalize user days and activities
 * @param {Object} user - User object to modify
 * @private
 */
const normalizeUserDays = (user) => {
  if (!user.days) return;

  Object.keys(user.days).forEach(dayKey => {
    const day = user.days[dayKey];
    if (!day || !day.activities || !Array.isArray(day.activities)) return;

    day.activities = day.activities.map(normalizeActivity);
  });
};

/**
 * Normalize entire sync data structure
 */
export const normalizeSyncData = (data) => {
  if (!data) return data;
  
  const normalized = { ...data };
  
  // Normalize users
  if (normalized.users && typeof normalized.users === 'object') {
    Object.keys(normalized.users).forEach(userId => {
      normalized.users[userId] = normalizeUser(normalized.users[userId]);
    });
  }
  
  // Normalize library activities
  if (normalized.library && normalized.library.categories) {
    // Handle both array and object formats
    if (Array.isArray(normalized.library.categories)) {
      normalized.library.categories.forEach(category => {
        if (category.activities && Array.isArray(category.activities)) {
          category.activities = category.activities.map(normalizeActivity);
        }
      });
    } else if (typeof normalized.library.categories === 'object') {
      // Categories is an object, normalize values
      Object.keys(normalized.library.categories).forEach(categoryId => {
        const category = normalized.library.categories[categoryId];
        if (category && category.activities && Array.isArray(category.activities)) {
          category.activities = category.activities.map(normalizeActivity);
        }
      });
    }
  }
  
  // Also normalize library.activities if it exists (different structure)
  if (normalized.library && normalized.library.activities && Array.isArray(normalized.library.activities)) {
    normalized.library.activities = normalized.library.activities.map(normalizeActivity);
  }
  
  // Normalize library templates
  if (normalized.libraryTemplates && Array.isArray(normalized.libraryTemplates)) {
    normalized.libraryTemplates = normalized.libraryTemplates.map(normalizeActivity);
  }
  
  // Normalize current activities array (legacy)
  if (normalized.activities && Array.isArray(normalized.activities)) {
    normalized.activities = normalized.activities.map(normalizeActivity);
  }
  
  return normalized;
};

/**
 * Check if data needs normalization
 *
 * @description Checks if sync data contains old field names that need normalization
 * @param {Object} data - Data object to check
 * @returns {boolean} True if normalization is needed
 */
export const needsNormalization = (data) => {
  if (!data) return false;

  // Check users section
  if (checkUsersNeedNormalization(data.users)) {
    return true;
  }

  // Check library section
  if (checkLibraryNeedsNormalization(data.library)) {
    return true;
  }

  return false;
};

/**
 * @description Check if users section needs normalization
 * @param {Object} users - Users object to check
 * @returns {boolean} True if normalization needed
 * @private
 */
const checkUsersNeedNormalization = (users) => {
  if (!users) return false;

  for (const userId in users) {
    const user = users[userId];

    // Check user fields
    if (userNeedsNormalization(user)) {
      return true;
    }

    // Check user activities
    if (userActivitiesNeedNormalization(user.days)) {
      return true;
    }
  }

  return false;
};

/**
 * @description Check if individual user needs normalization
 * @param {Object} user - User object to check
 * @returns {boolean} True if user has old field names
 * @private
 */
const userNeedsNormalization = (user) => {
  if (!user) return false;
  return user.emoji || (user.name && typeof user.name === 'object');
};

/**
 * @description Check if user activities need normalization
 * @param {Object} days - Days object containing activities
 * @returns {boolean} True if activities have old field names
 * @private
 */
const userActivitiesNeedNormalization = (days) => {
  if (!days) return false;

  for (const dayKey in days) {
    const day = days[dayKey];
    if (!day.activities || !Array.isArray(day.activities)) continue;

    if (activitiesArrayNeedsNormalization(day.activities)) {
      return true;
    }
  }

  return false;
};

/**
 * @description Check if library needs normalization
 * @param {Object} library - Library object to check
 * @returns {boolean} True if normalization needed
 * @private
 */
const checkLibraryNeedsNormalization = (library) => {
  if (!library) return false;

  // Check library.categories
  if (library.categories) {
    if (categoriesNeedNormalization(library.categories)) {
      return true;
    }
  }

  // Check library.activities
  if (library.activities && Array.isArray(library.activities)) {
    if (activitiesArrayNeedsNormalization(library.activities)) {
      return true;
    }
  }

  return false;
};

/**
 * @description Check if categories need normalization
 * @param {Object|Array} categories - Categories to check
 * @returns {boolean} True if normalization needed
 * @private
 */
const categoriesNeedNormalization = (categories) => {
  // Handle array format
  if (Array.isArray(categories)) {
    return categories.some(category =>
      category.activities &&
      Array.isArray(category.activities) &&
      activitiesArrayNeedsNormalization(category.activities)
    );
  }

  // Handle object format
  if (typeof categories === 'object') {
    for (const categoryId in categories) {
      const category = categories[categoryId];
      if (!category || !category.activities || !Array.isArray(category.activities)) continue;

      if (activitiesArrayNeedsNormalization(category.activities)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * @description Check if activities array needs normalization
 * @param {Array} activities - Activities array to check
 * @returns {boolean} True if any activity has old field names
 * @private
 */
const activitiesArrayNeedsNormalization = (activities) => {
  return activities.some(activity =>
    activity.name || activity.title || activity.emoji
  );
};