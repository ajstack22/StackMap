// Debug script for browser console
// This exposes sync info through the React DevTools

// First, check if sync is available through window
if (window.syncService) {
  console.log('Sync service found on window');
} else {
  console.log('Sync service not exposed to window');
  console.log('To debug sync, you need to:');
  console.log('1. Open React DevTools');
  console.log('2. Find the App component');
  console.log('3. Check the hooks for sync status');
}

// Alternative: Check localStorage for sync info
console.log('\n=== CHECKING LOCALSTORAGE ===');
const syncEnabled = localStorage.getItem('syncEnabled');
const syncId = localStorage.getItem('syncId');
const lastSync = localStorage.getItem('lastSyncTime');

console.log('Sync Enabled:', syncEnabled);
console.log('Sync ID:', syncId);
console.log('Last Sync:', lastSync ? new Date(parseInt(lastSync)).toLocaleString() : 'Never');

// Check for sync-related keys
const syncKeys = Object.keys(localStorage).filter(key => key.toLowerCase().includes('sync'));
console.log('\nAll sync-related keys in localStorage:', syncKeys);

// Monitor network activity
console.log('\n=== MONITORING NETWORK ===');
console.log('Open Network tab and filter by "sync" or look for:');
console.log('- pull.php requests (should happen every 30 seconds)');
console.log('- push.php requests (should happen 5 seconds after changes)');

// Check if activities are being tracked
console.log('\n=== ACTIVITY STATE CHECK ===');
const appState = localStorage.getItem('appState');
if (appState) {
  try {
    const state = JSON.parse(appState);
    console.log('Current User:', state.currentUser);
    console.log('Activities:', state.activities?.length || 0);
    console.log('Last activity update:', state.lastActivityUpdate ? new Date(state.lastActivityUpdate).toLocaleString() : 'Unknown');
  } catch (e) {
    console.log('Could not parse app state');
  }
}

console.log('\n=== NEXT STEPS ===');
console.log('1. Complete an activity');
console.log('2. Watch Network tab for push.php request within 5 seconds');
console.log('3. Check other device for pull.php request within 30 seconds');
console.log('4. If no requests appear, sync may not be properly initialized');