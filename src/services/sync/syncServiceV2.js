/**
 * Simplified Sync Service V2 with CRDT-based conflict resolution
 * Target: ~200 lines of core orchestration logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import encryptionService from './encryptionService';
import crdtMerger from './crdtMerger';
import eventLogger from './eventLogger';
import { normalizeSyncData } from '../../utils/dataNormalizer';

// Type helpers for tweetnacl-util
const encodeBase64 = (arr) => util.encodeBase64(arr);
const decodeBase64 = (str) => util.decodeBase64(str);
const decodeUTF8 = (str) => util.decodeUTF8(str);

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = () => {
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return 'https://stackmap.app/qual/api/sync';
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'https://stackmap.app/api/sync';
    }
    if (window.location.pathname.startsWith('/qual')) {
      return 'https://stackmap.app/qual/api/sync';
    }
  }
  return 'https://stackmap.app/api/sync';
};

class SyncServiceV2 {
  constructor() {
    this.syncEnabled = false;
    this.syncId = null;
    this.deviceId = null;
    this.lastVersion = 0;
    this.syncTimer = null;
    this.syncInProgress = false;
    this.pendingSync = false;
    
    // Single consistent timing strategy
    this.SYNC_INTERVAL = 5000; // 5 seconds
    this.RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff
    
    // Initialize on construction
    this.initialize();
  }

  /**
   * Initialize service
   */
  async initialize() {
    try {
      // Restore saved state
      const [enabled, syncId, version] = await Promise.all([
        AsyncStorage.getItem('@sync_enabled_v2'),
        AsyncStorage.getItem('@sync_id'),
        AsyncStorage.getItem('@sync_version_v2')
      ]);

      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastVersion = parseInt(version) || 0;
        this.deviceId = await encryptionService.getDeviceId();
        
        eventLogger.logSync('INITIALIZED', { 
          syncId: this.syncId,
          version: this.lastVersion 
        });
        
        this.startSyncTimer();
      }
    } catch (error) {
      console.error('[SyncV2] Initialization failed:', error);
    }
  }

  /**
   * Generate deterministic sync ID from recovery phrase
   */
  async generateSyncId(recoveryPhrase) {
    // Use a fixed salt for sync ID generation to ensure consistency
    const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ=='; // Base64 encoded fixed salt
    
    const { key } = await encryptionService.deriveKeyFromPhrase(
      recoveryPhrase,
      fixedSalt
    );
    
    // Use first 16 bytes of key as sync ID
    const syncIdBytes = key.slice(0, 16);
    const syncId = Array.from(syncIdBytes, byte =>
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    return syncId;
  }

  /**
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase) {
    try {
      // Generate recovery phrase if not provided
      if (!recoveryPhrase) {
        recoveryPhrase = encryptionService.generateRecoveryPhrase();
      }
      
      // Generate sync ID from recovery phrase
      this.syncId = await this.generateSyncId(recoveryPhrase);
      this.deviceId = await encryptionService.getDeviceId();
      
      // Check if sync group exists
      const existingData = await this.pull();
      
      if (!existingData) {
        // New sync group - create it
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        const { salt } = await encryptionService.initialize(
          recoveryPhrase,
          this.syncId,
          fixedSalt
        );
        await this.createSyncGroup(this.syncId, salt);
      } else {
        // Existing sync group - join it
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(
          recoveryPhrase,
          this.syncId,
          fixedSalt
        );
        
        // Verify we can decrypt
        const decryptedData = encryptionService.decryptData(existingData.encrypted_blob);
        
        // Apply remote data if it has content
        if (decryptedData.users && Object.keys(decryptedData.users).length > 0) {
          await this.applyState(decryptedData);
        }
        
        this.lastVersion = existingData.version;
      }

      // Save state
      await AsyncStorage.multiSet([
        ['@sync_enabled_v2', 'true'],
        ['@sync_id', this.syncId],
        ['@sync_version_v2', this.lastVersion.toString()]
      ]);

      this.syncEnabled = true;
      
      eventLogger.logSync('ENABLED', { syncId: this.syncId });
      
      // Start sync timer
      this.startSyncTimer();
      
      // Store recovery phrase for future use
      await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
      
      // Return recovery phrase so user can save it
      return recoveryPhrase;
    } catch (error) {
      console.error('[SyncV2] Enable failed:', error);
      throw error;
    }
  }

  /**
   * Disable sync
   */
  async disable() {
    this.syncEnabled = false;
    this.stopSyncTimer();
    
    await AsyncStorage.multiRemove([
      '@sync_enabled_v2',
      '@sync_version_v2'
    ]);
    
    eventLogger.logSync('DISABLED', {});
  }

  /**
   * Start sync timer
   */
  startSyncTimer() {
    this.stopSyncTimer();
    this.syncTimer = setInterval(() => {
      if (this.pendingSync) {
        this.performSync();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop sync timer
   */
  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Request sync (debounced)
   */
  requestSync() {
    if (!this.syncEnabled) return;
    this.pendingSync = true;
    eventLogger.logSync('REQUESTED', {});
  }

  /**
   * Perform sync operation
   */
  async performSync(retryCount = 0) {
    if (!this.syncEnabled || !this.syncId || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    this.pendingSync = false;
    
    try {
      eventLogger.logSync('START', { version: this.lastVersion });
      
      // Get current local state
      const localState = this.getCurrentState();
      
      // Pull remote data
      const remoteData = await this.pull();
      
      let stateToSync;
      
      if (remoteData && remoteData.version > this.lastVersion) {
        // Remote is newer - merge with CRDT
        eventLogger.logSync('MERGING', { 
          localVersion: this.lastVersion,
          remoteVersion: remoteData.version 
        });
        
        const decryptedRemote = encryptionService.decryptData(remoteData.encrypted_blob);
        const normalizedRemote = normalizeSyncData(decryptedRemote);
        
        // Use CRDT merger for conflict-free merge
        stateToSync = crdtMerger.mergeStates(localState, normalizedRemote, this.deviceId);
        
        // Apply merged state locally
        await this.applyState(stateToSync);
      } else {
        // Local is newer or same - use local
        stateToSync = localState;
      }
      
      // Push merged state
      const newVersion = await this.push(stateToSync);
      this.lastVersion = newVersion;
      
      await AsyncStorage.setItem('@sync_version_v2', newVersion.toString());
      
      eventLogger.logSync('SUCCESS', { newVersion });
      
      this.syncInProgress = false;
      return true;
      
    } catch (error) {
      this.syncInProgress = false;
      
      // Retry with exponential backoff
      if (retryCount < this.RETRY_DELAYS.length) {
        eventLogger.logNetwork('RETRY', { 
          attempt: retryCount + 1,
          delay: this.RETRY_DELAYS[retryCount] 
        });
        
        setTimeout(() => {
          this.performSync(retryCount + 1);
        }, this.RETRY_DELAYS[retryCount]);
      } else {
        eventLogger.logSync('FAILED', { error: error.message });
      }
      
      throw error;
    }
  }

  /**
   * Create a new sync group on the server
   */
  async createSyncGroup(syncId, salt) {
    const deviceId = await encryptionService.getDeviceId();
    const currentState = this.getCurrentState();
    const encryptedBlob = encryptionService.encryptData(currentState);
    
    eventLogger.logSync('CREATE_GROUP', { 
      syncId: this.syncId,
      userCount: Object.keys(currentState.users || {}).length 
    });
    
    const response = await fetch(`${getApiBaseUrl()}/create.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: syncId,
        encrypted_blob: encryptedBlob,
        recovery_salt: salt,
        device_id: deviceId
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Create sync group failed: ${errorText}`);
    }
    
    const result = await response.json();
    this.lastVersion = result.version || 1;
    return result;
  }

  /**
   * Pull data from server
   */
  async pull() {
    if (!this.syncId) return null;
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/pull.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_id: this.syncId })
      });

      if (!response.ok) {
        // 404 means sync doesn't exist yet (expected for new syncs)
        // 400 might mean invalid sync_id format or server issue
        // Both should return null during enable() to create new sync
        if (response.status === 404 || response.status === 400) {
          eventLogger.logSync('PULL_NOT_FOUND', { 
            status: response.status,
            syncId: this.syncId 
          });
          return null;
        }
        throw new Error(`Pull failed: ${response.status}`);
      }

      const data = await response.json();
      eventLogger.logSync('PULL_SUCCESS', { 
        version: data.version,
        hasData: !!data.encrypted_blob 
      });
      return data;
    } catch (error) {
      // Network errors should also return null during enable
      if (error.message && error.message.includes('fetch')) {
        eventLogger.logNetwork('PULL_NETWORK_ERROR', { error: error.message });
        return null;
      }
      throw error;
    }
  }

  /**
   * Push data to server
   */
  async push(state) {
    const encrypted = encryptionService.encryptData(state);
    
    const response = await fetch(`${getApiBaseUrl()}/push.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: this.syncId,
        encrypted_blob: encrypted,
        version: this.lastVersion + 1,
        device_id: this.deviceId
      })
    });

    if (!response.ok) {
      throw new Error(`Push failed: ${response.status}`);
    }

    const result = await response.json();
    return result.version;
  }

  /**
   * Get current state from stores
   */
  getCurrentState() {
    // Import stores dynamically to avoid circular dependencies
    const { useAppStore, useUserStore, useSettingsStore, useLibraryStore } = require('../../stores');
    
    const userStore = useUserStore.getState();
    const settingsStore = useSettingsStore.getState();
    const libraryStore = useLibraryStore.getState();
    const appStore = useAppStore.getState();
    
    return {
      users: userStore.users,
      currentUser: userStore.currentUser,
      currentDay: userStore.currentDay,
      library: libraryStore.library,
      libraryTemplates: libraryStore.libraryTemplates,
      globalSettings: {
        currentTheme: settingsStore.currentTheme,
        bannerPosition: settingsStore.bannerPosition,
        soundEnabled: settingsStore.soundEnabled,
        taskCelebration: settingsStore.taskCelebration,
        routineCelebration: settingsStore.routineCelebration
      }
    };
  }

  /**
   * Apply state to stores
   */
  async applyState(state) {
    const { useUserStore, useSettingsStore, useLibraryStore } = require('../../stores');
    
    // Update stores
    useUserStore.getState().setUsers(state.users || {});
    useUserStore.getState().setCurrentUser(state.currentUser);
    useUserStore.getState().setCurrentDay(state.currentDay || 'today');
    
    if (state.library) {
      useLibraryStore.getState().setLibrary(state.library);
    }
    
    if (state.globalSettings) {
      useSettingsStore.getState().updateSettings(state.globalSettings);
    }
    
    eventLogger.logSync('STATE_APPLIED', {
      userCount: Object.keys(state.users || {}).length
    });
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      enabled: this.syncEnabled,
      syncId: this.syncId,
      version: this.lastVersion,
      inProgress: this.syncInProgress,
      pending: this.pendingSync
    };
  }

  /**
   * Compatibility methods for existing code
   */
  
  // Check if sync is enabled (legacy method name)
  isEnabled() {
    return this.syncEnabled;
  }

  // Initialize for import (skip initial sync)
  async initializeForImport(recoveryPhrase) {
    try {
      eventLogger.logSync('INITIALIZE_FOR_IMPORT', {});
      
      // Generate sync ID from recovery phrase
      this.syncId = await this.generateSyncId(recoveryPhrase);
      this.deviceId = await encryptionService.getDeviceId();
      
      // Initialize encryption with fixed salt
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      await encryptionService.initialize(recoveryPhrase, this.syncId, fixedSalt);
      
      // Enable sync and store state
      this.syncEnabled = true;
      await AsyncStorage.multiSet([
        ['@sync_enabled_v2', 'true'],
        ['@sync_id', this.syncId],
        ['@sync_version_v2', '0']
      ]);
      
      // Store recovery phrase for future use
      await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
      
      // Start sync timer but don't trigger immediate sync
      // The imported data will sync on next interval
      this.startSyncTimer();
      
      eventLogger.logSync('IMPORT_INITIALIZED', { syncId: this.syncId });
      
      return {
        syncId: this.syncId,
        recoveryPhrase,
        isNewSync: false
      };
    } catch (error) {
      console.error('[SyncV2] Initialize for import failed:', error);
      this.syncId = null;
      throw error;
    }
  }

  // Check if user has auto-update shares
  async hasAutoUpdateShares(userId) {
    const shares = await this.getActiveShares();
    return shares.some(share => share.userId === userId && share.autoUpdate);
  }

  // Update all auto-update shares for a user
  async updateActiveShares(userId) {
    const shares = await this.getActiveShares();
    const userShares = shares.filter(
      share => share.userId === userId && share.autoUpdate && share.shareVersion === 2
    );
    
    // Update shares in parallel with error handling for each
    await Promise.all(
      userShares.map(async share => {
        try {
          await this.updateShare(share.token, userId);
        } catch (error) {
          console.error(`Failed to update share: ${error.message}`);
        }
      })
    );
  }

  // Join sync group with recovery phrase
  async join(recoveryPhrase) {
    return this.enable(recoveryPhrase);
  }

  // Create new sync group
  async create() {
    // Use encryption service to generate proper recovery phrase
    const recoveryPhrase = encryptionService.generateRecoveryPhrase();
    
    // Enable will handle creating the sync group
    await this.enable(recoveryPhrase);
    
    // Return the recovery phrase for the user to save
    return recoveryPhrase;
  }

  // Get recovery phrase (if available)
  getRecoveryPhrase() {
    // For security, we don't store the recovery phrase
    // User must save it when creating/joining
    return null;
  }

  // Manual sync trigger
  async manualSync() {
    if (!this.syncEnabled) {
      return { success: false, message: 'Sync not enabled' };
    }
    
    try {
      await this.performSync();
      return { success: true, message: 'Sync completed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Sharing functionality
   */

  // Create a share link for provider access
  async createShareLink(userId, options = {}) {
    if (!this.syncEnabled || !this.syncId) {
      throw new Error('Sync must be enabled to create share links');
    }

    const {
      recipientName = '',
      shareNote = '',
      includeCompleted = true,
      includeTomorrow = false,
      autoUpdate = false
    } = options;

    try {
      const state = this.getCurrentState();
      const user = state.users[userId];
      if (!user) {
        throw new Error('User not found');
      }

      // Generate share token
      const token = this.generateShareToken();
      const shareKey = this._lastShareKeyBytes;

      // Prepare user data
      const userData = {
        id: userId,
        name: user.name,
        icon: user.icon,
        days: user.days || {},
        activities: user.days?.today?.activities || []
      };

      // Filter activities based on options
      if (!includeCompleted) {
        userData.activities = userData.activities.filter(a => !a.completed);
      }

      if (!includeTomorrow && userData.days.tomorrow) {
        delete userData.days.tomorrow;
      }

      // Encrypt share data
      const shareData = {
        user: userData,
        sharedBy: this.deviceId,
        sharedAt: new Date().toISOString(),
        note: shareNote
      };

      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const messageBytes = decodeUTF8(JSON.stringify(shareData));
      const encrypted = nacl.secretbox(messageBytes, nonce, shareKey);
      
      const combined = new Uint8Array(nonce.length + encrypted.length);
      combined.set(nonce);
      combined.set(encrypted, nonce.length);
      const encryptedData = encodeBase64(combined);

      // Create share on server
      const response = await fetch(`${getApiBaseUrl()}/share/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_id: this.syncId,
          encrypted_data: encryptedData,
          access_token: token,
          share_version: 2,
          expires_hours: options.expiresInHours || 24,
          recipient_name: recipientName,
          auto_update: autoUpdate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create share');
      }

      const result = await response.json();

      // Store share info locally
      const shares = await this.getActiveShares();
      shares.push({
        shareId: result.share_id,
        token: token,
        userId,
        userName: user.name,
        recipientName,
        shareNote,
        includeCompleted,
        includeTomorrow,
        autoUpdate,
        shareVersion: 2,
        createdAt: new Date().toISOString(),
        expiresAt: result.expires_at,
        shareUrl: result.share_url
      });
      await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(shares));

      return result;
    } catch (error) {
      console.error('Failed to create share link:', error);
      throw error;
    }
  }

  // Update an existing share with fresh data
  async updateShare(token, userId) {
    if (!this.syncEnabled || !this.syncId) {
      throw new Error('Sync must be enabled to update shares');
    }

    try {
      const state = this.getCurrentState();
      const user = state.users[userId];
      if (!user) {
        throw new Error('User not found');
      }

      // Get share metadata
      const shares = await this.getActiveShares();
      const shareInfo = shares.find(s => s.token === token);
      if (!shareInfo) {
        console.warn('Share not found locally, skipping update');
        return;
      }

      // Prepare updated data (same filters as original)
      const userData = {
        id: userId,
        name: user.name,
        icon: user.icon,
        days: user.days || {},
        activities: user.days?.today?.activities || []
      };

      if (!shareInfo.includeCompleted) {
        userData.activities = userData.activities.filter(a => !a.completed);
      }

      if (!shareInfo.includeTomorrow && userData.days.tomorrow) {
        delete userData.days.tomorrow;
      }

      // Encrypt with share key
      const shareKey = decodeBase64(token + '='.repeat((4 - token.length % 4) % 4));
      const shareData = {
        user: userData,
        sharedBy: this.deviceId,
        sharedAt: shareInfo.createdAt,
        updatedAt: new Date().toISOString(),
        note: shareInfo.shareNote
      };

      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const messageBytes = decodeUTF8(JSON.stringify(shareData));
      const encrypted = nacl.secretbox(messageBytes, nonce, shareKey);
      
      const combined = new Uint8Array(nonce.length + encrypted.length);
      combined.set(nonce);
      combined.set(encrypted, nonce.length);
      const encryptedData = encodeBase64(combined);

      // Update on server
      const response = await fetch(`${getApiBaseUrl()}/share/update.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: token,
          encrypted_data: encryptedData
        })
      });

      if (!response.ok) {
        console.warn('Failed to update share on server');
      }
    } catch (error) {
      console.error('Failed to update share:', error);
    }
  }

  // Get active shares created by this device
  async getActiveShares() {
    try {
      const stored = await AsyncStorage.getItem('@stackmap_shares');
      if (!stored) return [];
      
      const shares = JSON.parse(stored);
      const now = new Date();
      
      // Process shares to mark status
      const processedShares = shares.map(share => {
        const expiryDate = new Date(share.expiresAt);
        const gracePeriodEnd = new Date(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        if (expiryDate < now && gracePeriodEnd > now) {
          return { ...share, status: 'idle' };
        } else if (expiryDate >= now) {
          return { ...share, status: 'active' };
        }
        return null;
      });
      
      return processedShares.filter(share => share !== null);
    } catch (error) {
      console.error('Failed to get active shares:', error);
      return [];
    }
  }

  // Delete a share link
  async deleteShare(shareId) {
    try {
      // Delete from server
      const response = await fetch(`${getApiBaseUrl()}/share/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_id: this.syncId,
          share_id: shareId
        })
      });

      if (!response.ok) {
        console.error('Server error deleting share');
      }

      // Remove from local storage
      const shares = await this.getActiveShares();
      const filtered = shares.filter(share => share.shareId !== shareId);
      await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(filtered));
      
      return true;
    } catch (error) {
      console.error('Failed to delete share:', error);
      throw error;
    }
  }

  // Extend a share link
  async extendShare(shareId, additionalHours) {
    try {
      const shares = await this.getActiveShares();
      const shareIndex = shares.findIndex(share => share.shareId === shareId);
      
      if (shareIndex === -1) {
        throw new Error('Share not found');
      }
      
      const share = shares[shareIndex];
      const currentExpiry = new Date(share.expiresAt);
      const now = new Date();
      const baseTime = currentExpiry < now || share.status === 'idle' ? now : currentExpiry;
      const newExpiry = new Date(baseTime.getTime() + additionalHours * 60 * 60 * 1000);
      
      shares[shareIndex] = {
        ...share,
        expiresAt: newExpiry.toISOString(),
        status: 'active',
        extendedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(shares));
      return shares[shareIndex];
    } catch (error) {
      console.error('Failed to extend share:', error);
      throw error;
    }
  }

  // Generate a share token
  generateShareToken() {
    const bytes = nacl.randomBytes(32);
    const token = encodeBase64(bytes)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/[=]/g, '');
    
    this._lastShareKeyBytes = bytes;
    return token;
  }
}

// Export singleton instance
export default new SyncServiceV2();