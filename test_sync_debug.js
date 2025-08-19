// Quick test script to check sync data
const crypto = require('crypto');

const syncCode = 'cb3f47f1e78dc3ef0a5604906035a09f';

// Generate sync ID from the code (same logic as syncService)
function generateSyncId(recoveryPhrase) {
  const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ=='; // Base64 encoded fixed salt
  const saltBuffer = Buffer.from(fixedSalt, 'base64');
  
  // Use PBKDF2 to derive key
  const key = crypto.pbkdf2Sync(recoveryPhrase, saltBuffer, 100000, 32, 'sha256');
  
  // Use first 16 bytes as sync ID
  const syncIdBytes = key.slice(0, 16);
  return Array.from(syncIdBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

const syncId = generateSyncId(syncCode);
console.log('Sync code:', syncCode);
console.log('Generated sync ID:', syncId);

// Now let's check if this exists on the server
const fetch = require('node-fetch');

async function checkSync() {
  try {
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
    console.error('Error checking sync:', error);
  }
}

checkSync();