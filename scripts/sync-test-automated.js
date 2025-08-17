#!/usr/bin/env node

/**
 * Automated sync testing script
 * Tests sync scenarios against the qual API
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const API_BASE = 'https://stackmap.app/qual/api/sync';
const TEST_PHRASE = crypto.randomBytes(16).toString('hex'); // Generate random sync phrase
const DEVICE_ID = crypto.randomBytes(16).toString('hex'); // Generate device ID

console.log('🧪 Automated Sync Test Suite');
console.log('============================\n');
console.log(`Using API: ${API_BASE}`);
console.log(`Test phrase: ${TEST_PHRASE}`);
console.log(`Device ID: ${DEVICE_ID}\n`);

// Test data
const testData = {
  version: 4,
  users: {
    'test-user-1': {
      name: 'Test User 1',
      icon: '🧪',
      days: {
        today: {
          activities: [
            {
              id: 'test-1',
              text: 'Test Activity 1',
              icon: '✅',
              completed: false,
              pinned: false
            },
            {
              id: 'test-2',
              text: 'Test Activity 2',
              icon: '📝',
              completed: true,
              pinned: true,
              completedAt: Date.now(),
              completedBy: 'test-device-1'
            }
          ]
        }
      }
    }
  },
  currentUser: 'test-user-1'
};

// Simple encryption for testing (mimics the real encryption structure)
function encrypt(data, phrase) {
  // The real app uses TweetNaCl, but for testing we'll use a simple base64 encoding
  // The API just stores the encrypted blob, it doesn't validate the encryption
  const jsonStr = JSON.stringify(data);
  const base64 = Buffer.from(jsonStr).toString('base64');
  
  // Wrap it in a structure similar to what the real app sends
  return JSON.stringify({
    nonce: crypto.randomBytes(24).toString('base64'),
    data: base64
  });
}

function decrypt(encrypted, phrase) {
  try {
    const parsed = JSON.parse(encrypted);
    const jsonStr = Buffer.from(parsed.data, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (error) {
    // If it's not our format, it might be real encrypted data from the app
    console.log('   Note: Cannot decrypt real app data with test encryption');
    return null;
  }
}

// HTTP request helper
function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('Test 1: Health Check');
  console.log('--------------------');
  
  try {
    const response = await request('/health.php');
    
    if (response.status === 200) {
      console.log('✅ API is healthy');
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    } else {
      console.log(`❌ API returned status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }
  
  console.log('');
}

async function testCreateSync() {
  console.log('Test 2: Create Sync Group');
  console.log('-------------------------');
  
  try {
    const encryptedData = encrypt(testData, TEST_PHRASE);
    const syncId = crypto.createHash('sha256').update(TEST_PHRASE).digest('hex').substring(0, 32);
    
    const response = await request('/create.php', 'POST', {
      sync_id: syncId,  // Changed from syncId to sync_id
      encrypted_blob: encryptedData  // Changed from data to encrypted_blob
    });
    
    if (response.status === 200 || response.data?.success) {
      console.log('✅ Sync group created successfully');
      console.log(`   Sync ID: ${response.data?.sync_id || syncId}`);
      return response.data?.sync_id || syncId;
    } else {
      console.log(`❌ Failed to create sync group: ${JSON.stringify(response.data)}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ Create sync failed: ${error.message}`);
    return null;
  }
  
  console.log('');
}

async function testPullSync(syncId) {
  console.log('Test 3: Pull Sync Data');
  console.log('----------------------');
  
  if (!syncId) {
    console.log('⚠️  Skipping - no sync ID available');
    console.log('');
    return;
  }
  
  try {
    const response = await request(`/pull.php?sync_id=${syncId}&device_id=${DEVICE_ID}`);
    
    if (response.status === 200 && (response.data?.data || response.data?.encrypted_blob)) {
      console.log('✅ Sync data retrieved successfully');
      
      // Try to decrypt (API returns encrypted_blob field)
      const encryptedData = response.data.encrypted_blob || response.data.data;
      const decrypted = decrypt(encryptedData, TEST_PHRASE);
      if (decrypted) {
        console.log('✅ Data decrypted successfully');
        console.log(`   Users: ${Object.keys(decrypted.users || {}).join(', ')}`);
        console.log(`   Activities: ${decrypted.users?.['test-user-1']?.days?.today?.activities?.length || 0}`);
      } else {
        console.log('⚠️  Could not decrypt data (expected with simplified encryption)');
      }
    } else {
      console.log(`❌ Failed to pull sync data: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ Pull sync failed: ${error.message}`);
  }
  
  console.log('');
}

async function testPushSync(syncId) {
  console.log('Test 4: Push Updated Data');
  console.log('-------------------------');
  
  if (!syncId) {
    console.log('⚠️  Skipping - no sync ID available');
    console.log('');
    return;
  }
  
  try {
    // Modify test data
    const updatedData = JSON.parse(JSON.stringify(testData));
    updatedData.users['test-user-1'].days.today.activities.push({
      id: 'test-3',
      text: 'New Activity from Push',
      icon: '🆕',
      completed: false,
      pinned: false
    });
    
    const encryptedData = encrypt(updatedData, TEST_PHRASE);
    
    const response = await request('/push.php', 'POST', {
      sync_id: syncId,
      encrypted_blob: encryptedData,
      device_id: DEVICE_ID,
      version: 2
    });
    
    if (response.status === 200 && response.data?.success) {
      console.log('✅ Updated data pushed successfully');
      console.log(`   New version: ${response.data.version || 'unknown'}`);
    } else {
      console.log(`❌ Failed to push data: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ Push sync failed: ${error.message}`);
  }
  
  console.log('');
}

async function testDeleteSync(syncId) {
  console.log('Test 5: Delete Sync Group');
  console.log('-------------------------');
  
  if (!syncId) {
    console.log('⚠️  Skipping - no sync ID available');
    console.log('');
    return;
  }
  
  try {
    const response = await request('/delete.php', 'POST', {
      sync_id: syncId,
      device_id: DEVICE_ID
    });
    
    if (response.status === 200 && response.data?.success) {
      console.log('✅ Sync group deleted successfully');
    } else {
      console.log(`❌ Failed to delete sync group: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    console.log(`❌ Delete sync failed: ${error.message}`);
  }
  
  console.log('');
}

// Run tests
async function runTests() {
  console.log('Starting tests...\n');
  
  await testHealthCheck();
  
  const syncId = await testCreateSync();
  
  await testPullSync(syncId);
  
  await testPushSync(syncId);
  
  // Pull again to verify push worked
  if (syncId) {
    console.log('Test 6: Verify Push (Pull Again)');
    console.log('--------------------------------');
    await testPullSync(syncId);
  }
  
  await testDeleteSync(syncId);
  
  console.log('=============================');
  console.log('✅ Test suite completed');
  console.log('');
  console.log('Note: Some tests may fail due to simplified encryption.');
  console.log('For full testing, use the actual app with real encryption.');
}

// Run the tests
runTests().catch(console.error);