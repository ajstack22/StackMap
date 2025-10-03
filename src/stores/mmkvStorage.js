import { MMKV } from 'react-native-mmkv';

// Create MMKV instance - 30x faster than AsyncStorage!
const storage = new MMKV({
  id: 'stackmap-storage',
  encryptionKey: undefined, // Add encryption if needed
});

/**
 * Zustand storage adapter for MMKV
 * @description Provides a storage interface compatible with Zustand persist middleware
 * @type {Object}
 */
export const mmkvStorage = {
  /**
   * Retrieves an item from MMKV storage
   * @param {string} name - The key to retrieve
   * @returns {any} The parsed JSON value or null if not found
   */
  getItem: name => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  /**
   * Stores an item in MMKV storage
   * @param {string} name - The key to store under
   * @param {any} value - The value to store (will be JSON stringified)
   * @returns {void}
   */
  setItem: (name, value) => {
    storage.set(name, JSON.stringify(value));
  },
  /**
   * Removes an item from MMKV storage
   * @param {string} name - The key to remove
   * @returns {void}
   */
  removeItem: name => {
    storage.delete(name);
  },
};

/**
 * Migration helper from AsyncStorage to MMKV
 * @description Migrates existing data from AsyncStorage to MMKV for improved performance
 * @returns {Promise<void>}
 * @throws {Error} Silently fails if AsyncStorage is not available
 */
export const migrateFromAsyncStorage = async () => {
  try {
    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;
    const existingData = await AsyncStorage.getItem('stackmap-storage');

    if (existingData && !storage.contains('migrated')) {
      storage.set('stackmap-storage', existingData);
      storage.set('migrated', true);
      await AsyncStorage.removeItem('stackmap-storage');
    }
  } catch (error) {
    // Migration is optional - silently fail if AsyncStorage not available
    if (__DEV__) {
      console.warn('[MMKV] Migration skipped:', error.message);
    }
  }
};
