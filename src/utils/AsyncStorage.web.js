// Web implementation of AsyncStorage using localStorage
const VERBOSE_LOGGING = true; // ENABLED FOR DEBUGGING RECOVERY PHRASE ISSUE
console.warn('[AsyncStorage.web] Module loaded at', new Date().toISOString());

// Test localStorage availability
const testLocalStorage = () => {
  try {
    const testKey = '__asyncstorage_test__';
    const testValue = Date.now().toString();
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    if (retrieved !== testValue) {
      console.error('[AsyncStorage.web] ❌ localStorage test failed!');
      return false;
    }
    console.warn('[AsyncStorage.web] ✅ localStorage test passed');
    return true;
  } catch (e) {
    console.error('[AsyncStorage.web] ❌ localStorage not available:', e);
    return false;
  }
};

const isLocalStorageAvailable = testLocalStorage();

// Memory fallback for critical data like recovery phrases
const memoryStorage = {};

const AsyncStorage = {
  getItem: key => {
    if (VERBOSE_LOGGING) console.warn(`[AsyncStorage.web] 🟢 getItem called for: ${key}`);
    return new Promise((resolve) => {
      // Use setTimeout to ensure async behavior
      setTimeout(() => {
        try {
          // Try localStorage first
          let value = localStorage.getItem(key);
          
          // Fallback to sessionStorage if localStorage fails
          if (value === null && typeof sessionStorage !== 'undefined') {
            value = sessionStorage.getItem(key);
            if (value !== null && VERBOSE_LOGGING) {
              console.warn(`[AsyncStorage.web] 📦 Found in sessionStorage: ${key}`);
            }
          }
          
          // Fallback to memory storage for critical keys
          if (value === null && key.includes('sync_phrase')) {
            value = memoryStorage[key];
            if (value !== null && VERBOSE_LOGGING) {
              console.warn(`[AsyncStorage.web] 🧠 Found in memory: ${key}`);
            }
          }
          
          if (VERBOSE_LOGGING) {
            console.warn(`[AsyncStorage.web] 🟢 getItem('${key}') = ${value ? value.substring(0, 50) + '...' : null}`);
          }
          resolve(value);
        } catch (error) {
          console.error('[AsyncStorage.web] getItem error:', error);
          // Try memory fallback on error
          const memValue = memoryStorage[key];
          resolve(memValue || null);
        }
      }, 0);
    });
  },

  setItem: (key, value) => {
    return new Promise((resolve, reject) => {
      try {
        // Always log during debugging
        console.warn(`[AsyncStorage.web] 🔵 setItem('${key}') = ${value ? value.substring(0, 50) + '...' : value}`);
        
        let storageSuccess = false;
        
        // Try localStorage first
        try {
          localStorage.setItem(key, value);
          
          // Verify it was actually stored
          const verification = localStorage.getItem(key);
          if (verification === value) {
            storageSuccess = true;
            console.warn(`[AsyncStorage.web] ✅ Successfully stored in localStorage: ${key}`);
          } else {
            console.error(`[AsyncStorage.web] ❌ localStorage verification failed for ${key}!`);
          }
        } catch (e) {
          console.error(`[AsyncStorage.web] ❌ localStorage.setItem failed for ${key}:`, e);
        }
        
        // Always store critical keys in sessionStorage as backup
        if (key.includes('sync_phrase')) {
          try {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(key, value);
              console.warn(`[AsyncStorage.web] 📦 Backed up to sessionStorage: ${key}`);
            }
          } catch (e) {
            console.warn(`[AsyncStorage.web] sessionStorage backup failed:`, e);
          }
          
          // Always store in memory as final fallback
          memoryStorage[key] = value;
          console.warn(`[AsyncStorage.web] 🧠 Backed up to memory: ${key}`);
        }
        
        // If localStorage completely failed, try sessionStorage
        if (!storageSuccess && typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.setItem(key, value);
            storageSuccess = true;
            console.warn(`[AsyncStorage.web] 📦 Fallback stored in sessionStorage: ${key}`);
          } catch (e) {
            console.error(`[AsyncStorage.web] sessionStorage also failed:`, e);
          }
        }
        
        // Final fallback to memory
        if (!storageSuccess) {
          memoryStorage[key] = value;
          console.warn(`[AsyncStorage.web] 🧠 Final fallback to memory storage: ${key}`);
        }
        
        resolve();
      } catch (error) {
        console.error('[AsyncStorage.web] setItem error:', error);
        reject(error);
      }
    });
  },

  removeItem: key => {
    return new Promise((resolve, reject) => {
      try {
        // Remove from all storage locations
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('[AsyncStorage.web] localStorage.removeItem failed:', e);
        }
        
        if (typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn('[AsyncStorage.web] sessionStorage.removeItem failed:', e);
          }
        }
        
        delete memoryStorage[key];
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  clear: () => {
    return new Promise((resolve, reject) => {
      try {
        localStorage.clear();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllKeys: () => {
    return new Promise((resolve) => {
      try {
        resolve(Object.keys(localStorage));
      } catch (error) {
        resolve([]);
      }
    });
  },

  multiGet: async keys => {
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch (error) {
      return [];
    }
  },

  multiSet: async keyValuePairs => {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      throw error;
    }
  },

  multiRemove: async keys => {
    try {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      throw error;
    }
  },
  
  // Add a unique property to verify this is our custom implementation
  __isCustomWebImplementation: true,
  
  // Debug function to check what's in all storage locations
  debugStorage: () => {
    console.warn('=== AsyncStorage Debug ===');
    console.warn('localStorage available:', isLocalStorageAvailable);
    
    // Check localStorage
    console.warn('Total items in localStorage:', localStorage.length);
    const localSyncItems = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('sync')) {
        const value = localStorage.getItem(key);
        localSyncItems.push({ key, value: value?.substring(0, 100), storage: 'localStorage' });
      }
    }
    console.warn('localStorage sync items:', localSyncItems);
    
    // Check sessionStorage
    if (typeof sessionStorage !== 'undefined') {
      const sessionSyncItems = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('sync')) {
          const value = sessionStorage.getItem(key);
          sessionSyncItems.push({ key, value: value?.substring(0, 100), storage: 'sessionStorage' });
        }
      }
      console.warn('sessionStorage sync items:', sessionSyncItems);
    }
    
    // Check memory storage
    const memoryItems = Object.keys(memoryStorage)
      .filter(key => key.includes('sync'))
      .map(key => ({ key, value: memoryStorage[key]?.substring(0, 100), storage: 'memory' }));
    console.warn('Memory sync items:', memoryItems);
    
    return { localSyncItems, memoryStorage: memoryItems };
  }
};

console.warn('[AsyncStorage.web] Exporting AsyncStorage with custom flag:', AsyncStorage.__isCustomWebImplementation);

// Make debug function globally available in browser console
if (typeof window !== 'undefined') {
  window.debugAsyncStorage = AsyncStorage.debugStorage;
  console.warn('💡 Type "debugAsyncStorage()" in console to see stored sync data');
}

export default AsyncStorage;
