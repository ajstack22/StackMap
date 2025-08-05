/**
 * Data validation utility for sync operations
 * Ensures data integrity and prevents corruption
 */

/**
 * Validate the structure and integrity of synced data
 * @param {Object} data - The data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateSyncedData = (data) => {
  try {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      console.error('Data validation failed: Data is not an object', data);
      return false;
    }

    // Check required top-level fields
    if (!data.users || typeof data.users !== 'object') {
      console.error('Data validation failed: Missing or invalid users object', data);
      return false;
    }

    // Validate each user
    for (const [userId, user] of Object.entries(data.users)) {
      if (!validateUser(userId, user)) {
        return false;
      }
    }

    // Validate theme if present
    if (data.currentTheme && !validateTheme(data.currentTheme)) {
      return false;
    }

    // Validate currentUser if present
    if (data.currentUser && !data.users[data.currentUser]) {
      console.error(`Data validation failed: currentUser ${data.currentUser} not found in users`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Data validation error:', error);
    return false;
  }
};

/**
 * Validate a single user object
 */
const validateUser = (userId, user) => {
  if (!user || typeof user !== 'object') {
    console.error(`Data validation failed: Invalid user object for ${userId}`);
    return false;
  }

  // Check required user fields
  if (!user.name || typeof user.name !== 'string') {
    console.error(`Data validation failed: User ${userId} missing or invalid name`);
    return false;
  }

  if (!user.icon || typeof user.icon !== 'string') {
    console.error(`Data validation failed: User ${userId} missing or invalid icon`);
    return false;
  }

  // Validate days object
  if (!user.days || typeof user.days !== 'object') {
    console.error(`Data validation failed: User ${userId} missing or invalid days object`);
    return false;
  }

  // Validate each day
  for (const [day, dayData] of Object.entries(user.days)) {
    if (!validateDay(userId, day, dayData)) {
      return false;
    }
  }

  return true;
};

/**
 * Validate a single day's data
 */
const validateDay = (userId, day, dayData) => {
  if (!dayData || typeof dayData !== 'object') {
    console.error(`Data validation failed: Invalid day data for user ${userId}, day ${day}`);
    return false;
  }

  // Validate activities array
  if (!Array.isArray(dayData.activities)) {
    console.error(`Data validation failed: Activities not an array for user ${userId}, day ${day}`);
    return false;
  }

  // Check for duplicate activity IDs
  const activityIds = new Set();
  for (const activity of dayData.activities) {
    if (!validateActivity(activity)) {
      console.error(`Data validation failed: Invalid activity in user ${userId}, day ${day}`);
      return false;
    }

    if (activityIds.has(activity.id)) {
      console.error(`Data validation failed: Duplicate activity ID ${activity.id} in user ${userId}, day ${day}`);
      return false;
    }
    activityIds.add(activity.id);
  }

  // We don't use completedActivities array anymore - completion is tracked on each activity

  return true;
};

/**
 * Validate a single activity
 */
const validateActivity = (activity) => {
  if (!activity || typeof activity !== 'object') {
    return false;
  }

  // Check required fields
  if (!activity.id || typeof activity.id !== 'string') {
    console.error('Activity missing or invalid ID:', activity);
    return false;
  }

  if (!activity.text || typeof activity.text !== 'string') {
    console.error('Activity missing or invalid text:', activity);
    return false;
  }

  // Check boolean fields
  if (typeof activity.completed !== 'boolean') {
    console.error('Activity missing or invalid completed flag:', activity);
    return false;
  }

  if (typeof activity.pinned !== 'boolean') {
    console.error('Activity missing or invalid pinned flag:', activity);
    return false;
  }

  // Validate completion timestamp fields if present
  if (activity.completed) {
    if (activity.completedAt && typeof activity.completedAt !== 'number') {
      console.error('Activity has invalid completedAt timestamp:', activity);
      return false;
    }
    if (activity.completedBy && typeof activity.completedBy !== 'string') {
      console.error('Activity has invalid completedBy device ID:', activity);
      return false;
    }
  }

  return true;
};

/**
 * Validate theme object
 */
const validateTheme = (theme) => {
  if (!theme || typeof theme !== 'object') {
    console.error('Data validation failed: Invalid theme object');
    return false;
  }

  const requiredColors = ['primary', 'background', 'surface', 'text'];
  for (const color of requiredColors) {
    if (!theme[color] || typeof theme[color] !== 'string') {
      console.error(`Data validation failed: Theme missing or invalid ${color}`);
      return false;
    }
  }

  return true;
};

/**
 * Repair common data issues
 * @param {Object} data - The data to repair
 * @returns {Object} Repaired data
 */
export const repairSyncedData = (data) => {
  try {
    const repaired = JSON.parse(JSON.stringify(data)); // Deep clone

    // Ensure users object exists
    if (!repaired.users) {
      repaired.users = {};
    }

    // Repair each user
    for (const [userId, user] of Object.entries(repaired.users)) {
      // Ensure required user fields
      if (!user.name) user.name = 'Unknown User';
      if (!user.icon) user.icon = '👤';
      if (!user.days) user.days = {};

      // Repair each day
      for (const [day, dayData] of Object.entries(user.days)) {
        // Ensure activities array
        if (!Array.isArray(dayData.activities)) {
          dayData.activities = [];
        }

        // Filter out invalid activities
        dayData.activities = dayData.activities.filter(activity => {
          return activity && 
                 activity.id && 
                 activity.text && 
                 typeof activity.completed === 'boolean' &&
                 typeof activity.pinned === 'boolean';
        });

        // No need for completedActivities array - tracked on each activity
      }
    }

    return repaired;
  } catch (error) {
    console.error('Data repair error:', error);
    return data; // Return original if repair fails
  }
};

export default {
  validateSyncedData,
  repairSyncedData
};