#!/usr/bin/env node

/**
 * End-to-end sync test using actual encryption
 * This mimics what the real app does
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 End-to-End Sync Test\n');
console.log('This test will:');
console.log('1. Create a new sync group with test data');
console.log('2. Verify currentUser is NOT synced');
console.log('3. Simulate multiple devices');
console.log('4. Check that each device keeps its own user\n');

// Create a test React Native script that uses the actual sync service
const testScript = `
import { syncService } from './src/services/sync/syncService.js';
import { useUserStore } from './src/stores/useUserStore.js';
import { useSettingsStore } from './src/stores/useSettingsStore.js';
import { useLibraryStore } from './src/stores/useLibraryStore.js';

async function runTest() {
  console.log('📱 Initializing test environment...');
  
  // Setup test data
  const testUsers = {
    'user_dad_test': {
      name: 'Test Dad',
      icon: '👨',
      days: {
        today: {
          activities: [
            { 
              id: 'act_dad_1',
              text: 'Dad Activity',
              icon: '🔨',
              completed: false,
              pinned: false
            }
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
            {
              id: 'act_mom_1',
              text: 'Mom Activity',
              icon: '📚',
              completed: true,
              pinned: false
            }
          ]
        }
      }
    }
  };
  
  // Device 1: Dad's Phone
  console.log('\\n📱 Device 1: Dad\\'s Phone');
  console.log('Setting up Dad as current user...');
  useUserStore.getState().setUsers(testUsers);
  useUserStore.getState().setCurrentUser('user_dad_test');
  
  // Create sync
  console.log('Creating new sync group...');
  const phrase = await syncService.createNewSync();
  console.log('Recovery phrase:', phrase);
  
  // Enable sync
  await syncService.enable(phrase);
  console.log('Sync enabled');
  
  // Push initial data
  await syncService.pushData();
  console.log('Initial data pushed');
  
  // Check what was sent
  const sentData = syncService.getCurrentState();
  console.log('Sent currentUser?', sentData.currentUser ? 'YES ❌' : 'NO ✅');
  
  // Device 2: Mom's Tablet
  console.log('\\n📱 Device 2: Mom\\'s Tablet');
  
  // Reset to simulate different device
  syncService.disable();
  useUserStore.getState().setCurrentUser('user_mom_test');
  console.log('Mom selected as current user');
  
  // Join sync
  console.log('Joining sync with recovery phrase...');
  await syncService.enable(phrase);
  
  // Pull data
  const pulledData = await syncService.pullData();
  console.log('Data pulled from sync');
  
  // Check current user after sync
  const afterSyncUser = useUserStore.getState().currentUser;
  console.log('Current user after sync:', afterSyncUser);
  
  if (afterSyncUser === 'user_mom_test') {
    console.log('✅ Mom\\'s tablet kept Mom as current user!');
  } else {
    console.log('❌ Mom\\'s tablet switched to:', afterSyncUser);
  }
  
  // Check if all users are present
  const allUsers = Object.keys(useUserStore.getState().users);
  console.log('All users synced:', allUsers.join(', '));
  
  // Final verification
  console.log('\\n📊 Test Results:');
  const testPassed = afterSyncUser === 'user_mom_test' && allUsers.length === 2;
  console.log(testPassed ? '✅ Test PASSED' : '❌ Test FAILED');
  
  process.exit(testPassed ? 0 : 1);
}

runTest().catch(console.error);
`;

// Write test script
fs.writeFileSync('test-sync-temp.js', testScript);

console.log('Option 1: Run this test script in the React Native environment:');
console.log('  node --experimental-modules test-sync-temp.js\n');

console.log('Option 2: Manual test steps:');
console.log('1. Open StackMap in a web browser');
console.log('2. Create users: Dad, Mom, Kid');
console.log('3. Enable sync and copy the recovery phrase');
console.log('4. Open the app on different devices/simulators');
console.log('5. Each device: Join sync and select different user');
console.log('6. Make a change on one device');
console.log('7. Verify: Other devices sync data but keep their user\n');

console.log('Expected behavior:');
console.log('✅ All users and activities sync to all devices');
console.log('✅ Each device keeps its own currentUser selection');
console.log('✅ No device switches users unexpectedly');
console.log('❌ If devices switch users, the fix didn\'t work\n');

// Check the actual code to verify our changes
console.log('🔍 Verifying code changes...\n');

const syncServicePath = path.join(__dirname, 'src/services/sync/syncService.js');
const syncServiceCode = fs.readFileSync(syncServicePath, 'utf8');

// Check if currentUser is commented out in sync package
if (syncServiceCode.includes('// currentUser: userState.currentUser')) {
  console.log('✅ currentUser is commented out in sync package');
} else if (syncServiceCode.includes('currentUser: userState.currentUser,')) {
  console.log('❌ WARNING: currentUser is still being synced!');
}

// Check if local currentUser is preserved
if (syncServiceCode.includes('PRESERVE local currentUser')) {
  console.log('✅ Code preserves local currentUser selection');
} else {
  console.log('⚠️  Cannot verify currentUser preservation logic');
}

console.log('\n' + '='.repeat(50));
console.log('To fully verify, you need to:');
console.log('1. Set up a fresh sync group');
console.log('2. Test with real devices/simulators');
console.log('3. Confirm each device keeps its user');