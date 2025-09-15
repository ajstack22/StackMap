/**
 * Central sync service export
 * Phase 5: Production sync with conflict resolution (August 2025)
 * Build: 2025.08.29.39
 */

// Import the new integrated sync service with conflict resolution
import syncStoreIntegration from './syncStoreIntegration';

// DEBUG: Import minimal test sync
import debugSync from './debugSync';

// Use the new sync store integration as the default
const syncService = syncStoreIntegration;
if (__DEV__) {
}

// DEBUG: Test if basic sync works at all
if (typeof window !== 'undefined') {
  setTimeout(() => {
  }, 2000);
}

// All old sync implementations have been removed (12,500+ lines deleted)

// Development helpers for testing and emergency rollback
if (__DEV__ && typeof window !== 'undefined') {
  // Test timestamp implementation
  window.testTimestamp = async () => {
    return syncService.getStatus ? syncService.getStatus() : { enabled: syncService.syncEnabled };
  };
  
  // Old sync systems have been removed
  window.useCRDTSync = () => {
    
    
    return 'Modern sync (minimalSyncService + syncStoreIntegration)';
  };
  
  // Check sync status
  window.syncStatus = () => {
    
    if (syncService.getStatus) {
      return syncService.getStatus();
    }
    return { version: 'CRDT V2', enabled: syncService.syncEnabled };
  };
  
  // Event logger has been removed
  window.syncLogs = () => {
    return 'Use browser console filters for sync debugging';
  };
}

export default syncService;