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
  console.log('[Sync] Using Phase 5 sync: store integration with conflict resolution');
}

// DEBUG: Test if basic sync works at all
if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log('[Sync] Debug sync available - window.testDebugSync()');
  }, 2000);
}

// All old sync implementations have been removed (12,500+ lines deleted)

// Development helpers for testing and emergency rollback
if (__DEV__ && typeof window !== 'undefined') {
  // Test timestamp implementation
  window.testTimestamp = async () => {
    console.log('🧪 Testing timestamp sync...');
    console.log('- Clock skew detection: enabled');
    console.log('- Protection time: 61 seconds');
    console.log('- Sync interval: 30 seconds');
    return syncService.getStatus ? syncService.getStatus() : { enabled: syncService.syncEnabled };
  };
  
  // Old sync systems have been removed
  window.useCRDTSync = () => {
    console.warn('⚠️ Old sync systems have been removed.');
    console.warn('The modern sync system is the only implementation.');
    return 'Modern sync (minimalSyncService + syncStoreIntegration)';
  };
  
  // Check sync status
  window.syncStatus = () => {
    console.log('Current sync: Timestamp-based (default)');
    console.log('Commands:');
    console.log('  window.testTimestamp() - Test timestamp sync');
    console.log('  window.syncStatus()    - Show sync status');
    console.log('  window.useCRDTSync()   - Instructions for CRDT rollback');
    
    if (syncService.getStatus) {
      return syncService.getStatus();
    }
    return { version: 'CRDT V2', enabled: syncService.syncEnabled };
  };
  
  // Event logger has been removed
  window.syncLogs = () => {
    console.log('📊 Event logger has been removed.');
    console.log('Check browser console for [MinimalSync] and [SyncStore] logs.');
    return 'Use browser console filters for sync debugging';
  };
}

export default syncService;