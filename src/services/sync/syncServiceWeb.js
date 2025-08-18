/**
 * Simple Web Sync Service - Direct localStorage implementation
 * No AsyncStorage, no complex promises, just simple synchronous localStorage
 */

import { Platform } from 'react-native';
import encryptionService from './encryptionService';
import { useUserStore, useSettingsStore, useLibraryStore } from '../../stores';
import conflictResolver from './conflictResolver';
import { validateSyncedData, repairSyncedData } from './dataValidator';

console.log('[SyncWeb] Module loading at', new Date().toISOString());

// Get API base URL
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/qual')) {
    return 'https://stackmap.app/qual/api/sync';
  }
  return 'https://stackmap.app/api/sync';
};

const API_BASE_URL = getApiBaseUrl();

class WebSyncService {
  constructor() {
    console.log('[SyncWeb] Constructor called');
    
    // Initialize state directly from localStorage (synchronous)
    this.syncEnabled = localStorage.getItem('@sync_enabled') === 'true';
    this.syncId = localStorage.getItem('@sync_id');
    this.lastSyncVersion = parseInt(localStorage.getItem('@sync_last_version') || '0', 10);
    this.lastSyncSuccess = parseInt(localStorage.getItem('@sync_last_success') || '0', 10);
    this.initialized = false;
    this.syncInProgress = false;
    this.syncDebounceTimer = null;
    this.syncDebounceDelay = 10000;
    
    console.log('[SyncWeb] Initial state:', {
      syncEnabled: this.syncEnabled,
      syncId: this.syncId ? this.syncId.substring(0, 8) + '...' : null,
      lastSyncVersion: this.lastSyncVersion,
    });
    
    // Initialize encryption if we have credentials
    if (this.syncEnabled && this.syncId) {
      const recoveryPhrase = localStorage.getItem('@sync_recovery_phrase');
      if (recoveryPhrase) {
        try {
          console.log('[SyncWeb] Initializing encryption...');
          encryptionService.initializeFromPhrase(recoveryPhrase);
          console.log('[SyncWeb] Encryption initialized');
        } catch (error) {
          console.error('[SyncWeb] Failed to initialize encryption:', error);
        }
      }
      
      // Set up visibility listener
      this.setupVisibilityListener();
      
      // Perform initial sync
      setTimeout(() => this.sync(), 1000);
    }
    
    this.initialized = true;
  }
  
