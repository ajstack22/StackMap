import { Platform } from 'react-native';

/**
 * Calculate the bottom height for Android modals to account for navigation bar
 * @param {Object} insets - Safe area insets
 * @returns {number} Height in pixels
 */
export const getAndroidModalBottomHeight = (insets) => {
  if (Platform.OS !== 'android') return 0;
  return insets?.bottom || 0;
};