// Test script using the same NaCl-based method as syncService.js
const nacl = require('tweetnacl');
const util = require('tweetnacl-util');

const syncCode = 'cb3f47f1e78dc3ef0a5604906035a09f';

// Match the exact method from syncService.js
async function generateSyncId(recoveryPhrase) {
  // Use the same fixed salt as syncService.js
  const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ=='; // Base64 encoded fixed salt
  
  // Decode the salt from base64
  const saltBytes = util.decodeBase64(fixedSalt);
  
  // Convert recovery phrase to bytes
  const phraseBytes = util.decodeUTF8(recoveryPhrase);
  
  // Combine phrase and salt
  const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
  combined.set(phraseBytes);
  combined.set(saltBytes, phraseBytes.length);
  
  // Hash multiple times for key stretching (matching encryptionService.js)
  let key = nacl.hash(combined);
  
  // Do 100,000 iterations to match KEY_DERIVATION_ITERATIONS
  for (let i = 0; i < 100000; i++) {
    key = nacl.hash(key);
  }
  
  // Use first 32 bytes as the derived key
  const derivedKey = key.slice(0, 32);
  
  // Use first 16 bytes of key as sync ID
  const syncIdBytes = derivedKey.slice(0, 16);
  
  // Convert to hex string
  return Array.from(syncIdBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function checkSync() {
  try {
    const syncId = await generateSyncId(syncCode);
    console.log('Sync code:', syncCode);
    console.log('Generated sync ID (NaCl method):', syncId);
    
    // Check if this exists on the server
    const fetch = require('node-fetch');
    const response = await fetch(`https://stackmap.app/qual/api/sync/pull.php?sync_id=${syncId}&device_id=test`);
    console.log('Response status:', response.status);
    
    if (response.status === 404) {
      console.log('Sync group does not exist on server');
    } else if (response.ok) {
      const text = await response.text();
      const data = JSON.parse(text);
      console.log('Sync exists! Version:', data.version);
      console.log('Blob size:', data.encrypted_blob ? data.encrypted_blob.length : 0);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSync();