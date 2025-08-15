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
//       console.error('Data validation failed: Data is not an object', data);
      return false;
    }

    // Check required top-level fields
    if (!data.users || typeof data.users !== 'object') {
      console.error('Data validation failed: Missing or invalid users object', data);
      return false;
    }

    // Validate each user (skip deleted users)
    for (const [userId, user] of Object.entries(data.users)) {
      // Skip validation for deleted users
      if (user && user.deleted) {
        continue;
      }
      if (!validateUser(userId, user)) {
        return false;
      }
    }

    // Validate theme if present
    if (data.currentTheme && !validateTheme(data.currentTheme)) {
      return false;
    }

    // Validate currentUser if present
    if (data.currentUser) {
      const currentUserData = data.users[data.currentUser];
      // Current user must exist and not be deleted
      if (!currentUserData || currentUserData.deleted) {
        console.error(`Data validation failed: currentUser ${data.currentUser} is missing or deleted`, currentUserData);
        return false;
      }
    }

    return true;
  } catch (error) {
//     console.error('Data validation error:', error);
    return false;
  }
};

/**
 * Validate a single user object
 */
const validateUser = (userId, user) => {
  if (!user || typeof user !== 'object') {
    console.error(`Data validation failed: Invalid user object for ${userId}`, user);
    return false;
  }

  // Check required user fields
  if (!user.name || typeof user.name !== 'string') {
    console.error(`Data validation failed: User ${userId} missing or invalid name`, user);
    console.error('Name value:', user.name, 'Type:', typeof user.name);
    return false;
  }

  // Check for icon field (normalize emoji to icon if needed)
  if (!user.icon) {
    if (user.emoji) {
      // Accept emoji field but it will be normalized to icon during repair
      console.log(`Data validation: User ${userId} has emoji but no icon - will normalize`);
    } else {
      console.error(`Data validation failed: User ${userId} missing icon`, user);
      console.error('Icon value:', user.icon, 'Emoji value:', user.emoji);
      return false;
    }
  }

  // Validate days object
  if (!user.days || typeof user.days !== 'object') {
    console.error(`Data validation failed: User ${userId} missing or invalid days object`, user);
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
//     console.error(`Data validation failed: Invalid day data for user ${userId}, day ${day}`);
    return false;
  }

  // Validate activities array
  if (!Array.isArray(dayData.activities)) {
//     console.error(`Data validation failed: Activities not an array for user ${userId}, day ${day}`);
    return false;
  }

  // Check for duplicate activity IDs
  const activityIds = new Set();
  for (const activity of dayData.activities) {
    if (!validateActivity(activity)) {
//       console.error(`Data validation failed: Invalid activity in user ${userId}, day ${day}`);
      return false;
    }

    if (activityIds.has(activity.id)) {
//       console.error(`Data validation failed: Duplicate activity ID ${activity.id} in user ${userId}, day ${day}`);
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
//     console.error('Activity missing or invalid ID:', activity);
    return false;
  }

  // Check for text field (normalize from name/title if needed)
  if (!activity.text) {
    // Accept name or title for backwards compatibility, but will normalize
    const activityText = activity.name || activity.title;
    if (!activityText || typeof activityText !== 'string') {
//       console.error('Activity missing text field:', activity);
      return false;
    }
  } else if (typeof activity.text !== 'string') {
//     console.error('Activity text field is not a string:', activity);
    return false;
  }

  // Check boolean fields - allow undefined for repair to fix
  if (activity.completed !== undefined && typeof activity.completed !== 'boolean') {
//     console.error('Activity has invalid completed flag:', activity);
    return false;
  }

  if (activity.pinned !== undefined && typeof activity.pinned !== 'boolean') {
//     console.error('Activity has invalid pinned flag:', activity);
    return false;
  }

  // Validate completion timestamp fields if present
  if (activity.completed) {
    if (activity.completedAt && typeof activity.completedAt !== 'number') {
//       console.error('Activity has invalid completedAt timestamp:', activity);
      return false;
    }
    if (activity.completedBy && typeof activity.completedBy !== 'string') {
//       console.error('Activity has invalid completedBy device ID:', activity);
      return false;
    }
  }

  return true;
};

/**
 * Validate theme - themes are stored as string names, not objects
 */
const validateTheme = (theme) => {
  // Theme should be a string name like 'stackBlue', 'crimson', etc.
  if (!theme || typeof theme !== 'string') {
//     console.error('Data validation failed: Theme should be a string');
    return false;
  }

  // List of valid theme names from constants/theme.js
  const validThemes = [
    'crimson', 'cherry', 'scarlet', 'rust', 'tangerine', 'amber', 'gold',
    'olive', 'emerald', 'forest', 'ocean', 'sapphire', 'navy', 'indigo', 'plum',
    'sage', 'dustyBlue', 'stackBlue', 'terracotta', 'lavender', 'slate'
  ];

  if (!validThemes.includes(theme)) {
//     console.error(`Data validation failed: Invalid theme name '${theme}'`);
    return false;
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
    console.log('Repair: Starting data repair process');
    console.log('Repair: Input data has', Object.keys(data.users || {}).length, 'users');
    console.log('Repair: Current user is', data.currentUser);
    
    const repaired = JSON.parse(JSON.stringify(data)); // Deep clone

    // Ensure users object exists
    if (!repaired.users || typeof repaired.users !== 'object') {
      repaired.users = {};
    }
    
    // Check if we have any valid (non-deleted) users
    const validUserIds = Object.keys(repaired.users).filter(id => 
      repaired.users[id] && !repaired.users[id].deleted
    );
    
    // If no valid users exist, create a default user
    if (validUserIds.length === 0) {
      const defaultUserId = repaired.currentUser || 'user_1';
      repaired.users[defaultUserId] = {
        name: 'User',
        icon: '👤',
        days: {}
      };
      repaired.currentUser = defaultUserId;
    } else {
      // Ensure currentUser points to a valid (non-deleted) user
      if (!repaired.currentUser || 
          !repaired.users[repaired.currentUser] || 
          repaired.users[repaired.currentUser].deleted) {
        // Set to first valid user
        repaired.currentUser = validUserIds[0];
      }
    }

    // Repair each user
    for (const [userId, user] of Object.entries(repaired.users)) {
      // Skip deleted users - they don't need repair
      if (user && user.deleted) {
        continue;
      }
      
      // Ensure required user fields
      if (!user.name) {
        console.log(`Repair: User ${userId} missing name, setting to 'Unknown User'`);
        user.name = 'Unknown User';
      }
      // Normalize icon field
      if (!user.icon) {
        if (user.emoji) {
          // Migrate emoji to icon field
          console.log(`Repair: User ${userId} migrating emoji to icon field`);
          user.icon = user.emoji;
          delete user.emoji; // Remove redundant field
        } else {
          console.log(`Repair: User ${userId} missing icon, setting default`);
          user.icon = '👤'; // Default user icon
        }
      } else if (user.emoji) {
        // Remove redundant emoji field if icon exists
        console.log(`Repair: User ${userId} removing redundant emoji field`);
        delete user.emoji;
      }
      if (!user.days) {
        console.log(`Repair: User ${userId} missing days object, creating empty`);
        user.days = {};
      }

      // Repair each day
      for (const [day, dayData] of Object.entries(user.days)) {
        // Ensure activities array
        if (!Array.isArray(dayData.activities)) {
          dayData.activities = [];
        }

        // Filter out invalid activities and repair them
        dayData.activities = dayData.activities.map(activity => {
          if (!activity || typeof activity !== 'object') return null;
          
          // Normalize text field from name/title if needed
          if (!activity.text) {
            activity.text = activity.name || activity.title || 'Untitled Activity';
          }
          
          // Normalize icon field from emoji if needed
          if (!activity.icon && activity.emoji) {
            activity.icon = activity.emoji;
          }
          
          // Ensure required fields with defaults
          const cleanActivity = {
            id: activity.id || `repaired_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: activity.text,
            icon: activity.icon || activity.emoji || '',
            completed: typeof activity.completed === 'boolean' ? activity.completed : false,
            pinned: typeof activity.pinned === 'boolean' ? activity.pinned : false
          };
          
          // Copy over any other valid fields (like order, completedAt, etc)
          if (activity.order !== undefined) cleanActivity.order = activity.order;
          if (activity.completedAt !== undefined) cleanActivity.completedAt = activity.completedAt;
          if (activity.completedBy !== undefined) cleanActivity.completedBy = activity.completedBy;
          if (activity.description !== undefined) cleanActivity.description = activity.description;
          
          // Don't copy redundant fields (name, title, emoji)
          return cleanActivity;
        }).filter(activity => {
          // Filter out null activities and validate
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
//     console.error('Data repair error:', error);
    return data; // Return original if repair fails
  }
};

/**
 * Validate incremental sync data
 * @param {Object} incrementalData - The incremental sync data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const validateIncrementalSync = (incrementalData) => {
  try {
    // Check if data is an object
    if (!incrementalData || typeof incrementalData !== 'object') {
      console.error('Incremental sync validation failed: Data is not an object', incrementalData);
      return false;
    }

    // Check required fields for incremental sync
    if (incrementalData.type !== 'incremental') {
      console.error('Incremental sync validation failed: Type is not "incremental"', incrementalData.type);
      return false;
    }

    if (!incrementalData.timestamp || typeof incrementalData.timestamp !== 'number') {
      console.error('Incremental sync validation failed: Invalid timestamp', incrementalData.timestamp);
      return false;
    }

    // Validate patch if present
    if (incrementalData.patch) {
      if (typeof incrementalData.patch !== 'object') {
        console.error('Incremental sync validation failed: Patch is not an object', typeof incrementalData.patch);
        return false;
      }

      console.log('Incremental sync patch structure:', JSON.stringify(incrementalData.patch, null, 2));
      
      // Validate patch contents based on field type
      for (const [field, value] of Object.entries(incrementalData.patch)) {
        switch (field) {
          case 'users':
            if (value && typeof value === 'object') {
              // For incremental patches, users might be partial updates or full replacements
              // We need to validate the structure but be more lenient
              for (const [userId, user] of Object.entries(value)) {
                // Allow null to indicate deletion
                if (user === null) {
                  continue;
                }
                // For incremental patches, just check it's an object with valid structure
                if (!user || typeof user !== 'object') {
                  console.error(`Incremental sync validation failed: Invalid user object for ${userId} in patch`, user);
                  return false;
                }
                // If it's a full user object, validate it properly
                // If it has name and icon, it's a full user
                // Also accept emoji field for backwards compatibility
                if (user.name && (user.icon || user.emoji) && user.days) {
                  if (!validateUser(userId, user)) {
                    console.error(`Incremental sync validation failed: Invalid full user ${userId} in patch`, user);
                    return false;
                  }
                }
                // Otherwise, it's a partial update and that's okay for patches
              }
            }
            break;
          
          case 'activities':
            if (value && Array.isArray(value)) {
              // Validate each activity in the patch
              for (const activity of value) {
                if (!validateActivity(activity)) {
                  console.error('Incremental sync validation failed: Invalid activity in patch', activity);
                  return false;
                }
              }
            }
            break;
          
          case 'currentTheme':
            if (!validateTheme(value)) {
              console.error('Incremental sync validation failed: Invalid theme in patch', value);
              return false;
            }
            break;
          
          // For scalar fields, just ensure they're not undefined
          case 'currentUser':
          case 'bannerPosition':
          case 'soundEnabled':
          case 'taskCelebration':
          case 'routineCelebration':
          case 'currentDay':
            if (value === undefined) {
              console.error(`Incremental sync validation failed: Undefined value for ${field}`);
              return false;
            }
            break;
        }
      }
    }

    // Validate changes array if present
    if (incrementalData.changes) {
      if (!Array.isArray(incrementalData.changes)) {
//         console.error('Incremental sync validation failed: Changes is not an array');
        return false;
      }

      // Each change should have required fields
      for (const change of incrementalData.changes) {
        if (!change.timestamp || typeof change.timestamp !== 'number') {
//           console.error('Incremental sync validation failed: Change missing timestamp');
          return false;
        }
      }
    }

    return true;
  } catch (error) {
//     console.error('Incremental sync validation error:', error);
    return false;
  }
};

export default {
  validateSyncedData,
  repairSyncedData,
  validateIncrementalSync
};