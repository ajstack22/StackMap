// Web implementation of AsyncStorage using localStorage

const AsyncStorage = {
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },
  
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      throw error;
    }
  },
  
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      throw error;
    }
  },
  
  clear: async () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('AsyncStorage clear error:', error);
      throw error;
    }
  },
  
  getAllKeys: async () => {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('AsyncStorage getAllKeys error:', error);
      return [];
    }
  },
  
  multiGet: async (keys) => {
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch (error) {
      console.error('AsyncStorage multiGet error:', error);
      return [];
    }
  },
  
  multiSet: async (keyValuePairs) => {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      console.error('AsyncStorage multiSet error:', error);
      throw error;
    }
  },
  
  multiRemove: async (keys) => {
    try {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('AsyncStorage multiRemove error:', error);
      throw error;
    }
  }
};

export default AsyncStorage;