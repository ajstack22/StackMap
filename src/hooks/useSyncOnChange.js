import { useEffect, useRef } from 'react';
import { useAppStore, useUserStore, useSettingsStore, useLibraryStore } from '../stores';
import syncService from '../services/sync';

/**
 * Hook to automatically sync when store changes
 */
export const useSyncOnChange = () => {
  const lastStateRef = useRef(null);

  useEffect(() => {
    // Function to get current state from all stores
    const getCurrentState = () => {
      const userStore = useUserStore.getState();
      const settingsStore = useSettingsStore.getState();
      const libraryStore = useLibraryStore.getState();
      const appStore = useAppStore.getState();
      
      return {
        // User store data
        users: userStore.users,
        currentUser: userStore.currentUser,
        currentDay: userStore.currentDay,
        // Settings store data
        currentTheme: settingsStore.currentTheme,
        bannerPosition: settingsStore.bannerPosition,
        soundEnabled: settingsStore.soundEnabled,
        taskCelebration: settingsStore.taskCelebration,
        routineCelebration: settingsStore.routineCelebration,
        // Library store data
        library: libraryStore.library,
        libraryTemplates: libraryStore.libraryTemplates,
        // App store data (legacy)
        activities: appStore.activities,
        completedActivities: appStore.completedActivities,
      };
    };

    // Subscribe to all stores
    const unsubscribes = [];
    
    // Common sync trigger function
    const triggerSyncIfNeeded = () => {
      // Skip if sync is not enabled (check both property names for compatibility)
      if (!syncService.enabled && !syncService.syncEnabled) {
        return;
      }
      
      // CRITICAL: Skip if we just joined a sync to prevent race conditions
      if (syncService._justJoinedSync) {
        return;
      }
      
      // CRITICAL: Skip if we're applying remote state to prevent feedback loop
      if (syncService._applyingRemoteState) {
        return;
      }
      
      // Skip if sync is already in progress to prevent race conditions
      if (syncService.syncInProgress) {
        return;
      }

      const currentState = getCurrentState();

      // Check if state actually changed
      if (
        lastStateRef.current &&
        JSON.stringify(lastStateRef.current) !== JSON.stringify(currentState)
      ) {
        // Log what changed for debugging

        // Request debounced sync with 5 second delay to allow for AsyncStorage debounce
        syncService
          .requestSync({
            priority: 'normal',
            immediate: false,
            delay: 5000, // Wait 5 seconds to ensure AsyncStorage has written
          })
          .catch(error => {
          });
      }

      lastStateRef.current = currentState;
    };

    // Subscribe to each store
    unsubscribes.push(useUserStore.subscribe(triggerSyncIfNeeded));
    unsubscribes.push(useSettingsStore.subscribe(triggerSyncIfNeeded));
    unsubscribes.push(useLibraryStore.subscribe(triggerSyncIfNeeded));
    unsubscribes.push(useAppStore.subscribe(triggerSyncIfNeeded));

    // Initialize lastStateRef
    lastStateRef.current = getCurrentState();

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);
};
