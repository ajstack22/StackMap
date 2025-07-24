import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores';
import syncService from '../services/sync/syncService';

/**
 * Hook to automatically sync when store changes
 */
export const useSyncOnChange = () => {
  const lastStateRef = useRef(null);
  
  useEffect(() => {
    // Subscribe to specific state changes that should trigger sync
    const unsubscribe = useAppStore.subscribe(
      (state) => {
        // Skip if sync is not enabled
        if (!syncService.syncEnabled) return;
        
        // Get current state snapshot
        const currentState = {
          activities: state.activities,
          users: state.users,
          completedActivities: state.completedActivities,
          currentUser: state.currentUser,
          currentTheme: state.currentTheme,
          bannerPosition: state.bannerPosition,
          soundEnabled: state.soundEnabled,
          taskCelebration: state.taskCelebration,
          routineCelebration: state.routineCelebration,
          currentDay: state.currentDay
        };
        
        // Check if state actually changed
        if (lastStateRef.current && 
            JSON.stringify(lastStateRef.current) !== JSON.stringify(currentState)) {
          console.log('State changed, requesting sync');
          
          // Request debounced sync
          syncService.requestSync({ 
            priority: 'normal',
            immediate: false 
          }).catch(error => {
            console.error('Auto-sync failed:', error);
          });
        }
        
        lastStateRef.current = currentState;
      }
    );
    
    return () => unsubscribe();
  }, []);
};