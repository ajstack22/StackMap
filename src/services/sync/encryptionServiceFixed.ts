// Fixed encryption service for iOS
// Uses native TextEncoder/TextDecoder instead of tweetnacl-util for UTF-8

import nacl from 'tweetnacl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pako from 'pako';
import { Platform } from 'react-native';

// Base64 encoding from tweetnacl-util (this works fine)
const util = require('tweetnacl-util');
const encodeBase64 = (arr: Uint8Array): string => util.encodeBase64(arr);
const decodeBase64 = (str: string): Uint8Array => util.decodeBase64(str);

// UTF-8 encoding - ALWAYS use manual implementation to avoid platform issues
// tweetnacl-util is broken on iOS (returns strings instead of Uint8Arrays)
let encodeUTF8: (str: string) => Uint8Array;
let decodeUTF8: (arr: Uint8Array) => string;

// ALWAYS use manual implementation - tweetnacl-util is unreliable
if (true) {  // Always true, keeping structure for clarity
  // Manual UTF-8 encoding that works reliably on all platforms
  encodeUTF8 = (str: string) => {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      if (char < 0x80) {
        bytes.push(char);
      } else if (char < 0x800) {
        bytes.push(0xc0 | (char >> 6));
        bytes.push(0x80 | (char & 0x3f));
      } else if (char < 0xd800 || char >= 0xe000) {
        bytes.push(0xe0 | (char >> 12));
        bytes.push(0x80 | ((char >> 6) & 0x3f));
        bytes.push(0x80 | (char & 0x3f));
      } else {
        // Surrogate pair
        i++;
        const char2 = str.charCodeAt(i);
        const codePoint = 0x10000 + (((char & 0x3ff) << 10) | (char2 & 0x3ff));
        bytes.push(0xf0 | (codePoint >> 18));
        bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
        bytes.push(0x80 | (codePoint & 0x3f));
      }
    }
    return new Uint8Array(bytes);
  };
  
  decodeUTF8 = (arr: Uint8Array) => {
    const bytes = Array.from(arr);
    let result = '';
    let i = 0;
    
    while (i < bytes.length) {
      const byte1 = bytes[i++];
      if (byte1 < 0x80) {
        result += String.fromCharCode(byte1);
      } else if ((byte1 & 0xe0) === 0xc0) {
        const byte2 = bytes[i++];
        result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
      } else if ((byte1 & 0xf0) === 0xe0) {
        const byte2 = bytes[i++];
        const byte3 = bytes[i++];
        result += String.fromCharCode(
          ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f)
        );
      } else if ((byte1 & 0xf8) === 0xf0) {
        const byte2 = bytes[i++];
        const byte3 = bytes[i++];
        const byte4 = bytes[i++];
        const codePoint =
          ((byte1 & 0x07) << 18) |
          ((byte2 & 0x3f) << 12) |
          ((byte3 & 0x3f) << 6) |
          (byte4 & 0x3f);
        const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800;
        const low = ((codePoint - 0x10000) % 0x400) + 0xdc00;
        result += String.fromCharCode(high, low);
      }
    }
    return result;
  };
}

const ENCRYPTION_VERSION = 2;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;
const COMPRESSION_THRESHOLD = 1024;
const KEY_DERIVATION_ITERATIONS = 100000;

interface EncryptionMetadata {
  version: number;
  compressed?: boolean;
}

interface DerivedKey {
  key: Uint8Array;
  salt: string;
}

class FixedEncryptionService {
  public masterKey: Uint8Array | null = null;
  public syncId: string | null = null;
  private keyCache: { [key: string]: DerivedKey } = {};


