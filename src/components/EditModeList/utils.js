import { Platform, Vibration } from 'react-native';

/**
 * Reorder an array by moving an item from one index to another
 */
export const reorderArray = (array, fromIndex, toIndex) => {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
};

/**
 * Move an item up in the array
 */
export const moveItemUp = (array, index) => {
  if (index <= 0) return array;
  return reorderArray(array, index, index - 1);
};

/**
 * Move an item down in the array
 */
export const moveItemDown = (array, index) => {
  if (index >= array.length - 1) return array;
  return reorderArray(array, index, index + 1);
};

/**
 * Batch delete items by IDs
 */
export const batchDelete = (array, idsToDelete) => {
  const deleteSet = new Set(idsToDelete);
  return array.filter(item => !deleteSet.has(item.id));
};

/**
 * Batch update items
 */
export const batchUpdate = (array, updates) => {
  const updateMap = new Map(updates.map(u => [u.id, u]));
  return array.map(item => updateMap.get(item.id) || item);
};

/**
 * Generate unique ID for new items
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Platform-specific haptic feedback
 */
export const triggerHaptic = (type = 'selection') => {
  if (Platform.OS === 'ios') {
    // Note: Expo haptics would be used here if available
    // For now, we'll use vibration as fallback
    Vibration.vibrate(10);
  } else if (Platform.OS === 'android') {
    // Android vibration
    Vibration.vibrate(10);
  } else if (Platform.OS === 'web' && navigator.vibrate) {
    // Web vibration API
    navigator.vibrate(10);
  }
};