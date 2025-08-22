// Web implementation of AsyncStorage using localStorage
const VERBOSE_LOGGING = false; // Set to true for debugging storage issues
if (VERBOSE_LOGGING) console.warn('[AsyncStorage.web] Module loaded at', new Date().toISOString());

const AsyncStorage = {
  getItem: key => {
    if (VERBOSE_LOGGING) console.warn(`[AsyncStorage.web] 🟢 getItem called for: ${key}`);
    return new Promise((resolve) => {
      // Use setTimeout to ensure async behavior
      setTimeout(() => {
        try {
          const value = localStorage.getItem(key);
          if (VERBOSE_LOGGING) {
            console.warn(`[AsyncStorage.web] 🟢 getItem('${key}') = ${value ? value.substring(0, 50) + '...' : null}`);
//             console.warn(`[AsyncStorage.web] 🟢 Resolving promise for ${key} with value:`, value);
          }
          resolve(value);
        } catch (error) {
//           console.error('[AsyncStorage.web] getItem error:', error);
          resolve(null);
        }
      }, 0);
    });
  },

  setItem: (key, value) => {
    return new Promise((resolve, reject) => {
      try {
        if (key.includes('@sync')) {
          if (VERBOSE_LOGGING) console.warn(`[AsyncStorage.web] setItem('${key}') = ${value ? value.substring(0, 20) + '...' : value}`);
        }
        localStorage.setItem(key, value);
        resolve();
      } catch (error) {
//         console.error('[AsyncStorage.web] setItem error:', error);
        reject(error);
      }
    });
  },

  removeItem: key => {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem(key);
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
};

if (VERBOSE_LOGGING) console.warn('[AsyncStorage.web] Exporting AsyncStorage with custom flag:', AsyncStorage.__isCustomWebImplementation);

export default AsyncStorage;
