// Debug script to check sync status
// Run in browser console

console.log('=== SYNC DEBUG INFO ===');
console.log('Sync Enabled:', syncService.syncEnabled);
console.log('Sync ID:', syncService.syncId);
console.log('Last Sync Version:', syncService.lastSyncVersion);
console.log('Sync Status:', syncService.syncStatus);
console.log('Sync In Progress:', syncService.syncInProgress);
console.log('Last Sync Success:', syncService.lastSyncSuccess ? new Date(syncService.lastSyncSuccess).toLocaleString() : 'Never');
console.log('Sync Interval:', syncService.syncInterval ? 'Active' : 'Not running');

// Check if periodic sync is running
if (syncService.syncInterval) {
  console.log('✅ Periodic sync is ACTIVE (30 second interval)');
} else {
  console.log('❌ Periodic sync is NOT running');
}

// Force a manual sync
console.log('\n=== FORCING MANUAL SYNC ===');
syncService.sync().then(() => {
  console.log('✅ Manual sync completed');
}).catch(error => {
  console.error('❌ Manual sync failed:', error);
});

// Monitor next automatic sync
console.log('\n=== MONITORING SYNC ACTIVITY ===');
console.log('Watch Network tab for requests to:');
console.log('- /api/sync/pull.php (fetching remote changes)');
console.log('- /api/sync/push.php (sending local changes)');

// Check store subscription
const state = useAppStore.getState();
console.log('\n=== CURRENT STATE ===');
console.log('Current User:', state.currentUser);
console.log('Activities Count:', state.activities?.length || 0);
console.log('Users Count:', Object.keys(state.users || {}).length);

// Test activity completion trigger
console.log('\n=== TESTING ACTIVITY COMPLETION ===');
console.log('Complete an activity and watch for:');
console.log('1. State change in activities array');
console.log('2. Network request to push.php within 5 seconds');
console.log('3. Other device should pull changes within 30 seconds');