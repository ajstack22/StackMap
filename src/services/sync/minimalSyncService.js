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
import nacl from 'tweetnacl';
import conflictResolver from './conflictResolver';
// Use fixed encryption service that works on iOS
import encryptionService from './encryptionServiceFixed';
// Import build configuration for API URL
import { getCurrentApiUrl } from '../../config/buildConfig';
import { logError } from '../../utils/logger';

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
    // No artificial delay needed - just make it non-blocking
    this.loadExistingSyncId().catch(error => {
      console.error('[Sync] Failed to load existing sync ID:', error);
      this.isEnabled = false; // Ensure clean state on error
    });

    // Use centralized build configuration for API URL
    // Call at runtime to allow environment changes in tests
    this.API_BASE = getCurrentApiUrl();


    // Initialize device ID synchronously with a placeholder
    this.deviceId = null;
    // Then initialize it properly (async)
    this.initDeviceId();

    // Track encryption initialization
    this.encryptionReady = false;
    this.recoveryPhrase = null;

    // Rate limiting properties
    this.lastRequest = {};
    this.MIN_REQUEST_INTERVAL = 200; // 200ms between requests

    // Recovery phrase management
    this.pendingRecoveryPhrase = null;

    // Check for recovery phrase in URL fragment
    this.checkForRecoveryPhrase();
  }


  async initDeviceId() {
    try {
      this.deviceId = await AsyncStorage.getItem('device_id');
      if (!this.deviceId) {
        this.deviceId = this.generateId();
        await AsyncStorage.setItem('device_id', this.deviceId);
      }
    } catch (error) {
      // Generate one for this session
      this.deviceId = this.generateId();
    }
  }

  async loadExistingSyncId() {
    try {
      const storedSyncId = await AsyncStorage.getItem('@minimal_sync_id');

      if (storedSyncId) {
        this.syncId = storedSyncId;

        let storedPhrase, storedData;

        // Platform-specific optimization
        if (Platform.OS === 'ios') {
          // Sequential for iOS to avoid AsyncStorage performance issues
          const phraseWithId = await AsyncStorage.getItem(`@sync_phrase_${storedSyncId}`);
          storedPhrase = phraseWithId || await AsyncStorage.getItem('@sync_phrase');
          storedData = await AsyncStorage.getItem('@minimal_sync_data');
        } else {
          // Parallel for Android/Web is safe and faster
          const [phraseWithId, phraseGeneric, data] = await Promise.all([
            AsyncStorage.getItem(`@sync_phrase_${storedSyncId}`),
            AsyncStorage.getItem('@sync_phrase'),
            AsyncStorage.getItem('@minimal_sync_data')
          ]);
          storedPhrase = phraseWithId || phraseGeneric;
          storedData = data;
        }

        if (storedPhrase) {
          this.recoveryPhrase = storedPhrase;

          // CRITICAL: Re-initialize encryption with the loaded phrase
          await this.initializeEncryption(storedPhrase, storedSyncId);

          // CRITICAL: Set isEnabled flag after successfully loading sync
          this.isEnabled = true;
        } else {
          console.warn('[Sync] No recovery phrase found, clearing sync ID');
          this.syncId = null; // Clear sync ID if we can't decrypt
          this.isEnabled = false;
        }

        // Check stored data
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            console.log('[Sync] Found existing sync data from previous session');
          } catch (e) {
            console.error('[Sync] Failed to parse stored data:', e);
          }
        }
      } else {
        console.log('[Sync] No existing sync ID found');
        this.isEnabled = false;
      }
    } catch (error) {
      console.error('[Sync] Error loading existing sync ID:', error);
      this.isEnabled = false; // Ensure clean state
      throw error; // Re-throw to be caught by caller
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
      // Use nacl.randomBytes as secure fallback (already available)
      
      const bytes = nacl.randomBytes(16);
      return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  }

  // Removed unused base64 encode/decode functions that used deprecated escape/unescape
  // These were causing "Malformed decodeURI input" errors on iOS
  // Encryption is handled by encryptionService which uses tweetnacl-util
  
  /**
   * Rate limiting to prevent rapid API calls
   */
  async rateLimitCheck(action) {
    const now = Date.now();
    const last = this.lastRequest[action] || 0;
    
    const waitTime = this.MIN_REQUEST_INTERVAL - (now - last);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest[action] = Date.now();
  }
  
  /**
   * Check for recovery phrase in URL fragment and clear it
   */
  checkForRecoveryPhrase() {
    // Only run on web platform - window.location doesn't exist on React Native
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Safely access window.location
      const location = window.location;
      if (!location || !location.hash) {
        return;
      }

      const fragment = location.hash.substring(1);

      // Clear immediately
      if (fragment) {
        window.history.replaceState(
          null,
          document.title,
          location.pathname + location.search
        );

        // Use if it looks like a recovery phrase (32 hex characters)
        if (fragment.length === 32 && /^[a-f0-9]+$/i.test(fragment)) {
          this.pendingRecoveryPhrase = fragment;

          // Clear from memory after 10 seconds if unused
          setTimeout(() => {
            if (this.pendingRecoveryPhrase === fragment) {
              this.pendingRecoveryPhrase = null;
            }
          }, 10000);
        }
      }
    } catch (e) {
      // Gracefully handle window.location access errors (e.g., in tests or restricted environments)
      return;
    }
  }

  /**
   * Add metadata to data if it doesn't have it
   */
  addMetadata(data) {
    const now = Date.now();

    // Handle null/undefined data
    if (!data) {
      data = {};
    }

    // If data already has metadata, preserve it
    if (data.metadata) {
      return data;
    }
    
    // Add metadata for conflict resolution and ensure all required fields exist
    return {
      users: data.users || {},
      activities: data.activities || {},
      settings: data.settings || {},
      library: data.library || {},
      ...data, // Spread any additional fields from original data
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

    // eslint-disable-next-line no-secrets/no-secrets -- Public salt for sync ID derivation, not a secret
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
    // eslint-disable-next-line no-secrets/no-secrets -- Public salt for client-side KDF, not a secret
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
    }
    
    // Store recovery phrase for persistence
    await AsyncStorage.setItem(`@sync_phrase_${syncId}`, recoveryPhrase);
    await AsyncStorage.setItem('@sync_phrase', recoveryPhrase);
    
  }

  /**
   * Create a new sync group with test data
   */
  async createSync(testData) {
    
    try {
      // Generate recovery phrase
      this.recoveryPhrase = encryptionService.generateRecoveryPhrase();
      
      // Generate sync ID from recovery phrase
      this.syncId = await this.generateSyncId(this.recoveryPhrase);
      
      // Initialize encryption
      await this.initializeEncryption(this.recoveryPhrase, this.syncId);
      
      // Use encryption service's device ID
      this.deviceId = await encryptionService.getDeviceId();
    } catch (error) {
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
    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
    
    // Verify it was stored
    await AsyncStorage.getItem('@minimal_sync_data');
    
    // Test encryption before sending
    const testEncrypted = encryptionService.encryptData(dataWithMetadata);
    
    // Test decryption to verify it works
    try {
      encryptionService.decryptData(testEncrypted);
    } catch (error) {
      return { success: false, error: 'Test decryption failed' };
    }
    
    // Now push to server - using timestamp format
    const payload = {
      sync_id: this.syncId,
      device_id: this.deviceId,
      encrypted_blob: testEncrypted, // Use the tested encrypted data
      timestamp
    };
    
    
    try {
      // Use timestamp-based endpoint (tables should exist on server)
      // Creating sync on server
      
      const response = await fetch(`${this.API_BASE}/create_timestamp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Check response status first
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server error ${response.status}: ${text.substring(0, 200)}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        await AsyncStorage.setItem('@minimal_sync_id', this.syncId);
        
        // Store recovery phrase with sync ID for persistence
        await AsyncStorage.setItem(`@sync_phrase_${this.syncId}`, this.recoveryPhrase);
        await AsyncStorage.setItem('@sync_phrase', this.recoveryPhrase);
        
        
        // Start periodic pull if sync is enabled
        if (this.isEnabled) {
          this.startPeriodicPull();
        }
        
        return { success: true, syncId: this.syncId, recoveryPhrase: this.recoveryPhrase };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Join an existing sync group
   */
  async joinSync(recoveryPhrase) {
    
    // Clean recovery phrase (remove any spaces for consistency)
    const cleanPhrase = recoveryPhrase.replace(/[\s-]+/g, '');
    
    // Store the cleaned recovery phrase
    this.recoveryPhrase = cleanPhrase;
    
    // Generate sync ID from recovery phrase
    this.syncId = await this.generateSyncId(cleanPhrase);
    
    // Initialize encryption
    await this.initializeEncryption(cleanPhrase, this.syncId);
    
    // Use encryption service's device ID
    this.deviceId = await encryptionService.getDeviceId();
    
    
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
        throw new Error(`Server error ${response.status}: ${text.substring(0, 200)}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        if (result.latest_record && result.latest_record.encrypted_blob) {
          // We have data - decrypt and use it
          const decodedData = encryptionService.decryptData(result.latest_record.encrypted_blob);

          // PHASE 1 CHECKPOINT 1: Post-decrypt verification
          console.log('[CHECKPOINT1] Post-decrypt data structure:', {
            hasUsers: !!decodedData?.users,
            userCount: decodedData?.users ? Object.keys(decodedData.users).length : 0,
            sampleUserId: decodedData?.users ? Object.keys(decodedData.users)[0] : null,
            sampleUser: decodedData?.users && Object.keys(decodedData.users)[0]
              ? {
                  id: decodedData.users[Object.keys(decodedData.users)[0]].id,
                  name: decodedData.users[Object.keys(decodedData.users)[0]].name,
                  hasIcon: !!decodedData.users[Object.keys(decodedData.users)[0]].icon,
                  hasDays: !!decodedData.users[Object.keys(decodedData.users)[0]].days,
                  daysKeys: decodedData.users[Object.keys(decodedData.users)[0]].days
                    ? Object.keys(decodedData.users[Object.keys(decodedData.users)[0]].days)
                    : []
                }
              : null
          });
          
          // Store it locally
          const dataToStore = {
            syncId: this.syncId,
            timestamp: result.latest_record.timestamp || Date.now(),
            data: decodedData
          };
          
          await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
          
          // Immediately verify storage
          const verify = await AsyncStorage.getItem('@minimal_sync_data');
          const parsed = verify ? JSON.parse(verify) : null;
          
          // Store sync ID and recovery phrase for persistence
          await AsyncStorage.setItem('@minimal_sync_id', this.syncId);
          await AsyncStorage.setItem(`@sync_phrase_${this.syncId}`, this.recoveryPhrase);
          await AsyncStorage.setItem('@sync_phrase', this.recoveryPhrase);
          
          
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
          
          // Try pulling with since=0 to get all records
          // Simple URL construction like in the working test UI
          const pullUrl = `${this.API_BASE}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=0`;
          
          const pullResponse = await fetch(pullUrl);
          const pullResult = await pullResponse.json();
          
          if (pullResult.success && pullResult.records && pullResult.records.length) {
            // Process the pulled records
            let latestTimestamp = 0;
            let latestData = null;
            
            for (const record of pullResult.records) {
              try {
                const decryptedData = encryptionService.decryptData(record.encrypted_blob);
                
                if (record.timestamp > latestTimestamp) {
                  latestTimestamp = record.timestamp;
                  latestData = decryptedData;
                }
              } catch (error) {
                // Failed to decrypt record
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
              
              
              return {
                success: true,
                data: latestData,
                timestamp: latestTimestamp
              };
            }
          }
          
          // Still no data - return error
          return { success: false, error: result.message || 'No data available in sync group' };
        }
      } else {
        return { success: false, error: result.error || 'Join failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current data from local storage
   */
  async getCurrentData() {
    
    const stored = await AsyncStorage.getItem('@minimal_sync_data');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed;
    }
    
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
    }
    
    if (JSON.stringify(newData.activities) !== JSON.stringify(oldData?.activities)) {
      updatedTimestamps.activities = now;
    }
    
    if (JSON.stringify(newData.settings) !== JSON.stringify(oldData?.settings)) {
      updatedTimestamps.settings = now;
    }
    
    if (JSON.stringify(newData.library) !== JSON.stringify(oldData?.library)) {
      updatedTimestamps.library = now;
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
    
    if (!this.syncId) {
      return { success: false, error: 'No sync ID' };
    }
    
    if (!this.encryptionReady) {
      return { success: false, error: 'Encryption not ready' };
    }
    
    // Apply rate limiting
    await this.rateLimitCheck('push');
    
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
    
    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
    
    // Push to server using timestamp
    const payload = {
      sync_id: this.syncId,
      device_id: this.deviceId,
      encrypted_blob: encryptionService.encryptData(dataWithMetadata),
      timestamp
    };
    
    
    try {
      // Use timestamp endpoint to avoid version conflicts
      const response = await fetch(`${this.API_BASE}/push_timestamp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      // Check if we got a 429 (rate limit)
      if (response.status === 429) {
        
        return { success: false, error: result.error, rateLimited: true };
      }
      
      // Check if response was successful
      if (!response.ok) {
        return { success: false, error: result.error || 'Push failed' };
      }
      
      return { success: result.success };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate pull request prerequisites
   * @private
   */
  async validatePullRequest() {
    // Ensure device ID is initialized
    if (!this.deviceId) {
      await this.initDeviceId();
    }

    if (!this.deviceId) {
      return { valid: false, error: { success: false, error: 'No device ID' } };
    }

    // Additional validation to prevent encoding issues
    if (typeof this.syncId !== 'string' || typeof this.deviceId !== 'string') {
      return { valid: false, error: { success: false, error: 'Invalid sync ID or device ID format' } };
    }

    return { valid: true };
  }

  /**
   * Get pull context (timestamp and local data)
   * @private
   */
  async getPullContext(forceFullPull) {
    let lastTimestamp = 0;
    let localData = null;

    // CRITICAL: For initial sync (onboarding/import), ignore all stored data
    if (forceFullPull) {
      // Initial sync - pull everything from timestamp 0, no merge needed
      return { lastTimestamp: 0, localData: null };
    }

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
      // Silent fail - use defaults
    }

    return { lastTimestamp, localData };
  }

  /**
   * Fetch data from server
   * @private
   */
  async fetchServerData(lastTimestamp) {
    // Ensure all values are valid strings before URL construction
    if (!this.syncId || !this.deviceId) {
      throw new Error('Missing sync ID or device ID');
    }

    // Simple URL construction without encoding (hex IDs don't need it)
    const url = `${this.API_BASE}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=${lastTimestamp}`;

    // Add debugging for fetch call
    let response;
    try {
      response = await fetch(url);
    } catch (fetchError) {
      throw fetchError;
    }

    return response;
  }

  /**
   * Read response text with iOS fallback
   * @private
   */
  async readResponseSafely(response) {
    let responseText;
    try {
      responseText = await response.text();
    } catch (textError) {
      // Try to get response as blob then convert to text
      try {
        const blob = await response.blob();
        responseText = await blob.text();
      } catch (blobError) {
        return {
          success: false,
          error: {
            success: false,
            error: `Failed to read response: ${textError.message}`,
            responseStatus: response.status
          }
        };
      }
    }

    return { success: true, responseText };
  }

  /**
   * Parse JSON response safely
   * @private
   */
  parseJsonSafely(responseText) {
    // Check if response looks like JSON before parsing
    if (!responseText || (!responseText.startsWith('{') && !responseText.startsWith('['))) {
      return {
        success: false,
        error: {
          success: false,
          error: `Invalid response format: ${responseText.substring(0, 100)}`,
          rawResponse: responseText.substring(0, 500)
        }
      };
    }

    // Parse the response
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      return {
        success: false,
        error: {
          success: false,
          error: `JSON parse error: ${parseError.message}`,
          rawResponse: responseText.substring(0, 500)
        }
      };
    }

    return { success: true, result };
  }

  /**
   * Process server data (decrypt and resolve conflicts)
   * @private
   */
  processServerData(result, localData, forceFullPull) {
    // DEBUG: Check what happens with empty records array
    if (result.success && result.records && Array.isArray(result.records)) {
      // Debug logging preserved
    }

    if (!result.success || !result.records || !result.records.length) {
      return null;
    }

    // Get the latest record
    const latest = result.records[result.records.length - 1];

    if (!latest.encrypted_blob) {
      throw new Error('No encrypted blob in record');
    }

    const remoteData = encryptionService.decryptData(latest.encrypted_blob);

    // Perform conflict resolution if we have local data AND this isn't a force pull
    let finalData;
    if (localData && !forceFullPull) {
      finalData = conflictResolver.mergeStates(localData, remoteData);

      // Log merge summary
      const mergeLog = conflictResolver.getMergeLog();
    } else {
      // Initial sync or no local data - use remote directly
      finalData = remoteData;
    }

    return {
      finalData,
      timestamp: latest.timestamp,
      hadConflicts: localData !== null
    };
  }

  /**
   * Store resolved data
   * @private
   */
  async storeResolvedData(finalData, timestamp) {
    const dataToStore = {
      syncId: this.syncId,
      timestamp: timestamp,
      data: finalData
    };

    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));

    // Verify storage
    const verify = await AsyncStorage.getItem('@minimal_sync_data');
  }

  /**
   * Pull latest data from server
   * @param {boolean} forceFullPull - If true, ignores stored data and pulls everything (for initial sync)
   */
  async pullData(forceFullPull = false) {
    // Apply rate limiting
    await this.rateLimitCheck('pull');

    // Step 1: Validate request
    const validation = await this.validatePullRequest();
    if (!validation.valid) {
      return validation.error;
    }

    // Step 2: Get pull context
    const { lastTimestamp, localData } = await this.getPullContext(forceFullPull);

    try {
      // Step 3: Fetch from server
      const response = await this.fetchServerData(lastTimestamp);

      // Step 4: Read response safely
      const readResult = await this.readResponseSafely(response);
      if (!readResult.success) {
        return readResult.error;
      }

      // Step 5: Parse JSON
      const parseResult = this.parseJsonSafely(readResult.responseText);
      if (!parseResult.success) {
        return parseResult.error;
      }

      // Step 6: Process server data
      const processed = this.processServerData(parseResult.result, localData, forceFullPull);

      if (!processed) {
        return { success: true, data: null };
      }

      // Step 7: Store resolved data
      await this.storeResolvedData(processed.finalData, processed.timestamp);

      // Step 8: Return success response
      return {
        success: true,
        data: processed.finalData,
        timestamp: processed.timestamp,
        hadConflicts: processed.hadConflicts,
        mergeLog: conflictResolver.getMergeLog()
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Enable periodic sync
   */
  enableSync(callback = null) {
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

    console.log('[Sync] Starting periodic pull (first pull in 30 seconds)');

    // DON'T pull immediately - let app finish loading
    // First pull will happen after interval delay
    this.pullInterval = setInterval(() => {
      const now = new Date().toLocaleTimeString();
      console.log(`[Sync] Periodic pull at ${now}`);
      this.pullAndNotify();
    }, this.pullIntervalDuration);
  }

  // Add new method for manual immediate pull (when needed)
  async pullImmediately() {
    console.log('[Sync] Manual immediate pull requested');
    return await this.pullAndNotify();
  }
  
  /**
   * Stop periodic pull
   */
  stopPeriodicPull() {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }
  }
  
  /**
   * Pull data and notify if there are changes
   */
  async pullAndNotify() {
    if (!this.syncId) {
      return;
    }

    const now = Date.now();
    if (now - this.lastPullTime < 5000) {
      return;
    }

    this.lastPullTime = now;

    try {
      const result = await this.pullData();

      if (result.success && result.data && this.onDataReceived) {
        this.onDataReceived(result.data);
      }
    } catch (error) {
      // Gracefully handle pullData exceptions
      // Log the error but don't throw - this is called from intervals
      logError('[Sync] pullAndNotify error:', error);
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
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.pushDataWithRetry(newData, retryCount + 1);
    }
    
    return result;
  }
  
  /**
   * Clear all data (for testing)
   */
  async clearAll() {
    this.stopPeriodicPull();
    await AsyncStorage.multiRemove([
      '@minimal_sync_data',
      '@minimal_sync_id'
      // No more join_time to clear
    ]);
    this.syncId = null;
    this.isEnabled = false;
  }

  // Get current sync ID
  getSyncId() {
    return this.syncId;
  }

  // Helper to get device name
  getDeviceName() {
    if (Platform.OS === 'ios') {
      return 'iOS Device';
    } else if (Platform.OS === 'android') {
      return 'Android Device';
    } else {
      return 'Web Browser';
    }
  }
}

// Export singleton
export default new MinimalSyncService();