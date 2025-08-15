// Web implementation of AsyncStorage using localStorage

const AsyncStorage = {
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      throw error;
    }
  },
  
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      throw error;
    }
  },
  
  clear: async () => {
    try {
      localStorage.clear();
    } catch (error) {
      throw error;
    }
  },
  
  getAllKeys: async () => {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      return [];
    }
  },
  
  multiGet: async (keys) => {
    try {
      return keys.map(key => [key, localStorage.getItem(key)]);
    } catch (error) {
      return [];
    }
  },
  
  multiSet: async (keyValuePairs) => {
    try {
      keyValuePairs.forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    } catch (error) {
      throw error;
    }
  },
  
  multiRemove: async (keys) => {
    try {
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      throw error;
    }
  }
};

export default AsyncStorage;