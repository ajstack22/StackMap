/**
 * Navigation Bar Theme Manager for Android
 * Dynamically sets navigation bar color to match app theme
 */

import { Platform, NativeModules, StatusBar } from 'react-native';

// Try to use react-native-system-navigation-bar if available
let SystemNavigationBar = null;
try {
  SystemNavigationBar = require('react-native-system-navigation-bar').default;
} catch (e) {
  // Library not installed, we'll use fallback methods
}

/**
 * Set navigation bar color to match theme
 * @param {string} color - Hex color from theme (e.g., '#5C7E9D')
 * @param {boolean} useLightIcons - Whether to use light (white) navigation bar icons
 */
export const setNavigationBarColor = async (color, useLightIcons = true) => {
  if (Platform.OS !== 'android') {
    return; // Only works on Android
  }

  try {
    if (SystemNavigationBar) {
      // Use the library if available (most robust solution)
      // Note: 'light' = light/white icons, 'dark' = dark/grey icons
      await SystemNavigationBar.setNavigationColor(
        color,
        useLightIcons ? 'light' : 'dark',
        'navigation'
      );

      // For Samsung devices, try to disable contrast enforcement
      if (SystemNavigationBar.setNavigationBarContrastEnforced) {
        await SystemNavigationBar.setNavigationBarContrastEnforced(false);
      }
    } else {
      // Fallback: Use StatusBar API (limited but works)
      // Note: This only works on Android 5.0+
      if (Platform.Version >= 21) {
        // We'll need to create a native module for this
        // or add the package react-native-system-navigation-bar
        console.warn('Navigation bar theming requires react-native-system-navigation-bar package');
      }
    }
  } catch (error) {
    console.warn('Failed to set navigation bar color:', error);
  }
};

/**
 * Apply translucent navigation bar for edge-to-edge display
 * @param {string} color - Theme color with transparency
 */
export const setTranslucentNavigationBar = async (color) => {
  if (Platform.OS !== 'android') return;

  try {
    if (SystemNavigationBar) {
      // Make navigation bar translucent
      await SystemNavigationBar.setNavigationColor(
        `${color}CC`, // Add transparency (80% opacity)
        false,
        'navigation'
      );
    }
  } catch (error) {
    console.warn('Failed to set translucent navigation bar:', error);
  }
};

/**
 * Reset navigation bar to default
 */
export const resetNavigationBar = async () => {
  if (Platform.OS !== 'android') return;

  try {
    if (SystemNavigationBar) {
      await SystemNavigationBar.setNavigationColor(
        'transparent',
        false,
        'navigation'
      );
    }
  } catch (error) {
    console.warn('Failed to reset navigation bar:', error);
  }
};

/**
 * Check if the color is light (for determining icon color)
 * @param {string} hexColor - Hex color string
 * @returns {boolean} - True if color is light
 */
export const isLightColor = (hexColor) => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
};