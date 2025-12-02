/**
 * BUILD CONFIGURATION
 *
 * Determines API endpoints based on build type for the 4-tier deployment system.
 *
 * Four-Tier Deployment System:
 * - QUAL: Development/testing environment
 * - STAGE: Pre-production validation
 * - BETA: Internal/external beta testing
 * - PROD: Production release
 *
 * Build Type Detection:
 * 1. React Native: Uses __DEV__ flag and BUILD_TYPE env var
 * 2. Web: Uses window.location to detect environment
 * 3. Manual override: Set BUILD_TYPE env var at build time
 */

import { Platform } from 'react-native';

/**
 * Determine the current build type
 * Priority: Android BuildConfig > iOS env var > __DEV__ flag > URL detection > default (prod)
 *
 * @returns {'qual'|'stage'|'beta'|'prod'} The current build type
 */
function getBuildType() {
  // Priority 1a: Android - Read from BuildConfig (set via Gradle flavor)
  // This is the most reliable method for Android as it's baked into the APK/AAB
  if (Platform.OS === 'android') {
    try {
      // Import BuildConfigModule from native module
      const { NativeModules } = require('react-native');
      const BuildConfigModule = NativeModules.BuildConfigModule;
      if (BuildConfigModule && BuildConfigModule.BUILD_TYPE_ENV) {
        const buildType = BuildConfigModule.BUILD_TYPE_ENV.toLowerCase();
        if (['qual', 'stage', 'beta', 'prod'].includes(buildType)) {
          return buildType;
        }
      }
    } catch (e) {
      // BuildConfig not available, fall through to other methods
      console.warn('[BuildConfig] Failed to read Android BuildConfigModule:', e);
    }
  }

  // Priority 1b: iOS - Read from Info.plist (set via fastlane before build)
  // This is the most reliable method for iOS as it's baked into the IPA
  if (Platform.OS === 'ios') {
    try {
      // Import RNCConfig (react-native-config) or use Info.plist reader
      const { NativeModules } = require('react-native');

      // Try to read from Info.plist via RNCConfig or custom module
      const BuildConfigModule = NativeModules.BuildConfigModule;

      // Debug: Log what we're getting from native module
      console.log('[BuildConfig] iOS Native Module:', JSON.stringify(BuildConfigModule));

      if (BuildConfigModule && BuildConfigModule.BUILD_TYPE_ENV) {
        const buildType = BuildConfigModule.BUILD_TYPE_ENV.toLowerCase();
        console.log('[BuildConfig] iOS BUILD_TYPE_ENV from native:', buildType);
        console.log('[BuildConfig] iOS DISPLAY_NAME from native:', BuildConfigModule.DISPLAY_NAME);
        if (['qual', 'stage', 'beta', 'prod'].includes(buildType)) {
          return buildType;
        }
      } else {
        console.log('[BuildConfig] iOS BuildConfigModule missing or no BUILD_TYPE_ENV');
      }
    } catch (e) {
      console.warn('[BuildConfig] iOS native module error:', e);
    }
  }

  // Priority 2: Web environment - detect from URL
  if (typeof window !== 'undefined') {
    try {
      // Safely access window.location
      const location = window.location;
      if (!location) {
        // window exists but location doesn't - fall through
      } else {
        const hostname = location.hostname || '';
        const href = location.href || '';

        // Local development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return 'qual';
        }

        // Check for environment-specific URLs
        if (href.includes('/qual/') || href.includes('qual.')) {
          return 'qual';
        }
        if (href.includes('/stage/') || href.includes('stage.')) {
          return 'stage';
        }
        if (href.includes('/beta/') || href.includes('beta.')) {
          return 'beta';
        }

        // Production (default for web if no specific environment detected)
        return 'prod';
      }
    } catch (e) {
      // Fallback if window.location access fails
      console.warn('[BuildConfig] Failed to detect web environment:', e);
    }
  }

  // Priority 3: React Native - use __DEV__ flag as fallback
  // Note: For production builds, the BUILD_TYPE should be set via:
  //   Android: ./gradlew assembleBetaRelease (sets BUILD_TYPE=beta)
  //   iOS: Select Beta scheme in Xcode (sets BUILD_TYPE=beta)
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      // __DEV__ is true in debug builds, false in release builds
      // If __DEV__ is undefined or true, default to QUAL for development
      const isDevelopment = typeof __DEV__ === 'undefined' ? true : __DEV__;

      // Debug builds or missing __DEV__ default to QUAL
      if (isDevelopment) {
        return 'qual';
      }

      // Release builds default to PROD if BUILD_TYPE not set
      // This ensures backward compatibility with existing release builds
      return 'prod';
    } catch (e) {
      console.warn('[BuildConfig] Failed to check __DEV__ flag:', e);
    }
  }

  // Default: production
  return 'prod';
}

/**
 * Get the API base URL for the current build type
 *
 * @param {string} buildType - The build type (qual, stage, beta, prod)
 * @returns {string} The API base URL
 */
function getApiUrl(buildType) {
  // Web localhost - use relative URL for webpack proxy
  if (typeof window !== 'undefined') {
    try {
      const location = window.location;
      if (location) {
        const hostname = location.hostname || '';
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return '/api/sync';
        }
      }
    } catch (e) {
      // Ignore window.location access errors
    }
  }

  // Map build types to API URLs
  const apiUrls = {
    qual: 'https://stackmap.app/qual/api/sync',
    stage: 'https://stackmap.app/qual/api/sync',  // Stage uses qual API (no separate stage deployment)
    beta: 'https://stackmap.app/beta/api/sync',
    prod: 'https://stackmap.app/api/sync'
  };

  return apiUrls[buildType] || apiUrls.prod;
}

/**
 * Get the current build type (runtime evaluation for testing)
 * @returns {'qual'|'stage'|'beta'|'prod'} The current build type
 */
function getCurrentBuildType() {
  return getBuildType();
}

/**
 * Get the current API URL (runtime evaluation for testing)
 * @returns {string} The API base URL
 */
function getCurrentApiUrl() {
  const buildType = getBuildType();
  return getApiUrl(buildType);
}

// Determine current build type (for compatibility with existing imports)
const BUILD_TYPE = getBuildType();
const API_URL = getApiUrl(BUILD_TYPE);

// Log configuration in development
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('[BuildConfig] Build Type:', BUILD_TYPE);
  console.log('[BuildConfig] API URL:', API_URL);
}

// Export configuration
export { BUILD_TYPE, API_URL, getCurrentBuildType, getCurrentApiUrl };

// Default export for convenience
export default {
  BUILD_TYPE,
  API_URL,
  getCurrentBuildType,
  getCurrentApiUrl
};
