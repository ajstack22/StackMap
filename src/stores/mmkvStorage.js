const { MMKV } = require('react-native-mmkv');

// Create MMKV instance - 30x faster than AsyncStorage!
const storage = new MMKV({
  id: 'stackmap-storage',
  encryptionKey: undefined, // Add encryption if needed
});

// Zustand storage adapter for MMKV
export const mmkvStorage = {
  getItem: name => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name, value) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: name => {
    storage.delete(name);
  },
};

// Migration helper from AsyncStorage to MMKV
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
  } catch (error) {}
};
