/**
 * Simple browser console test for Phase 1 sync
 * 
 * Run this in the browser console on two tabs:
 * 1. Start your app: npm run web (port 3000) and PORT=3001 npm run web
 * 2. Open browser console on each tab
 * 3. Copy and paste this entire script into each console
 * 4. Follow the test instructions below
 */

// Test functions for Phase 1 minimal sync
window.testSync = {
  // Test 1: Create sync in Tab A
  async createTest() {
    console.log('📝 TEST 1: Creating sync with test data...');
    
    // Import the minimal sync service
    const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
    
    const testData = {
      activities: ['Test Activity 1', 'Test Activity 2', 'Test Activity 3'],
      timestamp: Date.now(),
      source: 'Tab A'
    };
    
    const result = await minimalSync.createSync(testData);
    
    if (result.success) {
      console.log('✅ SUCCESS! Sync created');
      console.log('📋 COPY THIS SYNC ID:', result.syncId);
      console.log('---');
      console.log('Now in Tab B, run: testSync.joinTest("' + result.syncId + '")');
      
      // Check local storage
      const stored = localStorage.getItem('@minimal_sync_data');
      console.log('💾 Local storage check:', stored ? 'Data stored' : 'NO DATA!');
    } else {
      console.error('❌ FAILED:', result.error);
    }
    
    return result;
  },
  
  // Test 2: Join sync in Tab B
  async joinTest(syncId) {
    console.log('📝 TEST 2: Joining sync', syncId);
    
    const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
    
    const result = await minimalSync.joinSync(syncId);
    
    if (result.success) {
      console.log('✅ SUCCESS! Joined sync');
      console.log('📦 Received data:', result.data);
      console.log('🔢 Activities count:', result.data?.activities?.length);
      
      // Check local storage
      const stored = localStorage.getItem('@minimal_sync_data');
      console.log('💾 Local storage check:', stored ? 'Data stored' : 'NO DATA!');
      
      console.log('---');
      console.log('⚠️ NOW REFRESH THIS TAB (Cmd+R) and run: testSync.checkPersistence()');
    } else {
      console.error('❌ FAILED:', result.error);
    }
    
    return result;
  },
  
  // Test 3: Check persistence after refresh
  async checkPersistence() {
    console.log('📝 TEST 3: Checking if data persisted after refresh...');
    
    const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
    
    // Check raw localStorage first
    const rawData = localStorage.getItem('@minimal_sync_data');
    console.log('💾 Raw localStorage:', rawData ? 'EXISTS' : 'MISSING!');
    
    if (rawData) {
      const parsed = JSON.parse(rawData);
      console.log('📦 Parsed data:', parsed);
      console.log('🔢 Activities:', parsed.data?.activities);
    }
    
    // Check through service
    const currentData = await minimalSync.getCurrentData();
    
    if (currentData && currentData.data) {
      console.log('✅ SUCCESS! Data persisted');
      console.log('📦 Current data:', currentData.data);
      console.log('🔢 Activities count:', currentData.data.activities?.length);
      return true;
    } else {
      console.error('❌ FAILED! Data did not persist');
      console.log('Current data:', currentData);
      return false;
    }
  },
  
  // Test 4: Add activity and push
  async addActivity() {
    console.log('📝 TEST 4: Adding new activity...');
    
    const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
    
    const currentData = await minimalSync.getCurrentData();
    if (!currentData) {
      console.error('❌ No current data - run createTest() or joinTest() first');
      return;
    }
    
    const newActivity = `New Activity ${Date.now()}`;
    const updatedData = {
      ...currentData.data,
      activities: [...(currentData.data.activities || []), newActivity],
      timestamp: Date.now()
    };
    
    const result = await minimalSync.pushData(updatedData);
    
    if (result.success) {
      console.log('✅ SUCCESS! Pushed new activity:', newActivity);
      console.log('---');
      console.log('In the other tab, run: testSync.pullData()');
    } else {
      console.error('❌ FAILED:', result.error);
    }
    
    return result;
  },
  
  // Test 5: Pull latest data
  async pullData() {
    console.log('📝 TEST 5: Pulling latest data...');
    
    const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
    
    const result = await minimalSync.pullData();
    
    if (result.success) {
      if (result.data) {
        console.log('✅ SUCCESS! Pulled new data');
        console.log('📦 Updated data:', result.data);
        console.log('🔢 Activities count:', result.data.activities?.length);
      } else {
        console.log('ℹ️ No new data available');
      }
    } else {
      console.error('❌ FAILED:', result.error);
    }
    
    return result;
  },
  
  // Utility: Clear all data
  async clearAll() {
    console.log('🗑️ Clearing all sync data...');
    
    const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
    await minimalSync.clearAll();
    
    console.log('✅ All data cleared');
  },
  
  // Utility: Show current state
  async showState() {
    console.log('📊 Current state:');
    
    const minimalSync = (await import('./src/services/sync/minimalSyncService.js')).default;
    const currentData = await minimalSync.getCurrentData();
    
    console.log('Sync ID:', minimalSync.syncId || 'None');
    console.log('Device ID:', minimalSync.deviceId);
    console.log('Current data:', currentData);
    
    // Check all localStorage keys
    console.log('---');
    console.log('LocalStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.includes('sync') || key.includes('minimal')) {
        console.log(`  ${key}:`, localStorage.getItem(key)?.substring(0, 100));
      }
    }
  }
};

// Print instructions
console.log(`
🧪 PHASE 1 SYNC TEST - Browser Console
=====================================

SETUP:
1. Run: npm run web (Tab A on port 3000)
2. Run: PORT=3001 npm run web (Tab B on port 3001)
3. Open browser console on both tabs

TEST SEQUENCE:
--------------
TAB A:
  testSync.createTest()
  (Copy the sync ID)

TAB B:
  testSync.joinTest("paste-sync-id-here")
  (Refresh the page with Cmd+R)
  testSync.checkPersistence()
  
  ✅ If data persists after refresh = SUCCESS!
  ❌ If data is lost = FAILED

ADDITIONAL TESTS:
  testSync.addActivity()    // Add new activity
  testSync.pullData()        // Pull latest from server
  testSync.showState()       // Show current state
  testSync.clearAll()        // Clear all data

=================`);

// Return the test object
window.testSync;