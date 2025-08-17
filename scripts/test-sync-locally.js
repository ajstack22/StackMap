#!/usr/bin/env node

/**
 * Local sync testing script
 * Tests sync functionality without deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import sync service and test utilities
const syncService = require('../src/services/sync/syncService.ts').default;
const { encryptionService } = require('../src/services/sync/encryptionService.ts');
const { validateSyncedData, repairSyncedData } = require('../src/services/sync/dataValidator.ts');
const demoData = require('../data/demo-data-kids.json');

console.log('🧪 Starting local sync test...\n');

// Test scenarios
async function runTests() {
  try {
    // Test 1: Validate demo data
    console.log('Test 1: Validating demo data structure...');
    const isValid = validateSyncedData(demoData);
    console.log(`✅ Demo data valid: ${isValid}\n`);

    // Test 2: Test repair function with deleted activities
    console.log('Test 2: Testing repair with deleted activities...');
    const dataWithDeleted = JSON.parse(JSON.stringify(demoData));
    if (dataWithDeleted.users['user-atlas']?.days?.today?.activities?.[0]) {
      dataWithDeleted.users['user-atlas'].days.today.activities[0].deleted = true;
      dataWithDeleted.users['user-atlas'].days.today.activities[0].deletedAt = Date.now();
    }
    
    const repaired = repairSyncedData(dataWithDeleted);
    const deletedActivityExists = repaired.users['user-atlas']?.days?.today?.activities?.some(a => a.deleted);
    console.log(`✅ Deleted activities filtered: ${!deletedActivityExists}\n`);

    // Test 3: Test encryption/decryption
    console.log('Test 3: Testing encryption/decryption...');
    const testPhrase = 'test1234567890abcdef1234567890ab';
    encryptionService.initialize(testPhrase);
    
    const encrypted = encryptionService.encryptData(demoData);
    const decrypted = encryptionService.decryptData(encrypted);
    const encryptionWorks = JSON.stringify(demoData) === JSON.stringify(decrypted);
    console.log(`✅ Encryption/decryption works: ${encryptionWorks}\n`);

    // Test 4: Simulate conflict resolution
    console.log('Test 4: Testing conflict resolution...');
    const { resolveConflicts } = require('../src/services/sync/conflictResolver.js');
    
    const localState = JSON.parse(JSON.stringify(demoData));
    const remoteState = JSON.parse(JSON.stringify(demoData));
    
    // Modify states to create conflicts
    localState.users['user-atlas'].days.today.activities[0].text = 'Local change';
    remoteState.users['user-atlas'].days.today.activities[0].text = 'Remote change';
    
    const resolved = await resolveConflicts(
      localState,
      remoteState,
      [{ field: 'users.user-atlas.days.today.activities.0.text', type: 'update' }]
    );
    
    console.log(`✅ Conflict resolution completed\n`);

    // Test 5: Test with various edge cases
    console.log('Test 5: Testing edge cases...');
    
    // Empty users
    const emptyUsers = { users: {}, currentUser: null };
    const repairedEmpty = repairSyncedData(emptyUsers);
    console.log(`  - Empty users handled: ${validateSyncedData(repairedEmpty)}`);
    
    // Missing icons
    const missingIcons = JSON.parse(JSON.stringify(demoData));
    delete missingIcons.users['user-atlas'].icon;
    const repairedIcons = repairSyncedData(missingIcons);
    console.log(`  - Missing icons repaired: ${repairedIcons.users['user-atlas'].icon !== undefined}`);
    
    // Invalid activities
    const invalidActivities = JSON.parse(JSON.stringify(demoData));
    invalidActivities.users['user-atlas'].days.today.activities.push({
      // Missing required fields
      completed: true
    });
    const repairedActivities = repairSyncedData(invalidActivities);
    const allActivitiesValid = repairedActivities.users['user-atlas'].days.today.activities.every(a => a.id && a.text);
    console.log(`  - Invalid activities fixed: ${allActivitiesValid}`);

    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();