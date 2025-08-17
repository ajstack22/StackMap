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
  // Haptic feedback disabled until VIBRATE permission is added to AndroidManifest.xml
  // To enable:
  // 1. Add <uses-permission android:name="android.permission.VIBRATE" /> to AndroidManifest.xml
  // 2. Uncomment the code below
};
