/**
 * PHASE 1: MINIMAL SYNC SERVICE
 * 
 * Goal: Just make two browser tabs exchange data reliably
 * - NO encryption
 * - NO CRDT
 * - NO complex state management
 * - Just JSON in, JSON out, with extreme logging
 * 
 * PHASE 4 UPDATE: Added conflict resolution with metadata tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import conflictResolver from './conflictResolver';

class MinimalSyncService {
  constructor() {
    console.log('[MinimalSync] 🚀 Constructor called');
    this.syncId = null;
    this.deviceId = null;
    this.pullInterval = null;
    this.pullIntervalDuration = 30000; // 30 seconds
    this.isEnabled = false;
    this.lastPullTime = 0;
    this.onDataReceived = null; // Callback for when new data arrives
    
    // Load existing sync ID on initialization
    this.loadExistingSyncId();
    
    // Determine API URL based on environment
    if (typeof window !== 'undefined' && window.location) {
      // Web environment
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Local development - use relative URL to go through webpack proxy
        this.API_BASE = '/api/sync';
      } else if (window.location.pathname.startsWith('/qual')) {
        // QUAL environment
        this.API_BASE = 'https://stackmap.app/qual/api/sync';
      } else {
        // Production
        this.API_BASE = 'https://stackmap.app/api/sync';
      }
    } else {
      // Default for non-web environments
      this.API_BASE = 'https://stackmap.app/api/sync';
    }
    
    console.log('[MinimalSync] API URL:', this.API_BASE);
    
    // Generate device ID once
    this.initDeviceId();
  }

  async initDeviceId() {
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
    try {
      const storedSyncId = await AsyncStorage.getItem('@minimal_sync_id');
      if (storedSyncId) {
        this.syncId = storedSyncId;
        console.log('[MinimalSync] 📥 Loaded existing sync ID:', this.syncId);
        
        // Also check if we have stored data
        const storedData = await AsyncStorage.getItem('@minimal_sync_data');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          console.log('[MinimalSync] 📦 Found existing data from previous session:', {
            syncId: parsed.syncId,
            hasData: !!parsed.data,
            timestamp: parsed.timestamp
          });
        }
      } else {
        console.log('[MinimalSync] ℹ️ No existing sync ID found');
      }
    } catch (error) {
      console.log('[MinimalSync] Error loading existing sync ID:', error);
    }
  }

  generateId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
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
   * Create a new sync group with test data
   */
  async createSync(testData) {
    console.log('[MinimalSync] 📤 createSync called with:', testData);
    
    this.syncId = this.generateId();
    const timestamp = Date.now();
    
    // Add metadata for conflict resolution
    const dataWithMetadata = this.addMetadata(testData);
    
    // Store the data locally first
    const dataToStore = {
      syncId: this.syncId,
      timestamp,
      data: dataWithMetadata
    };
    
    console.log('[MinimalSync] 💾 Storing locally first...');
    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
    
    // Verify it was stored
    const verify = await AsyncStorage.getItem('@minimal_sync_data');
    console.log('[MinimalSync] ✅ Local storage verified:', verify ? 'SUCCESS' : 'FAILED');
    
    // Now push to server - using timestamp format
    const payload = {
      sync_id: this.syncId,
      device_id: this.deviceId,
      encrypted_blob: this.encodeBase64(JSON.stringify(dataWithMetadata)), // Safe base64, no encryption
      timestamp
    };
    
    console.log('[MinimalSync] 🌐 Sending to server...', payload);
    
    try {
      // Use timestamp-based endpoint (tables should exist on server)
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
        console.log('[MinimalSync] ✅ Sync created successfully!');
        
        // Start periodic pull if sync is enabled
        if (this.isEnabled) {
          this.startPeriodicPull();
        }
        
        return { success: true, syncId: this.syncId };
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
  async joinSync(syncId) {
    console.log('[MinimalSync] 📥 joinSync called with:', syncId);
    
    this.syncId = syncId;
    
    console.log('[MinimalSync] 🌐 Fetching from server to join sync...');
    
    try {
      // Use timestamp endpoint for joining (POST request)
      const url = `${this.API_BASE}/join_timestamp.php`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_id: syncId,
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
      
      if (result.success && result.latest_record && result.latest_record.encrypted_blob) {
        // Decode the data from timestamp API format
        const decodedData = JSON.parse(this.decodeBase64(result.latest_record.encrypted_blob));
        console.log('[MinimalSync] 📦 Decoded data:', decodedData);
        
        // Store it locally
        const dataToStore = {
          syncId: syncId,
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
          syncIdMatches: parsed?.syncId === syncId,
          hasData: !!parsed?.data
        });
        
        // Also store sync ID and join time
        await AsyncStorage.setItem('@minimal_sync_id', syncId);
        await AsyncStorage.setItem('@minimal_sync_join_time', Date.now().toString());
        
        console.log('[MinimalSync] ⏰ 60-second protection period started for new device');
        
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
        console.error('[MinimalSync] ❌ Join failed:', result);
        return { success: false, error: result.error || 'No data found' };
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
    
    // Check if we need to wait (protection period for new devices)
    const joinTime = await AsyncStorage.getItem('@minimal_sync_join_time');
    if (joinTime) {
      const secondsSinceJoin = (Date.now() - parseInt(joinTime, 10)) / 1000;
      if (secondsSinceJoin < 60) {
        const remaining = Math.ceil(60 - secondsSinceJoin);
        console.log(`[MinimalSync] ⏳ Protection period: ${remaining}s remaining`);
        return { 
          success: false, 
          error: `New device must wait ${remaining} seconds before pushing`,
          secondsRemaining: remaining
        };
      }
    }
    
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
      encrypted_blob: this.encodeBase64(JSON.stringify(dataWithMetadata)),
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
      
      return { success: result.success };
    } catch (error) {
      console.error('[MinimalSync] ❌ Push error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Pull latest data from server
   */
  async pullData() {
    console.log('[MinimalSync] 📥 pullData called');
    
    if (!this.syncId) {
      console.error('[MinimalSync] ❌ No sync ID');
      return { success: false, error: 'No sync ID' };
    }
    
    // Get the last timestamp and current local data
    let lastTimestamp = 0;
    let localData = null;
    try {
      const storedData = await AsyncStorage.getItem('@minimal_sync_data');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        lastTimestamp = parsed.timestamp || 0;
        localData = parsed.data;
        console.log('[MinimalSync] Using stored timestamp:', lastTimestamp);
        console.log('[MinimalSync] Has local data:', !!localData);
      }
    } catch (error) {
      console.log('[MinimalSync] Error getting stored data:', error);
    }
    
    try {
      // Use timestamp endpoint - pull changes since last timestamp
      const url = `${this.API_BASE}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=${lastTimestamp}`;
      console.log('[MinimalSync] 🌐 Pulling from:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      console.log('[MinimalSync] 📡 Pull response:', result);
      
      if (result.success && result.records && result.records.length > 0) {
        // Get the latest record from timestamp API
        const latest = result.records[result.records.length - 1];
        const remoteData = JSON.parse(this.decodeBase64(latest.encrypted_blob));
        console.log('[MinimalSync] 📦 Remote data received');
        
        // Perform conflict resolution if we have local data
        let finalData;
        if (localData) {
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
          console.log('[MinimalSync] No local data, using remote directly');
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
      
      console.log('[MinimalSync] ℹ️ No new data from server');
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
    
    // Then set up interval
    this.pullInterval = setInterval(() => {
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
   * Push data with automatic retry after protection period
   */
  async pushDataWithRetry(newData) {
    const result = await this.pushData(newData);
    
    if (!result.success && result.secondsRemaining) {
      console.log(`[MinimalSync] ⏳ Will retry push in ${result.secondsRemaining} seconds`);
      
      // Schedule retry after protection period
      setTimeout(async () => {
        console.log('[MinimalSync] 🔄 Retrying push after protection period');
        const retryResult = await this.pushData(newData);
        if (retryResult.success) {
          console.log('[MinimalSync] ✅ Retry successful!');
        }
      }, result.secondsRemaining * 1000);
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
      '@minimal_sync_id',
      '@minimal_sync_join_time'
    ]);
    this.syncId = null;
    this.isEnabled = false;
    console.log('[MinimalSync] ✅ All data cleared');
  }
}

// Export singleton
export default new MinimalSyncService();