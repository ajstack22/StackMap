
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
  console.log('\n📱 Device 1: Dad\'s Phone');
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
  console.log('\n📱 Device 2: Mom\'s Tablet');
  
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
    console.log('✅ Mom\'s tablet kept Mom as current user!');
  } else {
    console.log('❌ Mom\'s tablet switched to:', afterSyncUser);
  }
  
  // Check if all users are present
  const allUsers = Object.keys(useUserStore.getState().users);
  console.log('All users synced:', allUsers.join(', '));
  
  // Final verification
  console.log('\n📊 Test Results:');
  const testPassed = afterSyncUser === 'user_mom_test' && allUsers.length === 2;
  console.log(testPassed ? '✅ Test PASSED' : '❌ Test FAILED');
  
  process.exit(testPassed ? 0 : 1);
}

runTest().catch(console.error);
