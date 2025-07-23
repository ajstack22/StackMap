import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const ENCRYPTION_VERSION = 1;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

class EncryptionService {
  constructor() {
    this.masterKey = null;
    this.syncId = null;
  }

  /**
   * Generate a random recovery phrase (12 words from a wordlist)
   */
  generateRecoveryPhrase() {
    // For now, generate a random 128-bit seed and convert to hex
    // In production, use BIP39 wordlist for better UX
    const seedBytes = nacl.randomBytes(16);
    return util.encodeBase64(seedBytes);
  }

  /**
   * Derive encryption key from recovery phrase using PBKDF2-like approach
   */
  async deriveKeyFromPhrase(recoveryPhrase, salt = null) {
    // If no salt provided, generate one
    if (!salt) {
      salt = nacl.randomBytes(SALT_LENGTH);
    } else if (typeof salt === 'string') {
      salt = util.decodeBase64(salt);
    }

    // Simple key derivation (in production, use proper PBKDF2)
    const phraseBytes = util.decodeUTF8(recoveryPhrase);
    const combined = new Uint8Array(phraseBytes.length + salt.length);
    combined.set(phraseBytes);
    combined.set(salt, phraseBytes.length);
    
    // Hash multiple times for key stretching
    let key = nacl.hash(combined);
    for (let i = 0; i < 1000; i++) {
      key = nacl.hash(key);
    }
    
    // Take first 32 bytes as the key
    return {
      key: key.slice(0, KEY_LENGTH),
      salt: util.encodeBase64(salt)
    };
  }

  /**
   * Initialize encryption with a recovery phrase
   */
  async initialize(recoveryPhrase, syncId, existingSalt = null) {
    // Use existing salt if provided, otherwise generate new one
    const { key, salt } = await this.deriveKeyFromPhrase(recoveryPhrase, existingSalt);
    this.masterKey = key;
    this.syncId = syncId;
    
    // Store salt for future key derivation
    await this.storeSalt(salt);
    
    // Store encrypted recovery phrase for automatic restoration
    // We encrypt it with a device-specific key for security
    await this.storeRecoveryPhrase(recoveryPhrase, syncId);
    
    return { syncId, salt };
  }

  /**
   * Encrypt activity data
   */
  encryptData(data) {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    const dataString = JSON.stringify({
      version: ENCRYPTION_VERSION,
      data: data,
      timestamp: Date.now()
    });

    const dataBytes = util.decodeUTF8(dataString);
    const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
    const encrypted = nacl.secretbox(dataBytes, nonce, this.masterKey);

    // Combine nonce and encrypted data
    const combined = new Uint8Array(nonce.length + encrypted.length);
    combined.set(nonce);
    combined.set(encrypted, nonce.length);

    return util.encodeBase64(combined);
  }

  /**
   * Decrypt activity data
   */
  decryptData(encryptedData) {
    if (!this.masterKey) {
      throw new Error('Encryption not initialized');
    }

    const combined = util.decodeBase64(encryptedData);
    
    // Extract nonce and encrypted data
    const nonce = combined.slice(0, nacl.secretbox.nonceLength);
    const encrypted = combined.slice(nacl.secretbox.nonceLength);

    const decrypted = nacl.secretbox.open(encrypted, nonce, this.masterKey);
    if (!decrypted) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }

    const dataString = util.encodeUTF8(decrypted);
    const parsed = JSON.parse(dataString);

    // Verify version
    if (parsed.version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encryption version: ${parsed.version}`);
    }

    return parsed.data;
  }

  /**
   * Store salt locally for key derivation
   */
  async storeSalt(salt) {
    const key = `@sync_salt_${this.syncId}`;
    await AsyncStorage.setItem(key, salt);
  }

  /**
   * Retrieve stored salt
   */
  async getStoredSalt(syncId) {
    const key = `@sync_salt_${syncId}`;
    return await AsyncStorage.getItem(key);
  }

  /**
   * Generate a unique device ID
   */
  async getDeviceId() {
    const key = '@device_id';
    let deviceId = await AsyncStorage.getItem(key);
    
    if (!deviceId) {
      deviceId = util.encodeBase64(nacl.randomBytes(16));
      await AsyncStorage.setItem(key, deviceId);
    }
    
    return deviceId;
  }

  /**
   * Get device name for identification
   */
  getDeviceName() {
    if (Platform.OS === 'ios') {
      return `iPhone/iPad`;
    } else if (Platform.OS === 'android') {
      return `Android Device`;
    } else if (Platform.OS === 'web') {
      return `Web Browser`;
    }
    return 'Unknown Device';
  }

  /**
   * Store recovery phrase encrypted with device key
   */
  async storeRecoveryPhrase(recoveryPhrase, syncId) {
    try {
      // Generate a device-specific encryption key
      const deviceKey = await this.getDeviceKey();
      
      // Encrypt the recovery phrase
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const phraseBytes = util.decodeUTF8(recoveryPhrase);
      const encrypted = nacl.secretbox(phraseBytes, nonce, deviceKey);
      
      // Combine nonce and encrypted data
      const combined = new Uint8Array(nonce.length + encrypted.length);
      combined.set(nonce);
      combined.set(encrypted, nonce.length);
      
      // Store encrypted phrase
      await AsyncStorage.setItem(`@sync_phrase_${syncId}`, util.encodeBase64(combined));
    } catch (error) {
      console.error('Failed to store recovery phrase:', error);
    }
  }
  
  /**
   * Retrieve and decrypt recovery phrase
   */
  async getStoredRecoveryPhrase(syncId) {
    try {
      const encryptedData = await AsyncStorage.getItem(`@sync_phrase_${syncId}`);
      if (!encryptedData) return null;
      
      // Get device key
      const deviceKey = await this.getDeviceKey();
      
      // Decrypt
      const combined = util.decodeBase64(encryptedData);
      const nonce = combined.slice(0, nacl.secretbox.nonceLength);
      const encrypted = combined.slice(nacl.secretbox.nonceLength);
      
      const decrypted = nacl.secretbox.open(encrypted, nonce, deviceKey);
      if (!decrypted) return null;
      
      return util.encodeUTF8(decrypted);
    } catch (error) {
      console.error('Failed to retrieve recovery phrase:', error);
      return null;
    }
  }
  
  /**
   * Generate device-specific encryption key
   */
  async getDeviceKey() {
    // Get or create a device-specific seed
    let deviceSeed = await AsyncStorage.getItem('@device_seed');
    if (!deviceSeed) {
      deviceSeed = util.encodeBase64(nacl.randomBytes(32));
      await AsyncStorage.setItem('@device_seed', deviceSeed);
    }
    
    // Derive key from seed
    const seedBytes = util.decodeBase64(deviceSeed);
    const hash = nacl.hash(seedBytes);
    return hash.slice(0, nacl.secretbox.keyLength);
  }

  /**
   * Clear all encryption data
   */
  async clear() {
    if (this.syncId) {
      await AsyncStorage.removeItem(`@sync_phrase_${this.syncId}`);
      await AsyncStorage.removeItem(`@sync_salt_${this.syncId}`);
    }
    this.masterKey = null;
    this.syncId = null;
  }
}

export default new EncryptionService();