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

// Old implementations - kept for emergency rollback only
// If rollback is needed, uncomment these lines:
// import crdtSyncService from './syncServiceV2';
// import complexSyncService from './syncService';
// import simpleSyncService from './simpleSyncService';

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
  
  // Emergency rollback to CRDT version
  window.useCRDTSync = () => {
    console.warn('⚠️ To rollback to CRDT sync:');
    console.warn('1. Uncomment crdtSyncService import in src/services/sync/index.js');
    console.warn('2. Change line 10 to: const syncService = crdtSyncService;');
    return 'Timestamp sync is the current implementation';
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
  
  // Show event logger status
  window.syncLogs = () => {
    const eventLogger = require('./eventLogger').default;
    const events = eventLogger.getRecentEvents();
    console.log(`📊 Recent sync events (${events.length})`);
    events.slice(-20).forEach(e => {
      console.log(`${new Date(e.timestamp).toISOString().slice(11,19)} ${e.category}:${e.action}`, e);
    });
    return events;
  };
}

export default syncService;