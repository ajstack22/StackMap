// @ts-check
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Debounce timer for storage writes
let storageWriteTimer = null;
let pendingWrite = null;

// Platform-specific debounce delays for better performance
const DEBOUNCE_DELAY = Platform.select({
  ios: 500,     // iOS has severe AsyncStorage performance issues
  android: 100, // Android performs better
  web: 0,       // Web localStorage is synchronous, no debounce needed
  default: 100
});

// Storage adapter for React Native AsyncStorage with debounced writes
const storage = {
  getItem: async name => {
    // CRITICAL FIX: If there's a pending write, return that instead of stale storage
    if (pendingWrite && pendingWrite.name === name) {
      // Returning pending write instead of stale storage
      return pendingWrite.value;
    }

    try {
      const value = await AsyncStorage.getItem(name);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        // Error parsing stored value, clearing corrupted data
        await AsyncStorage.removeItem(name);
        return null;
      }
    } catch (error) {
      // Error reading from AsyncStorage
      return null;
    }
  },
  setItem: async (name, value) => {
    pendingWrite = { name, value };

    if (storageWriteTimer) {
      clearTimeout(storageWriteTimer);
    }

    // Only debounce on native platforms
    if (DEBOUNCE_DELAY > 0) {
      storageWriteTimer = setTimeout(async () => {
        if (pendingWrite) {
          try {
            await AsyncStorage.setItem(
              pendingWrite.name,
              JSON.stringify(pendingWrite.value),
            );
          } catch (error) {
            // Error writing to AsyncStorage
          }
          pendingWrite = null;
        }
      }, DEBOUNCE_DELAY);
    } else {
      // Web: Write immediately (synchronous localStorage)
      try {
        await AsyncStorage.setItem(name, JSON.stringify(value));
        pendingWrite = null;
      } catch (error) {
        // Error writing to AsyncStorage
      }
    }
  },
  removeItem: async name => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
    }
  },
};

/**
 * Sync store
 * Handles sync state and configuration
 */
const useSyncStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Sync State
        syncEnabled: false,
        syncStatus: 'idle',
        syncId: null,
        lastSync: null,
        syncError: null,

        // Sync Actions
        setSyncEnabled: enabled =>
          set({ syncEnabled: enabled }, false, 'setSyncEnabled'),
        setSyncStatus: status =>
          set({ syncStatus: status }, false, 'setSyncStatus'),
        setSyncId: id => set({ syncId: id }, false, 'setSyncId'),
        setLastSync: timestamp =>
          set({ lastSync: timestamp }, false, 'setLastSync'),
        setSyncError: error => set({ syncError: error }, false, 'setSyncError'),

        // Update sync state
        updateSyncState: updates =>
          set(
            state => ({
              ...state,
              ...updates,
            }),
            false,
            'updateSyncState',
          ),

        // Clear sync state
        clearSyncState: () =>
          set(
            {
              syncEnabled: false,
              syncStatus: 'idle',
              syncId: null,
              lastSync: null,
              syncError: null,
            },
            false,
            'clearSyncState',
          ),
      }),
      {
        name: 'stackmap-sync-storage',
        storage,
        partialize: state => ({
          syncEnabled: state.syncEnabled,
          syncStatus: state.syncStatus,
          syncId: state.syncId,
          lastSync: state.lastSync,
          syncError: state.syncError,
        }),
      },
    ),
    {
      name: 'SyncStore',
    },
  ),
);

export default useSyncStore;
