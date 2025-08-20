/**
 * Central sync service export
 * Controls which sync implementation is used throughout the app
 */

// Toggle this to switch between implementations
// CHANGED: Switched back to complex sync (see /docs/sync/SYNC_SERVICE_COMPARISON.md)
const USE_SIMPLE_SYNC = false;

// Import both implementations
import complexSyncService from './syncService';
import simpleSyncService from './simpleSyncService';

// Export the chosen implementation
const syncService = USE_SIMPLE_SYNC ? simpleSyncService : complexSyncService;

// Log which service is being used
if (typeof console !== 'undefined') {
  console.log(`🔄 Using ${USE_SIMPLE_SYNC ? 'SIMPLE' : 'COMPLEX'} sync service`);
  if (USE_SIMPLE_SYNC) {
    console.log('ℹ️ Simple sync: Last-write-wins, atomic updates');
    console.log('💡 Enable debug: window.SYNC_DEBUG = true');
  }
}

// Add global helpers for debugging
if (typeof window !== 'undefined') {
  window.checkSyncStatus = () => {
    console.log('=== SYNC STATUS ===');
    console.log('Service type:', USE_SIMPLE_SYNC ? 'SIMPLE' : 'COMPLEX');
    console.log('Enabled:', syncService.enabled || syncService.syncEnabled || false);
    console.log('Sync ID:', syncService.syncId || syncService.getSyncId?.() || 'none');
    console.log('In progress:', syncService.syncInProgress || false);
    
    if (syncService.enabled || syncService.syncEnabled) {
      console.log('✅ Sync is ACTIVE');
      console.log('To force sync now: window.syncService.sync()');
    } else {
      console.log('❌ Sync is NOT enabled');
      console.log('Enable in: Settings > Data > Sync');
    }
    return syncService;
  };
  
  window.syncService = syncService;
  window.forceSync = () => {
    console.log('Forcing sync now...');
    return syncService.sync ? syncService.sync() : syncService.requestSync();
  };
}

export default syncService;