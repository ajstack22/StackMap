/**
 * PHASE 1: MINIMAL SYNC SERVICE
 * 
 * Goal: Just make two browser tabs exchange data reliably
 * - NO encryption
 * - NO CRDT
 * - NO complex state management
 * - Just JSON in, JSON out, with extreme logging
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

class MinimalSyncService {
  constructor() {
    console.log('[MinimalSync] 🚀 Constructor called');
    this.syncId = null;
    this.deviceId = null;
    
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

  generateId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Create a new sync group with test data
   */
  async createSync(testData) {
    console.log('[MinimalSync] 📤 createSync called with:', testData);
    
    this.syncId = this.generateId();
    const timestamp = Date.now();
    
    // Store the data locally first
    const dataToStore = {
      syncId: this.syncId,
      timestamp,
      data: testData
    };
    
    console.log('[MinimalSync] 💾 Storing locally first...');
    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
    
    // Verify it was stored
    const verify = await AsyncStorage.getItem('@minimal_sync_data');
    console.log('[MinimalSync] ✅ Local storage verified:', verify ? 'SUCCESS' : 'FAILED');
    
    // Now push to server (simple format, no encryption)
    const payload = {
      sync_id: this.syncId,
      device_id: this.deviceId,
      encrypted_blob: btoa(JSON.stringify(testData)), // Just base64, no encryption
      timestamp
    };
    
    console.log('[MinimalSync] 🌐 Sending to server...', payload);
    
    try {
      const response = await fetch(`${this.API_BASE}/create_timestamp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('[MinimalSync] 📡 Server response:', result);
      
      if (result.success) {
        await AsyncStorage.setItem('@minimal_sync_id', this.syncId);
        console.log('[MinimalSync] ✅ Sync created successfully!');
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
    
    const payload = {
      sync_id: syncId,
      device_id: this.deviceId
    };
    
    console.log('[MinimalSync] 🌐 Fetching from server...');
    
    try {
      const response = await fetch(`${this.API_BASE}/join_timestamp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      console.log('[MinimalSync] 📡 Server response:', result);
      
      if (result.success && result.latest_record) {
        // Decode the data (just base64, no decryption)
        const decodedData = JSON.parse(atob(result.latest_record.encrypted_blob));
        console.log('[MinimalSync] 📦 Decoded data:', decodedData);
        
        // Store it locally
        const dataToStore = {
          syncId: syncId,
          timestamp: result.latest_record.timestamp,
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
        
        // Also store sync ID
        await AsyncStorage.setItem('@minimal_sync_id', syncId);
        
        return { 
          success: true, 
          data: decodedData,
          timestamp: result.latest_record.timestamp
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
   * Push updated data
   */
  async pushData(newData) {
    console.log('[MinimalSync] 📤 pushData called with:', newData);
    
    if (!this.syncId) {
      console.error('[MinimalSync] ❌ No sync ID - call createSync or joinSync first');
      return { success: false, error: 'No sync ID' };
    }
    
    const timestamp = Date.now();
    
    // Store locally first
    const dataToStore = {
      syncId: this.syncId,
      timestamp,
      data: newData
    };
    
    console.log('[MinimalSync] 💾 Updating local storage...');
    await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
    
    // Push to server
    const payload = {
      sync_id: this.syncId,
      device_id: this.deviceId,
      encrypted_blob: btoa(JSON.stringify(newData)),
      timestamp
    };
    
    console.log('[MinimalSync] 🌐 Pushing to server...');
    
    try {
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
    
    const lastTimestamp = 0; // Get all records for now
    
    try {
      const url = `${this.API_BASE}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=${lastTimestamp}`;
      console.log('[MinimalSync] 🌐 Pulling from:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      console.log('[MinimalSync] 📡 Pull response:', result);
      
      if (result.success && result.records && result.records.length > 0) {
        // Get the latest record
        const latest = result.records[result.records.length - 1];
        const decodedData = JSON.parse(atob(latest.encrypted_blob));
        console.log('[MinimalSync] 📦 Latest data:', decodedData);
        
        // Store it
        const dataToStore = {
          syncId: this.syncId,
          timestamp: latest.timestamp,
          data: decodedData
        };
        
        console.log('[MinimalSync] 💾 Storing pulled data...');
        await AsyncStorage.setItem('@minimal_sync_data', JSON.stringify(dataToStore));
        
        // Verify storage
        const verify = await AsyncStorage.getItem('@minimal_sync_data');
        console.log('[MinimalSync] ✅ Storage verified:', !!verify);
        
        return { 
          success: true, 
          data: decodedData,
          timestamp: latest.timestamp
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
   * Clear all data (for testing)
   */
  async clearAll() {
    console.log('[MinimalSync] 🗑️ Clearing all data...');
    await AsyncStorage.multiRemove([
      '@minimal_sync_data',
      '@minimal_sync_id'
    ]);
    this.syncId = null;
    console.log('[MinimalSync] ✅ All data cleared');
  }
}

// Export singleton
export default new MinimalSyncService();