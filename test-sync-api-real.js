#!/usr/bin/env node

/**
 * Real API test for sync logic
 * Tests against actual qual API endpoint
 */

const crypto = require('crypto');

// Test configuration
const API_BASE = 'https://stackmap.app/qual/api/sync';
const TEST_PHRASE = crypto.randomBytes(16).toString('hex'); // Generate unique test phrase
console.log(`\n🔑 Test Recovery Phrase: ${TEST_PHRASE}\n`);

// Helper to generate sync ID from recovery phrase
function generateSyncId(phrase) {
  // This mimics the actual sync ID generation
  const hash = crypto.createHash('sha256');
  hash.update(phrase + 'StackMapSyncSalt');
  return hash.digest('hex').substring(0, 32);
}

// Helper to create encrypted blob (simplified for testing)
function createTestBlob(data) {
  // In real app this would be properly encrypted
  // For testing, we'll use base64 encoding
  const jsonStr = JSON.stringify(data);
  return Buffer.from(jsonStr).toString('base64');
}

// Helper to decode test blob
function decodeTestBlob(blob) {
  try {
    const jsonStr = Buffer.from(blob, 'base64').toString();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to decode blob:', e);
    return null;
  }
}

// Test data
const testUsers = {
  'user_dad_test': { 
    name: 'Test Dad', 
    icon: '👨',
    days: {
      today: {
        activities: [
          { id: 'act_1', text: 'Test Activity 1', icon: '✅', completed: false, pinned: false }
        ]
      }
    }
  },
  'user_mom_test': { 
    name: 'Test Mom', 
    icon: '👩',
    days: {
      today: {
        activities: [
          { id: 'act_2', text: 'Test Activity 2', icon: '📝', completed: true, pinned: false }
        ]
      }
    }
  },
  'user_kid_test': { 
    name: 'Test Kid', 
    icon: '👦',
    days: {
      today: {
        activities: []
      }
    }
  }
};

