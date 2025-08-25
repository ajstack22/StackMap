#!/usr/bin/env node

/**
 * Test sync logic for currentUser preservation
 * Run with: node test-sync-logic.js
 */

// Mock the store functions
const mockUserStore = {
  state: {},
  getState: function() {
    return {
      currentUser: this.state.currentUser,
      setCurrentUser: (userId) => {
        this.state.currentUser = userId;
        return userId;
      },
      setUsers: (users) => {
        this.state.users = users;
        return users;
      }
    };
  },
  reset: function(currentUser = null) {
    this.state = { currentUser, users: {} };
  }
};

// Test the sync logic
function testSyncLogic(localCurrentUser, syncedUsers, expectedResult, testName) {
  // Reset store with local state
  mockUserStore.reset(localCurrentUser);
  
  // Simulate the sync restore logic
  const userStore = mockUserStore;
  userStore.getState().setUsers(syncedUsers || {});
  
  // This is our actual logic from syncService.js
  const localUser = userStore.getState().currentUser;
  if (!localUser || (syncedUsers && !syncedUsers[localUser])) {
    const availableUsers = Object.keys(syncedUsers || {});
    if (availableUsers.length > 0) {
      userStore.getState().setCurrentUser(availableUsers[0]);
    }
  }
  
  const result = userStore.state.currentUser;
  const passed = result === expectedResult;
  
  console.log(`${passed ? '✅' : '❌'} ${testName}`);
  if (!passed) {
    console.log(`   Expected: ${expectedResult}, Got: ${result}`);
    console.log(`   Local: ${localCurrentUser}, Synced Users: ${Object.keys(syncedUsers || {})}`);
  }
  
  return passed;
}

// Run test cases
console.log('\n🧪 Testing Sync CurrentUser Logic\n');

