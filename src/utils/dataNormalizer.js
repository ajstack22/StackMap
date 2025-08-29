// @ts-check
/**
 * Data normalizer utility to ensure consistent field naming across sync
 * Critical for preventing sync inconsistencies
 */

/**
 * Normalize activity fields to use standard naming
 * Activities should use 'text' and 'icon' (not 'name', 'title', or 'emoji')
 */
export const normalizeActivity = (activity) => {
  if (!activity) return activity;
  
  const normalized = { ...activity };
  
  // Normalize text field (prefer text > name > title)
  if (!normalized.text) {
    if (normalized.name) {
      normalized.text = normalized.name;
      delete normalized.name;
    } else if (normalized.title) {
      normalized.text = normalized.title;
      delete normalized.title;
    }
  }
  
  // Normalize icon field (prefer icon > emoji)
  if (!normalized.icon) {
    if (normalized.emoji) {
      normalized.icon = normalized.emoji;
      delete normalized.emoji;
    }
  } else if (normalized.emoji) {
    // Remove redundant emoji field if icon exists
    delete normalized.emoji;
  }
  
  return normalized;
};

/**
 * Normalize user fields to use standard naming
 * Users should use 'name' (string) and 'icon' (not 'emoji')
 */
export const normalizeUser = (user) => {
  if (!user) return user;
  
  const normalized = { ...user };
  
  // Ensure name is a string
  if (normalized.name && typeof normalized.name === 'object') {
    // Try to extract string from object
    if (normalized.name.name && typeof normalized.name.name === 'string') {
      normalized.name = normalized.name.name;
    } else if (normalized.name.text && typeof normalized.name.text === 'string') {
      normalized.name = normalized.name.text;
    } else {
      normalized.name = 'User';
    }
  } else if (!normalized.name || typeof normalized.name !== 'string') {
    normalized.name = 'User';
  }
  
  // Normalize icon field (prefer icon > emoji)
  if (!normalized.icon) {
    if (normalized.emoji) {
      normalized.icon = normalized.emoji;
      delete normalized.emoji;
    } else {
      normalized.icon = '👤';
    }
  } else if (normalized.emoji) {
    // Remove redundant emoji field if icon exists
    delete normalized.emoji;
  }
  
  // Normalize days if present
  if (normalized.days) {
    Object.keys(normalized.days).forEach(dayKey => {
      const day = normalized.days[dayKey];
      if (day && day.activities && Array.isArray(day.activities)) {
        day.activities = day.activities.map(normalizeActivity);
      }
    });
  }
  
  return normalized;
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
 */
export const needsNormalization = (data) => {
  if (!data) return false;
  
  // Check users for old field names
  if (data.users) {
    for (const userId in data.users) {
      const user = data.users[userId];
      if (user.emoji || (user.name && typeof user.name === 'object')) {
        return true;
      }
      
      // Check user activities
      if (user.days) {
        for (const dayKey in user.days) {
          const day = user.days[dayKey];
          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              if (activity.name || activity.title || activity.emoji) {
                return true;
              }
            }
          }
        }
      }
    }
  }
  
  // Check library activities
  if (data.library && data.library.categories) {
    // Handle both array and object formats
    if (Array.isArray(data.library.categories)) {
      for (const category of data.library.categories) {
        if (category.activities && Array.isArray(category.activities)) {
          for (const activity of category.activities) {
            if (activity.name || activity.title || activity.emoji) {
              return true;
            }
          }
        }
      }
    } else if (typeof data.library.categories === 'object') {
      // Categories is an object
      for (const categoryId in data.library.categories) {
        const category = data.library.categories[categoryId];
        if (category && category.activities && Array.isArray(category.activities)) {
          for (const activity of category.activities) {
            if (activity.name || activity.title || activity.emoji) {
              return true;
            }
          }
        }
      }
    }
  }
  
  // Also check library.activities if it exists
  if (data.library && data.library.activities && Array.isArray(data.library.activities)) {
    for (const activity of data.library.activities) {
      if (activity.name || activity.title || activity.emoji) {
        return true;
      }
    }
  }
  
  return false;
};