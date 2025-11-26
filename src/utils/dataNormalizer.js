// @ts-check
/**
 * Data normalizer utility to ensure consistent field naming across sync
 * Critical for preventing sync inconsistencies
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
 * Assign sortIndex to library activities that don't have one.
 * For migration: activities without sortIndex get their array position.
 * Activities without sortIndexModifiedAt are treated as timestamp 0 (lowest priority).
 */
const normalizeActivitySortIndexes = (activities) => {
  if (!activities || !Array.isArray(activities)) return;

  activities.forEach((activity, index) => {
    // Only assign sortIndex if it's missing (don't overwrite existing)
    if (typeof activity.sortIndex !== 'number') {
      activity.sortIndex = index;
      // No sortIndexModifiedAt means this is migrated data (treated as 0 in conflict resolution)
    }
  });
};


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


const extractNameFromObject = (nameObj) => {
  if (nameObj.name && typeof nameObj.name === 'string') {
    return nameObj.name;
  }

  if (nameObj.text && typeof nameObj.text === 'string') {
    return nameObj.text;
  }

  return 'User';
};


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
          // Ensure sortIndex is assigned to activities for sync ordering
          normalizeActivitySortIndexes(category.activities);
        }
      });
    } else if (typeof normalized.library.categories === 'object') {
      // Categories is an object, normalize values
      Object.keys(normalized.library.categories).forEach(categoryId => {
        const category = normalized.library.categories[categoryId];
        if (category && category.activities && Array.isArray(category.activities)) {
          category.activities = category.activities.map(normalizeActivity);
          // Ensure sortIndex is assigned to activities for sync ordering
          normalizeActivitySortIndexes(category.activities);
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


const userNeedsNormalization = (user) => {
  if (!user) return false;
  return user.emoji || (user.name && typeof user.name === 'object');
};


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


const activitiesArrayNeedsNormalization = (activities) => {
  return activities.some(activity =>
    activity.name || activity.title || activity.emoji
  );
};