// Import crypto polyfill for React Native BEFORE tweetnacl
import { Platform } from 'react-native';
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pako from 'pako';

const ENCRYPTION_VERSION = 2; // Bumped for compression support
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const COMPRESSION_THRESHOLD = 1024; // Only compress if data > 1KB
const KEY_DERIVATION_ITERATIONS = 100000; // TEMPORARY: Reverted to match server data encryption

interface EncryptionMetadata {
  version: number;
  compressed?: boolean;
}

interface DerivedKey {
  key: Uint8Array;
  salt: string;
}

class EncryptionService {
  public masterKey: Uint8Array | null = null;
  public syncId: string | null = null;

  /**
   * Generate a random recovery phrase (12 words from a wordlist)
   */
  generateRecoveryPhrase(): string {
    // Generate a random 128-bit seed and convert to hex
    // In production, use BIP39 wordlist for better UX
    const seedBytes = nacl.randomBytes(16);
    // Convert to hex string (no padding, URL-safe)
    return Array.from(seedBytes).map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Derive encryption key from recovery phrase using PBKDF2-like approach
   */
  async deriveKeyFromPhrase(recoveryPhrase: string, salt: Uint8Array | string | null = null): Promise<DerivedKey> {
    const startTime = Date.now();
        
    // If no salt provided, generate one
    let saltBytes: Uint8Array;
    if (!salt) {
      saltBytes = nacl.randomBytes(SALT_LENGTH);
    } else if (typeof salt === 'string') {
      saltBytes = util.decodeBase64(salt);
    } else {
      saltBytes = salt;
    }

    // Simple key derivation (in production, use proper PBKDF2)
    const phraseBytes = util.decodeUTF8(recoveryPhrase);
    const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
    combined.set(phraseBytes);
    combined.set(saltBytes, phraseBytes.length);
    
    // Hash multiple times for key stretching (PBKDF2-like)
    let key = nacl.hash(combined);
    
    // Log progress for long operation (only in development)
    const logInterval = KEY_DERIVATION_ITERATIONS / 10;
    const batchSize = 5000; // Process 5000 iterations at a time (increased for better performance)
    
    // Process in batches to avoid blocking the UI thread
    for (let i = 0; i < KEY_DERIVATION_ITERATIONS; i++) {
      key = nacl.hash(key);
      
      // Yield control back to the event loop periodically
      if (i % batchSize === 0 && i > 0) {
        // Use setTimeout to allow UI updates and other events to process
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Log timing info
        const elapsed = Date.now() - startTime;
        const progress = (i / KEY_DERIVATION_ITERATIONS) * 100;
      }
      
      // Log progress in development mode
      if (__DEV__ && i % logInterval === 0 && i > 0) {
        // Progress logged
      }
    }
    
    const derivedKey = key.slice(0, KEY_LENGTH);
    return {
      key: derivedKey,
      salt: util.encodeBase64(saltBytes)
    };
  }

  /**
   * Initialize encryption with recovery phrase
   */
  async initialize(recoveryPhrase: string, syncId: string, existingSalt: string | null = null): Promise<void> {
    const { key, salt } = await this.deriveKeyFromPhrase(recoveryPhrase, existingSalt);
    this.masterKey = key;
    this.syncId = syncId;
    
    // Store the recovery phrase and salt securely
    await this.storeRecoveryPhrase(recoveryPhrase);
    await AsyncStorage.setItem('encryption_salt', salt);
  }

  /**
   * Encrypt data using nacl secretbox
   */
  encryptData(data: any): string {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    // Convert data to bytes
    const dataStr = JSON.stringify(data);
    let dataBytes = util.decodeUTF8(dataStr);
    
    // Prepare metadata
    const metadata: EncryptionMetadata = {
      version: ENCRYPTION_VERSION,
      compressed: false
    };
    
    // Compress if data is large enough
    if (dataBytes.length > COMPRESSION_THRESHOLD) {
      try {
        const compressed = pako.deflate(dataBytes);
        if (compressed.length < dataBytes.length * 0.9) {
          dataBytes = compressed;
          metadata.compressed = true;
        }
      } catch (error) {
        console.warn('[ENCRYPTION] Compression failed, using uncompressed data:', error);
      }
    }
    
    // Encode metadata
    const metadataBytes = util.decodeUTF8(JSON.stringify(metadata));
    const metadataLength = new Uint8Array(4);
    new DataView(metadataLength.buffer).setUint32(0, metadataBytes.length, false);
    
    // Combine metadata and data
    const combined = new Uint8Array(4 + metadataBytes.length + dataBytes.length);
    combined.set(metadataLength, 0);
    combined.set(metadataBytes, 4);
    combined.set(dataBytes, 4 + metadataBytes.length);
    
    // Generate nonce and encrypt
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(combined, nonce, this.masterKey);
    
    // Combine nonce and encrypted data
    const result = new Uint8Array(nonce.length + encrypted.length);
    result.set(nonce);
    result.set(encrypted, nonce.length);
    
    return util.encodeBase64(result);
  }

  /**
   * Decrypt data using nacl secretbox
   */
  decryptData(encryptedData: string): any {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const combined = util.decodeBase64(encryptedData);
      
      // Extract nonce and encrypted data
      const nonce = combined.slice(0, nacl.secretbox.nonceLength);
      const encrypted = combined.slice(nacl.secretbox.nonceLength);
      
      // Decrypt
      const decrypted = nacl.secretbox.open(encrypted, nonce, this.masterKey);
      if (!decrypted) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      // Check for metadata (version 2+)
      if (decrypted.length > 4) {
        const metadataLength = new DataView(decrypted.buffer, decrypted.byteOffset, 4).getUint32(0, false);
        if (metadataLength > 0 && metadataLength < decrypted.length - 4) {
          try {
            const metadataBytes = decrypted.slice(4, 4 + metadataLength);
            const metadata: EncryptionMetadata = JSON.parse(util.encodeUTF8(metadataBytes));
            let dataBytes = decrypted.slice(4 + metadataLength);
            
            // Handle decompression if needed
            if (metadata.version === 2) {
              if (metadata.compressed) {
                try {
                  dataBytes = pako.inflate(dataBytes);
                                  } catch (error) {
                  console.error('[DECRYPTION] Decompression failed:', error);
                  throw new Error('Failed to decompress data');
                }
              }
            }
            
            const dataStr = util.encodeUTF8(dataBytes);
            return JSON.parse(dataStr);
          } catch (error) {
                      }
        }
      }
      
      // Legacy format (no metadata)
      const decryptedStr = util.encodeUTF8(decrypted);
      return JSON.parse(decryptedStr);
    } catch (error) {
      console.error('[DECRYPTION] Decryption error:', error);
      throw error;
    }
  }

