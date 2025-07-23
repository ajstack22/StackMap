import AsyncStorage from '@react-native-async-storage/async-storage';
import encryptionService from './encryptionService';
import { useAppStore } from '../../stores';

const API_BASE_URL = 'https://stackmap.app/api/sync';

class SyncService {
  constructor() {
    this.syncEnabled = false;
    this.syncId = null;
    this.lastSyncVersion = 0;
    this.initialized = false;
    this.syncInterval = null;
    this.syncIntervalDuration = 30000; // 30 seconds
    
    // Auto-restore state on construction
    this.restoreState();
  }
  
  /**
   * Restore sync state from AsyncStorage
   */
  async restoreState() {
    try {
      const enabled = await AsyncStorage.getItem('@sync_enabled');
      const syncId = await AsyncStorage.getItem('@sync_id');
      const lastVersion = await AsyncStorage.getItem('@sync_last_version');
      
      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastSyncVersion = parseInt(lastVersion || '0', 10);
        console.log('SyncService: State restored, syncId:', syncId, 'version:', this.lastSyncVersion);
        
        // Try to restore encryption automatically
        await this.restoreEncryptionFromStorage();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to restore sync state:', error);
      this.initialized = true;
    }
  }
  
  /**
   * Restore encryption from stored recovery phrase
   */
  async restoreEncryptionFromStorage() {
    if (!this.syncId) return false;
    
    try {
      // Try to get stored recovery phrase
      const storedPhrase = await encryptionService.getStoredRecoveryPhrase(this.syncId);
      if (!storedPhrase) {
        console.log('No stored recovery phrase found');
        return false;
      }
      
      // Use the fixed salt for consistency across all operations
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ='; // Same salt used in initialize()
      
      // Initialize encryption with the stored phrase and fixed salt
      await encryptionService.initialize(storedPhrase, this.syncId, fixedSalt);
      console.log('Encryption restored automatically from stored phrase');
      
      // Start periodic sync after successful restoration
      this.startPeriodicSync();
      
      return true;
    } catch (error) {
      console.error('Failed to restore encryption from storage:', error);
    }
    
    return false;
  }

  /**
   * Initialize sync with a new or existing sync group
   */
  async initialize(recoveryPhrase = null) {
    try {
      // Generate new recovery phrase if not provided
      if (!recoveryPhrase) {
        recoveryPhrase = encryptionService.generateRecoveryPhrase();
      }

      // Generate sync ID from recovery phrase
      const syncId = await this.generateSyncId(recoveryPhrase);
      
      // Set sync ID temporarily so pullData can work
      this.syncId = syncId;
      
      // Try to pull existing data first
      const existingData = await this.pullData();
      
      if (!existingData) {
        // This is a new sync group, use fixed salt for consistency
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ='; // Base64 encoded fixed salt
        const { salt } = await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
        
        // Create new sync group
        await this.createSyncGroup(syncId, salt);
      } else {
        // This is an existing sync group
        // Use a deterministic approach: use the same salt for all operations
        // This ensures consistency across devices
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ='; // Base64 encoded fixed salt for encryption
        
        // Initialize encryption with the fixed salt
        await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
        
        // Verify we can decrypt the data
        try {
          const decryptedData = encryptionService.decryptData(existingData.encrypted_blob);
          await this.restoreData(decryptedData);
          this.lastSyncVersion = existingData.version;
        } catch (decryptError) {
          // If decryption fails, the recovery phrase is wrong
          throw new Error('Invalid recovery phrase. Please check and try again.');
        }
      }

      this.syncEnabled = true;
      
      // Store sync state
      await AsyncStorage.setItem('@sync_enabled', 'true');
      await AsyncStorage.setItem('@sync_id', syncId);
      await AsyncStorage.setItem('@sync_last_version', (this.lastSyncVersion || 0).toString());
      
      // The recovery phrase is already stored by encryptionService.initialize()
      // so we don't need to store it again here
      
      // Start periodic sync
      this.startPeriodicSync();
      
      return { 
        syncId, 
        recoveryPhrase,
        isNewSync: !existingData 
      };
    } catch (error) {
      console.error('Sync initialization failed:', error);
      // Reset state on failure
      this.syncId = null;
      throw error;
    }
  }