  setupVisibilityListener() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.syncEnabled) {
          console.log('[SyncWeb] Tab became visible, syncing...');
          this.sync();
        }
      });
    }
  }
  
  async enable(recoveryPhrase = null) {
    console.log('[SyncWeb] Enable called with recovery phrase:', !!recoveryPhrase);
    
    try {
      // Generate new recovery phrase if not provided
      if (!recoveryPhrase) {
        recoveryPhrase = encryptionService.generateRecoveryPhrase();
      }
      
      // Generate sync ID from recovery phrase
      const syncId = await this.generateSyncId(recoveryPhrase);
      this.syncId = syncId;
      
      console.log('[SyncWeb] Generated sync ID:', syncId.substring(0, 8) + '...');
      
      // Try to pull existing data
      const existingData = await this.pullData();
      
      if (!existingData) {
        // New sync group
        console.log('[SyncWeb] Creating new sync group');
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        const { salt } = await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
        await this.createSyncGroup(syncId, salt);
      } else {
        // Existing sync group
        console.log('[SyncWeb] Joining existing sync group');
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
        
        try {
          const decryptedData = encryptionService.decryptData(existingData.encrypted_blob);
          const isEmptySync = !decryptedData.users || Object.keys(decryptedData.users).length === 0;
          const currentState = this.getCurrentState();
          const hasLocalData = currentState.users && Object.keys(currentState.users).length > 0;
          
          if (isEmptySync && hasLocalData) {
            console.log('[SyncWeb] Empty sync, keeping local data');
          } else {
            console.log('[SyncWeb] Restoring data from sync');
            await this.restoreData(decryptedData);
          }
          
          this.lastSyncVersion = existingData.version;
        } catch (decryptError) {
          console.error('[SyncWeb] Decrypt failed:', decryptError);
          throw new Error('Invalid recovery phrase. Please check and try again.');
        }
      }
      
      // Save credentials to localStorage
      this.syncEnabled = true;
      localStorage.setItem('@sync_enabled', 'true');
      localStorage.setItem('@sync_id', syncId);
      localStorage.setItem('@sync_recovery_phrase', recoveryPhrase);
      localStorage.setItem('@sync_last_version', String(this.lastSyncVersion));
      
      console.log('[SyncWeb] Sync enabled and saved');
      
      // Store recovery phrase for encryption service
      await encryptionService.storeRecoveryPhrase(recoveryPhrase, syncId);
      
      // Set up visibility listener
      this.setupVisibilityListener();
      
      // Do initial sync
      this.sync();
      
      return {
        syncId,
        recoveryPhrase,
        isNewSync: !existingData,
      };
    } catch (error) {
      console.error('[SyncWeb] Enable failed:', error);
      this.syncId = null;
      throw error;
    }
  }
  
  async disable() {
    console.log('[SyncWeb] Disable called');
    
    // Clear debounce timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
    
    // Clear state
    this.syncEnabled = false;
    this.syncId = null;
    this.lastSyncVersion = 0;
    
    // Clear localStorage
    localStorage.removeItem('@sync_enabled');
    localStorage.removeItem('@sync_id');
    localStorage.removeItem('@sync_recovery_phrase');
    localStorage.removeItem('@sync_last_version');
    localStorage.removeItem('@sync_last_success');
    
    // Clear encryption
    encryptionService.masterKey = null;
    encryptionService.syncId = null;
    
    console.log('[SyncWeb] Sync disabled');
  }
  
  requestSync() {
    console.log('[SyncWeb] requestSync called', {
      syncEnabled: this.syncEnabled,
      syncId: this.syncId ? this.syncId.substring(0, 8) + '...' : null,
    });
    
    if (!this.syncEnabled || !this.syncId) {
      console.log('[SyncWeb] Skipping sync - not enabled');
      return;
    }
    
    // Clear existing timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    
    // Set new timer
    this.syncDebounceTimer = setTimeout(() => {
      console.log('[SyncWeb] Debounced sync triggered');
      this.sync();
    }, this.syncDebounceDelay);
  }
  
  async sync() {
    console.log('[SyncWeb] sync() called', {
      syncInProgress: this.syncInProgress,
      syncEnabled: this.syncEnabled,
      syncId: this.syncId ? this.syncId.substring(0, 8) + '...' : null,
    });
    
    if (this.syncInProgress) {
      console.log('[SyncWeb] Sync already in progress');
      return { success: false, error: 'Sync already in progress' };
    }
    
    if (!this.syncEnabled || !this.syncId) {
      console.log('[SyncWeb] Sync not enabled or no syncId');
      return { success: false, error: 'Sync not enabled' };
    }
    
    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();
    
    try {
      // Pull remote data
      const remoteData = await this.pullData();
      
      if (!remoteData) {
        // No remote data, push local data
        console.log('[SyncWeb] No remote data, pushing local');
        const result = await this.pushData();
        this.syncInProgress = false;
        return result;
      }
      
      // Decrypt remote data
      const decryptedRemote = encryptionService.decryptData(remoteData.encrypted_blob);
      
      // Get local state
      const localState = this.getCurrentState();
      
      // Simple conflict resolution: last-write-wins
      const shouldUseRemote = conflictResolver.shouldUseRemoteData(localState, decryptedRemote);
      
      if (shouldUseRemote) {
        console.log('[SyncWeb] Using remote data (newer)');
        await this.restoreData(decryptedRemote);
        this.lastSyncVersion = remoteData.version;
        this.lastSyncSuccess = Date.now();
        localStorage.setItem('@sync_last_version', String(remoteData.version));
        localStorage.setItem('@sync_last_success', String(this.lastSyncSuccess));
      } else {
        console.log('[SyncWeb] Using local data (newer), pushing...');
        const result = await this.pushData();
        if (result.success) {
          this.lastSyncVersion = result.version || this.lastSyncVersion;
          this.lastSyncSuccess = Date.now();
          localStorage.setItem('@sync_last_version', String(this.lastSyncVersion));
          localStorage.setItem('@sync_last_success', String(this.lastSyncSuccess));
        }
        this.syncInProgress = false;
        return result;
      }
      
      this.syncInProgress = false;
      return { success: true, version: this.lastSyncVersion };
    } catch (error) {
      console.error('[SyncWeb] Sync failed:', error);
      this.syncInProgress = false;
      return { success: false, error: error.message };
    }
  }
  
  async pullData() {
    if (!this.syncId) return null;
    
    try {
      const deviceId = await encryptionService.getDeviceId();
      const url = `${API_BASE_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;
      
      console.log('[SyncWeb] Pulling from:', url);
      const response = await fetch(url);
      
      if (response.status === 404) {
        return null; // No data exists
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      const data = JSON.parse(responseText);
      return data.data || null;
    } catch (error) {
      console.error('[SyncWeb] Pull failed:', error);
      return null;
    }
  }
  
  async pushData() {
    if (!this.syncId) {
      return { success: false, error: 'No sync ID' };
    }
    
    try {
      const deviceId = await encryptionService.getDeviceId();
      const deviceName = encryptionService.getDeviceName();
      const currentState = this.getCurrentState();
      const encryptedData = encryptionService.encryptData(currentState);
      
      console.log('[SyncWeb] Pushing data to server');
      
      const response = await fetch(`${API_BASE_URL}/push.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_id: this.syncId,
          device_id: deviceId,
          device_name: deviceName,
          encrypted_blob: encryptedData,
          sync_type: 'full',
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        success: result.success,
        version: result.version,
        lastModified: result.last_modified,
      };
    } catch (error) {
      console.error('[SyncWeb] Push failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  async createSyncGroup(syncId, salt) {
    const deviceId = await encryptionService.getDeviceId();
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
        device_id: deviceId,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create sync group');
    }
  }
  
  getCurrentState() {
    const userState = useUserStore.getState();
    const settingsState = useSettingsStore.getState();
    const libraryState = useLibraryStore.getState();
    
    return {
      users: userState.users,
      currentUser: userState.currentUser,
      library: libraryState.library,
      ...settingsState,
      lastModified: Date.now(),
    };
  }
  
  async restoreData(data) {
    // Validate and repair if needed
    const isValid = validateSyncedData(data);
    if (!isValid) {
      console.warn('[SyncWeb] Data validation failed, attempting repair...');
      data = repairSyncedData(data);
    }
    
    // Update stores
    if (data.users) {
      useUserStore.getState().setUsers(data.users);
    }
    if (data.currentUser !== undefined) {
      useUserStore.getState().setCurrentUser(data.currentUser);
    }
    if (data.library) {
      useLibraryStore.getState().setLibrary(data.library);
    }
    
    // Update settings
    const settingsUpdate = {};
    if (data.currentTheme) settingsUpdate.currentTheme = data.currentTheme;
    if (data.bannerPosition) settingsUpdate.bannerPosition = data.bannerPosition;
    if (data.soundEnabled !== undefined) settingsUpdate.soundEnabled = data.soundEnabled;
    if (data.taskCelebration !== undefined) settingsUpdate.taskCelebration = data.taskCelebration;
    if (data.routineCelebration !== undefined) settingsUpdate.routineCelebration = data.routineCelebration;
    
    if (Object.keys(settingsUpdate).length > 0) {
      useSettingsStore.getState().updateSettings(settingsUpdate);
    }
  }
  
  async generateSyncId(recoveryPhrase) {
    const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';
    const { key } = await encryptionService.deriveKeyFromPhrase(recoveryPhrase, fixedSalt);
    const syncIdBytes = key.slice(0, 16);
    return Array.from(syncIdBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Simple compatibility methods
  async isEnabled() {
    return this.syncEnabled;
  }
  
  getSyncId() {
    return this.syncId;
  }
  
  async getRecoveryPhrase() {
    if (!this.syncId) return null;
    try {
      return await encryptionService.getStoredRecoveryPhrase(this.syncId);
    } catch (error) {
      console.error('[SyncWeb] Failed to get recovery phrase:', error);
      return null;
    }
  }
  
  async verifySyncExists() {
    if (!this.syncId) return false;
    try {
      const data = await this.pullData();
      return data !== null;
    } catch {
      return false;
    }
  }
  
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
        device_id: deviceId,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      await this.disable();
    }
    
    return result;
  }
  
  getApiUrl() {
    return API_BASE_URL;
  }
  
  // Stubs for compatibility
  syncOnModeChange() {
    if (this.syncEnabled) {
      console.log('[SyncWeb] Mode changed, syncing...');
      this.sync();
    }
  }
  
  async hasAutoUpdateShares(_userId) {
    return false;
  }
  
  async updateActiveShares(_userId) {
    console.log('[SyncWeb] Share updates not supported yet');
  }
  
  get syncInterval() {
    return null;
  }
  
  addStatusListener(callback) {
    callback({
      status: 'idle',
      error: null,
      lastAttempt: this.lastSyncAttempt,
      lastSuccess: this.lastSyncSuccess,
      isOnline: true,
      queueStatus: { pending: 0 },
    });
    return () => {};
  }
  
  removeStatusListener(_callback) {
    // No-op
  }
  
  async syncWithQueue() {
    return this.sync();
  }
  
  async requestSyncWithOptions(_options) {
    this.requestSync();
    return { success: true };
  }
  
  async getActiveShares() {
    return [];
  }
  
  generateShareToken() {
    throw new Error('Share functionality not yet implemented');
  }
  
  async createShareLink(_userId, _options) {
    throw new Error('Share functionality not yet implemented');
  }
  
  async deleteShare(_shareId) {
    console.warn('[SyncWeb] Share deletion not yet implemented');
    return false;
  }
}

// Create singleton
const webSyncService = new WebSyncService();

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.syncService = webSyncService;
  console.log('[SyncWeb] Added syncService to window');
}

export default webSyncService;