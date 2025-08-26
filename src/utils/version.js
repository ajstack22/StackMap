/**
 * Version management utility for StackMap
 * Format: YY.MM.DD.#
 * Where # is the build counter for the day
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERSION_KEY = '@stackmap_build_version';
const BUILD_COUNTER_KEY = '@stackmap_build_counter';
const BUILD_DATE_KEY = '@stackmap_build_date';

/**
 * Get the current version string
 * Format: YY.MM.DD.#
 */
export const getCurrentVersion = async () => {
  try {
    if (Platform.OS === 'web') {
      // For web, try to get from localStorage first
      const stored = localStorage.getItem(VERSION_KEY);
      if (stored) return stored;
    } else {
      // For native, use AsyncStorage
      const stored = await AsyncStorage.getItem(VERSION_KEY);
      if (stored) return stored;
    }

    // If no stored version, generate from current date
    return generateVersion();
  } catch (error) {
//     console.error('Error getting version:', error);
    return generateVersion();
  }
};

/**
 * Generate a new version string based on current date
 */
export const generateVersion = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  // Default to build 1 if no counter exists
  return `${yy}.${mm}.${dd}.1`;
};

/**
 * Increment the build counter for today
 * Called during build process
 */
export const incrementBuildCounter = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    let lastBuildDate;
    let buildCounter = 1;

    if (Platform.OS === 'web') {
      lastBuildDate = localStorage.getItem(BUILD_DATE_KEY);
      const storedCounter = localStorage.getItem(BUILD_COUNTER_KEY);
      if (storedCounter) buildCounter = parseInt(storedCounter, 10);
    } else {
      lastBuildDate = await AsyncStorage.getItem(BUILD_DATE_KEY);
      const storedCounter = await AsyncStorage.getItem(BUILD_COUNTER_KEY);
      if (storedCounter) buildCounter = parseInt(storedCounter, 10);
    }

    // If it's a new day, reset counter to 1
    if (lastBuildDate !== today) {
      buildCounter = 1;
    } else {
      // Same day, increment counter
      buildCounter++;
    }

    // Generate new version
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const newVersion = `${yy}.${mm}.${dd}.${buildCounter}`;

    // Store the new values
    if (Platform.OS === 'web') {
      localStorage.setItem(VERSION_KEY, newVersion);
      localStorage.setItem(BUILD_COUNTER_KEY, String(buildCounter));
      localStorage.setItem(BUILD_DATE_KEY, today);
    } else {
      await AsyncStorage.setItem(VERSION_KEY, newVersion);
      await AsyncStorage.setItem(BUILD_COUNTER_KEY, String(buildCounter));
      await AsyncStorage.setItem(BUILD_DATE_KEY, today);
    }

    return newVersion;
  } catch (error) {
//     console.error('Error incrementing build counter:', error);
    return generateVersion();
  }
};

/**
 * Set a specific version (useful for CI/CD)
 */
export const setVersion = async version => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(VERSION_KEY, version);
    } else {
      await AsyncStorage.setItem(VERSION_KEY, version);
    }
    return version;
  } catch (error) {
//     console.error('Error setting version:', error);
    return null;
  }
};

// Export a static version for builds
// This will be updated by the build script
export const BUILD_VERSION = '2025.08.26.20';
// Clean deployment system fully operational - 2025-01-13
