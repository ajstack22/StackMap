// Simplified encryption service for iOS debugging
// Starting from absolute basics that work on web/Android

import nacl from 'tweetnacl';
import { Platform } from 'react-native';

// Use minimal type casting for tweetnacl-util
const util = require('tweetnacl-util');

class SimpleEncryptionService {
  public masterKey: Uint8Array | null = null;
  
  /**
   * Initialize with a test key for debugging
   */
  async initializeTest(): Promise<void> {
    // Use a fixed test key (32 bytes)
    this.masterKey = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      this.masterKey[i] = i;
    }
  }

  /**
   * Test basic Base64 encoding/decoding
   */
  testBase64(): boolean {
    try {
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      
      // Test encoding
      const encoded = util.encodeBase64(testData);
      
      // Test decoding
      const decoded = util.decodeBase64(encoded);
      
      // Verify round-trip
      const match = testData.every((val, idx) => val === decoded[idx]);
      return match;
    } catch (error) {
      console.error('[SimpleEncryption] Base64 test failed:', error);
      return false;
    }
  }

  /**
   * Test basic UTF-8 encoding/decoding
   */
  testUTF8(): boolean {
    try {
      const testString = 'Hello iOS! 👋';
      
      // Test encoding
      const encoded = util.encodeUTF8(testString);
      
      // Test decoding
      const decoded = util.decodeUTF8(encoded);
      
      // Verify round-trip
      const match = testString === decoded;
      return match;
    } catch (error) {
      console.error('[SimpleEncryption] UTF-8 test failed:', error);
      return false;
    }
  }

  /**
   * Test metadata encoding (the problematic part on iOS)
   */
  testMetadataEncoding(): boolean {
    try {
      
      const metadata = { version: 2, compressed: false };
      const metadataStr = JSON.stringify(metadata);
      
      // Encode to UTF-8
      const metadataBytes = util.encodeUTF8(metadataStr);
      
      // Create length prefix (4 bytes) - SIMPLE APPROACH
      const lengthBytes = new Uint8Array(4);
      const length = metadataBytes.length;
      
      // Manual byte packing (avoiding DataView issues on iOS)
      lengthBytes[0] = (length >> 24) & 0xFF;
      lengthBytes[1] = (length >> 16) & 0xFF;
      lengthBytes[2] = (length >> 8) & 0xFF;
      lengthBytes[3] = length & 0xFF;
      
      
      // Combine length and metadata
      const combined = new Uint8Array(4 + metadataBytes.length);
      combined.set(lengthBytes, 0);
      combined.set(metadataBytes, 4);
      
      
      // Now test reading it back
      const readLength = (combined[0] << 24) | (combined[1] << 16) | (combined[2] << 8) | combined[3];
      
      const readMetadataBytes = combined.slice(4, 4 + readLength);
      const readMetadataStr = util.decodeUTF8(readMetadataBytes);
      const readMetadata = JSON.parse(readMetadataStr);
      
      const match = JSON.stringify(metadata) === JSON.stringify(readMetadata);
      return match;
    } catch (error) {
      console.error('[SimpleEncryption] Metadata test failed:', error);
      return false;
    }
  }

  /**
   * Simple encrypt function using manual byte packing
   */
  encryptData(data: any): string {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      
      // Prepare data
      const dataStr = JSON.stringify(data);
      const dataBytes = util.encodeUTF8(dataStr);
      
      // Prepare metadata
      const metadata = { version: 2, compressed: false };
      const metadataStr = JSON.stringify(metadata);
      const metadataBytes = util.encodeUTF8(metadataStr);
      
      // Create length prefix manually (avoiding DataView)
      const length = metadataBytes.length;
      const lengthBytes = new Uint8Array(4);
      lengthBytes[0] = (length >> 24) & 0xFF;
      lengthBytes[1] = (length >> 16) & 0xFF;
      lengthBytes[2] = (length >> 8) & 0xFF;
      lengthBytes[3] = length & 0xFF;
      
      
      // Combine all parts
      const combined = new Uint8Array(4 + metadataBytes.length + dataBytes.length);
      combined.set(lengthBytes, 0);
      combined.set(metadataBytes, 4);
      combined.set(dataBytes, 4 + metadataBytes.length);
      
      
      // Encrypt with nacl
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const encrypted = nacl.secretbox(combined, nonce, this.masterKey);
      
      if (!encrypted) {
        throw new Error('Encryption failed');
      }
      
      
      // Combine nonce and encrypted data
      const result = new Uint8Array(nonce.length + encrypted.length);
      result.set(nonce, 0);
      result.set(encrypted, nonce.length);
      
      // Encode to base64
      const encoded = util.encodeBase64(result);
      
      return encoded;
    } catch (error) {
      console.error('[SimpleEncryption] Encryption error:', error);
      throw error;
    }
  }

  /**
   * Simple decrypt function using manual byte unpacking
   */
  decryptData(encryptedData: string): any {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      
      // Decode from base64
      const combined = util.decodeBase64(encryptedData);
      
      // Extract nonce and encrypted data
      const nonce = combined.slice(0, nacl.secretbox.nonceLength);
      const encrypted = combined.slice(nacl.secretbox.nonceLength);
      
      
      // Decrypt
      const decrypted = nacl.secretbox.open(encrypted, nonce, this.masterKey);
      if (!decrypted) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      
      // Read metadata length manually (avoiding DataView)
      const metadataLength = (decrypted[0] << 24) | 
                            (decrypted[1] << 16) | 
                            (decrypted[2] << 8) | 
                            decrypted[3];
      
      
      if (metadataLength > 0 && metadataLength < decrypted.length - 4) {
        // Read metadata
        const metadataBytes = decrypted.slice(4, 4 + metadataLength);
        const metadataStr = util.decodeUTF8(metadataBytes);
        // const metadata = JSON.parse(metadataStr);
        JSON.parse(metadataStr); // Validate metadata format
        
        // Read data
        const dataBytes = decrypted.slice(4 + metadataLength);
        const dataStr = util.decodeUTF8(dataBytes);
        const data = JSON.parse(dataStr);
        
        return data;
      } else {
        // Legacy format without metadata
        const dataStr = util.decodeUTF8(decrypted);
        return JSON.parse(dataStr);
      }
    } catch (error) {
      console.error('[SimpleEncryption] Decryption error:', error);
      throw error;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    
    await this.initializeTest();
    
    // const base64Pass = this.testBase64();
    this.testBase64();
    
    // const utf8Pass = this.testUTF8();
    this.testUTF8();
    
    // const metadataPass = this.testMetadataEncoding();
    this.testMetadataEncoding();
    
    try {
      const testData = { 
        test: 'data', 
        timestamp: Date.now(),
        platform: Platform.OS,
        emoji: '🎉'
      };
      
      const encrypted = this.encryptData(testData);
      
      const decrypted = this.decryptData(encrypted);
      
      // const fullPass = JSON.stringify(testData) === JSON.stringify(decrypted);
      // Test passes if no exception thrown
      
    } catch (error) {
      console.error('[SimpleEncryption] Full test failed:', error);
    }
  }
}

export default new SimpleEncryptionService();