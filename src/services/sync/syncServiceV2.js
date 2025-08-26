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
    
    // Status tracking
    this.syncStatus = 'idle';
    this.syncError = null;
    this.lastSyncAttempt = null;
    this.lastSyncSuccess = null;
    
    // Listeners for UI updates
    this.statusListeners = new Set();
    
    // Expose encryptionService for backward compatibility with onboarding
    this.encryptionService = encryptionService;
    
    // Initialize on construction
    this._initializeOnStartup();
  }

  /**
   * Initialize with recovery phrase - for backward compatibility with onboarding
   * @param {string} recoveryPhrase - Optional recovery phrase to initialize with
   */
  async initialize(recoveryPhrase = null) {
    // If recovery phrase is provided, this is being called from onboarding
    // Use enable() functionality instead
    if (recoveryPhrase) {
      // Don't fully enable sync, just set up encryption for pulling data
      // This matches the original sync service behavior for onboarding
      const syncId = await this.generateSyncId(recoveryPhrase);
      this.syncId = syncId;
      this.deviceId = await encryptionService.getDeviceId();
      
      // Initialize encryption
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
      
      return { syncId, recoveryPhrase };
    }
    
    // Otherwise, do the normal startup initialization
    return this._initializeOnStartup();
  }
  
  /**
   * Initialize service on startup (original initialize method)
   */
  async _initializeOnStartup() {
    try {
      // Restore saved state - use original keys for compatibility
      const [enabled, syncId, version] = await Promise.all([
        AsyncStorage.getItem('@sync_enabled'), // Original key
        AsyncStorage.getItem('@sync_id'),
        AsyncStorage.getItem('@sync_version')  // Original key
      ]);

      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastVersion = parseInt(version) || 0;
        this.deviceId = await encryptionService.getDeviceId();
        
        // Try to get the stored recovery phrase and initialize encryption
        try {
          const recoveryPhrase = await encryptionService.getStoredRecoveryPhrase(syncId);
          if (recoveryPhrase) {
            // Initialize encryption with the stored recovery phrase
            const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
            await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
            
            eventLogger.logSync('INITIALIZED', { 
              syncId: this.syncId,
              version: this.lastVersion,
              encryptionReady: true
            });
            
            this.startSyncTimer();
          } else {
            // Recovery phrase not found - sync is enabled but can't decrypt
            // Don't start sync timer until encryption is properly initialized
            eventLogger.logSync('INITIALIZED_NO_KEY', { 
              syncId: this.syncId,
              version: this.lastVersion 
            });
            console.warn('[SyncV2] Sync enabled but recovery phrase not found');
          }
        } catch (encryptError) {
          console.error('[SyncV2] Failed to initialize encryption:', encryptError);
          // Don't start sync if encryption fails
        }
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
      let existingData = null;
      try {
        existingData = await this.pull();
      } catch (pullError) {
        // Log the error but continue - might be a new sync or temporary issue
        console.warn('[SyncV2] Pull during enable failed:', pullError.message);
        existingData = null;
      }
      
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

      // Save state - use original keys for compatibility
      await AsyncStorage.multiSet([
        ['@sync_enabled', 'true'],
        ['@sync_id', this.syncId],
        ['@sync_version', this.lastVersion.toString()]
      ]);

      this.syncEnabled = true;
      
      eventLogger.logSync('ENABLED', { syncId: this.syncId });
      
      // Start sync timer
      this.startSyncTimer();
      
      // Store recovery phrase for future use
      await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
      
      // Return object with sync info (matching original sync service)
      return {
        syncId: this.syncId,
        recoveryPhrase: recoveryPhrase
      };
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
      '@sync_enabled',
      '@sync_version'
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

    // Check if encryption is initialized
    if (!encryptionService.masterKey) {
      console.warn('[SyncV2] Skipping sync - encryption not initialized');
      return;
    }

    this.syncInProgress = true;
    this.pendingSync = false;
    this.lastSyncAttempt = Date.now();
    
    try {
      this.updateSyncStatus('syncing');
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
      
      await AsyncStorage.setItem('@sync_version', newVersion.toString());
      
      this.lastSyncSuccess = Date.now();
      this.updateSyncStatus('success');
      eventLogger.logSync('SUCCESS', { newVersion });
      
      this.syncInProgress = false;
      return true;
      
    } catch (error) {
      this.syncInProgress = false;
      this.updateSyncStatus('error', error.message);
      
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
    
    // Ensure we have a device ID
    if (!this.deviceId) {
      this.deviceId = await encryptionService.getDeviceId();
    }
    
    try {
      // Send parameters as query params, not POST body (matching original service)
      const url = `${getApiBaseUrl()}/pull.php?sync_id=${this.syncId}&device_id=${this.deviceId}&current_version=${this.lastVersion || 0}`;
      const response = await fetch(url);

      if (!response.ok) {
        // 404 means sync doesn't exist yet (expected for new syncs)
        if (response.status === 404) {
          eventLogger.logSync('PULL_NOT_FOUND', { 
            status: response.status,
            syncId: this.syncId 
          });
          return null;
        }
        // 400 is a bad request - log it but throw error for debugging
        if (response.status === 400) {
          const errorText = await response.text();
          console.error('[SyncV2] Pull got 400 error:', errorText, 'for syncId:', this.syncId);
          eventLogger.logSync('PULL_BAD_REQUEST', { 
            status: response.status,
            syncId: this.syncId,
            error: errorText
          });
          // Don't return null for 400 - let caller handle it
          throw new Error(`Pull failed with 400: ${errorText || 'Bad Request'}`);
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
   * Pull data - alias for backward compatibility with onboarding
   */
  async pullData() {
    return this.pull();
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
        ['@sync_enabled', 'true'],
        ['@sync_id', this.syncId],
        ['@sync_version', '0']
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
    const result = await this.enable(recoveryPhrase);
    return {
      ...result,
      isNewSync: false
    };
  }

  // Create new sync group
  async create() {
    // Use encryption service to generate proper recovery phrase
    const recoveryPhrase = encryptionService.generateRecoveryPhrase();
    
    // Enable will handle creating the sync group
    await this.enable(recoveryPhrase);
    
    // Return object with sync info like the original sync service
    return {
      syncId: this.syncId,
      recoveryPhrase: recoveryPhrase,
      isNewSync: true
    };
  }

  // Initialize sync for data import (doesn't pull/overwrite existing data)
  async initializeForImport(recoveryPhrase) {
    try {
      console.log('[SyncV2] Initialize for import - skipping data pull');
      
      // Generate sync ID from recovery phrase
      const syncId = await this.generateSyncId(recoveryPhrase);
      this.syncId = syncId;
      this.deviceId = await encryptionService.getDeviceId();
      
      // Initialize encryption with fixed salt
      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
      
      // Enable sync and store state
      this.syncEnabled = true;
      await AsyncStorage.multiSet([
        ['@sync_enabled', 'true'],
        ['@sync_id', syncId],
        ['@sync_version', '0'] // Start at 0 since we haven't synced yet
      ]);
      
      // Store recovery phrase for future use
      await encryptionService.storeRecoveryPhrase(recoveryPhrase, syncId);
      
      // Don't pull data, don't restore data - the data has already been imported
      // Start sync timer to begin syncing the imported data
      this.startSyncTimer();
      
      console.log('[SyncV2] Sync enabled for imported data');
      return { syncId, recoveryPhrase };
    } catch (error) {
      console.error('[SyncV2] Initialize for import failed:', error);
      throw error;
    }
  }

  // Get recovery phrase (if available)
  async getRecoveryPhrase() {
    if (!this.syncId) return null;
    try {
      // Retrieve the stored recovery phrase for the current sync ID
      return await encryptionService.getStoredRecoveryPhrase(this.syncId);
    } catch (error) {
      console.error('[SyncV2] Failed to get recovery phrase:', error);
      return null;
    }
  }

  // Get sync ID
  getSyncId() {
    return this.syncId;
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

  // Alias for backward compatibility
  async performManualSync() {
    return this.manualSync();
  }

  // Verify if sync exists on server
  async verifySyncExists() {
    if (!this.syncId) return false;
    
    try {
      const response = await this.pull();
      return response !== null;
    } catch (error) {
      return false;
    }
  }

  // Delete all data from server
  async deleteFromServer() {
    if (!this.syncEnabled || !this.syncId) {
      throw new Error('Sync not enabled');
    }

    try {
      const response = await fetch(`${this.API_URL}/delete.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_id: this.syncId })
      });

      if (!response.ok) {
        throw new Error('Failed to delete from server');
      }

      // Disable sync after deletion
      await this.disable();
      
      return { success: true };
    } catch (error) {
      console.error('[SyncV2] Delete from server failed:', error);
      throw error;
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

  /**
   * Status listener methods for UI updates
   */

  // Update sync status and notify listeners
  updateSyncStatus(status, error = null) {
    this.syncStatus = status;
    this.syncError = error;
    
    const statusData = {
      status,
      error,
      lastAttempt: this.lastSyncAttempt,
      lastSuccess: this.lastSyncSuccess,
      isOnline: true, // Simplified - assume online
      queueStatus: { pending: 0, failed: 0 }, // Simplified queue status
      hasConflicts: false, // CRDT has no conflicts
      conflictCount: 0
    };
    
    // Notify all listeners
    this.statusListeners.forEach(callback => {
      try {
        callback(statusData);
      } catch (err) {
        console.error('Status listener error:', err);
      }
    });
  }

  // Add a sync status listener
  addStatusListener(callback) {
    this.statusListeners.add(callback);
    
    // Immediately send current status
    callback({
      status: this.syncStatus,
      error: this.syncError,
      lastAttempt: this.lastSyncAttempt,
      lastSuccess: this.lastSyncSuccess,
      isOnline: true,
      queueStatus: { pending: 0, failed: 0 },
      hasConflicts: false,
      conflictCount: 0
    });
    
    // Return unsubscribe function
    return () => this.statusListeners.delete(callback);
  }

  // Remove a status listener
  removeStatusListener(callback) {
    this.statusListeners.delete(callback);
  }

  // Add conflict listener (no-op for CRDT - no conflicts possible)
  addConflictListener(callback) {
    // CRDT has no conflicts, so just return a no-op unsubscribe
    return () => {};
  }

  // Get pending conflicts (always empty for CRDT)
  getPendingConflicts() {
    return [];
  }

  // Retry failed sync operations (called by SyncStatusIndicator)
  async retryFailed() {
    console.log('[SyncV2] Retry failed called');
    if (this.syncEnabled) {
      try {
        const result = await this.performSync();
        return { success: true, message: 'Sync completed' };
      } catch (error) {
        console.error('[SyncV2] Retry failed error:', error);
        return { success: false, message: error.message };
      }
    }
    return { success: false, message: 'Sync not enabled' };
  }
}

// Export singleton instance
export default new SyncServiceV2();