  /**
   * Generate deterministic sync ID from recovery phrase
   */
  async generateSyncId(recoveryPhrase) {
    // Use a fixed salt for sync ID generation to ensure consistency
    const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ=='; // Base64 encoded fixed salt
    const { key } = await encryptionService.deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
    // Use first 16 bytes of key as sync ID
    const syncIdBytes = key.slice(0, 16);
    return Array.from(syncIdBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a new sync group on the server
   */
  async createSyncGroup(syncId, salt) {
    const deviceId = await encryptionService.getDeviceId();
    
    // Get current state and encrypt it
    const currentState = this.getCurrentState();
    const encryptedBlob = encryptionService.encryptData(currentState);
    
    const response = await fetch(`${API_BASE_URL}/create.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_id: syncId,
        encrypted_blob: encryptedBlob,
        recovery_salt: salt,
        device_id: deviceId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create sync group');
    }

    return await response.json();
  }

  /**
   * Push local changes to server
   */
  async pushData() {
    if (!this.syncEnabled || !this.syncId) {
      throw new Error('Sync not initialized');
    }

    const deviceId = await encryptionService.getDeviceId();
    const deviceName = encryptionService.getDeviceName();
    
    // Get current state and encrypt it
    const currentState = this.getCurrentState();
    const encryptedBlob = encryptionService.encryptData(currentState);
    
    const response = await fetch(`${API_BASE_URL}/push.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_id: this.syncId,
        device_id: deviceId,
        device_name: deviceName,
        encrypted_blob: encryptedBlob
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to push data');
    }

    const result = await response.json();
    this.lastSyncVersion = result.version;
    
    // Store the version for persistence
    await AsyncStorage.setItem('@sync_last_version', result.version.toString());
    
    return result;
  }

  /**
   * Pull latest data from server
   */
  async pullData() {
    if (!this.syncId) {
      console.log('pullData: No syncId available');
      return null;
    }

    const deviceId = await encryptionService.getDeviceId();
    console.log('pullData: syncId:', this.syncId, 'deviceId:', deviceId);
    
    const url = `${API_BASE_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;
    console.log('pullData: fetching from', url);
    
    const response = await fetch(url);
    console.log('pullData: response status', response.status);

    if (response.status === 404) {
      return null; // Sync group doesn't exist
    }

    if (!response.ok) {
      const error = await response.json();
      console.error('pullData error:', error);
      throw new Error(error.message || 'Failed to pull data');
    }

    const data = await response.json();
    console.log('pullData: received data', data);
    return data;
  }

  /**
   * Sync data (pull, merge, push)
   */
  async sync() {
    // Wait for initialization if needed
    if (!this.initialized) {
      await this.restoreState();
    }
    
    console.log('sync: Starting sync, enabled:', this.syncEnabled, 'syncId:', this.syncId);
    
    if (!this.syncEnabled) {
      throw new Error('Sync not enabled');
    }

    // Ensure encryption is initialized
    if (!encryptionService.masterKey) {
      console.log('sync: Encryption not initialized, need recovery phrase');
      throw new Error('Encryption not initialized. Please re-enter your recovery phrase.');
    }

    try {
      // Pull latest data
      console.log('sync: Pulling latest data...');
      const remoteData = await this.pullData();
      
      if (remoteData && remoteData.version > this.lastSyncVersion) {
        console.log('sync: Remote data is newer, merging...');
        // Decrypt and merge remote data
        const decryptedData = encryptionService.decryptData(remoteData.encrypted_blob);
        await this.mergeData(decryptedData);
        this.lastSyncVersion = remoteData.version;
      } else {
        console.log('sync: No newer remote data');
      }
      
      // Push our current state
      console.log('sync: Pushing current state...');
      const pushResult = await this.pushData();
      
      console.log('sync: Sync complete!', pushResult);
      return {
        success: true,
        version: pushResult.version,
        lastModified: pushResult.last_modified
      };
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  /**
   * Get current state from Zustand store
   */
  getCurrentState() {
    const state = useAppStore.getState();
    
    // Use the same structure as the export functionality
    const currentState = {
      version: 3,
      currentDay: state.currentDay,
      users: state.users,
      globalSettings: {
        currentTheme: state.currentTheme,
        bannerPosition: state.bannerPosition,
        defaultView: 'normal',
        displayMode: 'numbers',
        enableDayManagement: true,
        soundEnabled: state.soundEnabled,
        taskCelebration: state.taskCelebration,
        routineCelebration: state.routineCelebration
      },
      templates: state.activities, // activities are the templates
      currentUser: state.currentUser,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      completedActivities: state.completedActivities,
      lastBackup: new Date().toISOString()
    };
    
    console.log('getCurrentState: Full export-style state:', currentState);
    
    return currentState;
  }

  /**
   * Restore data to Zustand store
   */
  async restoreData(data) {
    console.log('restoreData: Incoming data:', data);
    
    // Handle both old format and new export format
    if (data.version === 3 && data.templates) {
      // New export format
      const {
        users,
        templates,
        completedActivities,
        currentUser,
        globalSettings,
        hasCompletedOnboarding,
        currentDay
      } = data;
      
      console.log('restoreData: Export format data - Users:', users);
      console.log('restoreData: Export format data - Templates:', templates);
      
      // Update store with export format data
      const newState = {
        activities: templates || [],
        users: users || {},
        completedActivities: completedActivities || [],
        currentUser: currentUser || Object.keys(users || {})[0] || 'user_1',
        currentTheme: globalSettings?.currentTheme || 'stackBlue',
        bannerPosition: globalSettings?.bannerPosition || 'top',
        soundEnabled: globalSettings?.soundEnabled !== false,
        taskCelebration: globalSettings?.taskCelebration || 'rainbow',
        routineCelebration: globalSettings?.routineCelebration || 'rainbow',
        hasCompletedOnboarding: hasCompletedOnboarding !== undefined ? hasCompletedOnboarding : true,
        currentDay: currentDay || 'today'
      };
      
      console.log('restoreData: Setting export format state:', newState);
      useAppStore.setState(newState);
    } else {
      // Old format (backwards compatibility)
      const {
        activities,
        users,
        completedActivities,
        currentUser,
        currentTheme,
        bannerPosition,
        hasCompletedOnboarding
      } = data;
      
      const newState = {
        activities: activities || [],
        users: users || {},
        completedActivities: completedActivities || [],
        currentUser: currentUser || 'user_1',
        currentTheme: currentTheme || 'stackBlue',
        bannerPosition: bannerPosition || 'top',
        hasCompletedOnboarding: hasCompletedOnboarding !== undefined ? hasCompletedOnboarding : false
      };
      
      useAppStore.setState(newState);
    }
  }

  /**
   * Merge remote data with local data
   */
  async mergeData(remoteData) {
    // Simple last-write-wins merge strategy
    // In production, implement proper conflict resolution
    const localState = this.getCurrentState();
    
    // For now, just replace with remote data if it's newer
    if (remoteData.lastBackup > localState.lastBackup) {
      await this.restoreData(remoteData);
    }
  }

  /**
   * Disable sync and clear credentials
   */
  async disable() {
    this.syncEnabled = false;
    this.syncId = null;
    this.lastSyncVersion = 0;
    
    // Stop periodic sync
    this.stopPeriodicSync();
    
    await AsyncStorage.removeItem('@sync_enabled');
    await AsyncStorage.removeItem('@sync_id');
    await AsyncStorage.removeItem('@sync_last_version');
    await encryptionService.clear();
  }

  /**
   * Delete all sync data from server
   */
  async deleteFromServer() {
    if (!this.syncId) {
      throw new Error('No sync data to delete');
    }

    const deviceId = await encryptionService.getDeviceId();
    
    const response = await fetch(`${API_BASE_URL}/delete.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_id: this.syncId,
        device_id: deviceId
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete sync data');
    }

    const result = await response.json();
    
    // After successful deletion, disable sync locally
    await this.disable();
    
    return result;
  }

  /**
   * Check if sync is enabled
   */
  async isEnabled() {
    // Wait for initialization if needed
    if (!this.initialized) {
      await this.restoreState();
    }
    
    return this.syncEnabled;
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      enabled: this.syncEnabled,
      syncId: this.syncId,
      version: this.lastSyncVersion
    };
  }

  /**
   * Re-initialize encryption with recovery phrase (for restoring after refresh)
   */
  async restoreEncryption(recoveryPhrase) {
    if (!this.syncId) {
      throw new Error('No sync ID available');
    }

    try {
      // Use the same fixed salt for consistency
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      
      // Re-derive the key with the fixed salt
      const { key } = await encryptionService.deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
      
      // Verify by trying to decrypt some data
      const testData = await this.pullData();
      if (testData && testData.encrypted_blob) {
        // Set the key temporarily
        encryptionService.masterKey = key;
        encryptionService.syncId = this.syncId;
        
        // Try to decrypt
        const decrypted = encryptionService.decryptData(testData.encrypted_blob);
        
        // If successful, the key is correct
        console.log('Encryption restored successfully');
        
        // Store the recovery phrase for future automatic restoration
        await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
        
        // Start periodic sync
        this.startPeriodicSync();
        
        return true;
      } else {
        // No data to verify against, just set the key
        encryptionService.masterKey = key;
        encryptionService.syncId = this.syncId;
        
        // Store the recovery phrase for future automatic restoration
        await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
        
        // Start periodic sync
        this.startPeriodicSync();
        
        return true;
      }
    } catch (error) {
      console.error('Failed to restore encryption:', error);
      throw new Error('Invalid recovery phrase');
    }
  }

  /**
   * Start periodic background sync
   */
  startPeriodicSync() {
    // Clear any existing interval
    this.stopPeriodicSync();
    
    // Only start if sync is enabled
    if (!this.syncEnabled) return;
    
    console.log('Starting periodic sync every', this.syncIntervalDuration / 1000, 'seconds');
    
    // Run immediate sync
    this.sync().catch(error => {
      console.error('Periodic sync failed:', error);
    });
    
    // Set up interval
    this.syncInterval = setInterval(() => {
      this.sync().catch(error => {
        console.error('Periodic sync failed:', error);
      });
    }, this.syncIntervalDuration);
  }
  
  /**
   * Stop periodic sync
   */
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Stopped periodic sync');
    }
  }
}

export default new SyncService();