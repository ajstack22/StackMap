/**
 * MINIMAL SYNC SERVICE WITH ENCRYPTION
 * 
 * PHASE 1: Core bidirectional sync ✅
 * PHASE 2: Store integration ✅
 * PHASE 3: Encryption layer ✅
 * PHASE 4: Conflict resolution ✅
 * 
 * Features:
 * - Zero-knowledge encryption using NaCl
 * - Conflict resolution with LWW
 * - Automatic retry for rate limits
 * - 30-second periodic sync
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import conflictResolver from './conflictResolver';
import encryptionService from './encryptionService';

class MinimalSyncService {
  constructor() {
    // Constructor initialization
    this.syncId = null;
    this.deviceId = null;
    this.pullInterval = null;
    this.pullIntervalDuration = 30000; // 30 seconds
    this.isEnabled = false;
    this.lastPullTime = 0;
    this.onDataReceived = null; // Callback for when new data arrives
    
    // Load existing sync ID on initialization
    // Using setTimeout to prevent blocking the constructor and ensure AsyncStorage is ready
    // This pattern was proven to work in the old syncService
    setTimeout(() => {
      console.log('[MinimalSync] Attempting to load existing sync ID (delayed for AsyncStorage)...');
      this.loadExistingSyncId().then(() => {
        console.log('[MinimalSync] Successfully loaded existing sync ID');
      }).catch(error => {
        console.log('[MinimalSync] Error loading existing sync ID:', error);
      });
    }, 1000); // 1 second delay, same as old syncService
    
    // Determine API URL based on environment
    if (typeof window !== 'undefined' && window.location) {
      // Web environment
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development - use relative URL to go through webpack proxy
        this.API_BASE = '/api/sync';
      } else if (window.location.href.includes('/qual/') || window.location.href.includes('qual.')) {
        // QUAL environment - check for /qual/ in URL or qual subdomain
        this.API_BASE = 'https://stackmap.app/qual/api/sync';
      } else {
        // Production
        this.API_BASE = 'https://stackmap.app/api/sync';
      }
    } else {
      // Mobile environments
      // Check if we're in development mode using __DEV__ global
      // __DEV__ is true in debug builds, false in release builds
      const isDevelopment = typeof __DEV__ !== 'undefined' ? __DEV__ : false;
      
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        if (isDevelopment) {
          // Development/Debug builds use QUAL
          this.API_BASE = 'https://stackmap.app/qual/api/sync';
          console.log('[MinimalSync] Mobile DEBUG build - using QUAL API');
        } else {
          // Production/Release builds use production API
          this.API_BASE = 'https://stackmap.app/api/sync';
          console.log('[MinimalSync] Mobile RELEASE build - using production API');
        }
      } else {
        // Default for other non-web environments
        this.API_BASE = 'https://stackmap.app/api/sync';
      }
    }
    
    console.log('[MinimalSync] API URL:', this.API_BASE);
    
    // Initialize device ID synchronously with a placeholder
    this.deviceId = null;
    // Then initialize it properly (async)
    this.initDeviceId();
    
    // Track encryption initialization
    this.encryptionReady = false;
    this.recoveryPhrase = null;
  }

  async initDeviceId() {
    console.log('[MinimalSync] Initializing device ID...');
    try {
      this.deviceId = await AsyncStorage.getItem('device_id');
      if (!this.deviceId) {
        this.deviceId = this.generateId();
        await AsyncStorage.setItem('device_id', this.deviceId);
      }
      console.log('[MinimalSync] Device ID:', this.deviceId);
    } catch (error) {
      console.log('[MinimalSync] Error initializing device ID:', error);
      // Generate one for this session
      this.deviceId = this.generateId();
    }
  }

  async loadExistingSyncId() {
    console.log('[MinimalSync] Checking for existing sync ID...');
    try {
      const storedSyncId = await AsyncStorage.getItem('@minimal_sync_id');
      console.log('[MinimalSync] Stored sync ID result:', storedSyncId ? 'FOUND' : 'NOT FOUND');
      if (storedSyncId) {
        this.syncId = storedSyncId;
        console.log('[MinimalSync] 📥 Loaded existing sync ID:', this.syncId);
        
        // Try to load the recovery phrase
        const storedPhrase = await AsyncStorage.getItem(`@sync_phrase_${storedSyncId}`) || 
                           await AsyncStorage.getItem('@sync_phrase');
        if (storedPhrase) {
          this.recoveryPhrase = storedPhrase;
          console.log('[MinimalSync] 🔑 Loaded recovery phrase');
          
          // CRITICAL: Re-initialize encryption with the loaded phrase
          await this.initializeEncryption(storedPhrase, storedSyncId);
          console.log('[MinimalSync] 🔐 Re-initialized encryption');
          
          // CRITICAL: Set isEnabled flag after successfully loading sync
          this.isEnabled = true;
          console.log('[Sync] Enabled');
        } else {
          console.warn('[MinimalSync] ⚠️ Sync ID found but no recovery phrase - sync disabled');
          this.syncId = null; // Clear sync ID if we can't decrypt
        }
        
        // Also check if we have stored data
        const storedData = await AsyncStorage.getItem('@minimal_sync_data');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          // Found existing sync data from previous session
        }
      } else {
        // No existing sync ID found
      }
    } catch (error) {
      console.log('[MinimalSync] Error loading existing sync ID:', error);
    }
  }

  generateId() {
    // Use the global crypto which is polyfilled by react-native-get-random-values
    // On React Native, this is provided by the polyfill imported in index.js
    if (typeof global.crypto !== 'undefined' && global.crypto.getRandomValues) {
      return Array.from(global.crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      // Fallback for web
      return Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } else {
      // Final fallback using Math.random (less secure but works everywhere)
      console.warn('[MinimalSync] Using Math.random for ID generation - crypto not available');
      return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  /**
   * Safe base64 encoding that handles Unicode
   */
  encodeBase64(str) {
    // Convert string to UTF-8, then to base64
    const utf8 = unescape(encodeURIComponent(str));
    return btoa(utf8);
  }

  /**
   * Safe base64 decoding that handles Unicode
   */
  decodeBase64(str) {
    // Decode from base64, then from UTF-8
    const utf8 = atob(str);
    return decodeURIComponent(escape(utf8));
  }

  /**
   * Add metadata to data if it doesn't have it
   */
  addMetadata(data) {
    const now = Date.now();
    
    // If data already has metadata, preserve it
    if (data.metadata) {
      return data;
    }
    
    // Add metadata for conflict resolution
    return {
      ...data,
      metadata: {
        lastModified: now,
        deviceId: this.deviceId,
        fieldTimestamps: {
          users: now,
          activities: now,
          settings: now,
          library: now
        }
      }
    };
  }

  /**
   * Generate sync ID from recovery phrase (same as existing sync)
   */
  async generateSyncId(recoveryPhrase) {
    const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';
    const { key } = await encryptionService.deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
    const syncIdBytes = key.slice(0, 16);
    const syncId = Array.from(syncIdBytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    return syncId;
  }

  /**
   * Initialize encryption for sync
   */
  async initializeEncryption(recoveryPhrase, syncId) {
    const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
    await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
    this.encryptionReady = true;
    this.recoveryPhrase = recoveryPhrase;
    this.syncId = syncId; // CRITICAL: Set the sync ID for pullData to work
    
    // Ensure device ID is set
    if (!this.deviceId) {
      await this.initDeviceId();
    }
    
    // Use encryption service's device ID if ours isn't set
    if (!this.deviceId) {
      this.deviceId = await encryptionService.getDeviceId();
      console.log('[MinimalSync] Using encryption service device ID:', this.deviceId);
    }
    
    // Store recovery phrase for persistence
    await AsyncStorage.setItem(`@sync_phrase_${syncId}`, recoveryPhrase);
    await AsyncStorage.setItem('@sync_phrase', recoveryPhrase);
    
    console.log('[MinimalSync] 🔐 Encryption initialized with device ID:', this.deviceId);
  }

  /**
   * Create a new sync group with test data
   */
  async createSync(testData) {
    console.log('[MinimalSync] 📤 createSync called');
    console.log('[MinimalSync] 📊 Data received:');
    console.log('[MinimalSync]   - Users count:', Object.keys(testData?.users || {}).length);
    console.log('[MinimalSync]   - User IDs:', Object.keys(testData?.users || {}));
    console.log('[MinimalSync]   - Library activities:', testData?.library?.activities?.length || 0);
    console.log('[MinimalSync]   - Has metadata:', !!testData?.metadata);
    
    try {
      // Generate recovery phrase
      console.log('[MinimalSync] About to generate recovery phrase...');
      this.recoveryPhrase = encryptionService.generateRecoveryPhrase();
      console.log('[MinimalSync] 🔑 Generated recovery phrase:', this.recoveryPhrase);
      
      // Generate sync ID from recovery phrase
      this.syncId = await this.generateSyncId(this.recoveryPhrase);
      console.log('[MinimalSync] 🆔 Generated sync ID:', this.syncId);
      
      // Initialize encryption
      await this.initializeEncryption(this.recoveryPhrase, this.syncId);
      
      // Use encryption service's device ID
      this.deviceId = await encryptionService.getDeviceId();
    } catch (error) {
      console.error('[MinimalSync] ❌ Error in sync creation:', error);
      console.error('[MinimalSync] Error stack:', error.stack);
      return { success: false, error: `Failed to initialize encryption: ${error.message}` };
    }
    
    const timestamp = Date.now();
    
    // Add metadata for conflict resolution
    const dataWithMetadata = this.addMetadata(testData);
    
    // Store the data locally first
    // IMPORTANT: Store timestamp-1 so the first pull includes our own record
    const dataToStore = {
      syncId: this.syncId,
      timestamp: timestamp - 1,  // Ensure first pull includes this record
      data: dataWithMetadata
    };
    
    // Store sync data locally
    console.log('[MinimalSync] 📝 Storing with timestamp-1 to ensure first pull includes our record');
    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
    
    // Verify it was stored
    const verify = await AsyncStorage.getItem('@minimal_sync_data');
    if (!verify) console.error('[Sync] Failed to verify local storage');
    
    // Test encryption before sending
    console.log('[MinimalSync] 🔐 Testing encryption...');
    const testEncrypted = encryptionService.encryptData(dataWithMetadata);
    console.log('[MinimalSync] 🔐 Encrypted data length:', testEncrypted.length);
    
    // Test decryption to verify it works
    try {
      const testDecrypted = encryptionService.decryptData(testEncrypted);
      console.log('[MinimalSync] 🔓 Test decryption successful');
      console.log('[MinimalSync] 🔓 Decrypted users count:', Object.keys(testDecrypted?.users || {}).length);
    } catch (error) {
      console.error('[MinimalSync] ❌ Test decryption failed:', error);
    }
    
    // Now push to server - using timestamp format
    const payload = {
      sync_id: this.syncId,
      device_id: this.deviceId,
      encrypted_blob: testEncrypted, // Use the tested encrypted data
      timestamp
    };
    
    console.log('[MinimalSync] 🌐 Sending to server...');
    console.log('[MinimalSync] Payload details:');
    console.log('[MinimalSync]   - sync_id:', payload.sync_id);
    console.log('[MinimalSync]   - device_id:', payload.device_id);
    console.log('[MinimalSync]   - timestamp:', payload.timestamp);
    console.log('[MinimalSync]   - encrypted_blob length:', payload.encrypted_blob.length);
    console.log('[MinimalSync]   - Total payload size:', JSON.stringify(payload).length, 'bytes');
    
    try {
      // Use timestamp-based endpoint (tables should exist on server)
      // Creating sync on server
      console.log('[MinimalSync] 🚀 Full URL:', `${this.API_BASE}/create_timestamp.php`);
      
      const response = await fetch(`${this.API_BASE}/create_timestamp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Check response status first
      if (!response.ok) {
        const text = await response.text();
        console.error('[MinimalSync] ❌ Server error:', response.status);
        console.error('[MinimalSync] Response:', text);
        throw new Error(`Server error ${response.status}: ${text.substring(0, 200)}`);
      }
      
      const result = await response.json();
      console.log('[MinimalSync] 📡 Server response:', result);
      
      if (result.success) {
        await AsyncStorage.setItem('@minimal_sync_id', this.syncId);
        
        // Store recovery phrase with sync ID for persistence
        await AsyncStorage.setItem(`@sync_phrase_${this.syncId}`, this.recoveryPhrase);
        await AsyncStorage.setItem('@sync_phrase', this.recoveryPhrase);
        
        console.log('[MinimalSync] ✅ Sync created successfully!');
        console.log('[MinimalSync] 🔑 Recovery phrase stored for persistence');
        
        // Start periodic pull if sync is enabled
        if (this.isEnabled) {
          this.startPeriodicPull();
        }
        
        return { success: true, syncId: this.syncId, recoveryPhrase: this.recoveryPhrase };
      } else {
        console.error('[MinimalSync] ❌ Server error:', result);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('[MinimalSync] ❌ Network error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Join an existing sync group
   */
  async joinSync(recoveryPhrase) {
    console.log('[MinimalSync] 📥 joinSync called with recovery phrase');
    
    // Clean recovery phrase (remove any spaces for consistency)
    const cleanPhrase = recoveryPhrase.replace(/[\s-]+/g, '');
    
    // Store the cleaned recovery phrase
    this.recoveryPhrase = cleanPhrase;
    
    // Generate sync ID from recovery phrase
    this.syncId = await this.generateSyncId(cleanPhrase);
    console.log('[MinimalSync] 🆔 Generated sync ID from phrase:', this.syncId);
    
    // Initialize encryption
    await this.initializeEncryption(cleanPhrase, this.syncId);
    
    // Use encryption service's device ID
    this.deviceId = await encryptionService.getDeviceId();
    
    console.log('[MinimalSync] 🌐 Fetching from server to join sync...');
    
    try {
      // Use timestamp endpoint for joining (POST request)
      const url = `${this.API_BASE}/join_timestamp.php`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_id: this.syncId,
          device_id: this.deviceId
        })
      });
      
      // Check response status first
      if (!response.ok) {
        const text = await response.text();
        console.error('[MinimalSync] ❌ Server error:', response.status);
        console.error('[MinimalSync] Response:', text);
        throw new Error(`Server error ${response.status}: ${text.substring(0, 200)}`);
      }
      
      const result = await response.json();
      console.log('[MinimalSync] 📡 Server response:', result);
      
      if (result.success) {
        if (result.latest_record && result.latest_record.encrypted_blob) {
          // We have data - decrypt and use it
          const decodedData = encryptionService.decryptData(result.latest_record.encrypted_blob);
          console.log('[MinimalSync] 📦 Decoded data:', decodedData);
          
          // Store it locally
          const dataToStore = {
            syncId: this.syncId,
            timestamp: result.latest_record.timestamp || Date.now(),
            data: decodedData
          };
          
          console.log('[MinimalSync] 💾 Storing to AsyncStorage...');
          await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
          
          // Immediately verify storage
          const verify = await AsyncStorage.getItem('@minimal_sync_data');
          const parsed = verify ? JSON.parse(verify) : null;
          console.log('[MinimalSync] ✅ Storage verification:', {
            stored: !!verify,
            syncIdMatches: parsed?.syncId === this.syncId,
            hasData: !!parsed?.data
          });
          
          // Store sync ID and recovery phrase for persistence
          await AsyncStorage.setItem('@minimal_sync_id', this.syncId);
          await AsyncStorage.setItem(`@sync_phrase_${this.syncId}`, this.recoveryPhrase);
          await AsyncStorage.setItem('@sync_phrase', this.recoveryPhrase);
          
          console.log('[MinimalSync] ✅ Device joined sync - can push immediately');
          console.log('[MinimalSync] 🔑 Recovery phrase stored for persistence');
          
          // Start periodic pull if sync is enabled
          if (this.isEnabled) {
            this.startPeriodicPull();
          }
          
          return { 
            success: true, 
            data: decodedData,
            timestamp: result.latest_record.timestamp || Date.now()
          };
        } else {
          // No data yet but sync group exists - try pulling directly
          console.log('[MinimalSync] ⚠️ Sync group exists but no data yet, trying direct pull...');
          
          // Try pulling with since=0 to get all records
          // Simple URL construction like in the working test UI
          const pullUrl = `${this.API_BASE}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=0`;
          console.log('[MinimalSync] 📥 Attempting direct pull from:', pullUrl);
          
          const pullResponse = await fetch(pullUrl);
          const pullResult = await pullResponse.json();
          console.log('[MinimalSync] 📡 Pull result:', pullResult);
          
          if (pullResult.success && pullResult.records && pullResult.records.length > 0) {
            // Process the pulled records
            let latestTimestamp = 0;
            let latestData = null;
            
            for (const record of pullResult.records) {
              try {
                const decryptedData = encryptionService.decryptData(record.encrypted_blob);
                console.log('[MinimalSync] ✅ Decrypted record from device:', record.device_id);
                
                if (record.timestamp > latestTimestamp) {
                  latestTimestamp = record.timestamp;
                  latestData = decryptedData;
                }
              } catch (error) {
                console.error('[MinimalSync] ❌ Failed to decrypt record:', error);
              }
            }
            
            if (latestData) {
              // Store the data
              const dataToStore = {
                syncId: this.syncId,
                timestamp: latestTimestamp,
                data: latestData
              };
              
              await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
              await AsyncStorage.setItem('@minimal_sync_id', this.syncId);
              await AsyncStorage.setItem(`@sync_phrase_${this.syncId}`, this.recoveryPhrase);
              await AsyncStorage.setItem('@sync_phrase', this.recoveryPhrase);
              
              console.log('[MinimalSync] ✅ Successfully pulled data via direct pull');
              
              return {
                success: true,
                data: latestData,
                timestamp: latestTimestamp
              };
            }
          }
          
          // Still no data - return error
          console.error('[MinimalSync] ❌ No data available in sync group');
          return { success: false, error: result.message || 'No data available in sync group' };
        }
      } else {
        console.error('[MinimalSync] ❌ Join failed:', result);
        return { success: false, error: result.error || 'Join failed' };
      }
    } catch (error) {
      console.error('[MinimalSync] ❌ Network error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current data from local storage
   */
  async getCurrentData() {
    console.log('[MinimalSync] 📖 getCurrentData called');
    
    const stored = await AsyncStorage.getItem('@minimal_sync_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('[MinimalSync] 📦 Found stored data:', parsed);
      return parsed;
    }
    
    console.log('[MinimalSync] ⚠️ No stored data found');
    return null;
  }

  /**
   * Update metadata for changed fields
   */
  updateMetadata(newData, oldData) {
    const now = Date.now();
    const metadata = oldData?.metadata || {};
    const fieldTimestamps = metadata.fieldTimestamps || {};
    
    // Check which fields have changed and update their timestamps
    const updatedTimestamps = { ...fieldTimestamps };
    
    if (JSON.stringify(newData.users) !== JSON.stringify(oldData?.users)) {
      updatedTimestamps.users = now;
      console.log('[MinimalSync] Users changed, updating timestamp');
    }
    
    if (JSON.stringify(newData.activities) !== JSON.stringify(oldData?.activities)) {
      updatedTimestamps.activities = now;
      console.log('[MinimalSync] Activities changed, updating timestamp');
    }
    
    if (JSON.stringify(newData.settings) !== JSON.stringify(oldData?.settings)) {
      updatedTimestamps.settings = now;
      console.log('[MinimalSync] Settings changed, updating timestamp');
    }
    
    if (JSON.stringify(newData.library) !== JSON.stringify(oldData?.library)) {
      updatedTimestamps.library = now;
      console.log('[MinimalSync] Library changed, updating timestamp');
    }
    
    return {
      ...newData,
      metadata: {
        lastModified: now,
        deviceId: this.deviceId,
        fieldTimestamps: updatedTimestamps
      }
    };
  }

  /**
   * Push updated data
   */
  async pushData(newData) {
    console.log('[MinimalSync] 📤 pushData called with:', newData);
    
    if (!this.syncId) {
      console.error('[MinimalSync] ❌ No sync ID - call createSync or joinSync first');
      return { success: false, error: 'No sync ID' };
    }
    
    if (!this.encryptionReady) {
      console.error('[MinimalSync] ❌ Encryption not initialized');
      return { success: false, error: 'Encryption not ready' };
    }
    
    // No protection period needed - conflict resolution handles everything
    const timestamp = Date.now();
    
    // Get current data to preserve/update metadata
    const currentStored = await AsyncStorage.getItem('@minimal_sync_data');
    const currentData = currentStored ? JSON.parse(currentStored).data : null;
    
    // Update metadata based on what changed
    const dataWithMetadata = currentData 
      ? this.updateMetadata(newData, currentData)
      : this.addMetadata(newData);
    
    // Store locally first
    const dataToStore = {
      syncId: this.syncId,
      timestamp,
      data: dataWithMetadata
    };
    
    console.log('[MinimalSync] 💾 Updating local storage...');
    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
    
    // Push to server using timestamp
    const payload = {
      sync_id: this.syncId,
      device_id: this.deviceId,
      encrypted_blob: encryptionService.encryptData(dataWithMetadata),
      timestamp
    };
    
    console.log('[MinimalSync] 🌐 Pushing to server...');
    
    try {
      // Use timestamp endpoint to avoid version conflicts
      const response = await fetch(`${this.API_BASE}/push_timestamp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('[MinimalSync] 📡 Push response:', result);
      
      // Check if we got a 429 (rate limit)
      if (response.status === 429) {
        console.warn('[MinimalSync] ⚠️ Rate limited:', result.error);
        return { success: false, error: result.error, rateLimited: true };
      }
      
      // Check if response was successful
      if (!response.ok) {
        console.error('[MinimalSync] ❌ Push failed with status:', response.status);
        return { success: false, error: result.error || 'Push failed' };
      }
      
      return { success: result.success };
    } catch (error) {
      console.error('[MinimalSync] ❌ Push error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pull latest data from server
   * @param {boolean} forceFullPull - If true, ignores stored data and pulls everything (for initial sync)
   */
  async pullData(forceFullPull = false) {
    console.log('[MinimalSync] 📥 pullData called');
    console.log('[MinimalSync] Current state:', {
      syncId: this.syncId,
      deviceId: this.deviceId,
      encryptionReady: this.encryptionReady,
      hasRecoveryPhrase: !!this.recoveryPhrase
    });
    
    if (!this.syncId) {
      console.error('[MinimalSync] ❌ No sync ID');
      return { success: false, error: 'No sync ID' };
    }
    
    // Ensure device ID is initialized
    if (!this.deviceId) {
      console.log('[MinimalSync] Device ID not ready, initializing...');
      await this.initDeviceId();
    }
    
    if (!this.deviceId) {
      console.error('[MinimalSync] ❌ No device ID after init attempt');
      return { success: false, error: 'No device ID' };
    }
    
    // Additional validation to prevent encoding issues
    if (typeof this.syncId !== 'string' || typeof this.deviceId !== 'string') {
      console.error('[MinimalSync] ❌ Invalid sync ID or device ID type:', {
        syncIdType: typeof this.syncId,
        deviceIdType: typeof this.deviceId,
        syncId: this.syncId,
        deviceId: this.deviceId
      });
      return { success: false, error: 'Invalid sync ID or device ID format' };
    }
    
    // Get the last timestamp and current local data
    let lastTimestamp = 0;
    let localData = null;
    
    // CRITICAL: For initial sync (onboarding/import), ignore all stored data
    if (forceFullPull) {
      // Initial sync - pull everything from timestamp 0, no merge needed
      lastTimestamp = 0;
      localData = null;
    } else {
      // Incremental sync - check stored data for timestamp
      try {
        const storedData = await AsyncStorage.getItem('@minimal_sync_data');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          
          // Check if the stored sync ID matches our current sync ID
          if (parsed.syncId && parsed.syncId === this.syncId) {
            lastTimestamp = parsed.timestamp || 0;
            localData = parsed.data;
          }
        }
      } catch (error) {
        console.log('[MinimalSync] Error getting stored data:', error);
      }
    }
    
    try {
      // Use timestamp endpoint - pull changes since last timestamp
      // Ensure all parts are strings to avoid URL construction issues
      const syncIdStr = String(this.syncId || '');
      const deviceIdStr = String(this.deviceId || '');
      const sinceStr = String(lastTimestamp || 0);
      
      const url = `${this.API_BASE}/pull_timestamp.php?sync_id=${syncIdStr}&device_id=${deviceIdStr}&since=${sinceStr}`;
      console.log('[MinimalSync] 🌐 Pulling from:', url);
      
      const response = await fetch(url);
      const responseText = await response.text();
      console.log('[MinimalSync] 📡 Raw pull response:', responseText);
      console.log('[MinimalSync] 📡 Response length:', responseText.length, 'bytes');
      
      // Parse the response
      const result = JSON.parse(responseText);
      console.log('[MinimalSync] 📡 Parsed response:', {
        success: result.success,
        hasRecords: !!result.records,
        recordsLength: result.records ? result.records.length : 0,
        recordsArray: Array.isArray(result.records),
        firstRecord: result.records && result.records[0] ? {
          hasBlob: !!result.records[0].encrypted_blob,
          blobLength: result.records[0].encrypted_blob ? result.records[0].encrypted_blob.length : 0,
          timestamp: result.records[0].timestamp,
          device_id: result.records[0].device_id
        } : null,
        error: result.error
      });
      console.log('[MinimalSync] 📊 Records count:', result.records ? result.records.length : 0);
      
      // DEBUG: Check what happens with empty records array
      if (result.success && result.records && Array.isArray(result.records)) {
        console.log('[MinimalSync] 🔍 Records array check:', {
          isArray: true,
          length: result.records.length,
          isEmpty: result.records.length === 0,
          willReturnData: result.records.length > 0
        });
      }
      
      if (result.success && result.records && result.records.length > 0) {
        // Get the latest record from timestamp API
        const latest = result.records[result.records.length - 1];
        console.log('[MinimalSync] 🔐 About to decrypt blob of length:', latest.encrypted_blob?.length);
        console.log('[MinimalSync] 🔐 Blob preview:', latest.encrypted_blob?.substring(0, 50) + '...');
        
        let remoteData;
        try {
          remoteData = encryptionService.decryptData(latest.encrypted_blob);
          console.log('[MinimalSync] ✅ Decryption successful');
        } catch (decryptError) {
          console.error('[MinimalSync] ❌ Decryption failed:', decryptError);
          console.error('[MinimalSync] ❌ Error details:', {
            message: decryptError.message,
            stack: decryptError.stack,
            encryptionReady: this.encryptionReady,
            hasRecoveryPhrase: !!this.recoveryPhrase
          });
          throw decryptError;
        }
        
        console.log('[MinimalSync] 📦 Remote data received:', {
          isNull: remoteData === null,
          isUndefined: remoteData === undefined,
          type: typeof remoteData,
          hasKeys: remoteData ? Object.keys(remoteData).length : 0
        });
        console.log('[MinimalSync] Remote data structure:', {
          hasUsers: !!remoteData?.users,
          hasLibrary: !!remoteData?.library,
          libraryType: remoteData?.library ? typeof remoteData.library : 'undefined',
          categoriesType: remoteData?.library?.categories ? typeof remoteData.library.categories : 'undefined',
          isArray: Array.isArray(remoteData?.library?.categories),
          categoriesValue: remoteData?.library?.categories
        });
        
        // Perform conflict resolution if we have local data AND this isn't a force pull
        let finalData;
        if (localData && !forceFullPull) {
          console.log('[MinimalSync] 🔀 Merging remote with local data...');
          finalData = conflictResolver.mergeStates(localData, remoteData);
          
          // Log merge summary
          const mergeLog = conflictResolver.getMergeLog();
          if (mergeLog.length > 0) {
            console.log('[MinimalSync] 📊 Merge decisions:', mergeLog.length);
            mergeLog.slice(-5).forEach(entry => {
              console.log(`  - ${entry.message}`);
            });
          }
        } else {
          // Initial sync or no local data - use remote directly
          finalData = remoteData;
        }
        
        // Store the merged result
        const dataToStore = {
          syncId: this.syncId,
          timestamp: latest.timestamp,
          data: finalData
        };
        
        console.log('[MinimalSync] 💾 Storing merged data...');
        await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
        
        // Verify storage
        const verify = await AsyncStorage.getItem('@minimal_sync_data');
        console.log('[MinimalSync] ✅ Storage verified:', !!verify);
        
        return { 
          success: true, 
          data: finalData,
          timestamp: latest.timestamp,
          hadConflicts: localData !== null,
          mergeLog: conflictResolver.getMergeLog()
        };
      }
      
      console.log('[MinimalSync] ℹ️ No new data from server', {
        recordsExist: !!result.records,
        recordsLength: result.records ? result.records.length : 'no records array',
        resultSuccess: result.success,
        willReturnNull: true,
        lastTimestamp: lastTimestamp,
        syncId: this.syncId
      });
      return { success: true, data: null };
    } catch (error) {
      console.error('[MinimalSync] ❌ Pull error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable periodic sync
   */
  enableSync(callback = null) {
    console.log('[MinimalSync] 🔄 Enabling periodic sync');
    this.isEnabled = true;
    this.onDataReceived = callback;
    
    // Start periodic pull if we have a sync ID
    if (this.syncId) {
      this.startPeriodicPull();
    }
  }
  
  /**
   * Disable periodic sync
   */
  disableSync() {
    console.log('[MinimalSync] ⏸️ Disabling periodic sync');
    this.isEnabled = false;
    this.stopPeriodicPull();
  }
  
  /**
   * Start periodic pull
   */
  startPeriodicPull() {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
    }
    
    console.log('[MinimalSync] ⏰ Starting periodic pull (every 30s)');
    
    // Do an immediate pull
    this.pullAndNotify();
    
    // Then set up interval (every 30 seconds)
    this.pullInterval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      console.log(`[MinimalSync] ⏰ ${now} - 30-second sync check`);
      this.pullAndNotify();
    }, this.pullIntervalDuration);
  }
  
  /**
   * Stop periodic pull
   */
  stopPeriodicPull() {
    if (this.pullInterval) {
      console.log('[MinimalSync] ⏹️ Stopping periodic pull');
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }
  }
  
  /**
   * Pull data and notify if there are changes
   */
  async pullAndNotify() {
    if (!this.syncId) {
      console.log('[MinimalSync] ⚠️ No sync ID, skipping pull');
      return;
    }
    
    const now = Date.now();
    if (now - this.lastPullTime < 5000) {
      console.log('[MinimalSync] ⏳ Skipping pull, too soon since last pull');
      return;
    }
    
    this.lastPullTime = now;
    console.log('[MinimalSync] 🔄 Periodic pull triggered');
    
    const result = await this.pullData();
    
    if (result.success && result.data && this.onDataReceived) {
      console.log('[MinimalSync] 📨 New data received, notifying callback');
      this.onDataReceived(result.data);
    }
  }
  
  /**
   * Push data with retry logic for rate limits
   */
  async pushDataWithRetry(newData, retryCount = 0) {
    const maxRetries = 3;
    const result = await this.pushData(newData);
    
    // If rate limited and we have retries left, wait and retry
    if (result.rateLimited && retryCount < maxRetries) {
      const waitTime = Math.min(5000 * Math.pow(2, retryCount), 30000); // Exponential backoff, max 30s
      console.log(`[MinimalSync] ⏳ Rate limited, retrying in ${waitTime/1000}s...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.pushDataWithRetry(newData, retryCount + 1);
    }
    
    return result;
  }
  
  /**
   * Clear all data (for testing)
   */
  async clearAll() {
    console.log('[MinimalSync] 🗑️ Clearing all data...');
    this.stopPeriodicPull();
    await AsyncStorage.multiRemove([
      '@minimal_sync_data',
      '@minimal_sync_id'
      // No more join_time to clear
    ]);
    this.syncId = null;
    this.isEnabled = false;
    console.log('[MinimalSync] ✅ All data cleared');
  }
}

// Export singleton
export default new MinimalSyncService();