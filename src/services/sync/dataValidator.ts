import type { User, ThemeName } from '../../types';
import { DEFAULT_USER_ICON } from '../../constants';

/**
 * Data validation utility for sync operations
 * Ensures data integrity and prevents corruption during sync
 */

// Define types for validation
interface SyncData {
  users: Record<string, User | null>;
  currentUser?: string;
  currentTheme?: ThemeName | string;
  [key: string]: any;
}

// DayData interface removed - not needed

interface IncrementalSyncData {
  type: 'incremental';
  timestamp: number;
  patch?: Record<string, any>;
  changes?: Array<{ timestamp: number; [key: string]: any }>;
  [key: string]: any;
}

/**
 * Validate the structure and integrity of synced data
 * @param data - The data to validate
 * @returns True if valid, false otherwise
 */
export const validateSyncedData = (data: any): data is SyncData => {
  try {
    // Check if data is an object
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check required top-level fields
    if (!data.users || typeof data.users !== 'object') {
      console.error(
        'Data validation failed: Missing or invalid users object',
        data,
      );
      return false;
    }

    // Validate each user (skip deleted users)
    for (const [_userId, user] of Object.entries(data.users) as [
      string,
      any,
    ][]) {
      // Skip validation for deleted users
      if (user && user.deleted) {
        continue;
      }
      if (!validateUser(_userId, user)) {
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
        console.error(
          `Data validation failed: currentUser ${data.currentUser} is missing or deleted`,
          currentUserData,
        );
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validate a single user object
 * @param userId - The user's ID
 * @param user - The user object to validate
 * @returns True if valid, false otherwise
 */
const validateUser = (userId: string, user: any): boolean => {
  if (!user || typeof user !== 'object') {
    console.error(
      `Data validation failed: Invalid user object for ${userId}`,
      user,
    );
    return false;
  }

  // Check required user fields
  if (!user.name || typeof user.name !== 'string') {
    console.error(
      `Data validation failed: User ${userId} missing or invalid name`,
      user,
    );
    console.error('Name value:', user.name, 'Type:', typeof user.name);
    return false;
  }

  // Check for icon field (also check emoji for legacy support)
  if (!user.icon && !user.emoji) {
    console.error(
      `Data validation failed: User ${userId} missing icon or emoji`,
      user,
    );
    return false;
  }

  // Validate days object
  if (!user.days || typeof user.days !== 'object') {
    console.error(
      `Data validation failed: User ${userId} missing or invalid days object`,
      user,
    );
    return false;
  }

  // Validate each day
  for (const [day, dayData] of Object.entries(user.days) as [string, any][]) {
    if (!validateDay(userId, day, dayData)) {
      return false;
    }
  }

  return true;
};

/**
 * Validate a single day's data
 * @param userId - The user's ID for error reporting
 * @param day - The day name (e.g., 'today', 'tomorrow')
 * @param dayData - The day's data to validate
 * @returns True if valid, false otherwise
 */
const validateDay = (userId: string, day: string, dayData: any): boolean => {
  if (!dayData || typeof dayData !== 'object') {
    return false;
  }

  // Validate activities array
  if (!Array.isArray(dayData.activities)) {
    return false;
  }

  // Check for duplicate activity IDs
  const activityIds = new Set<string>();
  for (const activity of dayData.activities) {
    if (!validateActivity(activity)) {
      return false;
    }

    if (activityIds.has(activity.id)) {
      return false;
    }
    activityIds.add(activity.id);
  }

  // We don't use completedActivities array anymore - completion is tracked on each activity

  return true;
};

/**
 * Validate a single activity
 * @param activity - The activity to validate
 * @returns True if valid, false otherwise
 */
const validateActivity = (activity: any): boolean => {
  if (!activity || typeof activity !== 'object') {
    return false;
  }

  // Check required fields
  if (!activity.id || typeof activity.id !== 'string') {
    return false;
  }

  // Check for text field
  if (!activity.text || typeof activity.text !== 'string') {
    return false;
  }

  // Check boolean fields - allow undefined for repair to fix
  if (
    activity.completed !== undefined &&
    typeof activity.completed !== 'boolean'
  ) {
    return false;
  }

  if (activity.pinned !== undefined && typeof activity.pinned !== 'boolean') {
    return false;
  }

  // Validate completion timestamp fields if present
  if (activity.completed) {
    if (activity.completedAt && typeof activity.completedAt !== 'number') {
      return false;
    }
    if (activity.completedBy && typeof activity.completedBy !== 'string') {
      return false;
    }
  }

  return true;
};

/**
 * Validate theme - themes can be stored as names or hex colors
 * @param theme - The theme name or hex color to validate
 * @returns True if valid, false otherwise
 */
const validateTheme = (theme: any): boolean => {
  // Theme should be a string
  if (!theme || typeof theme !== 'string') {
    return false;
  }

  // List of valid theme names from constants/theme.js
  const validThemes = [
    'crimson',
    'cherry',
    'scarlet',
    'rust',
    'tangerine',
    'amber',
    'gold',
    'olive',
    'emerald',
    'forest',
    'ocean',
    'sapphire',
    'navy',
    'indigo',
    'plum',
    'sage',
    'dustyBlue',
    'stackBlue',
    'terracotta',
    'lavender',
    'slate',
  ];

  // Check if it's a valid theme name
  if (validThemes.includes(theme)) {
    return true;
  }

  // Also accept hex color codes (e.g., #2196F3)
  // This happens when user settings contain theme colors from custom settings
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexColorRegex.test(theme)) {
    return true;
  }

  return false;
};

/**
 * Repair common data issues
 * Attempts to fix corrupted or malformed sync data
 * @param data - The data to repair
 * @returns Repaired data
 */
export const repairSyncedData = (data: any): SyncData => {
  try {
    const repaired = JSON.parse(JSON.stringify(data)); // Deep clone

    // Ensure users object exists
    if (!repaired.users || typeof repaired.users !== 'object') {
      repaired.users = {};
    }

    // Check if we have any valid (non-deleted) users
    const validUserIds = Object.keys(repaired.users).filter(
      id => repaired.users[id] && !repaired.users[id].deleted,
    );

    // If no valid users exist, create a default user
    if (validUserIds.length === 0) {
      const defaultUserId = repaired.currentUser || 'user_1';
      repaired.users[defaultUserId] = {
        name: 'User',
        icon: '👤',
        days: {},
      };
      repaired.currentUser = defaultUserId;
    } else {
      // Ensure currentUser points to a valid (non-deleted) user
      if (
        !repaired.currentUser ||
        !repaired.users[repaired.currentUser] ||
        repaired.users[repaired.currentUser].deleted
      ) {
        // Set to first valid user
        repaired.currentUser = validUserIds[0];
      }
    }

    // Repair each user
    for (const [_userId, user] of Object.entries(repaired.users) as [
      string,
      any,
    ][]) {
      // Skip deleted users - they don't need repair
      if (user && user.deleted) {
        continue;
      }

      // Ensure required user fields
      if (!user.name) {
        user.name = 'Unknown User';
      }
      // Ensure icon field exists (check emoji field for legacy data)
      if (!user.icon) {
        if ((user as any).emoji && typeof (user as any).emoji === 'string') {
          user.icon = (user as any).emoji;
          delete (user as any).emoji; // Remove legacy field
        } else {
          user.icon = DEFAULT_USER_ICON; // Default user icon
        }
      }
      if (!user.days) {
        user.days = {};
      }

      // Repair each day
      for (const [_day, dayData] of Object.entries(user.days) as [
        string,
        any,
      ][]) {
        // Ensure activities array
        if (!Array.isArray(dayData.activities)) {
          dayData.activities = [];
        }

        // Filter out invalid activities and repair them
        dayData.activities = dayData.activities
          .map((activity: any) => {
            if (!activity || typeof activity !== 'object') return null;
            
            // Skip deleted activities
            if (activity.deleted) return null;

            // Ensure text field
            if (!activity.text) {
              activity.text = 'Untitled Activity';
            }

            // Ensure required fields with defaults
            const cleanActivity = {
              id:
                activity.id ||
                `repaired_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
              text: activity.text,
              icon: activity.icon || '',
              completed:
                typeof activity.completed === 'boolean'
                  ? activity.completed
                  : false,
              pinned:
                typeof activity.pinned === 'boolean' ? activity.pinned : false,
            };

            // Copy over any other valid fields (like order, completedAt, etc)
            if (activity.order !== undefined)
              (cleanActivity as any).order = activity.order;
            if (activity.completedAt !== undefined)
              (cleanActivity as any).completedAt = activity.completedAt;
            if (activity.completedBy !== undefined)
              (cleanActivity as any).completedBy = activity.completedBy;
            if (activity.description !== undefined)
              (cleanActivity as any).description = activity.description;

            return cleanActivity;
          })
          .filter((activity: any) => {
            // Filter out null activities, deleted activities, and validate
            return (
              activity &&
              activity.id &&
              activity.text &&
              typeof activity.completed === 'boolean' &&
              typeof activity.pinned === 'boolean' &&
              !activity.deleted // Filter out deleted activities
            );
          });

        // No need for completedActivities array - tracked on each activity
      }
    }

    return repaired;
  } catch (error) {
    return data; // Return original if repair fails
  }
};

/**
 * Validate incremental sync data
 * Ensures incremental updates have proper structure
 * @param incrementalData - The incremental sync data to validate
 * @returns True if valid, false otherwise
 */
export const validateIncrementalSync = (
  incrementalData: any,
): incrementalData is IncrementalSyncData => {
  try {
    // Check if data is an object
    if (!incrementalData || typeof incrementalData !== 'object') {
      console.error(
        'Incremental sync validation failed: Data is not an object',
        incrementalData,
      );
      return false;
    }

    // Check required fields for incremental sync
    if (incrementalData.type !== 'incremental') {
      console.error(
        'Incremental sync validation failed: Type is not "incremental"',
        incrementalData.type,
      );
      return false;
    }

    if (
      !incrementalData.timestamp ||
      typeof incrementalData.timestamp !== 'number'
    ) {
      console.error(
        'Incremental sync validation failed: Invalid timestamp',
        incrementalData.timestamp,
      );
      return false;
    }

    // Validate patch if present
    if (incrementalData.patch) {
      if (typeof incrementalData.patch !== 'object') {
        console.error(
          'Incremental sync validation failed: Patch is not an object',
          typeof incrementalData.patch,
        );
        return false;
      }

      // Validate patch contents based on field type
      for (const [field, value] of Object.entries(incrementalData.patch)) {
        switch (field) {
          case 'users':
            if (value && typeof value === 'object') {
              // For incremental patches, users might be partial updates or full replacements
              // We need to validate the structure but be more lenient
              for (const [userId, user] of Object.entries(value) as [
                string,
                any,
              ][]) {
                // Allow null to indicate deletion
                if (user === null) {
                  continue;
                }
                // For incremental patches, just check it's an object with valid structure
                if (!user || typeof user !== 'object') {
                  console.error(
                    `Incremental sync validation failed: Invalid user object for ${userId} in patch`,
                    user,
                  );
                  return false;
                }
                // If it's a full user object, validate it properly
                // If it has name and icon, it's a full user
                // Check for full user object
                if (user.name && user.icon && user.days) {
                  if (!validateUser(userId, user)) {
                    console.error(
                      `Incremental sync validation failed: Invalid full user ${userId} in patch`,
                      user,
                    );
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
                  console.error(
                    'Incremental sync validation failed: Invalid activity in patch',
                    activity,
                  );
                  return false;
                }
              }
            }
            break;

          case 'currentTheme':
            if (!validateTheme(value)) {
              console.error(
                'Incremental sync validation failed: Invalid theme in patch',
                value,
              );
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
              console.error(
                `Incremental sync validation failed: Undefined value for ${field}`,
              );
              return false;
            }
            break;
        }
      }
    }

    // Validate changes array if present
    if (incrementalData.changes) {
      if (!Array.isArray(incrementalData.changes)) {
        return false;
      }

      // Each change should have required fields
      for (const change of incrementalData.changes) {
        if (!change.timestamp || typeof change.timestamp !== 'number') {
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    return false;
  }
};

export default {
  validateSyncedData,
  repairSyncedData,
  validateIncrementalSync,
};
