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
      console.log('Simple sync not enabled. Set window.USE_SIMPLE_SYNC = true to enable');
      return;
    }

    console.log('🚀 SIMPLE SYNC ENABLED - Using simplified sync logic');
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

// Helper to enable simple sync from console
if (typeof window !== 'undefined') {
  window.enableSimpleSync = async (recoveryPhrase) => {
    if (!recoveryPhrase) {
      console.log('Usage: enableSimpleSync("your-32-character-recovery-phrase")');
      return;
    }
    
    window.USE_SIMPLE_SYNC = true;
    const simpleSyncService = require('../services/sync/simpleSyncService').default;
    const syncDebugger = require('../utils/syncDebugger').default;
    
    syncDebugger.enable();
    await simpleSyncService.enable(recoveryPhrase);
    
    console.log('✅ Simple sync enabled!');
    console.log('To sync manually: simpleSyncService.sync()');
    console.log('To see debug logs: syncDebugger.showHistory()');
    console.log('To compare states: syncDebugger.compareStates(state1, state2)');
    
    // Make service available globally for debugging
    window.simpleSyncService = simpleSyncService;
    window.syncDebugger = syncDebugger;
  };

  window.testSimpleSync = () => {
    console.log('=== SIMPLE SYNC TEST MODE ===');
    console.log('1. Enable debug mode: window.SYNC_DEBUG = true');
    console.log('2. Enable simple sync: window.USE_SIMPLE_SYNC = true');
    console.log('3. Set recovery phrase: enableSimpleSync("your-phrase-here")');
    console.log('4. Make changes and watch the console for sync logs');
    console.log('5. Check sync history: syncDebugger.showHistory()');
    console.log('6. Force sync: simpleSyncService.sync()');
  };
}