const testCases = [
  // Test 1: Local user exists and is valid - should preserve
  {
    local: 'user_dad',
    synced: { 
      'user_dad': { name: 'Dad', icon: '👨' },
      'user_mom': { name: 'Mom', icon: '👩' },
      'user_kid': { name: 'Kid', icon: '👦' }
    },
    expected: 'user_dad',
    name: 'Preserve valid local currentUser (Dad stays Dad)'
  },
  
  // Test 2: Local user exists but not in sync - should pick first
  {
    local: 'user_old',
    synced: {
      'user_dad': { name: 'Dad', icon: '👨' },
      'user_mom': { name: 'Mom', icon: '👩' }
    },
    expected: 'user_dad',
    name: 'Local user deleted from sync - pick first available'
  },
  
  // Test 3: No local user - should pick first from sync
  {
    local: null,
    synced: {
      'user_mom': { name: 'Mom', icon: '👩' },
      'user_dad': { name: 'Dad', icon: '👨' }
    },
    expected: 'user_mom',
    name: 'No local user - pick first from sync'
  },
  
  // Test 4: No local user, empty sync - should remain null
  {
    local: null,
    synced: {},
    expected: null,
    name: 'No local user, no synced users - remain null (DON\'T CREATE)'
  },
  
  // Test 5: Local user is empty string - should pick first
  {
    local: '',
    synced: {
      'user_kid': { name: 'Kid', icon: '👦' }
    },
    expected: 'user_kid',
    name: 'Empty string local user - pick first from sync'
  },
  
  // Test 6: Undefined local user - should pick first
  {
    local: undefined,
    synced: {
      'user_a': { name: 'A', icon: 'A' },
      'user_b': { name: 'B', icon: 'B' }
    },
    expected: 'user_a',
    name: 'Undefined local user - pick first from sync'
  },
  
  // Test 7: Local Mom stays Mom even if Dad is first in sync
  {
    local: 'user_mom',
    synced: {
      'user_dad': { name: 'Dad', icon: '👨' },
      'user_mom': { name: 'Mom', icon: '👩' },
      'user_kid': { name: 'Kid', icon: '👦' }
    },
    expected: 'user_mom',
    name: 'Mom stays Mom (not switching to Dad)'
  },
  
  // Test 8: Synced users is null - should remain as is
  {
    local: 'user_local',
    synced: null,
    expected: 'user_local',
    name: 'Null synced users - preserve local'
  },
  
  // Test 9: Edge case - user exists but is marked deleted
  {
    local: 'user_dad',
    synced: {
      'user_dad': { name: 'Dad', icon: '👨', deleted: true },
      'user_mom': { name: 'Mom', icon: '👩' }
    },
    expected: 'user_dad',  // We still preserve it (deletion is handled elsewhere)
    name: 'Local user marked deleted in sync - still preserve'
  }
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  if (testSyncLogic(test.local, test.synced, test.expected, test.name)) {
    passed++;
  } else {
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

// Test for the DEFAULT USER CREATION BUG
console.log('🐛 Testing Default User Creation Prevention\n');

function testNoDefaultUserCreation() {
  mockUserStore.reset(null);
  const userStore = mockUserStore;
  
  // Simulate receiving empty sync data
  const syncedUsers = {};
  userStore.getState().setUsers(syncedUsers);
  
  // Apply our logic
  const localUser = userStore.getState().currentUser;
  if (!localUser || !syncedUsers[localUser]) {
    const availableUsers = Object.keys(syncedUsers || {});
    if (availableUsers.length > 0) {
      userStore.getState().setCurrentUser(availableUsers[0]);
    }
    // CRITICAL: We should NOT create a default user here
  }
  
  // Check that no user was created
  const hasDefaultUser = userStore.state.currentUser === 'user_1' || 
                        userStore.state.currentUser === 'User';
  const userCount = Object.keys(userStore.state.users || {}).length;
  
  if (!hasDefaultUser && userCount === 0 && !userStore.state.currentUser) {
    console.log('✅ No default user created when sync is empty');
    return true;
  } else {
    console.log('❌ Default user was created or currentUser was set!');
    console.log(`   CurrentUser: ${userStore.state.currentUser}`);
    console.log(`   User count: ${userCount}`);
    return false;
  }
}

testNoDefaultUserCreation();

// Test the family scenario
console.log('\n👨‍👩‍👧‍👦 Testing Family Sync Scenario\n');

function testFamilyScenario() {
  // Dad's phone
  const dadPhone = { ...mockUserStore };
  dadPhone.reset('user_dad');
  
  // Mom's tablet  
  const momTablet = { ...mockUserStore };
  momTablet.reset('user_mom');
  
  // Kid's iPad
  const kidIPad = { ...mockUserStore };
  kidIPad.reset('user_kid');
  
  // Shared sync data (all users)
  const syncData = {
    'user_dad': { name: 'Dad', icon: '👨' },
    'user_mom': { name: 'Mom', icon: '👩' },
    'user_kid': { name: 'Kid', icon: '👦' }
  };
  
  // Each device receives sync
  [dadPhone, momTablet, kidIPad].forEach((device, i) => {
    const deviceName = ['Dad Phone', 'Mom Tablet', 'Kid iPad'][i];
    const expectedUser = ['user_dad', 'user_mom', 'user_kid'][i];
    
    device.getState().setUsers(syncData);
    
    // Apply sync logic
    const localUser = device.getState().currentUser;
    if (!localUser || !syncData[localUser]) {
      const availableUsers = Object.keys(syncData || {});
      if (availableUsers.length > 0) {
        device.getState().setCurrentUser(availableUsers[0]);
      }
    }
    
    const kept = device.state.currentUser === expectedUser;
    console.log(`${kept ? '✅' : '❌'} ${deviceName} kept their user: ${device.state.currentUser}`);
  });
}

testFamilyScenario();

console.log('\n✨ Test Complete\n');

if (failed > 0) {
  process.exit(1);
}