  generateRecoveryPhrase(): string {
    const seedBytes = nacl.randomBytes(16);
    return Array.from(seedBytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }


  async deriveKeyFromPhrase(
    recoveryPhrase: string,
    salt: Uint8Array | string | null = null,
  ): Promise<DerivedKey> {
    let saltBytes: Uint8Array;
    if (!salt) {
      saltBytes = nacl.randomBytes(SALT_LENGTH);
    } else if (typeof salt === 'string') {
      saltBytes = decodeBase64(salt);
    } else {
      saltBytes = salt;
    }

    const saltStr = encodeBase64(saltBytes);
    
    // Check cache
    const memoryCacheKey = `${recoveryPhrase}_${saltStr}`;
    if (this.keyCache[memoryCacheKey]) {
      return this.keyCache[memoryCacheKey];
    }

    
    // Simple key derivation
    const phraseBytes = encodeUTF8(recoveryPhrase);
    const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
    combined.set(phraseBytes);
    combined.set(saltBytes, phraseBytes.length);

    // Hash multiple times
    let key = nacl.hash(combined);
    for (let i = 0; i < KEY_DERIVATION_ITERATIONS; i++) {
      key = nacl.hash(key);
      if (i % 10000 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    const derivedKey = key.slice(0, KEY_LENGTH);
    const result: DerivedKey = {
      key: derivedKey,
      salt: saltStr,
    };
    
    this.keyCache[memoryCacheKey] = result;
    return result;
  }


  async initialize(
    recoveryPhrase: string,
    syncId: string,
    existingSalt: string | null = null,
  ): Promise<{ salt: string }> {
    const { key, salt } = await this.deriveKeyFromPhrase(
      recoveryPhrase,
      existingSalt,
    );
    this.masterKey = key;
    this.syncId = syncId;

    await this.storeRecoveryPhrase(recoveryPhrase, syncId);
    await AsyncStorage.setItem('encryption_salt', salt);

    return { salt };
  }


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

    // Compress if large enough
    if (dataBytes.length > COMPRESSION_THRESHOLD) {
      try {
        const compressed = pako.deflate(dataBytes);
        if (compressed.length < dataBytes.length * 0.9) {
          dataBytes = compressed;
          metadata.compressed = true;
        }
      } catch (error) {
        // Compression failed - continue without compression
      }
    }

    // Encode metadata
    const metadataStr = JSON.stringify(metadata);
    const metadataBytes = encodeUTF8(metadataStr);
    
    // Create length prefix using manual byte packing (iOS-compatible)
    const length = metadataBytes.length;
    const lengthBytes = new Uint8Array(4);
    lengthBytes[0] = (length >> 24) & 0xFF;
    lengthBytes[1] = (length >> 16) & 0xFF;
    lengthBytes[2] = (length >> 8) & 0xFF;
    lengthBytes[3] = length & 0xFF;

    // Combine metadata and data
    const combined = new Uint8Array(4 + metadataBytes.length + dataBytes.length);
    combined.set(lengthBytes, 0);
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


  private extractMetadata(decrypted: Uint8Array): { metadata: EncryptionMetadata; dataBytes: Uint8Array } | null {
    if (decrypted.length <= 4) {
      return null;
    }

    const metadataLength =
      (decrypted[0] << 24) |
      (decrypted[1] << 16) |
      (decrypted[2] << 8) |
      decrypted[3];

    if (metadataLength <= 0 || metadataLength >= decrypted.length - 4) {
      return null;
    }

    try {
      const metadataBytes = decrypted.slice(4, 4 + metadataLength);
      const metadataStr = decodeUTF8(metadataBytes);
      const metadata: EncryptionMetadata = JSON.parse(metadataStr);
      const dataBytes = decrypted.slice(4 + metadataLength);
      return { metadata, dataBytes };
    } catch {
      return null;
    }
  }


  private parseWithMetadata(decrypted: Uint8Array): any {
    const result = this.extractMetadata(decrypted);
    if (!result) {
      return null;
    }

    const { metadata, dataBytes } = result;
    let finalDataBytes = dataBytes;

    // Handle decompression if needed
    if (metadata.version === 2 && metadata.compressed) {
      try {
        finalDataBytes = pako.inflate(dataBytes);
      } catch {
        throw new Error('Failed to decompress data');
      }
    }

    const dataStr = decodeUTF8(finalDataBytes);
    return JSON.parse(dataStr);
  }


  private parseLegacyFormat(decrypted: Uint8Array): any {
    try {
      const decryptedStr = decodeUTF8(decrypted);
      return JSON.parse(decryptedStr);
    } catch {
      // Try decompressing
      const decompressed = pako.inflate(decrypted);
      const decompressedStr = decodeUTF8(decompressed);
      return JSON.parse(decompressedStr);
    }
  }


  decryptData(encryptedData: string): any {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    // Validate input
    if (typeof encryptedData !== 'string' || !encryptedData) {
      throw new Error(`Invalid encrypted data: ${typeof encryptedData}`);
    }

    const combined = decodeBase64(encryptedData);

    // Extract nonce and encrypted data
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const encrypted = combined.slice(nacl.secretbox.nonceLength);

    // Decrypt
    const decrypted = nacl.secretbox.open(encrypted, nonce, this.masterKey);
    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    // Try metadata format first, then legacy
    try {
      const result = this.parseWithMetadata(decrypted);
      if (result !== null) {
        return result;
      }
    } catch {
      // Continue to legacy format
    }

    return this.parseLegacyFormat(decrypted);
  }


  async storeRecoveryPhrase(phrase: string, syncId?: string): Promise<void> {
    try {
      const key = syncId ? `@sync_phrase_${syncId}` : '@sync_phrase';
      await AsyncStorage.setItem(key, phrase);
    } catch (error) {
      throw error;
    }
  }


  async getStoredRecoveryPhrase(syncId?: string): Promise<string | null> {
    try {
      const key = syncId ? `@sync_phrase_${syncId}` : '@sync_phrase';
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }


  async clear(): Promise<void> {
    this.masterKey = null;
    this.syncId = null;
    try {
      await AsyncStorage.removeItem('recovery_phrase');
      await AsyncStorage.removeItem('encryption_salt');
    } catch (error) {
      // Ignore clear errors - data might not exist
    }
  }


  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem('device_id');
      
      if (deviceId && !/^[a-f0-9]{32}$/.test(deviceId)) {
        await AsyncStorage.removeItem('device_id');
        deviceId = null;
      }
      
      if (!deviceId) {
        const randomBytes = nacl.randomBytes(16);
        deviceId = Array.from(randomBytes)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
        await AsyncStorage.setItem('device_id', deviceId);
      }
      return deviceId;
    } catch (error) {
      return '00000000000000000000000000000000';
    }
  }


  getDeviceName(): string {
    const platform = Platform.OS;
    const timestamp = new Date().toISOString().split('T')[0];
    return `${platform}_${timestamp}`;
  }


  testEncryption(): boolean {
    try {
      const testData = { test: 'data', timestamp: Date.now() };
      const encrypted = this.encryptData(testData);
      const decrypted = this.decryptData(encrypted);
      return JSON.stringify(testData) === JSON.stringify(decrypted);
    } catch (error) {
      return false;
    }
  }
}

export default new FixedEncryptionService();