  /**
   * Store recovery phrase securely
   */
  async storeRecoveryPhrase(phrase: string): Promise<void> {
    try {
      await AsyncStorage.setItem('recovery_phrase', phrase);
    } catch (error) {
      console.error('Failed to store recovery phrase:', error);
    }
  }

  /**
   * Get stored recovery phrase
   */
  async getStoredRecoveryPhrase(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('recovery_phrase');
    } catch (error) {
      console.error('Failed to get recovery phrase:', error);
      return null;
    }
  }

  /**
   * Clear encryption data
   */
  async clear(): Promise<void> {
    this.masterKey = null;
    this.syncId = null;
    try {
      await AsyncStorage.removeItem('recovery_phrase');
      await AsyncStorage.removeItem('encryption_salt');
    } catch (error) {
      console.error('Failed to clear encryption data:', error);
    }
  }

  /**
   * Generate a device-specific ID
   */
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      if (!deviceId) {
        // Generate a new device ID
        const randomBytes = nacl.randomBytes(16);
        deviceId = util.encodeBase64(randomBytes).replace(/[+/=]/g, '');
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Failed to get device ID:', error);
      // Return a fallback ID
      return 'unknown_device';
    }
  }

  /**
   * Get a human-readable device name
   */
  getDeviceName(): string {
    const platform = Platform.OS;
    const timestamp = new Date().toISOString().split('T')[0];
    return `${platform}_${timestamp}`;
  }

  /**
   * Test encryption/decryption
   */
  testEncryption(): boolean {
    try {
      const testData = { test: 'data', timestamp: Date.now() };
      const encrypted = this.encryptData(testData);
      const decrypted = this.decryptData(encrypted);
      return JSON.stringify(testData) === JSON.stringify(decrypted);
    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }
}

// Create and export singleton instance
const encryptionService = new EncryptionService();
export default encryptionService;