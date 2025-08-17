// Web implementation of react-native-keychain using localStorage

const Keychain = {
  setInternetCredentials: async (server, username, password) => {
    try {
      const key = `keychain_${server}_${username}`;
      localStorage.setItem(key, password);
      return true;
    } catch (error) {
      return false;
    }
  },

  getInternetCredentials: async server => {
    try {
      // Find any credentials for this server
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(`keychain_${server}_`)) {
          const username = key.replace(`keychain_${server}_`, '');
          const password = localStorage.getItem(key);
          return { username, password };
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  resetInternetCredentials: async server => {
    try {
      const keys = Object.keys(localStorage);

      let removed = false;
      for (const key of keys) {
        if (key.startsWith(`keychain_${server}_`)) {
          localStorage.removeItem(key);
          removed = true;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  },
};

// Export as both default and named exports for compatibility
export default Keychain;
export const setInternetCredentials = Keychain.setInternetCredentials;
export const getInternetCredentials = Keychain.getInternetCredentials;
export const resetInternetCredentials = Keychain.resetInternetCredentials;