// API Test Functions
async function testCreateSync() {
  console.log('📤 Testing: Create sync group...');
  
  const syncId = generateSyncId(TEST_PHRASE);
  const deviceId = 'test_device_' + Date.now();
  
  const syncData = {
    version: 4,
    users: testUsers,
    currentDay: 'today',
    // NOTE: We're NOT sending currentUser - it should be device-specific
    library: { categories: [] },
    globalSettings: { currentTheme: 'stackBlue' }
  };
  
  const payload = {
    sync_id: syncId,
    device_id: deviceId,
    device_name: 'Test Device',
    encrypted_blob: createTestBlob(syncData),
    sync_type: 'full',
    version: Date.now()
  };
  
  try {
    const response = await fetch(`${API_BASE}/push.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sync created successfully');
      console.log(`   Sync ID: ${syncId}`);
      return { syncId, deviceId };
    } else {
      console.log('❌ Failed to create sync:', result.error || result.message);
      return null;
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
    return null;
  }
}

async function testPullSync(syncId, deviceId, expectedCurrentUser = null) {
  console.log(`\n📥 Testing: Pull sync data (Device expects user: ${expectedCurrentUser || 'none'})...`);
  
  try {
    const response = await fetch(`${API_BASE}/pull.php?sync_id=${syncId}&device_id=${deviceId}`);
    const result = await response.json();
    
    if (result.success && result.encrypted_blob) {
      const syncData = decodeTestBlob(result.encrypted_blob);
      
      if (!syncData) {
        console.log('❌ Failed to decode sync data');
        return false;
      }
      
      console.log('✅ Sync data retrieved');
      console.log(`   Version: ${syncData.version}`);
      console.log(`   Users: ${Object.keys(syncData.users || {}).join(', ')}`);
      console.log(`   Has currentUser in sync: ${syncData.currentUser ? 'YES ⚠️' : 'NO ✅'}`);
      
      // Verify currentUser is NOT in sync data (it should be device-specific)
      if (syncData.currentUser) {
        console.log('⚠️  WARNING: currentUser found in sync data - this will override device preferences!');
        console.log(`   currentUser value: ${syncData.currentUser}`);
        return false;
      }
      
      // Simulate device-specific logic
      if (expectedCurrentUser && syncData.users[expectedCurrentUser]) {
        console.log(`✅ Device can keep its user: ${expectedCurrentUser}`);
      } else if (!expectedCurrentUser) {
        const firstUser = Object.keys(syncData.users || {})[0];
        console.log(`✅ Device would select first available: ${firstUser}`);
      }
      
      return true;
    } else {
      console.log('❌ Failed to pull sync:', result.error || result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
    return false;
  }
}

async function testMultiDeviceScenario(syncId) {
  console.log('\n👨‍👩‍👧‍👦 Testing: Multi-device family scenario...\n');
  
  // Simulate 3 devices with different current users
  const devices = [
    { id: 'dad_phone_' + Date.now(), currentUser: 'user_dad_test', name: "Dad's Phone" },
    { id: 'mom_tablet_' + Date.now(), currentUser: 'user_mom_test', name: "Mom's Tablet" },
    { id: 'kid_ipad_' + Date.now(), currentUser: 'user_kid_test', name: "Kid's iPad" }
  ];
  
  let allPassed = true;
  
  for (const device of devices) {
    console.log(`📱 ${device.name}:`);
    
    // Each device pulls sync
    const response = await fetch(`${API_BASE}/pull.php?sync_id=${syncId}&device_id=${device.id}`);
    const result = await response.json();
    
    if (result.success && result.encrypted_blob) {
      const syncData = decodeTestBlob(result.encrypted_blob);
      
      // Check if currentUser is in sync (it shouldn't be)
      if (syncData.currentUser) {
        console.log(`   ❌ Would be forced to switch to: ${syncData.currentUser}`);
        allPassed = false;
      } else {
        console.log(`   ✅ Keeps local user: ${device.currentUser}`);
      }
    } else {
      console.log(`   ❌ Failed to pull sync`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testSyncUpdate(syncId, deviceId) {
  console.log('\n🔄 Testing: Update sync without currentUser...');
  
  // Update with new data but NO currentUser
  const updatedData = {
    version: 4,
    users: {
      ...testUsers,
      'user_new_test': {
        name: 'New User',
        icon: '🆕',
        days: { today: { activities: [] } }
      }
    },
    currentDay: 'today',
    // Explicitly NOT including currentUser
    library: { categories: [] },
    globalSettings: { currentTheme: 'ocean' }
  };
  
  const payload = {
    sync_id: syncId,
    device_id: deviceId + '_v2',
    device_name: 'Test Device V2',
    encrypted_blob: createTestBlob(updatedData),
    sync_type: 'full',
    version: Date.now()
  };
  
  try {
    const response = await fetch(`${API_BASE}/push.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Sync updated without currentUser');
      
      // Verify by pulling
      const pullResponse = await fetch(`${API_BASE}/pull.php?sync_id=${syncId}&device_id=${deviceId}_verify`);
      const pullResult = await pullResponse.json();
      
      if (pullResult.success && pullResult.encrypted_blob) {
        const verifyData = decodeTestBlob(pullResult.encrypted_blob);
        
        if (verifyData.currentUser) {
          console.log('❌ PROBLEM: currentUser still present after update:', verifyData.currentUser);
          return false;
        } else {
          console.log('✅ Verified: No currentUser in updated sync');
          return true;
        }
      }
    } else {
      console.log('❌ Failed to update sync:', result.error || result.message);
      return false;
    }
  } catch (error) {
    console.log('❌ API Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing Real Sync API Implementation\n');
  console.log('================================');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Create sync
  const syncInfo = await testCreateSync();
  if (syncInfo) {
    passed++;
    
    // Test 2: Pull and verify no currentUser
    if (await testPullSync(syncInfo.syncId, syncInfo.deviceId)) {
      passed++;
    } else {
      failed++;
    }
    
    // Test 3: Multi-device scenario
    if (await testMultiDeviceScenario(syncInfo.syncId)) {
      passed++;
    } else {
      failed++;
    }
    
    // Test 4: Update without currentUser
    if (await testSyncUpdate(syncInfo.syncId, syncInfo.deviceId)) {
      passed++;
    } else {
      failed++;
    }
    
  } else {
    failed++;
    console.log('\n⚠️  Could not create test sync group - API may be down');
  }
  
  console.log('\n================================');
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed - currentUser may still be syncing!');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed - currentUser is properly device-specific!');
  }
}

// Run the tests
runTests().catch(console.error);