/**
 * Central sync service export
 * Controls which sync implementation is used throughout the app
 */

// Toggle this to switch between implementations
const USE_SIMPLE_SYNC = true;

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

export default syncService;