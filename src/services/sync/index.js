/**
 * Central sync service export
 * CRDT-based sync implementation (August 2025)
 */

// Import the CRDT sync service
import crdtSyncService from './syncServiceV2';

// Use CRDT sync as the default
const syncService = crdtSyncService;
console.log('[Sync] Using CRDT-based sync (conflict-free, 800 lines)');

// Keep old implementations available for emergency rollback if needed
import complexSyncService from './syncService';
import simpleSyncService from './simpleSyncService';

// Development helpers for testing and emergency rollback
if (__DEV__ && typeof window !== 'undefined') {
  // Test CRDT implementation
  window.testCRDT = async () => {
    console.log('🧪 Running CRDT tests...');
    const testModule = await import('./testCRDT');
    testModule.default.runTests();
  };
  
  // Emergency rollback to old sync if needed
  window.useOldSync = () => {
    console.warn('⚠️ Emergency rollback to complex sync - for debugging only!');
    console.warn('This requires modifying src/services/sync/index.js');
    return 'To rollback: Change line 10 to: const syncService = complexSyncService;';
  };
  
  // Check sync status
  window.syncStatus = () => {
    console.log('Current sync: CRDT V2 (default)');
    console.log('Commands:');
    console.log('  window.testCRDT()    - Run CRDT tests');
    console.log('  window.syncStatus()  - Show sync status');
    console.log('  window.useOldSync()  - Instructions for emergency rollback');
    
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