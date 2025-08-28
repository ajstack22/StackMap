/**
 * Timestamp-based Sync Service
 * Uses timestamps instead of version numbers for conflict-free sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import encryptionService from './encryptionService';
import eventLogger from './eventLogger';
import dataMigrator from './dataMigrator';
import { normalizeSyncData } from '../../utils/dataNormalizer';
import { useUserStore, useSettingsStore, useLibraryStore } from '../../stores';

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = () => {
  const prodUrl = 'https://stackmap.app/api/sync';
  const qualUrl = 'https://stackmap.app/qual/api/sync';
  
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return qualUrl;
  }
  
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return prodUrl;
    }
    if (window.location.pathname.startsWith('/qual')) {
      return qualUrl;
    }
    return prodUrl;
  }
  
  return prodUrl;
};

class SyncServiceTimestamp {
  constructor() {
    this.syncEnabled = false;
    this.syncId = null;
    this.deviceId = null;
    this.lastSyncTimestamp = 0;  // Last timestamp we synced
    this.syncTimer = null;
    this.syncDebounceTimer = null;
    this.syncInProgress = false;
    this._justJoinedSync = false;
    this._joinedAt = 0;
    this._applyingRemoteState = false;
    this.currentRecoveryPhrase = null; // Store phrase in memory for current session
    
    // Timing configuration
    this.SYNC_INTERVAL = 30000; // 30 seconds
    this.DEBOUNCE_DELAY = 5000; // 5 seconds
    this.JOIN_PROTECTION_TIME = 61000; // 61 seconds
    
    // Clock skew detection
    this.serverTimeOffset = 0;  // Difference between server and client time
    
    // Status tracking
    this.syncStatus = 'idle';
    this.syncError = null;
    this.lastSyncAttempt = null;
    this.lastSyncSuccess = null;
    
    // Listeners for UI updates
    this.statusListeners = new Set();
    
    // Expose encryptionService for backward compatibility
    this.encryptionService = encryptionService;
    
    this._initializeOnStartup();
  }

  /**
   * Initialize service on startup
   */
  async _initializeOnStartup() {
    try {
      const [enabled, syncId, lastTimestamp] = await Promise.all([
        AsyncStorage.getItem('@sync_enabled'),
        AsyncStorage.getItem('@sync_id'),
        AsyncStorage.getItem('@sync_timestamp')
      ]);

      console.log('[SyncTS] Initialize:', {
        enabled,
        syncId,
        lastTimestamp
      });

      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastSyncTimestamp = parseInt(lastTimestamp, 10) || 0;
        this.deviceId = await encryptionService.getDeviceId();
        
        try {
          const recoveryPhrase = await encryptionService.getStoredRecoveryPhrase(syncId);
          if (recoveryPhrase) {
            // CRITICAL: Store recovery phrase in memory for this session
            this.currentRecoveryPhrase = recoveryPhrase;
            
            const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
            await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
            
            eventLogger.logSync('INITIALIZED', { 
              syncId: this.syncId,
              lastTimestamp: this.lastSyncTimestamp,
              encryptionReady: true
            });
            
            this.startSyncTimer();
          }
        } catch (encryptError) {
          if (__DEV__) console.error('[SyncTS] Failed to initialize encryption:', encryptError);
        }
      }
    } catch (error) {
      if (__DEV__) console.error('[SyncTS] Initialization failed:', error);
    }
  }

  /**
   * Generate deterministic sync ID from recovery phrase
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
   * Get device ID (wrapper for encryptionService)
   */
  async getDeviceId() {
    return encryptionService.getDeviceId();
  }

  /**
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase) {
    try {
      // Verify we have data before enabling sync
      const testState = this.getCurrentState();
      if (!testState.users || Object.keys(testState.users).length === 0) {
        throw new Error('No data available to sync. Please ensure you have data before enabling sync.');
      }
      
      // Check if already enabled
      if (this.syncEnabled && this.syncId) {
        const existingPhrase = await encryptionService.getStoredRecoveryPhrase(this.syncId);
        if (existingPhrase) {
          return {
            syncId: this.syncId,
            recoveryPhrase: existingPhrase
          };
        }
      }
      
      // Generate recovery phrase if not provided
      if (!recoveryPhrase) {
        recoveryPhrase = encryptionService.generateRecoveryPhrase();
      }
      
      // Store in memory for this session
      this.currentRecoveryPhrase = recoveryPhrase;
      
      this.syncId = await this.generateSyncId(recoveryPhrase);
      this.deviceId = await encryptionService.getDeviceId();
      
      // Initialize encryption service with the recovery phrase
      await encryptionService.initialize(recoveryPhrase, this.syncId);
      
      // CRITICAL: Also store the recovery phrase directly to ensure it's available
      // Store in multiple locations to ensure retrieval works
      try {
        await AsyncStorage.setItem(`@sync_phrase_${this.syncId}`, recoveryPhrase);
        await AsyncStorage.setItem('@sync_phrase', recoveryPhrase);
        await AsyncStorage.setItem('@last_sync_id', this.syncId);
        
        // Verify it was actually stored
        const verify = await AsyncStorage.getItem(`@sync_phrase_${this.syncId}`);
        if (!verify) {
          throw new Error('Recovery phrase storage verification failed');
        }
      } catch (storageError) {
        // If storage fails, at least return the phrase so user can copy it
        console.error('Failed to store recovery phrase:', storageError);
        // Continue anyway - the phrase is still valid even if not stored
      }
      
      
      // Try to pull existing data
      let existingRecords = null;
      try {
        const pullResponse = await fetch(
          `${getApiBaseUrl()}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=0`
        );
        if (pullResponse.ok) {
          const pullData = await pullResponse.json();
          existingRecords = pullData.records;
          this.serverTimeOffset = pullData.server_time - Date.now();
        }
      } catch (pullError) {
        console.warn('[SyncTS] Pull during enable failed:', pullError.message);
      }
      
      if (!existingRecords || existingRecords.length === 0) {
        // New sync group - create it
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(recoveryPhrase, this.syncId, fixedSalt);
        await this.createSyncGroup();
      } else {
        // Existing sync group - join it properly
        console.log('[SyncTS] Joining existing sync group');
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(recoveryPhrase, this.syncId, fixedSalt);
        
        // Call join endpoint to register device
        const joinResponse = await fetch(`${getApiBaseUrl()}/join_timestamp.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sync_id: this.syncId,
            device_id: this.deviceId
          })
        });
        
        if (!joinResponse.ok) {
          const error = await joinResponse.json();
          throw new Error(error.error || 'Failed to join sync group');
        }
        
        const joinData = await joinResponse.json();
        
        // Set protection flags
        this._justJoinedSync = true;
        this._joinedAt = Date.now();
        this._applyingRemoteState = true;
        
        console.log('[SyncTS] Join protection active for', joinData.protection_seconds || 60, 'seconds');
        
        // Apply the latest record's data from join response
        const latestRecord = joinData.latest_record;
        const decryptedData = encryptionService.decryptData(latestRecord.encrypted_blob);
        
        // Clear local state completely before applying remote
        useUserStore.getState().setUsers({});
        useUserStore.getState().setCurrentUser(null);
        useLibraryStore.getState().setLibrary({});
        useSettingsStore.getState().updateSettings({ selectedCategories: [] });
        
        await this.applyState(decryptedData, true);
        
        this._applyingRemoteState = false;
        this.lastSyncTimestamp = latestRecord.timestamp;
        
        // Update server time offset
        if (joinData.server_time) {
          this.serverTimeOffset = joinData.server_time - Date.now();
        }
        
        // Keep protection active for the specified time
        const protectionTime = (joinData.protection_seconds || 60) * 1000 + 1000; // Add 1s buffer
        setTimeout(() => {
          console.log('[SyncTS] Clearing join protection');
          this._justJoinedSync = false;
        }, protectionTime);
      }

      // Save state
      await AsyncStorage.multiSet([
        ['@sync_enabled', 'true'],
        ['@sync_id', this.syncId],
        ['@sync_timestamp', this.lastSyncTimestamp.toString()]
      ]);

      this.syncEnabled = true;
      this.startSyncTimer();
      
      const isNewSync = !existingRecords || existingRecords.length === 0;
      return {
        syncId: this.syncId,
        recoveryPhrase: recoveryPhrase,
        isNewSync: isNewSync
      };
    } catch (error) {
      console.error('[SyncTS] Enable failed:', error);
      throw error;
    }
  }

  /**
   * Create new sync (API compatibility with V2)
   */
  async create() {
    // Disable any existing sync first
    if (this.syncEnabled) {
      await this.disable();
    }
    
    // Generate new recovery phrase and enable
    const recoveryPhrase = encryptionService.generateRecoveryPhrase();
    return this.enable(recoveryPhrase);
  }

  /**
   * Create a new sync group
   */
  async createSyncGroup() {
    const currentState = this.getCurrentState();
    const timestamp = Date.now();
    
    const encryptedBlob = encryptionService.encryptData(currentState);
    
    const response = await fetch(`${getApiBaseUrl()}/create_timestamp.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: this.syncId,
        encrypted_blob: encryptedBlob,
        device_id: this.deviceId,
        timestamp: timestamp
      })
    });

    if (!response.ok) {
      throw new Error(`Create failed: ${response.status}`);
    }

    const result = await response.json();
    this.lastSyncTimestamp = timestamp;
    this.serverTimeOffset = result.server_timestamp - Date.now();
    
    return result;
  }

  /**
   * Perform sync operation
   */
  async performSync() {
    // Check protection flags with proper error status
    if (this._justJoinedSync) {
      const elapsed = Date.now() - this._joinedAt;
      if (elapsed < this.JOIN_PROTECTION_TIME) {
        const secondsRemaining = Math.ceil((this.JOIN_PROTECTION_TIME - elapsed) / 1000);
        console.log(`[SyncTS] Sync blocked - wait ${secondsRemaining}s after joining`);
        this.updateSyncStatus('blocked', `Wait ${secondsRemaining}s after joining`);
        return { success: false, blocked: true, waitTime: secondsRemaining };
      }
      // Protection period has passed
      this._justJoinedSync = false;
    }
    
    if (this._applyingRemoteState) {
      console.log('[SyncTS] Skipping sync - applying remote state');
      return { success: false, blocked: true, message: 'Applying remote state' };
    }
    
    if (!this.syncEnabled || !this.syncId) {
      return { success: false, error: 'Sync not enabled' };
    }
    
    if (this.syncInProgress) {
      return { success: false, inProgress: true };
    }

    if (!encryptionService.masterKey) {
      console.warn('[SyncTS] Skipping sync - encryption not initialized');
      return { success: false, error: 'Encryption not initialized' };
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();
    
    try {
      this.updateSyncStatus('syncing');
      
      // Get current local state
      const localState = this.getCurrentState();
      
      // Safety check - don't sync empty state
      if (!localState.users || Object.keys(localState.users).length === 0) {
        console.error('[SyncTS] Refusing to sync - no users in local state');
        this.syncInProgress = false;
        return;
      }
      
      // Pull newer records from server
      const pullResponse = await fetch(
        `${getApiBaseUrl()}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=${this.lastSyncTimestamp}`
      );
      
      if (!pullResponse.ok) {
        if (pullResponse.status === 429) {
          const errorData = await pullResponse.json();
          const waitTime = errorData.seconds_remaining || 60;
          console.log(`[SyncTS] Rate limited - wait ${waitTime}s`);
          this.updateSyncStatus('blocked', `Rate limited - wait ${waitTime}s`);
          this.syncInProgress = false;
          return { success: false, blocked: true, waitTime: waitTime };
        }
        throw new Error(`Pull failed: ${pullResponse.status}`);
      }
      
      const pullData = await pullResponse.json();
      const remoteRecords = pullData.records || [];
      
      // Update clock skew detection
      if (pullData.server_time) {
        this.serverTimeOffset = pullData.server_time - Date.now();
        if (Math.abs(this.serverTimeOffset) > 300000) { // 5 minutes
          console.warn('[SyncTS] Large clock skew detected:', this.serverTimeOffset, 'ms');
        }
      }
      
      // If we have remote records, merge them
      let stateToSync = localState;
      let stateChanged = false;
      
      if (remoteRecords.length > 0) {
        console.log('[SyncTS] Merging', remoteRecords.length, 'remote records');
        
        // Keep original state for comparison
        const originalState = JSON.parse(JSON.stringify(localState));
        
        // Merge all remote records into local state
        for (const record of remoteRecords) {
          const decryptedRemote = encryptionService.decryptData(record.encrypted_blob);
          const normalizedRemote = normalizeSyncData(decryptedRemote);
          
          // Use timestamp-based merge
          stateToSync = this.mergeStatesByTimestamp(
            stateToSync, 
            normalizedRemote,
            record.timestamp,
            record.device_id
          );
          
          // Track latest timestamp
          if (record.timestamp > this.lastSyncTimestamp) {
            this.lastSyncTimestamp = record.timestamp;
          }
        }
        
        // Check if merge actually changed anything
        stateChanged = this.statesAreDifferent(originalState, stateToSync);
        
        if (stateChanged) {
          console.log('[SyncTS] Merge resulted in changes, applying to stores');
          // Apply merged state to stores
          await this.applyState(stateToSync);
        } else {
          console.log('[SyncTS] Merge resulted in no changes, skipping store update');
        }
      }
      
      // Check if local state has changes newer than last sync
      const localTimestamp = this.getLatestLocalTimestamp(localState);
      const hasNewLocalChanges = localTimestamp > this.lastSyncTimestamp;
      
      // Only push if we have actual changes
      if (hasNewLocalChanges || stateChanged) {
        console.log('[SyncTS] Pushing changes - hasNewLocal:', hasNewLocalChanges, 'stateChanged:', stateChanged);
        // Use server timestamp if available, fallback to client timestamp
        const pushTimestamp = pullData.server_time || Date.now();
        const pushResult = await this.push(stateToSync, pushTimestamp);
        if (pushResult && pushResult.server_time) {
          // Update our timestamp to match server
          this.lastSyncTimestamp = pushResult.server_time;
        } else {
          this.lastSyncTimestamp = pushTimestamp;
        }
      } else {
        console.log('[SyncTS] No changes to push');
      }
      
      // Save last sync timestamp
      await AsyncStorage.setItem('@sync_timestamp', this.lastSyncTimestamp.toString());
      
      this.lastSyncSuccess = Date.now();
      this.updateSyncStatus('success');
      this.syncInProgress = false;
      return { success: true };
      
    } catch (error) {
      this.syncInProgress = false;
      this.updateSyncStatus('error', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Compare two states to detect if they're meaningfully different
   */
  statesAreDifferent(state1, state2) {
    try {
      // Quick check - if one is null/undefined and other isn't
      if (!state1 || !state2) return state1 !== state2;
      
      // Compare JSON strings of normalized states
      // This handles object property order differences
      const json1 = JSON.stringify(this.normalizeForComparison(state1));
      const json2 = JSON.stringify(this.normalizeForComparison(state2));
      
      return json1 !== json2;
    } catch (error) {
      console.error('[SyncTS] Error comparing states:', error);
      // If comparison fails, assume they're different to be safe
      return true;
    }
  }
  
  /**
   * Normalize state for comparison (sort arrays, normalize data)
   */
  normalizeForComparison(state) {
    if (!state) return state;
    
    const normalized = JSON.parse(JSON.stringify(state)); // Deep clone
    
    // Sort users by ID for consistent comparison
    if (normalized.users) {
      const sortedUsers = {};
      Object.keys(normalized.users).sort().forEach(userId => {
        sortedUsers[userId] = normalized.users[userId];
      });
      normalized.users = sortedUsers;
    }
    
    // Sort library items by text for consistent comparison
    if (normalized.library?.items) {
      normalized.library.items = [...normalized.library.items].sort((a, b) => 
        (a.text || '').localeCompare(b.text || '')
      );
    }
    
    return normalized;
  }

  /**
   * Push state to server with timestamp
   */
  async push(state, timestamp) {
    // Protection check
    if (this._justJoinedSync || (this._joinedAt && Date.now() - this._joinedAt < this.JOIN_PROTECTION_TIME)) {
      console.log('[SYNC_FIX_VERIFICATION] Push blocked - protection working correctly');
      return;
    }
    
    // Safety checks
    if (this._applyingRemoteState) {
      console.warn('[SyncTS] Refusing to push - applying remote state');
      return;
    }
    
    const activityCount = Object.values(state.users || {}).reduce((sum, user) => 
      sum + Object.values(user.days || {}).reduce((daySum, day) => 
        daySum + (day.activities?.length || 0), 0), 0);
    
    if (activityCount === 0) {
      console.warn('[SyncTS] Refusing to push - no activities');
      return;
    }
    
    const encrypted = encryptionService.encryptData(state);
    
    const response = await fetch(`${getApiBaseUrl()}/push_timestamp.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: this.syncId,
        encrypted_blob: encrypted,
        device_id: this.deviceId,
        timestamp: timestamp
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        const errorData = await response.json();
        const waitTime = errorData.seconds_remaining || 60;
        console.log(`[SyncTS] Push blocked by server - wait ${waitTime}s`);
        this.updateSyncStatus('blocked', `New device protection - wait ${waitTime}s`);
        return { success: false, blocked: true, waitTime: waitTime };
      }
      const error = await response.json();
      throw new Error(error.error || `Push failed: ${response.status}`);
    }

    const result = await response.json();
    // Store server time if provided
    if (result.server_time) {
      this.serverTimeOffset = result.server_time - Date.now();
    }
    return result;
  }

  /**
   * Pull latest data from server for preview or import
   */
  async pullData() {
    if (!this.syncId) {
      console.warn('[SyncTS] pullData called without syncId');
      return null;
    }
    
    try {
      const deviceId = await this.getDeviceId();
      const pullResponse = await fetch(
        `${getApiBaseUrl()}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${deviceId}&since=0`
      );
      
      if (!pullResponse.ok) {
        if (pullResponse.status === 404) {
          return null; // Sync group doesn't exist yet, which is valid for previews
        }
        const errorText = await pullResponse.text();
        throw new Error(`Pull failed: ${pullResponse.status} - ${errorText}`);
      }
      
      const pullData = await pullResponse.json();
      
      // The onboarding screen expects an object with an encrypted_blob property from the latest record.
      if (pullData.records && pullData.records.length > 0) {
        return {
          encrypted_blob: pullData.records[pullData.records.length - 1].encrypted_blob,
          records: pullData.records
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('[SyncTS] pullData failed:', error);
      // Return null to prevent crashing the app on network errors during onboarding
      return null;
    }
  }

  /**
   * Merge states using timestamp-based Last-Write-Wins
   */
  mergeStatesByTimestamp(localState, remoteState, remoteTimestamp, remoteDeviceId) {
    // For now, simple last-write-wins for entire state
    // TODO: Implement field-level timestamp tracking
    const localTimestamp = this.getLatestLocalTimestamp(localState);
    
    if (remoteTimestamp > localTimestamp) {
      console.log('[SyncTS] Remote is newer, taking remote state');
      return remoteState;
    } else if (localTimestamp > remoteTimestamp) {
      console.log('[SyncTS] Local is newer, keeping local state');
      return localState;
    } else {
      // Same timestamp - use device ID as tiebreaker
      if (remoteDeviceId > this.deviceId) {
        return remoteState;
      } else {
        return localState;
      }
    }
  }

  /**
   * Get latest modification timestamp from state
   */
  getLatestLocalTimestamp(state) {
    // TODO: Track actual modification timestamps per field
    // For now, use current time if we have local changes
    return Date.now();
  }

  /**
   * Start periodic sync timer
   */
  startSyncTimer() {
    this.stopSyncTimer();
    this.syncTimer = setInterval(() => {
      if (!this._justJoinedSync) {
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
   * Check if sync is enabled (for API compatibility)
   */
  isEnabled() {
    return this.syncEnabled;
  }

  /**
   * Initialize for import (for API compatibility)
   */
  async initializeForImport(recoveryPhrase) {
    console.log('[SyncTS] Initializing for import');
    this.syncId = await this.generateSyncId(recoveryPhrase);
    this.deviceId = await this.getDeviceId();
    return true;
  }

  /**
   * Check if auto-update shares is enabled (stub for API compatibility)
   */
  hasAutoUpdateShares() {
    return false;
  }

  /**
   * Update active shares (stub for API compatibility)
   */
  updateActiveShares() {
    console.log('[SyncTS] updateActiveShares not implemented in timestamp version');
    return Promise.resolve();
  }

  /**
   * Generate share token (stub for API compatibility)
   */
  generateShareToken(isReadOnly = false) {
    console.log('[SyncTS] generateShareToken not implemented in timestamp version');
    // Return a dummy token for now
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create share link (stub for API compatibility)
   */
  async createShareLink(userId, options = {}) {
    console.log('[SyncTS] createShareLink not implemented in timestamp version');
    return {
      shareUrl: `https://stackmap.app/share/${this.generateShareToken(true)}`,
      token: this.generateShareToken(true),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  /**
   * Request sync (debounced)
   */
  requestSync(options = {}) {
    if (!this.syncEnabled) {
      return Promise.resolve();
    }
    
    if (this._justJoinedSync) {
      console.log('[SyncTS] Ignoring sync request - just joined');
      return Promise.resolve();
    }
    
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    
    this.syncDebounceTimer = setTimeout(() => {
      this.performSync().catch(error => {
        console.error('[SyncTS] Sync failed:', error);
      });
    }, this.DEBOUNCE_DELAY);
    
    return Promise.resolve();
  }

  /**
   * Disable sync
   */
  async disable() {
    this.syncEnabled = false;
    this.stopSyncTimer();
    
    await AsyncStorage.multiRemove([
      '@sync_enabled',
      '@sync_id',
      '@sync_timestamp'
    ]);
    
    this.syncId = null;
    this.lastSyncTimestamp = 0;
    
    eventLogger.logSync('DISABLED', {});
  }

  /**
   * Get current state from stores
   */
  getCurrentState() {
    const userStore = useUserStore.getState();
    const settingsStore = useSettingsStore.getState();
    const libraryStore = useLibraryStore.getState();
    
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
  async applyState(state, skipMerge = false) {
    
    const migratedState = await dataMigrator.checkAndMigrate(state, this.deviceId);
    
    useUserStore.getState().setUsers(migratedState.users || {});
    useUserStore.getState().setCurrentUser(migratedState.currentUser);
    useUserStore.getState().setCurrentDay(migratedState.currentDay || 'today');
    
    if (migratedState.library) {
      useLibraryStore.getState().setLibrary(migratedState.library);
    }
    
    if (migratedState.globalSettings) {
      const settings = migratedState.globalSettings;
      const settingsStore = useSettingsStore.getState();
      settingsStore.updateSettings({
        currentTheme: settings.currentTheme || settingsStore.currentTheme,
        bannerPosition: settings.bannerPosition || settingsStore.bannerPosition,
        soundEnabled: settings.soundEnabled !== undefined ? settings.soundEnabled : settingsStore.soundEnabled,
        taskCelebration: settings.taskCelebration !== undefined ? settings.taskCelebration : settingsStore.taskCelebration,
        routineCelebration: settings.routineCelebration !== undefined ? settings.routineCelebration : settingsStore.routineCelebration
      });
    }
  }

  /**
   * Update sync status for UI
   */
  updateSyncStatus(status, error = null) {
    this.syncStatus = status;
    this.syncError = error;
    
    this.statusListeners.forEach(listener => {
      listener({ status, error });
    });
  }

  /**
   * Add status listener
   */
  addStatusListener(listener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
  
  /**
   * Get current sync ID
   */
  async getSyncId() {
    return this.syncId;
  }
  
  /**
   * Verify sync exists on server
   */
  async verifySyncExists() {
    if (!this.syncId) return false;
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/verify_timestamp.php?sync_id=${this.syncId}`
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data.exists;
    } catch {
      return false;
    }
  }
  
  /**
   * Perform manual sync
   */
  async performManualSync() {
    return this.performSync();
  }
  
  /**
   * Delete sync from server (stub)
   */
  async deleteFromServer() {
    // Not implemented for timestamp service
    console.warn('[SyncTS] deleteFromServer not implemented');
    return false;
  }
  
  /**
   * Get active shares (stub)
   */
  async getActiveShares() {
    // Not implemented for timestamp service
    return [];
  }
  
  /**
   * Delete share (stub)
   */
  async deleteShare(shareId) {
    // Not implemented for timestamp service
    console.warn('[SyncTS] deleteShare not implemented');
    return false;
  }
  
  /**
   * Get recovery phrase if available
   */
  async getRecoveryPhrase() {
    // First, check if we have it in memory from current session
    if (this.currentRecoveryPhrase) {
      return this.currentRecoveryPhrase;
    }
    
    if (!this.syncId) {
      return null;
    }
    
    try {
      // Try to get from storage
      const phrase = await encryptionService.getStoredRecoveryPhrase(this.syncId);
      
      if (!phrase) {
        // Try alternative storage locations as fallback
        const alternativeKeys = [
          `@sync_phrase_${this.syncId}`,
          `@sync_phrase`,
          `recovery_phrase_${this.syncId}`,
          `recovery_phrase`
        ];
        
        for (const key of alternativeKeys) {
          const altPhrase = await AsyncStorage.getItem(key);
          if (altPhrase) {
            // Store in memory for this session
            this.currentRecoveryPhrase = altPhrase;
            return altPhrase;
          }
        }
      } else {
        // Store in memory for this session
        this.currentRecoveryPhrase = phrase;
      }
      
      return phrase;
    } catch (error) {
      return null;
    }
  }
}

// Export singleton instance
const syncServiceTimestamp = new SyncServiceTimestamp();
export default syncServiceTimestamp;