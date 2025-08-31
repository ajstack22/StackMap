// Import crypto polyfill for React Native BEFORE tweetnacl
// Only import on native platforms, not web
// @ts-ignore
if (typeof window === 'undefined') {
  require('react-native-get-random-values');
}

import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pako from 'pako';
import { Platform } from 'react-native';

// Type helpers for tweetnacl-util with proper casting
const encodeBase64 = (arr: Uint8Array): string =>
  (util as any).encodeBase64(arr);
const decodeBase64 = (str: string): Uint8Array =>
  (util as any).decodeBase64(str);
const encodeUTF8 = (str: string): Uint8Array => (util as any).encodeUTF8(str);
const decodeUTF8 = (arr: Uint8Array): string => (util as any).decodeUTF8(arr);

const ENCRYPTION_VERSION = 2; // Bumped for compression support
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const COMPRESSION_THRESHOLD = 1024; // Only compress if data > 1KB
const KEY_DERIVATION_ITERATIONS = 100000; // Must match server for compatibility

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
  private keyCache: { [key: string]: DerivedKey } = {}; // In-memory cache for derived keys

  /**
   * Generate a random recovery phrase (12 words from a wordlist)
   */
  generateRecoveryPhrase(): string {
    // Generate a random 128-bit seed and convert to hex
    // In production, use BIP39 wordlist for better UX
    const seedBytes = nacl.randomBytes(16);
    // Convert to hex string (no padding, URL-safe)
    return Array.from(seedBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Derive encryption key from recovery phrase using PBKDF2-like approach
   */
  async deriveKeyFromPhrase(
    recoveryPhrase: string,
    salt: Uint8Array | string | null = null,
  ): Promise<DerivedKey> {
    // If no salt provided, generate one
    let saltBytes: Uint8Array;
    if (!salt) {
      saltBytes = nacl.randomBytes(SALT_LENGTH);
    } else if (typeof salt === 'string') {
      saltBytes = decodeBase64(salt);
    } else {
      saltBytes = salt;
    }

    const saltStr = encodeBase64(saltBytes);
    
    // Check in-memory cache first (fastest)
    const memoryCacheKey = `${recoveryPhrase}_${saltStr}`;
    if (this.keyCache[memoryCacheKey]) {
      console.log('[Encryption] Using in-memory cached key');
      return this.keyCache[memoryCacheKey];
    }

    // Check AsyncStorage cache second (persistent but slower)
    const storageCacheKey = `@derived_key_${recoveryPhrase.substring(0, 8)}_${saltStr.substring(0, 8)}`;
    try {
      const cachedKey = await AsyncStorage.getItem(storageCacheKey);
      if (cachedKey) {
        console.log('[Encryption] Using persistent cached key');
        const result = {
          key: decodeBase64(cachedKey),
          salt: saltStr,
        };
        // Store in memory cache for faster access
        this.keyCache[memoryCacheKey] = result;
        return result;
      }
    } catch (error) {
      console.log('[Encryption] Error loading cached key:', error);
    }

    console.log('[Encryption] Deriving key (this may take a moment)...');

    // Simple key derivation (in production, use proper PBKDF2)
    const phraseBytes = encodeUTF8(recoveryPhrase);
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

        // Log progress
        const progress = Math.round((i / KEY_DERIVATION_ITERATIONS) * 100);
        if (i % (batchSize * 2) === 0) {
          console.log(`[Encryption] Key derivation progress: ${progress}%`);
        }
      }

      // Log progress in development mode
      if (__DEV__ && i % logInterval === 0 && i > 0) {
        // Progress logged
      }
    }

    const derivedKey = key.slice(0, KEY_LENGTH);
    const result: DerivedKey = {
      key: derivedKey,
      salt: saltStr,
    };
    
    // Store in memory cache (instant access in same session)
    this.keyCache[memoryCacheKey] = result;
    console.log('[Encryption] Stored key in memory cache');
    
    // Also store in AsyncStorage for persistence (helps on next app launch)
    try {
      await AsyncStorage.setItem(storageCacheKey, encodeBase64(derivedKey));
      console.log('[Encryption] Stored key in persistent cache');
    } catch (error) {
      console.log('[Encryption] Error storing key in persistent cache:', error);
    }
    
    return result;
  }

  /**
   * Initialize encryption with recovery phrase
   */
  async initialize(
    recoveryPhrase: string,
    syncId: string,
    existingSalt: string | null = null,
  ): Promise<{ salt: string }> {
    // Check if encryption is already initialized (key is cached in memory)
    // This avoids expensive key derivation on every app start
    if (this.masterKey && this.syncId === syncId) {
      console.log('[Encryption] Using cached master key');
      // Return the existing salt
      const cachedSalt = await AsyncStorage.getItem('encryption_salt');
      return { salt: cachedSalt || existingSalt || '' };
    }

    const { key, salt } = await this.deriveKeyFromPhrase(
      recoveryPhrase,
      existingSalt,
    );
    this.masterKey = key;
    this.syncId = syncId;

    // Store the recovery phrase and salt securely
    await this.storeRecoveryPhrase(recoveryPhrase, syncId);
    await AsyncStorage.setItem('encryption_salt', salt);

    return { salt };
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
    let dataBytes = encodeUTF8(dataStr);

    // Prepare metadata
    const metadata: EncryptionMetadata = {
      version: ENCRYPTION_VERSION,
      compressed: false,
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
        if (__DEV__) {
          if (__DEV__) {
            console.warn(
          '[ENCRYPTION] Compression failed, using uncompressed data:',
          error,
        );
          }
        }
      }
    }

    // Encode metadata
    const metadataBytes = encodeUTF8(JSON.stringify(metadata));
    const metadataLength = new Uint8Array(4);
    new DataView(metadataLength.buffer).setUint32(
      0,
      metadataBytes.length,
      false,
    );

    // Combine metadata and data
    const combined = new Uint8Array(
      4 + metadataBytes.length + dataBytes.length,
    );
    combined.set(metadataLength, 0);
    combined.set(metadataBytes, 4);
    combined.set(dataBytes, 4 + metadataBytes.length);

    // Generate nonce and encrypt
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = (nacl.secretbox as any)(combined, nonce, this.masterKey);

    // Combine nonce and encrypted data
    const result = new Uint8Array(nonce.length + encrypted.length);
    result.set(nonce);
    result.set(encrypted, nonce.length);

    return encodeBase64(result);
  }

  /**
   * Decrypt data using nacl secretbox
   */
  decryptData(encryptedData: string): any {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      // Validate input
      if (typeof encryptedData !== 'string') {
        console.error('[DECRYPTION] Invalid input type:', typeof encryptedData);
        throw new Error(`Expected string but got ${typeof encryptedData}`);
      }
      
      if (!encryptedData) {
        throw new Error('Empty encrypted data');
      }
      
      console.log('[DECRYPTION] Starting decryption, encrypted data length:', encryptedData.length);
      const combined = decodeBase64(encryptedData);
      console.log('[DECRYPTION] Base64 decoded to', combined.length, 'bytes');

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
        const metadataLength = new DataView(
          decrypted.buffer,
          decrypted.byteOffset,
          4,
        ).getUint32(0, false);
        console.log('[DECRYPTION] Metadata length:', metadataLength, 'Total decrypted length:', decrypted.length);
        
        if (metadataLength > 0 && metadataLength < decrypted.length - 4) {
          try {
            const metadataBytes = decrypted.slice(4, 4 + metadataLength);
            console.log('[DECRYPTION] Attempting to decode metadata bytes:', metadataBytes.length, 'bytes');
            const metadata: EncryptionMetadata = JSON.parse(
              decodeUTF8(metadataBytes),
            );
            console.log('[DECRYPTION] Metadata parsed:', metadata);
            let dataBytes = decrypted.slice(4 + metadataLength);

            // Handle decompression if needed
            if (metadata.version === 2) {
              if (metadata.compressed) {
                try {
                  dataBytes = pako.inflate(dataBytes);
                } catch (error) {
                  if (__DEV__) {
                    console.error('[DECRYPTION] Decompression failed:', error);
                  }
                  throw new Error('Failed to decompress data');
                }
              }
            }

            const dataStr = decodeUTF8(dataBytes);
            return JSON.parse(dataStr);
          } catch (metadataError) {
            // Log metadata parsing error but don't fail yet
            console.log('[DECRYPTION] Metadata parsing error, trying legacy format:', metadataError);
            // Don't fall through - this error means we should try legacy format
          }
        }
      }

      // Legacy format (no metadata) - only try this if metadata parsing failed or no metadata
      try {
        const decryptedStr = decodeUTF8(decrypted);
        return JSON.parse(decryptedStr);
      } catch (legacyError) {
        // If legacy format also fails, the data might be compressed without proper metadata
        // Try decompressing first
        console.log('[DECRYPTION] Legacy format failed, attempting decompression:', legacyError);
        try {
          const decompressed = pako.inflate(decrypted);
          const decompressedStr = decodeUTF8(decompressed);
          return JSON.parse(decompressedStr);
        } catch (decompressionError) {
          console.error('[DECRYPTION] All decryption attempts failed');
          console.error('[DECRYPTION] Decrypted data length:', decrypted.length);
          console.error('[DECRYPTION] First 50 bytes:', Array.from(decrypted.slice(0, 50)));
          throw new Error('Failed to decrypt data - invalid format or corrupted data');
        }
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[DECRYPTION] Decryption error:', error);
      }
      throw error;
    }
  }

  /**
   * Store recovery phrase securely
   */
  async storeRecoveryPhrase(phrase: string, syncId?: string): Promise<void> {
    try {
      const key = syncId ? `@sync_phrase_${syncId}` : '@sync_phrase';
      // Storing recovery phrase
      await AsyncStorage.setItem(key, phrase);
      
      // Verify it was stored
      const verify = await AsyncStorage.getItem(key);
      // Verification complete
      
      if (!verify) {
        const errorMsg = `[CRITICAL] Recovery phrase storage verification failed! Key: ${key}`;
        console.error(errorMsg);
        // In production, show a visible warning
        if (!__DEV__) {
          console.warn('⚠️ IMPORTANT: Recovery phrase may not persist after page refresh. Please copy it immediately!');
        }
      }
    } catch (error) {
      console.error('[Encryption TS] Failed to store recovery phrase:', error);
      // In production, show a visible warning
      if (!__DEV__) {
        console.warn('⚠️ CRITICAL ERROR: Could not save recovery phrase. Copy it now before refreshing!');
      }
      throw error;
    }
  }

  /**
   * Get stored recovery phrase
   */
  async getStoredRecoveryPhrase(syncId?: string): Promise<string | null> {
    try {
      const key = syncId ? `@sync_phrase_${syncId}` : '@sync_phrase';
      // Getting recovery phrase
      const phrase = await AsyncStorage.getItem(key);
      // Retrieval complete
      return phrase;
    } catch (error) {
      console.error('[Encryption TS] Failed to get recovery phrase:', error);
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
      if (__DEV__) {
        console.error('Failed to clear encryption data:', error);
      }
    }
  }

  /**
   * Generate a device-specific ID
   */
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      // Check if existing device ID is in the wrong format (not 32 hex chars)
      if (deviceId && !/^[a-f0-9]{32}$/.test(deviceId)) {
        if (__DEV__) console.log('[Encryption] Clearing invalid device_id format:', deviceId);
        await AsyncStorage.removeItem('device_id');
        deviceId = null;
      }
      
      if (!deviceId) {
        // Generate a new device ID as 32-char hex string (matching server validation)
        const randomBytes = nacl.randomBytes(16);
        deviceId = Array.from(randomBytes)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        if (__DEV__) console.log('[Encryption] Generated new device_id:', deviceId);
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to get device ID:', error);
      }
      // Return a fallback ID in correct format (32 hex chars)
      return '00000000000000000000000000000000';
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
      if (__DEV__) {
        console.error('Encryption test failed:', error);
      }
      return false;
    }
  }
}

// Export singleton instance directly
export default new EncryptionService();
