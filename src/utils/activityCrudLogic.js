// @ts-check
/**
 * Pure business logic functions for activity CRUD operations
 * Extracted from CategoryActions.js for independent testing
 */

import { DEFAULT_ACTIVITY_EMOJI } from '../constants';
import { generateSecureId } from './secureId';
import { getActivityIcon, getActivityText } from './fieldAccessors';

/**
 * Validates activity data before creation or update
 * @param {Object} activityData - The activity data to validate
 * @param {string} activityData.name - Activity name
 * @param {string} [activityData.icon] - Activity icon/emoji
 * @param {string} [activityData.description] - Activity description
 * @returns {Object} Validation result with success flag and error message
 */
export const validateActivityData = (activityData) => {
  if (!activityData) {
    return { success: false, error: 'Activity data is required' };
  }

  const { name, icon } = activityData;

  if (!name?.trim()) {
    return { success: false, error: 'Activity name cannot be empty' };
  }

  if (!icon) {
    return { success: false, error: 'Please select an emoji for the activity' };
  }

  return { success: true };
};

/**
 * Creates a new activity object with normalized data
 * @param {Object} activityData - Raw activity data
 * @param {string} activityData.name - Activity name
 * @param {string} [activityData.icon] - Activity icon/emoji
 * @param {string} [activityData.description] - Activity description
 * @returns {Object} Normalized activity object
 */
export const createActivity = (activityData) => {
  const validation = validateActivityData(activityData);
  if (!validation.success) {
    throw new Error(validation.error);
  }

  const { name, icon, description = '' } = activityData;

  return {
    id: `activity-${Date.now()}`,
    name: name.trim(),
    icon: icon,
    description: description.trim(),
  };
};

/**
 * Updates an existing activity with new data
 * @param {Object} existingActivity - The current activity object
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated activity object
 */
export const updateActivity = (existingActivity, updateData) => {
  const validation = validateActivityData(updateData);
  if (!validation.success) {
    throw new Error(validation.error);
  }

  const { name, icon, description = '' } = updateData;

  return {
    ...existingActivity,
    name: name.trim(),
    icon: icon,
    description: description.trim(),
  };
};

/**
 * Adds an activity to a specific category
 * @param {Array} categories - Array of category objects
 * @param {string} categoryId - ID of the target category
 * @param {Object} activityData - Activity data to add
 * @returns {Array} Updated categories array
 */
export const addActivityToCategory = (categories, categoryId, activityData) => {
  const newActivity = createActivity(activityData);

  return categories.map(cat =>
    cat.id === categoryId
      ? {
          ...cat,
          activities: [...cat.activities, newActivity],
        }
      : cat
  );
};

/**
 * Updates an activity in the categories array
 * @param {Array} categories - Array of category objects
 * @param {string} activityId - ID of the activity to update
 * @param {Object} updateData - New activity data
 * @returns {Array} Updated categories array
 */
export const updateActivityInCategories = (categories, activityId, updateData) => {
  const updatedActivity = updateActivity({ id: activityId }, updateData);

  return categories.map(cat => ({
    ...cat,
    activities: cat.activities.map(act =>
      act.id === activityId ? { ...act, ...updatedActivity } : act
    ),
  }));
};

/**
 * Removes an activity from all categories
 * @param {Array} categories - Array of category objects
 * @param {string} activityId - ID of the activity to remove
 * @returns {Array} Updated categories array
 */
export const removeActivityFromCategories = (categories, activityId) => {
  return categories.map(cat => ({
    ...cat,
    activities: cat.activities.filter(act => act.id !== activityId),
  }));
};

/**
 * Removes an activity from a specific category
 * @param {Array} categories - Array of category objects
 * @param {string} categoryId - ID of the category
 * @param {string} activityId - ID of the activity to remove
 * @returns {Array} Updated categories array
 */
export const removeActivityFromCategory = (categories, categoryId, activityId) => {
  return categories.map(cat => {
    if (cat.id === categoryId) {
      return {
        ...cat,
        activities: cat.activities.filter(act => act.id !== activityId),
      };
    }
    return cat;
  });
};

/**
 * Finds all activities across all categories
 * @param {Array} categories - Array of category objects
 * @returns {Array} Array of all activities
 */
export const getAllActivities = (categories) => {
  return categories.flatMap(cat => cat.activities || []);
};

/**
 * Finds an activity by ID across all categories
 * @param {Array} categories - Array of category objects
 * @param {string} activityId - ID of the activity to find
 * @returns {Object|null} Activity object or null if not found
 */
export const findActivityById = (categories, activityId) => {
  const allActivities = getAllActivities(categories);
  return allActivities.find(act => act.id === activityId) || null;
};

/**
 * Finds activities by name (case-insensitive partial match)
 * @param {Array} categories - Array of category objects
 * @param {string} searchName - Name to search for
 * @returns {Array} Array of matching activities
 */
export const findActivitiesByName = (categories, searchName) => {
  if (!searchName || !searchName.trim()) {
    return [];
  }

  const searchLower = searchName.toLowerCase().trim();
  const allActivities = getAllActivities(categories);

  return allActivities.filter(act =>
    act.name && act.name.toLowerCase().includes(searchLower)
  );
};

/**
 * Transforms activity for UI display (handles field name variations)
 * @param {Object} activity - Activity object
 * @returns {Object} Transformed activity with consistent field names
 */
export const transformActivityForDisplay = (activity) => {
  if (!activity) return null;

  return {
    icon: getActivityIcon(activity),
    text: getActivityText(activity),
    description: activity.description || '',
    id: activity.id,
  };
};

/**
 * Batch transforms multiple activities for UI display
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Array of transformed activities
 */
export const transformActivitiesForDisplay = (activities) => {
  if (!Array.isArray(activities)) {
    return [];
  }

  return activities.map(transformActivityForDisplay).filter(Boolean);
};

/**
 * Duplicates an activity with a new ID
 * @param {Object} activity - Activity to duplicate
 * @param {string} [namePrefix] - Optional prefix for the duplicated activity name
 * @returns {Object} New activity object
 */
export const duplicateActivity = (activity, namePrefix = 'Copy of ') => {
  if (!activity) {
    throw new Error('Activity is required for duplication');
  }

  return {
    ...activity,
    id: generateSecureId('activity'),
    name: `${namePrefix}${activity.name}`,
  };
};