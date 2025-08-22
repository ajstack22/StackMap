// @ts-check
/**
 * Hook to use simple sync service with debugging
 * Enable with: window.USE_SIMPLE_SYNC = true
 */

import { useEffect, useRef } from 'react';
import { useUserStore, useSettingsStore, useLibraryStore } from '../stores';
import simpleSyncService from '../services/sync/simpleSyncService';
import syncDebugger from '../utils/syncDebugger';

export const useSimpleSync = () => {
  const lastStateHash = useRef(null);
  const syncTimer = useRef(null);

  useEffect(() => {
    // Check if simple sync is enabled
    const useSimple = (typeof window !== 'undefined' && window.USE_SIMPLE_SYNC) || 
                      (typeof global !== 'undefined' && global.USE_SIMPLE_SYNC);
    
    if (!useSimple) {

      return;
    }

    syncDebugger.enable();

    // Restore sync state
    simpleSyncService.restoreState();

    // Function to detect state changes
    const checkForChanges = () => {
      if (!simpleSyncService.enabled) return;

      const userStore = useUserStore.getState();
      const settingsStore = useSettingsStore.getState();
      const libraryStore = useLibraryStore.getState();

      // Create a simple hash of critical state
      const stateHash = JSON.stringify({
        users: userStore.users,
        currentUser: userStore.currentUser,
        currentDay: userStore.currentDay,
        theme: settingsStore.currentTheme,
        library: libraryStore.library?.categories?.length
      });

      if (lastStateHash.current && stateHash !== lastStateHash.current) {
        syncDebugger.log('STATE', 'Local state changed, scheduling sync');
        
        // Clear existing timer
        if (syncTimer.current) {
          clearTimeout(syncTimer.current);
        }

        // Wait 3 seconds for changes to settle, then sync
        syncTimer.current = setTimeout(() => {
          simpleSyncService.requestSync().then(result => {
            if (result.success) {
              syncDebugger.log('STATE', `Sync completed: ${result.action}`, result);
            }
          });
        }, 3000);
      }

      lastStateHash.current = stateHash;
    };

    // Subscribe to all stores
    const unsubscribes = [
      useUserStore.subscribe(checkForChanges),
      useSettingsStore.subscribe(checkForChanges),
      useLibraryStore.subscribe(checkForChanges)
    ];

    // Initial state
    lastStateHash.current = JSON.stringify({
      users: useUserStore.getState().users,
      currentUser: useUserStore.getState().currentUser,
      currentDay: useUserStore.getState().currentDay,
      theme: useSettingsStore.getState().currentTheme,
      library: useLibraryStore.getState().library?.categories?.length
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    };
  }, []);
};

// Production build - no debug helpers exposed