// Test script to decrypt and inspect sync data
const nacl = require('tweetnacl');
const util = require('tweetnacl-util');
const fetch = require('node-fetch');
const pako = require('pako');

const syncCode = 'cb3f47f1e78dc3ef0a5604906035a09f';

// Match the exact method from syncService.js
async function generateSyncId(recoveryPhrase) {
  const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ=='; // Base64 encoded fixed salt
  const saltBytes = util.decodeBase64(fixedSalt);
  const phraseBytes = util.decodeUTF8(recoveryPhrase);
  const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
  combined.set(phraseBytes);
  combined.set(saltBytes, phraseBytes.length);
  
  let key = nacl.hash(combined);
  for (let i = 0; i < 100000; i++) {
    key = nacl.hash(key);
  }
  
  const derivedKey = key.slice(0, 32);
  const syncIdBytes = derivedKey.slice(0, 16);
  return Array.from(syncIdBytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Derive encryption key
async function deriveEncryptionKey(recoveryPhrase) {
  const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ='; // Encryption salt
  const saltBytes = util.decodeBase64(fixedSalt);
  const phraseBytes = util.decodeUTF8(recoveryPhrase);
  const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
  combined.set(phraseBytes);
  combined.set(saltBytes, phraseBytes.length);
  
  let key = nacl.hash(combined);
  for (let i = 0; i < 100000; i++) {
    key = nacl.hash(key);
  }
  
  return key.slice(0, 32); // 32 bytes for secretbox
}

async function checkSync() {
  try {
    const syncId = await generateSyncId(syncCode);
    console.log('Sync ID:', syncId);
    
    // Fetch the encrypted data
    const response = await fetch(`https://stackmap.app/qual/api/sync/pull.php?sync_id=${syncId}&device_id=test`);
    const data = await response.json();
    
    if (!data.encrypted_blob) {
      console.log('No encrypted blob found');
      return;
    }
    
    console.log('Encrypted blob size:', data.encrypted_blob.length);
    console.log('Version:', data.version);
    
    // Decrypt the data
    const encryptedBytes = util.decodeBase64(data.encrypted_blob);
    console.log('Encrypted bytes length:', encryptedBytes.length);
    
    // Extract nonce (first 24 bytes)
    const nonce = encryptedBytes.slice(0, 24);
    const ciphertext = encryptedBytes.slice(24);
    
    // Derive the encryption key
    const encryptionKey = await deriveEncryptionKey(syncCode);
    console.log('Encryption key length:', encryptionKey.length);
    
    // Decrypt
    const decryptedBytes = nacl.secretbox.open(ciphertext, nonce, encryptionKey);
    
    if (!decryptedBytes) {
      console.log('Failed to decrypt - invalid key or corrupted data');
      return;
    }
    
    // Handle versioned format with metadata
    let decryptedData;
    
    // Check for version 2 format with metadata
    if (decryptedBytes.length > 4) {
      const metadataLengthView = new DataView(
        decryptedBytes.buffer,
        decryptedBytes.byteOffset,
        4
      );
      const metadataLength = metadataLengthView.getUint32(0, true);
      
      if (metadataLength > 0 && metadataLength < decryptedBytes.length - 4) {
        try {
          // Extract metadata
          const metadataBytes = decryptedBytes.slice(4, 4 + metadataLength);
          const decoder = new TextDecoder();
          const metadataString = decoder.decode(metadataBytes);
          const metadata = JSON.parse(metadataString);
          
          console.log('Metadata:', metadata);
          
          if (metadata.version === 2) {
            // Extract data
            let dataBytes = decryptedBytes.slice(4 + metadataLength);
            
            // Decompress if needed
            if (metadata.compressed) {
              console.log('Decompressing data...');
              dataBytes = pako.inflate(dataBytes);
            }
            
            const dataString = decoder.decode(dataBytes);
            decryptedData = JSON.parse(dataString);
          }
        } catch (e) {
          console.log('Failed to parse as v2 format, trying v1...');
        }
      }
    }
    
    // Fall back to version 1 format
    if (!decryptedData) {
      const decoder = new TextDecoder();
      const decryptedText = decoder.decode(decryptedBytes);
      decryptedData = JSON.parse(decryptedText);
    }
    
    console.log('\n=== DECRYPTED DATA ===');
    console.log('Has users:', !!decryptedData.users);
    console.log('User count:', decryptedData.users ? Object.keys(decryptedData.users).length : 0);
    
    if (decryptedData.users) {
      Object.entries(decryptedData.users).forEach(([userId, user]) => {
        console.log(`\nUser: ${user.name} (${userId})`);
        console.log('  Icon:', user.icon || user.emoji || 'none');
        console.log('  Has days:', !!user.days);
        
        if (user.days) {
          ['today', 'tomorrow'].forEach(day => {
            if (user.days[day]) {
              const activities = user.days[day].activities || [];
              console.log(`  ${day}: ${activities.length} activities`);
              if (activities.length > 0) {
                console.log(`    Sample activities:`);
                activities.slice(0, 3).forEach(act => {
                  console.log(`      - ${act.text || act.name || 'unnamed'} (id: ${act.id}, completed: ${act.completed})`);
                });
              }
            }
          });
        }
      });
    }
    
    console.log('\nHas library:', !!decryptedData.library);
    if (decryptedData.library) {
      console.log('Library categories:', decryptedData.library.categories?.length || 0);
    }
    
    console.log('\nCurrent user:', decryptedData.currentUser);
    console.log('Current day:', decryptedData.currentDay);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkSync();