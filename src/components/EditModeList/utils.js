import { Platform, Vibration, LayoutAnimation, UIManager } from 'react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Reorder an array by moving an item from one index to another
 * Also updates modifiedAt timestamp for sync conflict resolution
 */
export const reorderArray = (array, fromIndex, toIndex) => {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  // Add timestamp to the moved item for sync conflict resolution
  const movedItem = { ...removed, modifiedAt: Date.now() };
  result.splice(toIndex, 0, movedItem);
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

/**
 * Configure smooth animations for list reordering
 * Uses a spring animation for natural movement
 */
export const configureReorderAnimation = () => {
  // Custom animation configuration for smooth reordering
  const customAnimation = {
    duration: 250, // Slightly longer than 200ms for smoother feel
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
      duration: 200,
    },
    update: {
      type: LayoutAnimation.Types.spring,
      springDamping: 0.8, // Gentle spring for natural movement
      duration: 250,
    },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
      duration: 200,
    },
  };
  
  // Use platform-appropriate animation
  if (Platform.OS === 'ios') {
    // iOS: Use preset for best performance
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  } else if (Platform.OS === 'android') {
    // Android: Use custom config if enabled
    LayoutAnimation.configureNext(customAnimation);
  } else {
    // Web: LayoutAnimation not supported, will use CSS transitions
    // See styles.js for web-specific transition styles
  }
};
