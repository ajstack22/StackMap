#!/usr/bin/env node
/**
 * Integration test for sync service with real API
 * Run with: node src/services/sync/testSyncIntegration.js
 */

import fetch from 'node-fetch';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Polyfill fetch for Node.js
global.fetch = fetch;

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

    // 2. Pull data back

    const pullResponse = await fetch(
      `${API_BASE_URL}/pull.php?sync_id=${testSyncId}&device_id=${deviceId}`
    );
    
    const pullResult = await pullResponse.json();

    // 3. Decrypt and verify

    const decryptedData = decryptData(pullResult.encrypted_blob, masterKey);

    // 4. Push updated data

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

    // 5. Pull again to verify update

    const verifyResponse = await fetch(
      `${API_BASE_URL}/pull.php?sync_id=${testSyncId}&device_id=${deviceId}`
    );
    
    const verifyResult = await verifyResponse.json();
    const verifyData = decryptData(verifyResult.encrypted_blob, masterKey);

  } catch (error) {
//     console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

// Run the test
runIntegrationTest();