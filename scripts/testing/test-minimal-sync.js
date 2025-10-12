/**
 * Minimal Sync Test Script
 * Run this in the browser console to test sync persistence
 */

async function testMinimalSync() {
  console.log('=== MINIMAL SYNC TEST STARTED ===');
  
  // Get the sync service
  const minimalSync = require('./src/services/sync/minimalSyncService').default;
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  // Helper to log with timestamp
  const log = (msg, data = null) => {
    const time = new Date().toLocaleTimeString();
    if (data) {
      console.log(`[${time}] ${msg}`, data);
    } else {
      console.log(`[${time}] ${msg}`);
    }
  };
  
  // Test 1: Check current state
  log('Test 1: Checking current state...');
  const currentData = await minimalSync.getCurrentData();
  if (currentData) {
    log('✅ Found existing data:', currentData);
    return { test: 'has_data', data: currentData };
  } else {
    log('⚠️ No existing data found');
  }
  
  // Test 2: Check AsyncStorage directly
  log('Test 2: Checking AsyncStorage directly...');
  const keys = await AsyncStorage.getAllKeys();
  log('AsyncStorage keys:', keys);
  
  for (const key of keys) {
    if (key.includes('minimal')) {
      const value = await AsyncStorage.getItem(key);
      log(`  ${key}:`, value);
    }
  }
  
  // Test 3: Create test data for Device A
  log('Test 3: Creating test sync (Device A scenario)...');
  const testData = {
    activities: ['Test Activity 1', 'Test Activity 2', 'Test Activity 3'],
    timestamp: Date.now(),
    source: 'test-script',
    deviceId: 'device-a-' + Math.random().toString(36).substr(2, 9)
  };
  
  const createResult = await minimalSync.createSync(testData);
  if (createResult.success) {
    log('✅ Sync created successfully!');
    log('Sync ID:', createResult.syncId);
    
    // Verify storage
    const verify = await minimalSync.getCurrentData();
    log('Verification after create:', verify);
    
    return { 
      test: 'created', 
      syncId: createResult.syncId, 
      data: testData 
    };
  } else {
    log('❌ Failed to create sync:', createResult.error);
    return { test: 'failed', error: createResult.error };
  }
}

// Function to test Device B joining
async function testJoinSync(syncId) {
  console.log('=== TESTING JOIN SYNC (Device B) ===');
  
  const minimalSync = require('./src/services/sync/minimalSyncService').default;
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  const log = (msg, data = null) => {
    const time = new Date().toLocaleTimeString();
    if (data) {
      console.log(`[${time}] ${msg}`, data);
    } else {
      console.log(`[${time}] ${msg}`);
    }
  };
  
  log('Joining sync with ID:', syncId);
  
  // Clear any existing data first
  await minimalSync.clearAll();
  log('Cleared existing data');
  
  // Join the sync
  const joinResult = await minimalSync.joinSync(syncId);
  if (joinResult.success) {
    log('✅ Successfully joined sync!');
    log('Received data:', joinResult.data);
    
    // Verify it was stored
    const stored = await minimalSync.getCurrentData();
    log('Stored data after join:', stored);
    
    // Check AsyncStorage directly
    const keys = await AsyncStorage.getAllKeys();
    log('AsyncStorage keys after join:', keys);
    
    const syncData = await AsyncStorage.getItem('@minimal_sync_data');
    log('Raw AsyncStorage @minimal_sync_data:', syncData);
    
    return {
      test: 'joined',
      success: true,
      data: joinResult.data,
      stored: stored
    };
  } else {
    log('❌ Failed to join sync:', joinResult.error);
    return {
      test: 'join_failed',
      success: false,
      error: joinResult.error
    };
  }
}

// Function to test persistence after refresh
async function testPersistenceAfterRefresh() {
  console.log('=== TESTING PERSISTENCE AFTER REFRESH ===');
  
  const minimalSync = require('./src/services/sync/minimalSyncService').default;
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  
  const log = (msg, data = null) => {
    const time = new Date().toLocaleTimeString();
    if (data) {
      console.log(`[${time}] ${msg}`, data);
    } else {
      console.log(`[${time}] ${msg}`);
    }
  };
  
  log('Checking if data persisted after refresh...');
  
  // Check AsyncStorage keys
  const keys = await AsyncStorage.getAllKeys();
  log('AsyncStorage keys:', keys);
  
  // Get the stored data
  const storedData = await minimalSync.getCurrentData();
  
  if (storedData && storedData.data) {
    log('✅ SUCCESS! Data persisted after refresh!');
    log('Persisted data:', storedData);
    
    // Verify each field
    log('Verification details:');
    log('  - Sync ID:', storedData.syncId);
    log('  - Timestamp:', storedData.timestamp);
    log('  - Activities:', storedData.data.activities);
    
    return {
      test: 'persistence_success',
      success: true,
      data: storedData
    };
  } else {
    log('❌ FAILED! Data did not persist after refresh');
    
    // Debug why it failed
    log('Debug info:');
    for (const key of keys) {
      if (key.includes('minimal') || key.includes('sync')) {
        const value = await AsyncStorage.getItem(key);
        log(`  ${key}:`, value);
      }
    }
    
    return {
      test: 'persistence_failed',
      success: false,
      data: null
    };
  }
}

// Export functions for use in console
window.testMinimalSync = testMinimalSync;
window.testJoinSync = testJoinSync;
window.testPersistenceAfterRefresh = testPersistenceAfterRefresh;

console.log(`
==============================================
MINIMAL SYNC TEST SCRIPT LOADED

Available functions:
1. testMinimalSync() - Create a new sync (Device A)
2. testJoinSync(syncId) - Join existing sync (Device B)
3. testPersistenceAfterRefresh() - Check if data persisted

Example workflow:
1. Tab A: const result = await testMinimalSync()
2. Copy the syncId from result
3. Tab B: await testJoinSync('paste-sync-id-here')
4. Tab B: Refresh page (Cmd+R)
5. Tab B: await testPersistenceAfterRefresh()
==============================================
`);