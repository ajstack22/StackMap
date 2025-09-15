// @ts-check
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debounce timer for storage writes
let storageWriteTimer = null;
let pendingWrite = null;

// Storage adapter for React Native AsyncStorage with debounced writes
const storage = {
  getItem: async name => {
    try {
      const value = await AsyncStorage.getItem(name);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
//           'Error parsing stored value, clearing corrupted data:',
//           parseError,
//         );
        await AsyncStorage.removeItem(name);
        return null;
      }
    } catch (error) {
      return null;
    }
  },
  setItem: async (name, value) => {
    pendingWrite = { name, value };

    if (storageWriteTimer) {
      clearTimeout(storageWriteTimer);
    }

    storageWriteTimer = setTimeout(async () => {
      if (pendingWrite) {
        try {
          await AsyncStorage.setItem(
            pendingWrite.name,
            JSON.stringify(pendingWrite.value),
          );
        } catch (error) {
        }
        pendingWrite = null;
      }
    }, 1000);
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
