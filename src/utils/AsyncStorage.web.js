// Web implementation of AsyncStorage using localStorage
const VERBOSE_LOGGING = false; // Set to true for debugging

// Test localStorage availability
const testLocalStorage = () => {
  try {
    const testKey = '__asyncstorage_test__';
    const testValue = Date.now().toString();
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    if (retrieved !== testValue) {
      return false;
    }
    // localStorage test passed
    return true;
  } catch (e) {
    return false;
  }
};

const isLocalStorageAvailable = testLocalStorage();

// Memory fallback for critical data like recovery phrases
const memoryStorage = {};

const AsyncStorage = {
  getItem: key => {
    // getItem called
    return new Promise((resolve) => {
      // Use setTimeout to ensure async behavior
      setTimeout(() => {
        try {
          // Try localStorage first
          let value = localStorage.getItem(key);
          
          // Fallback to sessionStorage if localStorage fails
          if (value === null && typeof sessionStorage !== 'undefined') {
            value = sessionStorage.getItem(key);
            // Found in sessionStorage
          }
          
          // Fallback to memory storage for critical keys
          if (value === null && key.includes('sync_phrase')) {
            value = memoryStorage[key];
            // Found in memory
          }
          
          // getItem complete
          resolve(value);
        } catch (error) {
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
        // setItem called
        
        let storageSuccess = false;
        
        // Try localStorage first
        try {
          localStorage.setItem(key, value);
          
          // Verify it was actually stored
          const verification = localStorage.getItem(key);
          if (verification === value) {
            storageSuccess = true;
            // Successfully stored in localStorage
          } else {
          }
        } catch (e) {
        }
        
        // Always store critical keys in sessionStorage as backup
        if (key.includes('sync_phrase')) {
          try {
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem(key, value);
              // Backed up to sessionStorage
            }
          } catch (e) {
            
          }
          
          // Always store in memory as final fallback
          memoryStorage[key] = value;
          // Backed up to memory
        }
        
        // If localStorage completely failed, try sessionStorage
        if (!storageSuccess && typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.setItem(key, value);
            storageSuccess = true;
            // Fallback stored in sessionStorage
          } catch (e) {
          }
        }
        
        // Final fallback to memory
        if (!storageSuccess) {
          memoryStorage[key] = value;
          // Final fallback to memory storage
        }
        
        resolve();
      } catch (error) {
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
          
        }
        
        if (typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            
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
    
    
    
    // Check localStorage
    
    const localSyncItems = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('sync')) {
        const value = localStorage.getItem(key);
        localSyncItems.push({ key, value: value?.substring(0, 100), storage: 'localStorage' });
      }
    }
    
    
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
      
    }
    
    // Check memory storage
    const memoryItems = Object.keys(memoryStorage)
      .filter(key => key.includes('sync'))
      .map(key => ({ key, value: memoryStorage[key]?.substring(0, 100), storage: 'memory' }));
    
    
    return { localSyncItems, memoryStorage: memoryItems };
  }
};



// Make debug function globally available in browser console
if (typeof window !== 'undefined') {
  window.debugAsyncStorage = AsyncStorage.debugStorage;
  
}

export default AsyncStorage;
