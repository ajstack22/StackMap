// Simplified encryption service for iOS debugging
// Starting from absolute basics that work on web/Android

import nacl from 'tweetnacl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use minimal type casting for tweetnacl-util
const util = require('tweetnacl-util');

class SimpleEncryptionService {
  public masterKey: Uint8Array | null = null;
  
  /**
   * Initialize with a test key for debugging
   */
  async initializeTest(): Promise<void> {
    console.log('[SimpleEncryption] Initializing test encryption');
    // Use a fixed test key (32 bytes)
    this.masterKey = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      this.masterKey[i] = i;
    }
    console.log('[SimpleEncryption] Test key initialized');
  }

  /**
   * Test basic Base64 encoding/decoding
   */
  testBase64(): boolean {
    try {
      console.log('[SimpleEncryption] Testing Base64...');
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      
      // Test encoding
      const encoded = util.encodeBase64(testData);
      console.log('[SimpleEncryption] Encoded:', encoded);
      
      // Test decoding
      const decoded = util.decodeBase64(encoded);
      console.log('[SimpleEncryption] Decoded:', Array.from(decoded));
      
      // Verify round-trip
      const match = testData.every((val, idx) => val === decoded[idx]);
      console.log('[SimpleEncryption] Base64 test passed:', match);
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
      console.log('[SimpleEncryption] Testing UTF-8...');
      const testString = 'Hello iOS! 👋';
      
      // Test encoding
      const encoded = util.encodeUTF8(testString);
      console.log('[SimpleEncryption] UTF-8 encoded length:', encoded.length);
      console.log('[SimpleEncryption] First 10 bytes:', Array.from(encoded.slice(0, 10)));
      
      // Test decoding
      const decoded = util.decodeUTF8(encoded);
      console.log('[SimpleEncryption] UTF-8 decoded:', decoded);
      
      // Verify round-trip
      const match = testString === decoded;
      console.log('[SimpleEncryption] UTF-8 test passed:', match);
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
      console.log('[SimpleEncryption] Testing metadata encoding...');
      
      const metadata = { version: 2, compressed: false };
      const metadataStr = JSON.stringify(metadata);
      console.log('[SimpleEncryption] Metadata string:', metadataStr);
      
      // Encode to UTF-8
      const metadataBytes = util.encodeUTF8(metadataStr);
      console.log('[SimpleEncryption] Metadata bytes length:', metadataBytes.length);
      console.log('[SimpleEncryption] Metadata bytes:', Array.from(metadataBytes));
      
      // Create length prefix (4 bytes) - SIMPLE APPROACH
      const lengthBytes = new Uint8Array(4);
      const length = metadataBytes.length;
      
      // Manual byte packing (avoiding DataView issues on iOS)
      lengthBytes[0] = (length >> 24) & 0xFF;
      lengthBytes[1] = (length >> 16) & 0xFF;
      lengthBytes[2] = (length >> 8) & 0xFF;
      lengthBytes[3] = length & 0xFF;
      
      console.log('[SimpleEncryption] Length bytes:', Array.from(lengthBytes));
      
      // Combine length and metadata
      const combined = new Uint8Array(4 + metadataBytes.length);
      combined.set(lengthBytes, 0);
      combined.set(metadataBytes, 4);
      
      console.log('[SimpleEncryption] Combined first 10 bytes:', Array.from(combined.slice(0, 10)));
      
      // Now test reading it back
      const readLength = (combined[0] << 24) | (combined[1] << 16) | (combined[2] << 8) | combined[3];
      console.log('[SimpleEncryption] Read length:', readLength);
      
      const readMetadataBytes = combined.slice(4, 4 + readLength);
      const readMetadataStr = util.decodeUTF8(readMetadataBytes);
      const readMetadata = JSON.parse(readMetadataStr);
      console.log('[SimpleEncryption] Read metadata:', readMetadata);
      
      const match = JSON.stringify(metadata) === JSON.stringify(readMetadata);
      console.log('[SimpleEncryption] Metadata test passed:', match);
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
      console.log('[SimpleEncryption] Starting encryption...');
      
      // Prepare data
      const dataStr = JSON.stringify(data);
      const dataBytes = util.encodeUTF8(dataStr);
      console.log('[SimpleEncryption] Data bytes length:', dataBytes.length);
      
      // Prepare metadata
      const metadata = { version: 2, compressed: false };
      const metadataStr = JSON.stringify(metadata);
      const metadataBytes = util.encodeUTF8(metadataStr);
      console.log('[SimpleEncryption] Metadata bytes length:', metadataBytes.length);
      
      // Create length prefix manually (avoiding DataView)
      const length = metadataBytes.length;
      const lengthBytes = new Uint8Array(4);
      lengthBytes[0] = (length >> 24) & 0xFF;
      lengthBytes[1] = (length >> 16) & 0xFF;
      lengthBytes[2] = (length >> 8) & 0xFF;
      lengthBytes[3] = length & 0xFF;
      
      console.log('[SimpleEncryption] Length bytes:', Array.from(lengthBytes));
      
      // Combine all parts
      const combined = new Uint8Array(4 + metadataBytes.length + dataBytes.length);
      combined.set(lengthBytes, 0);
      combined.set(metadataBytes, 4);
      combined.set(dataBytes, 4 + metadataBytes.length);
      
      console.log('[SimpleEncryption] Combined length:', combined.length);
      console.log('[SimpleEncryption] First 10 bytes of combined:', Array.from(combined.slice(0, 10)));
      
      // Encrypt with nacl
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const encrypted = nacl.secretbox(combined, nonce, this.masterKey);
      
      if (!encrypted) {
        throw new Error('Encryption failed');
      }
      
      console.log('[SimpleEncryption] Encrypted length:', encrypted.length);
      
      // Combine nonce and encrypted data
      const result = new Uint8Array(nonce.length + encrypted.length);
      result.set(nonce, 0);
      result.set(encrypted, nonce.length);
      
      // Encode to base64
      const encoded = util.encodeBase64(result);
      console.log('[SimpleEncryption] Final encoded length:', encoded.length);
      
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
      console.log('[SimpleEncryption] Starting decryption...');
      console.log('[SimpleEncryption] Encrypted data length:', encryptedData.length);
      
      // Decode from base64
      const combined = util.decodeBase64(encryptedData);
      console.log('[SimpleEncryption] Decoded length:', combined.length);
      
      // Extract nonce and encrypted data
      const nonce = combined.slice(0, nacl.secretbox.nonceLength);
      const encrypted = combined.slice(nacl.secretbox.nonceLength);
      
      console.log('[SimpleEncryption] Nonce length:', nonce.length);
      console.log('[SimpleEncryption] Encrypted length:', encrypted.length);
      
      // Decrypt
      const decrypted = nacl.secretbox.open(encrypted, nonce, this.masterKey);
      if (!decrypted) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      console.log('[SimpleEncryption] Decrypted length:', decrypted.length);
      console.log('[SimpleEncryption] First 10 bytes:', Array.from(decrypted.slice(0, 10)));
      
      // Read metadata length manually (avoiding DataView)
      const metadataLength = (decrypted[0] << 24) | 
                            (decrypted[1] << 16) | 
                            (decrypted[2] << 8) | 
                            decrypted[3];
      
      console.log('[SimpleEncryption] Metadata length:', metadataLength);
      
      if (metadataLength > 0 && metadataLength < decrypted.length - 4) {
        // Read metadata
        const metadataBytes = decrypted.slice(4, 4 + metadataLength);
        const metadataStr = util.decodeUTF8(metadataBytes);
        const metadata = JSON.parse(metadataStr);
        console.log('[SimpleEncryption] Metadata:', metadata);
        
        // Read data
        const dataBytes = decrypted.slice(4 + metadataLength);
        const dataStr = util.decodeUTF8(dataBytes);
        const data = JSON.parse(dataStr);
        
        return data;
      } else {
        // Legacy format without metadata
        console.log('[SimpleEncryption] No metadata, using legacy format');
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
    console.log('\n=== Starting Simple Encryption Tests ===\n');
    console.log('Platform:', Platform.OS);
    
    await this.initializeTest();
    
    console.log('\n--- Test 1: Base64 ---');
    const base64Pass = this.testBase64();
    
    console.log('\n--- Test 2: UTF-8 ---');
    const utf8Pass = this.testUTF8();
    
    console.log('\n--- Test 3: Metadata Encoding ---');
    const metadataPass = this.testMetadataEncoding();
    
    console.log('\n--- Test 4: Full Encryption/Decryption ---');
    try {
      const testData = { 
        test: 'data', 
        timestamp: Date.now(),
        platform: Platform.OS,
        emoji: '🎉'
      };
      console.log('[SimpleEncryption] Test data:', testData);
      
      const encrypted = this.encryptData(testData);
      console.log('[SimpleEncryption] Encrypted successfully');
      
      const decrypted = this.decryptData(encrypted);
      console.log('[SimpleEncryption] Decrypted:', decrypted);
      
      const fullPass = JSON.stringify(testData) === JSON.stringify(decrypted);
      console.log('[SimpleEncryption] Full test passed:', fullPass);
      
      console.log('\n=== Test Results ===');
      console.log('Base64:', base64Pass ? '✅' : '❌');
      console.log('UTF-8:', utf8Pass ? '✅' : '❌');
      console.log('Metadata:', metadataPass ? '✅' : '❌');
      console.log('Full:', fullPass ? '✅' : '❌');
      console.log('===================\n');
    } catch (error) {
      console.error('[SimpleEncryption] Full test failed:', error);
      console.log('\n=== Test Results ===');
      console.log('Base64:', base64Pass ? '✅' : '❌');
      console.log('UTF-8:', utf8Pass ? '✅' : '❌');
      console.log('Metadata:', metadataPass ? '✅' : '❌');
      console.log('Full: ❌');
      console.log('===================\n');
    }
  }
}

export default new SimpleEncryptionService();