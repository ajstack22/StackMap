// @ts-check
/**
 * Data normalization utilities to ensure consistent field naming
 * across the application, handling historical variations.
 */

/**
 * Normalize an activity object to use consistent field names
 * @param {Object} activity - Raw activity object
 * @returns {Object} Normalized activity
 */
export const normalizeActivity = (activity) => {
  if (!activity || typeof activity !== 'object') return null;
  
  // Normalize text field (from name/title)
  const text = activity.text || activity.name || activity.title || 'Untitled';
  
  // Normalize icon field (from emoji)
  const icon = activity.icon || activity.emoji || '';
  
  // Build normalized activity with only valid fields
  const normalized = {
    id: activity.id || `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    icon,
    completed: activity.completed === true,
    pinned: activity.pinned === true
  };
  
  // Add optional fields if they exist
  if (activity.order !== undefined) normalized.order = activity.order;
  if (activity.completedAt) normalized.completedAt = activity.completedAt;
  if (activity.completedBy) normalized.completedBy = activity.completedBy;
  if (activity.uncompletedAt) normalized.uncompletedAt = activity.uncompletedAt;
  if (activity.uncompletedBy) normalized.uncompletedBy = activity.uncompletedBy;
  if (activity.description) normalized.description = activity.description;
  
  return normalized;
};

/**
 * Normalize a user object to use consistent field names
 * @param {Object} user - Raw user object
 * @returns {Object} Normalized user
 */
export const normalizeUser = (user) => {
  if (!user || typeof user !== 'object') return null;
  
  // Normalize name field
  let name = user.name;
  if (!name || typeof name !== 'string') {
    if (typeof name === 'object' && name !== null) {
      name = name.name || name.text || name.value || 'User';
    } else {
      name = 'User';
    }
  }
  
  // Normalize icon field (from emoji)
  const icon = user.icon || user.emoji || '👤';
  
  // Normalize days with activities
  const days = {};
  if (user.days && typeof user.days === 'object') {
    Object.entries(user.days).forEach(([dayKey, dayData]) => {
      if (dayData && typeof dayData === 'object') {
        days[dayKey] = {
          ...dayData,
          activities: Array.isArray(dayData.activities) 
            ? dayData.activities.map(normalizeActivity).filter(Boolean)
            : []
        };
      }
    });
  }
  
  // Build clean user object without redundant fields
  const cleanUser = {
    name,
    icon,
    days
  };
  
  // Copy over other valid fields (except emoji)
  Object.keys(user).forEach(key => {
    if (key !== 'emoji' && key !== 'name' && key !== 'icon' && key !== 'days') {
      cleanUser[key] = user[key];
    }
  });
  
  return cleanUser;
};

/**
 * Normalize export/import data to use consistent field names
 * @param {Object} data - Raw export/import data
 * @returns {Object} Normalized data
 */
export const normalizeExportData = (data) => {
  if (!data || typeof data !== 'object') return null;
  
  const normalized = { ...data };
  
  // Normalize users
  if (data.users && typeof data.users === 'object') {
    normalized.users = {};
    Object.entries(data.users).forEach(([userId, user]) => {
      const normalizedUser = normalizeUser(user);
      if (normalizedUser) {
        normalized.users[userId] = normalizedUser;
      }
    });
  }
  
  // Normalize standalone activities (if present)
  if (data.activities && Array.isArray(data.activities)) {
    normalized.activities = data.activities.map(normalizeActivity).filter(Boolean);
  }
  
  // Normalize activity cards (if present)
  if (data.activityCards && typeof data.activityCards === 'object') {
    normalized.activityCards = {};
    Object.entries(data.activityCards).forEach(([key, activities]) => {
      if (Array.isArray(activities)) {
        normalized.activityCards[key] = activities.map(normalizeActivity).filter(Boolean);
      }
    });
  }
  
  // Normalize templates/library activities
  if (data.templates && typeof data.templates === 'object') {
    normalized.templates = {};
    Object.entries(data.templates).forEach(([categoryId, category]) => {
      if (category && typeof category === 'object') {
        normalized.templates[categoryId] = {
          ...category,
          activities: Array.isArray(category.activities)
            ? category.activities.map(activity => ({
                ...normalizeActivity(activity),
                // Templates use 'name' field
                name: activity.text || activity.name || activity.title
              }))
            : []
        };
      }
    });
  }
  
  // Handle camelCase vs snake_case for timestamps
  if (data.last_modified !== undefined) {
    normalized.lastModified = data.last_modified;
    delete normalized.last_modified;
  }
  if (data.created_at !== undefined) {
    normalized.createdAt = data.created_at;
    delete normalized.created_at;
  }
  
  return normalized;
};

/**
 * Normalize sync data before applying to state
 * @param {Object} data - Raw sync data
 * @returns {Object} Normalized sync data
 */
export const normalizeSyncData = (data) => {
  // Use the same normalization as export data
  return normalizeExportData(data);
};
