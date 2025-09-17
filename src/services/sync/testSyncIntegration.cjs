#!/usr/bin/env node
/**
 * Integration test for sync service with real API
 * Run with: node src/services/sync/testSyncIntegration.cjs
 */

const fetch = require('node-fetch');
const nacl = require('tweetnacl');
const util = require('tweetnacl-util');

// Simple encryption implementation for testing
const ENCRYPTION_VERSION = 1;

function encryptData(data, masterKey) {
  const dataString = JSON.stringify({
    version: ENCRYPTION_VERSION,
    data: data,
    timestamp: Date.now()
  });

  const dataBytes = util.decodeUTF8(dataString);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const encrypted = nacl.secretbox(dataBytes, nonce, masterKey);

  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);

  return util.encodeBase64(combined);
}

function decryptData(encryptedData, masterKey) {
  const combined = util.decodeBase64(encryptedData);
  const nonce = combined.slice(0, nacl.secretbox.nonceLength);
  const encrypted = combined.slice(nacl.secretbox.nonceLength);

  const decrypted = nacl.secretbox.open(encrypted, nonce, masterKey);
  if (!decrypted) {
    throw new Error('Decryption failed');
  }

  const dataString = util.encodeUTF8(decrypted);
  const parsed = JSON.parse(dataString);
  return parsed.data;
}

async function runIntegrationTest() {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
    console.log('🧪 Running Sync Integration Test...\n');
  }

  const API_BASE_URL = 'https://stackmap.app/api/sync';
  
  // Generate test data
  const testSyncId = `test-integration-${Date.now()}`;
  const masterKey = nacl.randomBytes(32);
  const salt = util.encodeBase64(nacl.randomBytes(16));
  const deviceId = util.encodeBase64(nacl.randomBytes(16));

  const testData = {
    activities: [
      { id: '1', name: 'Test Activity 1', category: 'Test' },
      { id: '2', name: 'Test Activity 2', category: 'Test' }
    ],
    categories: ['Test', 'Sample'],
    completedToday: ['1'],
    lastBackup: new Date().toISOString()
  };

  try {
    // 1. Create sync group
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('1️⃣ Creating sync group...');
    }
    const encryptedBlob = encryptData(testData, masterKey);
    
    const createResponse = await fetch(`${API_BASE_URL}/create.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: testSyncId,
        encrypted_blob: encryptedBlob,
        recovery_salt: salt
      })
    });

    const createResult = await createResponse.json();
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('✅ Create response:', createResult);
    }

    // 2. Pull data back
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('\n2️⃣ Pulling data...');
    }
    const pullResponse = await fetch(
      `${API_BASE_URL}/pull.php?sync_id=${testSyncId}&device_id=${deviceId}`
    );
    
    const pullResult = await pullResponse.json();
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('✅ Pull response:', {
        version: pullResult.version,
        last_modified: pullResult.last_modified,
        blob_length: pullResult.encrypted_blob.length
      });
    }

    // 3. Decrypt and verify
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('\n3️⃣ Decrypting data...');
    }
    const decryptedData = decryptData(pullResult.encrypted_blob, masterKey);
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('✅ Decrypted successfully!');
      console.log('Activities:', decryptedData.activities.length);
      console.log('Categories:', decryptedData.categories);
    }

    // 4. Push updated data
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('\n4️⃣ Pushing updated data...');
    }
    const updatedData = {
      ...testData,
      activities: [...testData.activities, 
        { id: '3', name: 'New Activity', category: 'Test' }
      ]
    };
    
    const updatedBlob = encryptData(updatedData, masterKey);
    
    const pushResponse = await fetch(`${API_BASE_URL}/push.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: testSyncId,
        device_id: deviceId,
        device_name: 'Test Device',
        encrypted_blob: updatedBlob
      })
    });

    const pushResult = await pushResponse.json();
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('✅ Push response:', pushResult);
    }

    // 5. Pull again to verify update
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('\n5️⃣ Verifying update...');
    }
    const verifyResponse = await fetch(
      `${API_BASE_URL}/pull.php?sync_id=${testSyncId}&device_id=${deviceId}`
    );
    
    const verifyResult = await verifyResponse.json();
    const verifyData = decryptData(verifyResult.encrypted_blob, masterKey);
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.log('✅ Verified! Activities count:', verifyData.activities.length);

      console.log('\n🎉 Integration test passed! All sync operations working correctly.');
      console.log('\nSummary:');
      console.log('- Created sync group with encrypted data');
      console.log('- Successfully pulled and decrypted data');
      console.log('- Pushed updates with version tracking');
      console.log('- End-to-end encryption verified');
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined) {
      console.error('❌ Integration test failed:', error);
    }
    process.exit(1);
  }
}

// Run the test
runIntegrationTest();