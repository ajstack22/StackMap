/**
 * FIXED SYNC SERVICE
 * 
 * This addresses the core issue: ensuring data persists after being received from server
 * Key fix: Force immediate persistence after applying state
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore, useSettingsStore, useLibraryStore } from '../../stores';

class FixedSyncService {
  constructor() {
    console.log('[FixedSync] Service initialized');
  }

  /**
   * Apply sync data and FORCE immediate persistence
   * This is the critical fix - ensuring data is saved before any refresh can happen
   */
  async applyAndPersistState(syncData) {
    console.log('[FixedSync] Applying state from sync...');
    
    try {
      // 1. Apply to stores
      const userStore = useUserStore.getState();
      const settingsStore = useSettingsStore.getState();
      const libraryStore = useLibraryStore.getState();

      if (syncData.users) {
        userStore.setUsers(syncData.users);
        console.log('[FixedSync] Applied users:', Object.keys(syncData.users).length);
      }
      
      if (syncData.currentUser !== undefined) {
        userStore.setCurrentUser(syncData.currentUser);
      }
      
      if (syncData.currentDay) {
        userStore.setCurrentDay(syncData.currentDay);
      }

      if (syncData.settings) {
        settingsStore.updateSettings(syncData.settings);
        console.log('[FixedSync] Applied settings');
      }

      if (syncData.library) {
        libraryStore.setLibrary(syncData.library);
        console.log('[FixedSync] Applied library');
      }

      // 2. CRITICAL FIX: Force immediate persistence
      console.log('[FixedSync] Forcing immediate persistence...');
      
      // Method 1: If stores have persist.flush() (Zustand persist middleware)
      const stores = [useUserStore, useSettingsStore, useLibraryStore];
      for (const store of stores) {
        if (store.persist && typeof store.persist.flush === 'function') {
          await store.persist.flush();
          console.log('[FixedSync] ✅ Flushed:', store.persist.name || 'store');
        }
      }

      // Method 2: Direct AsyncStorage write as backup
      // This ensures data is saved even if persist middleware has issues
      const stateToSave = {
        users: useUserStore.getState().users,
        currentUser: useUserStore.getState().currentUser,
        currentDay: useUserStore.getState().currentDay,
        settings: useSettingsStore.getState(),
        library: useLibraryStore.getState(),
        timestamp: Date.now()
      };

      await AsyncStorage.setItem('@sync_backup_state', JSON.stringify(stateToSave));
      console.log('[FixedSync] ✅ Backup state saved to AsyncStorage');

      // 3. Verify persistence
      const verify = await AsyncStorage.getItem('@sync_backup_state');
      if (verify) {
        console.log('[FixedSync] ✅ Persistence verified - data will survive refresh');
        return true;
      } else {
        console.error('[FixedSync] ❌ Persistence verification failed');
        return false;
      }

    } catch (error) {
      console.error('[FixedSync] Error applying state:', error);
      return false;
    }
  }

  /**
   * Restore state on app startup (if stores are empty but we have backup)
   */
  async restoreFromBackup() {
    try {
      const backup = await AsyncStorage.getItem('@sync_backup_state');
      if (backup) {
        const state = JSON.parse(backup);
        console.log('[FixedSync] Restoring from backup, timestamp:', new Date(state.timestamp).toISOString());
        
        // Check if stores are empty (indicating a refresh happened)
        const currentUsers = useUserStore.getState().users;
        if (!currentUsers || Object.keys(currentUsers).length === 0) {
          // Restore the backup
          await this.applyAndPersistState(state);
          console.log('[FixedSync] ✅ Backup restored after refresh');
          return true;
        }
      }
    } catch (error) {
      console.error('[FixedSync] Error restoring backup:', error);
    }
    return false;
  }

  /**
   * Test helper: Simulate receiving sync data
   */
  async testReceiveData(testData) {
    console.log('[FixedSync] TEST: Simulating data receive...');
    
    const syncData = {
      users: {
        'user_1': {
          name: 'Test User',
          icon: '👤',
          days: {
            today: {
              activities: testData.activities.map((text, i) => ({
                id: `test_${i}`,
                text,
                icon: '✓',
                completed: false
              }))
            }
          }
        }
      },
      currentUser: 'user_1',
      currentDay: 'today',
      settings: {
        themeColor: '#4A90E2'
      },
      timestamp: Date.now()
    };

    const success = await this.applyAndPersistState(syncData);
    if (success) {
      console.log('[FixedSync] ✅ Test data applied and persisted successfully');
    } else {
      console.log('[FixedSync] ❌ Test data persistence failed');
    }
    return success;
  }

  /**
   * Clear backup data
   */
  async clearBackup() {
    await AsyncStorage.removeItem('@sync_backup_state');
    console.log('[FixedSync] Backup cleared');
  }
}

export default new FixedSyncService();