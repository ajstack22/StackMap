import { useEffect, useRef } from 'react';
import { useAppStore, useUserStore, useSettingsStore, useLibraryStore } from '../stores';
import syncService from '../services/sync/syncServiceSimple';

/**
 * Hook to automatically sync when store changes
 */
export const useSyncOnChange = () => {
  const lastStateRef = useRef(null);

  useEffect(() => {
    // Subscribe to all relevant stores
    const unsubscribeApp = useAppStore.subscribe(() => {
      handleStateChange();
    });
    
    const unsubscribeUser = useUserStore.subscribe(() => {
      handleStateChange();
    });
    
    const unsubscribeSettings = useSettingsStore.subscribe(() => {
      handleStateChange();
    });
    
    const unsubscribeLibrary = useLibraryStore.subscribe(() => {
      handleStateChange();
    });

    function handleStateChange() {
      // Skip if sync is not enabled
      if (!syncService.syncEnabled) return;

      // Get current state snapshot from all stores
      const appState = useAppStore.getState();
      const userState = useUserStore.getState();
      const settingsState = useSettingsStore.getState();
      const libraryState = useLibraryStore.getState();
      
      const currentState = {
        users: userState.users,
        currentUser: userState.currentUser,
        library: libraryState.library,
        currentTheme: settingsState.currentTheme,
        bannerPosition: settingsState.bannerPosition,
        soundEnabled: settingsState.soundEnabled,
        taskCelebration: settingsState.taskCelebration,
        routineCelebration: settingsState.routineCelebration,
      };

      // Check if state actually changed
      if (
        lastStateRef.current &&
        JSON.stringify(lastStateRef.current) !== JSON.stringify(currentState)
      ) {
        // Log what changed for debugging
        console.log('[useSyncOnChange] State changed, requesting sync', {
          usersChanged:
            JSON.stringify(lastStateRef.current.users) !==
            JSON.stringify(currentState.users),
          libraryChanged:
            JSON.stringify(lastStateRef.current.library) !==
            JSON.stringify(currentState.library),
          syncEnabled: syncService.syncEnabled,
        });

        // Request debounced sync (simpler API)
        syncService.requestSync();
      }

      lastStateRef.current = currentState;
    }

    return () => {
      unsubscribeApp();
      unsubscribeUser();
      unsubscribeSettings();
      unsubscribeLibrary();
    };
  }, []);
};
