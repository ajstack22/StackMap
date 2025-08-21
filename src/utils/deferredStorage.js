// @ts-check
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * Deferred AsyncStorage wrapper to prevent iOS UI freezing
 * Batches writes and executes them on the next tick
 */
class DeferredStorage {
  constructor() {
    this.pendingWrites = new Map();
    this.writeTimer = null;
    // Use immediate writes on non-iOS platforms
    this.shouldDefer = Platform.OS === 'ios';
  }

  /**
   * Set an item in storage (deferred on iOS)
   * @param {string} key 
   * @param {string} value 
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    if (!this.shouldDefer) {
      // Direct write on Android/Web
      return AsyncStorage.setItem(key, value);
    }

    // Queue the write for iOS
    this.pendingWrites.set(key, value);
    
    // Clear any existing timer
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    // Schedule batch write on next tick
    return new Promise((resolve) => {
      this.writeTimer = setTimeout(async () => {
        await this.flushWrites();
        resolve();
      }, 0);
    });
  }

  /**
   * Set multiple items at once (more efficient)
   * @param {Array<[string, string]>} keyValuePairs 
   * @returns {Promise<void>}
   */
  async multiSet(keyValuePairs) {
    if (!this.shouldDefer) {
      return AsyncStorage.multiSet(keyValuePairs);
    }

    // Add all to pending writes
    keyValuePairs.forEach(([key, value]) => {
      this.pendingWrites.set(key, value);
    });

    // Clear any existing timer
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    // Schedule batch write
    return new Promise((resolve) => {
      this.writeTimer = setTimeout(async () => {
        await this.flushWrites();
        resolve();
      }, 0);
    });
  }

  /**
   * Flush all pending writes
   * @returns {Promise<void>}
   */
  async flushWrites() {
    if (this.pendingWrites.size === 0) {
      return;
    }

    const writes = Array.from(this.pendingWrites.entries());
    this.pendingWrites.clear();
    this.writeTimer = null;

    try {
      // Use multiSet for efficiency
      await AsyncStorage.multiSet(writes);
    } catch (error) {
      console.error('[DeferredStorage] Failed to flush writes:', error);
      // Re-add failed writes to queue
      writes.forEach(([key, value]) => {
        this.pendingWrites.set(key, value);
      });
      throw error;
    }
  }

  /**
   * Get an item from storage (always direct)
   * @param {string} key 
   * @returns {Promise<string | null>}
   */
  async getItem(key) {
    // Always read directly
    return AsyncStorage.getItem(key);
  }

  /**
   * Remove an item from storage
   * @param {string} key 
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    // Remove from pending writes if present
    this.pendingWrites.delete(key);
    return AsyncStorage.removeItem(key);
  }

  /**
   * Get all keys
   * @returns {Promise<readonly string[]>}
   */
  async getAllKeys() {
    return AsyncStorage.getAllKeys();
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    this.pendingWrites.clear();
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    return AsyncStorage.clear();
  }
}

// Export singleton instance
export default new DeferredStorage();