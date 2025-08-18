import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Type helpers for tweetnacl-util with proper casting
const encodeBase64 = (arr) =>
  (util).encodeBase64(arr);
const decodeBase64 = (str) =>
  (util).decodeBase64(str);
// const encodeUTF8 = (arr) => (util).encodeUTF8(arr); // Unused
const decodeUTF8 = (str) => (util).decodeUTF8(str);

import encryptionService from './encryptionService';
import { useAppStore } from '../../stores';
import syncQueue from './syncQueue';
import networkMonitor from './networkMonitor';
import changeTracker from './changeTracker';
import syncThrottle from './syncThrottle';
import conflictResolver from './conflictResolver';
import syncHistory from './syncHistory';
import {
  validateSyncedData,
  repairSyncedData,
  validateIncrementalSync,
} from './dataValidator';
// Types imported but not all used directly - kept for documentation

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = () => {
  // For iOS/Android development builds, use qual environment
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return 'https://stackmap.app/qual/api/sync';
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // For local development
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'https://stackmap.app/api/sync';
    }
    // Check if we're in qual environment
    if (window.location.pathname.startsWith('/qual')) {
      return 'https://stackmap.app/qual/api/sync';
    }
  }
  // Default to production API
  return 'https://stackmap.app/api/sync';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Get share API URL based on environment
 */
const getShareApiUrl = () => {
  // For iOS/Android development builds, use qual environment
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return 'https://stackmap.app/qual/api/sync';
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // For local development
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'https://stackmap.app/api/sync';
    }
    // Check if we're in qual environment
    if (window.location.pathname.startsWith('/qual')) {
      return 'https://stackmap.app/qual/api/sync';
    }
  }
  // Default to production API
  return 'https://stackmap.app/api/sync';
};

const SHARE_API_URL = getShareApiUrl();

