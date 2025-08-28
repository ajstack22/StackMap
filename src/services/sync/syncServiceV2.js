/**
 * Simplified Sync Service V2 with CRDT-based conflict resolution
 * Target: ~200 lines of core orchestration logic
 * BUILD CHECK v21 - Protection flags active
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import encryptionService from './encryptionService';
import crdtMerger from './crdtMerger';
import eventLogger from './eventLogger';
import dataMigrator from './dataMigrator';
import { normalizeSyncData } from '../../utils/dataNormalizer';

// Type helpers for tweetnacl-util
const encodeBase64 = (arr) => util.encodeBase64(arr);
const decodeBase64 = (str) => util.decodeBase64(str);
const decodeUTF8 = (str) => util.decodeUTF8(str);

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = () => {
  // Always use full URLs, never relative paths
  const prodUrl = 'https://stackmap.app/api/sync';
  const qualUrl = 'https://stackmap.app/qual/api/sync';
  
  // Development mode for native apps
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return qualUrl;
  }
  
  // Web platform
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return prodUrl;
    }
    // Qual/staging environment
    if (window.location.pathname.startsWith('/qual')) {
      return qualUrl;
    }
    // Production
    return prodUrl;
  }
  
  // Default to production for any other cases
  return prodUrl;
};

// Note: Global protection flags removed in favor of proper instance protection

class SyncServiceV2 {
  constructor() {
    this.syncEnabled = false;
    this.syncId = null;
    this.deviceId = null;
    this.lastVersion = 0;
    this.syncTimer = null;
    this.syncDebounceTimer = null;
    this.syncInProgress = false;
    this.pendingSync = false;
    this._applyingRemoteState = false; // Flag to prevent sync during state application
    
    // Single consistent timing strategy
    this.SYNC_INTERVAL = 30000; // 30 seconds - less aggressive to avoid conflicts
    this.RETRY_DELAYS = [1000, 2000, 4000, 8000]; // Exponential backoff
    this.DEBOUNCE_DELAY = 5000; // 5 seconds after changes before syncing
    
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

      console.log('[SyncV2] Initialize: loaded from AsyncStorage:', {
        enabled,
        syncId,
        version
      });

      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastVersion = parseInt(version, 10) || 0;
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
            if (__DEV__) console.warn('[SyncV2] Sync enabled but recovery phrase not found');
          }
        } catch (encryptError) {
          if (__DEV__) console.error('[SyncV2] Failed to initialize encryption:', encryptError);
          // Don't start sync if encryption fails
        }
      }
    } catch (error) {
      if (__DEV__) console.error('[SyncV2] Initialization failed:', error);
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
    
    console.log('[SyncV2] Generated sync ID:', {
      syncId,
      recoveryPhraseLength: recoveryPhrase.length,
      firstChars: recoveryPhrase.substring(0, 4) + '...' + recoveryPhrase.substring(recoveryPhrase.length - 4)
    });
    
    return syncId;
  }

  /**
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase) {
    try {
      // CRITICAL: Verify we have data before enabling sync
      const testState = this.getCurrentState();
      if (!testState.users || Object.keys(testState.users).length === 0) {
        console.error('[SyncV2] Cannot enable sync - no users in store');
        throw new Error('No data available to sync. Please ensure you have data before enabling sync.');
      }
      
      // Check if sync is already enabled 
      if (this.syncEnabled && this.syncId) {
        console.warn('[SyncV2] Sync already enabled with ID:', this.syncId);
        // Get the existing recovery phrase
        const existingPhrase = await encryptionService.getStoredRecoveryPhrase(this.syncId);
        
        if (existingPhrase) {
          // Verify the phrase generates the correct sync ID
          const generatedId = await this.generateSyncId(existingPhrase);
          if (generatedId !== this.syncId) {
            console.error('[SyncV2] CRITICAL: Stored phrase generates wrong sync ID!', {
              activeId: this.syncId,
              generatedId: generatedId,
              phrasePreview: existingPhrase.substring(0, 4) + '...'
            });
            // The stored phrase is wrong! We need to find the right one or fail
            throw new Error('Sync recovery phrase mismatch - please disable and re-enable sync');
          }
          
          // CRITICAL: Return the existing sync info, don't create a new one!
          console.log('[SyncV2] Returning existing sync info');
          return {
            syncId: this.syncId,
            recoveryPhrase: existingPhrase
          };
        } else {
          console.error('[SyncV2] Sync enabled but no recovery phrase found!');
          throw new Error('Sync recovery phrase not found - please disable and re-enable sync');
        }
      }
      
      // Generate recovery phrase if not provided
      if (!recoveryPhrase) {
        console.log('[SyncV2] Generating new recovery phrase');
        recoveryPhrase = encryptionService.generateRecoveryPhrase();
      }
      
      // Only generate sync ID if we don't already have one
      // This allows create() to pre-set the sync ID to ensure consistency
      if (!this.syncId) {
        this.syncId = await this.generateSyncId(recoveryPhrase);
      }
      this.deviceId = await encryptionService.getDeviceId();
      
      // Check if sync group exists
      let existingData = null;
      try {
        existingData = await this.pull();
      } catch (pullError) {
        // Log the error but continue - might be a new sync or temporary issue
        if (__DEV__) console.warn('[SyncV2] Pull during enable failed:', pullError.message);
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
        console.log('[SyncV2] Joining existing sync group');
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(
          recoveryPhrase,
          this.syncId,
          fixedSalt
        );
        
        // Verify we can decrypt
        const decryptedData = encryptionService.decryptData(existingData.encrypted_blob);
        console.log('[SyncV2] Decrypted remote data:', {
          userCount: Object.keys(decryptedData.users || {}).length,
          version: existingData.version,
          currentUser: decryptedData.currentUser
        });
        
        // Apply remote data if it has content
        if (decryptedData.users && Object.keys(decryptedData.users).length > 0) {
          console.log('[SyncV2] Joining existing sync - will replace local state with remote');
          
          // CRITICAL: Set flags BEFORE applying state to prevent race conditions
          // These flags must be active when store listeners fire
          this._justJoinedSync = true;
          this._joinedAt = Date.now();
          this._applyingRemoteState = true;
          
          // Log protection activation for verification
          console.log('[SYNC_FIX_VERIFICATION] Protection active:', {
            justJoined: this._justJoinedSync,
            joinedAt: this._joinedAt,
            willBlockFor: '61 seconds'
          });
          
          // Temporarily disable sync to prevent any sync operations
          const wasSyncEnabled = this.syncEnabled;
          this.syncEnabled = false;
          console.log('[SyncV2] Disabled sync temporarily during join');
          
          // Clear local state completely before applying remote
          const { useUserStore, useLibraryStore } = require('../../stores');
          console.log('[SyncV2] Clearing local state before applying remote');
          useUserStore.getState().setUsers({});
          useUserStore.getState().setCurrentUser(null);
          useLibraryStore.getState().setLibrary({});
          
          // Now apply the remote state cleanly - NO MERGE, just direct replacement
          console.log('[SyncV2] Applying remote state (direct replacement, no merge)');
          await this.applyState(decryptedData, true); // true = skip merge, direct apply
          
          // Clear the applying flag
          this._applyingRemoteState = false;
          
          // Re-enable sync after a short delay
          setTimeout(() => {
            this.syncEnabled = wasSyncEnabled;
            console.log('[SyncV2] Re-enabled sync after join');
          }, 1000); // 1 second delay to let state settle
          
          // Keep the join flag active for 61 seconds (redundant with server protection)
          setTimeout(() => {
            console.log('[SyncV2] Clearing _justJoinedSync flag after 61 seconds');
            this._justJoinedSync = false;
          }, 61000); // 61 seconds to match server protection + 1 second buffer
        }
        
        this.lastVersion = existingData.version;
        console.log('[SyncV2] Joined existing sync with version:', this.lastVersion);
      }

      // Save state - use original keys for compatibility
      console.log('[SyncV2] Saving sync state to AsyncStorage:', {
        syncId: this.syncId,
        enabled: true,
        version: this.lastVersion
      });
      
      await AsyncStorage.multiSet([
        ['@sync_enabled', 'true'],
        ['@sync_id', this.syncId],
        ['@sync_version', this.lastVersion.toString()]
      ]);

      this.syncEnabled = true;
      
      eventLogger.logSync('ENABLED', { syncId: this.syncId });
      
      // Start sync timer
      this.startSyncTimer();
      
      // NOTE: Recovery phrase is already stored by encryptionService.initialize()
      // No need to store it again here
      
      // Verify it was stored correctly
      const verifyStored = await encryptionService.getStoredRecoveryPhrase(this.syncId);
      if (verifyStored !== recoveryPhrase) {
        console.error('[SyncV2] CRITICAL: Recovery phrase storage verification failed!', {
          original: recoveryPhrase,
          retrieved: verifyStored,
          match: verifyStored === recoveryPhrase
        });
      } else {
        console.log('[SyncV2] Recovery phrase storage verified successfully');
      }
      
      // Return object with sync info (matching original sync service)
      return {
        syncId: this.syncId,
        recoveryPhrase: recoveryPhrase
      };
    } catch (error) {
      if (__DEV__) console.error('[SyncV2] Enable failed:', error);
      throw error;
    }
  }

  /**
   * Disable sync
   */
  async disable() {
    this.syncEnabled = false;
    this.stopSyncTimer();
    
    // Clear any pending sync debounce
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
    
    // Get the sync ID before clearing it
    const syncIdToRemove = this.syncId || await AsyncStorage.getItem('@sync_id');
    
    // Clear all sync-related data including the sync ID
    const keysToRemove = [
      '@sync_enabled',
      '@sync_version',
      '@sync_id'  // CRITICAL: Must remove sync_id when disabling
    ];
    
    // Also remove the recovery phrase for this sync ID
    if (syncIdToRemove) {
      keysToRemove.push(`@sync_phrase_${syncIdToRemove}`);
    }
    
    await AsyncStorage.multiRemove(keysToRemove);
    
    // Clear in-memory state
    this.syncId = null;
    
    eventLogger.logSync('DISABLED', {});
  }

  /**
   * Start sync timer
   */
  startSyncTimer() {
    this.stopSyncTimer();
    console.log('[SyncV2] Starting sync timer with interval:', this.SYNC_INTERVAL);
    this.syncTimer = setInterval(() => {
      // Skip periodic sync if we just joined
      if (this._justJoinedSync) {
        console.log('[SyncV2] Skipping periodic sync - just joined sync group');
        return;
      }
      console.log('[SyncV2] Periodic sync timer fired');
      // Always perform sync to pull updates, not just when we have pending changes
      // This ensures all devices get updates even if they haven't made changes
      this.performSync();
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
   * @param {Object} options - Optional sync options (for compatibility with hook)
   */
  requestSync(options = {}) {
    if (!this.syncEnabled) {
      // Return resolved promise for compatibility with callers expecting a Promise
      return Promise.resolve();
    }
    
    // CRITICAL: Don't allow sync requests if we just joined
    if (this._justJoinedSync) {
      console.log('[SyncV2] Ignoring sync request - just joined sync group');
      return Promise.resolve();
    }
    
    console.log('[SyncV2] Sync requested - will sync after debounce delay');
    eventLogger.logSync('REQUESTED', {});
    
    // Clear any existing debounce timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    
    // Debounce sync requests (wait for changes to settle)
    // This prevents excessive syncing during rapid edits and ensures
    // local changes are fully saved before syncing
    this.syncDebounceTimer = setTimeout(() => {
      console.log('[SyncV2] Debounce timer fired - performing sync now');
      this.performSync().catch(error => {
        if (__DEV__) console.error('[SyncV2] Sync failed:', error);
      });
    }, this.DEBOUNCE_DELAY);
    
    // Return resolved promise since sync happens asynchronously
    return Promise.resolve();
  }

  /**
   * Perform sync operation
   */
  async performSync(retryCount = 0) {
    // CRITICAL: Check flags FIRST before any logging or operations
    if (this._justJoinedSync || this._applyingRemoteState) {
      const timeSinceJoin = this._joinedAt ? Date.now() - this._joinedAt : 0;
      console.log('[SyncV2] Skipping sync - flags active', {
        justJoined: this._justJoinedSync,
        applyingRemote: this._applyingRemoteState,
        timeSinceJoin
      });
      return;
    }
    
    console.log('[SyncV2] performSync called', {
      syncEnabled: this.syncEnabled,
      syncId: this.syncId,
      syncInProgress: this.syncInProgress
    });
    
    if (!this.syncEnabled || !this.syncId || this.syncInProgress) {
      console.log('[SyncV2] Skipping sync - not ready', {
        syncEnabled: this.syncEnabled,
        hasSyncId: !!this.syncId,
        syncInProgress: this.syncInProgress
      });
      return;
    }

    // Check if encryption is initialized
    if (!encryptionService.masterKey) {
      console.warn('[SyncV2] Skipping sync - encryption not initialized');
      return;
    }

    // CRITICAL: Don't sync if there's a pending debounced sync
    // This prevents the periodic sync from interfering with user changes
    if (this.syncDebounceTimer) {
      console.log('[SyncV2] Skipping periodic sync - pending changes being debounced');
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
      console.log('[SyncV2] performSync - Local state:', {
        userCount: Object.keys(localState.users || {}).length,
        currentUser: localState.currentUser,
        hasLibrary: !!localState.library,
        firstActivity: localState.users?.[localState.currentUser]?.days?.today?.activities?.[0]?.text
      });
      
      // CRITICAL SAFETY CHECK: Never push empty state
      // This can happen due to race conditions during initialization
      if (!localState.users || Object.keys(localState.users).length === 0) {
        console.error('[SyncV2] SAFETY: Refusing to sync - no users in local state');
        this.syncInProgress = false;
        this.updateSyncStatus('error', 'No data to sync');
        return;
      }
      
      // Pull remote data
      const remoteData = await this.pull();
      
      console.log('[SyncV2] Sync comparison:', {
        localVersion: this.lastVersion,
        remoteVersion: remoteData?.version,
        willMerge: remoteData && remoteData.version > this.lastVersion
      });
      
      // Version corruption detection - prevent massive version jumps
      if (remoteData && Math.abs(this.lastVersion - remoteData.version) > 10) {
        console.error('[Sync] Version corruption detected', {
          local: this.lastVersion,
          server: remoteData.version,
          difference: Math.abs(this.lastVersion - remoteData.version)
        });
        // Force fresh pull and apply remote state
        const decryptedRemote = encryptionService.decryptData(remoteData.encrypted_blob);
        const normalizedRemote = normalizeSyncData(decryptedRemote);
        await this.applyState(normalizedRemote);
        this.lastVersion = remoteData.version;
        await AsyncStorage.setItem('@sync_version', remoteData.version.toString());
        this.syncInProgress = false;
        return;
      }
      
      let stateToSync;
      
      if (remoteData && remoteData.version > this.lastVersion) {
        // Remote is newer - merge with CRDT
        console.log('[SyncV2] Remote is newer, will merge:', {
          localVersion: this.lastVersion,
          remoteVersion: remoteData.version
        });
        eventLogger.logSync('MERGING', { 
          localVersion: this.lastVersion,
          remoteVersion: remoteData.version 
        });
        
        const decryptedRemote = encryptionService.decryptData(remoteData.encrypted_blob);
        const normalizedRemote = normalizeSyncData(decryptedRemote);
        
        // CRITICAL: Log what we're about to merge
        console.log('[SyncV2] Pre-merge state comparison:', {
          local: {
            userCount: Object.keys(localState.users || {}).length,
            currentUser: localState.currentUser,
            activities: localState.users?.[localState.currentUser]?.days?.today?.activities?.length || 0,
            firstActivity: localState.users?.[localState.currentUser]?.days?.today?.activities?.[0]?.text
          },
          remote: {
            userCount: Object.keys(normalizedRemote.users || {}).length,
            currentUser: normalizedRemote.currentUser,
            activities: normalizedRemote.users?.[normalizedRemote.currentUser]?.days?.today?.activities?.length || 0,
            firstActivity: normalizedRemote.users?.[normalizedRemote.currentUser]?.days?.today?.activities?.[0]?.text
          }
        });
        
        // Use CRDT merger for conflict-free merge
        stateToSync = crdtMerger.mergeStates(localState, normalizedRemote, this.deviceId);
        
        // Log merge result
        console.log('[SyncV2] Post-merge result:', {
          userCount: Object.keys(stateToSync.users || {}).length,
          activities: stateToSync.users?.[stateToSync.currentUser]?.days?.today?.activities?.length || 0,
          firstActivity: stateToSync.users?.[stateToSync.currentUser]?.days?.today?.activities?.[0]?.text
        });
        
        // CRITICAL SAFETY CHECK: Never apply empty state that would delete all data
        if (!stateToSync.users || Object.keys(stateToSync.users).length === 0) {
          console.error('[SyncV2] CRITICAL: Merge resulted in empty state! Keeping local data');
          console.error('[SyncV2] Debug info:', {
            localUserCount: Object.keys(localState.users || {}).length,
            remoteUserCount: Object.keys(normalizedRemote.users || {}).length,
            mergedUserCount: Object.keys(stateToSync.users || {}).length
          });
          // Keep local state instead of applying empty merge
          stateToSync = localState;
        } else if (stateToSync.users?.[stateToSync.currentUser]?.days?.today?.activities?.length === 0 &&
                   localState.users?.[localState.currentUser]?.days?.today?.activities?.length > 0) {
          // CRITICAL: Don't wipe out activities
          console.error('[SyncV2] CRITICAL: Merge would delete all activities! Keeping local data');
          stateToSync = localState;
        } else {
          // Only apply if we have valid data
          console.log('[SyncV2] Applying merged state to stores');
          await this.applyState(stateToSync);
        }
      } else {
        // Local is newer or same - use local
        console.log('[SyncV2] Local is newer or same version, using local state');
        stateToSync = localState;
      }
      
      // Push merged state
      console.log('[SyncV2] Pushing state to server with activities:', {
        activityCount: stateToSync.users?.[stateToSync.currentUser]?.days?.today?.activities?.length || 0,
        firstActivity: stateToSync.users?.[stateToSync.currentUser]?.days?.today?.activities?.[0]?.text
      });
      const newVersion = await this.push(stateToSync);
      console.log('[SyncV2] Push successful, new version:', newVersion);
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
    
    // CRITICAL: Don't create sync with empty data
    if (!currentState.users || Object.keys(currentState.users).length === 0) {
      console.error('[SyncV2] ERROR: Cannot create sync group with no users');
      throw new Error('No data available to sync. Please ensure you have created at least one user before enabling sync.');
    }
    
    // Debug log to see what data we're syncing
    if (__DEV__) console.log('[SyncV2] Creating sync group with state:', {
      userCount: Object.keys(currentState.users || {}).length,
      userIds: Object.keys(currentState.users || {}),
      hasLibrary: !!currentState.library,
      currentUser: currentState.currentUser
    });
    
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
      
      console.log('[SyncV2] Pull request:', {
        syncId: this.syncId,
        deviceId: this.deviceId,
        currentVersion: this.lastVersion || 0,
        url: url.includes('qual') ? 'QUAL' : 'PROD'
      });
      
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
          if (__DEV__) console.error('[SyncV2] Pull got 400 error:', errorText, 'for syncId:', this.syncId);
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
    // CRITICAL: Block push for 61 seconds after joining (redundant with server protection)
    if (this._justJoinedSync || (this._joinedAt && Date.now() - this._joinedAt < 61000)) {
      console.log('[SYNC_FIX_VERIFICATION] Push blocked - protection working correctly', {
        justJoined: this._justJoinedSync,
        timeSinceJoin: this._joinedAt ? Date.now() - this._joinedAt : 0,
        requiredWait: 61000
      });
      return this.lastVersion; // Return current version without pushing
    }
    
    // SAFETY CHECK: Don't push if applying remote state
    if (this._applyingRemoteState) {
      console.warn('[SyncV2] Refusing to push - currently applying remote state');
      return this.lastVersion;
    }
    
    // SAFETY CHECK: Don't push empty state
    const activityCount = Object.values(state.users || {}).reduce((sum, user) => 
      sum + Object.values(user.days || {}).reduce((daySum, day) => 
        daySum + (day.activities?.length || 0), 0), 0);
    
    if (activityCount === 0) {
      console.warn('[SyncV2] Refusing to push - no activities in state');
      return this.lastVersion; // Return current version without pushing
    }
    
    // SAFETY CHECK: Detect starter data patterns
    const allActivities = [];
    Object.values(state.users || {}).forEach(user => {
      Object.values(user.days || {}).forEach(day => {
        if (day.activities) allActivities.push(...day.activities);
      });
    });
    
    // Check for known starter card patterns
    const starterTexts = ['Welcome to StackMap! 🎉', 'Tap cards to complete', 'Long press to edit', 'Swipe down for more'];
    const hasOnlyStarterCards = allActivities.length > 0 && 
      allActivities.every(activity => 
        starterTexts.includes(activity.text) || 
        starterTexts.includes(activity.name) ||
        starterTexts.includes(activity.title)
      );
    
    if (hasOnlyStarterCards) {
      console.warn('[SyncV2] Refusing to push - detected starter cards only');
      return this.lastVersion;
    }
    
    const encrypted = encryptionService.encryptData(state);
    
    console.log('[SyncV2] Push request:', {
      syncId: this.syncId,
      deviceId: this.deviceId,
      version: this.lastVersion + 1,
      hasData: !!state.users && Object.keys(state.users).length > 0,
      activityCount,
      url: getApiBaseUrl().includes('qual') ? 'QUAL' : 'PROD'
    });
    
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
    const { useUserStore, useSettingsStore, useLibraryStore } = require('../../stores');
    
    const userStore = useUserStore.getState();
    const settingsStore = useSettingsStore.getState();
    const libraryStore = useLibraryStore.getState();
    // Get current state from all stores
    
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
   * @param {boolean} skipMerge - If true, directly replace without merging
   */
  async applyState(state, skipMerge = false) {
    console.log('[SyncV2] applyState called with:', {
      userCount: Object.keys(state.users || {}).length,
      currentUser: state.currentUser,
      activities: state.users?.[state.currentUser]?.days?.today?.activities?.length || 0,
      firstActivity: state.users?.[state.currentUser]?.days?.today?.activities?.[0]?.text,
      skipMerge
    });
    
    const { useUserStore, useSettingsStore, useLibraryStore } = require('../../stores');
    
    // Check if data needs migration from old format
    const migratedState = await dataMigrator.checkAndMigrate(state, this.deviceId);
    
    // Log what we're about to apply
    console.log('[SyncV2] Applying migrated state:', {
      userCount: Object.keys(migratedState.users || {}).length,
      activities: migratedState.users?.[migratedState.currentUser]?.days?.today?.activities?.length || 0
    });
    
    // Update stores with migrated data
    useUserStore.getState().setUsers(migratedState.users || {});
    useUserStore.getState().setCurrentUser(migratedState.currentUser);
    useUserStore.getState().setCurrentDay(migratedState.currentDay || 'today');
    
    if (migratedState.library) {
      useLibraryStore.getState().setLibrary(migratedState.library);
    }
    
    if (migratedState.globalSettings) {
      useSettingsStore.getState().updateSettings(migratedState.globalSettings);
    }
    
    // Force refresh on iOS after sync
    // Note: iOS sometimes needs a forced re-render after sync
    // This is handled in App.js after sync completes
    
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
          if (__DEV__) console.error(`Failed to update share: ${error.message}`);
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
    // Check if there's an orphaned sync ID (ID exists but recovery phrase is missing/wrong)
    const storedId = await AsyncStorage.getItem('@sync_id');
    if (storedId) {
      console.log('[SyncV2] Found existing sync ID in storage:', storedId);
      const existingPhrase = await encryptionService.getStoredRecoveryPhrase(storedId);
      
      if (existingPhrase) {
        // Verify the phrase generates the correct sync ID
        const generatedId = await this.generateSyncId(existingPhrase);
        if (generatedId === storedId) {
          // Everything is valid, return existing sync info
          console.log('[SyncV2] Valid existing sync found, returning info');
          this.syncId = storedId;
          this.syncEnabled = true;
          return {
            syncId: storedId,
            recoveryPhrase: existingPhrase,
            isNewSync: false
          };
        } else {
          console.error('[SyncV2] ORPHANED SYNC: Stored phrase generates wrong ID!', {
            storedId: storedId,
            generatedId: generatedId
          });
        }
      } else {
        console.error('[SyncV2] ORPHANED SYNC: No recovery phrase for stored ID:', storedId);
      }
      
      // We have an orphaned sync ID - clear it and create a new sync
      console.log('[SyncV2] Clearing orphaned sync ID and creating new sync');
      await this.disable(); // This will clear all sync-related data
    }
    
    // Generate BOTH values immediately and store in immutable locals
    const recoveryPhrase = encryptionService.generateRecoveryPhrase();
    const syncId = await this.generateSyncId(recoveryPhrase);
    
    // CRITICAL DEBUG: Log what we're about to return
    console.log('[SyncV2] CREATE DEBUG:', {
      recoveryPhrase: recoveryPhrase,
      syncId: syncId,
      phraseLength: recoveryPhrase.length,
      syncIdLength: syncId.length,
      phraseFirst4: recoveryPhrase.substring(0, 4),
      syncIdFirst4: syncId.substring(0, 4)
    });
    
    // CRITICAL TEST: Immediately verify the generation is correct
    const verifyId = await this.generateSyncId(recoveryPhrase);
    if (verifyId !== syncId) {
      console.error('[SyncV2] CRITICAL BUG: generateSyncId is not deterministic!', {
        original: syncId,
        verify: verifyId
      });
    }
    
    // Create immutable result BEFORE any async operations
    // This ensures nothing can modify these values
    // CRITICAL FIX: Were we accidentally swapping these? Let's be ABSOLUTELY SURE
    const result = Object.freeze({
      recoveryPhrase: recoveryPhrase,  // The 32-char hex we generated with randomBytes
      syncId: syncId,  // The ID derived from the recovery phrase via PBKDF2
      isNewSync: true
    });
    
    // Now do the async work to actually enable sync
    // Set the service state so enable() uses our sync ID
    this.syncId = syncId;
    this.syncEnabled = false; // Not fully enabled yet, but we have the ID
    
    // Enable will use the existing this.syncId instead of generating a new one
    await this.enable(recoveryPhrase);
    
    // CRITICAL: Force an immediate sync after creation to push current data
    console.log('[SyncV2] Forcing immediate sync after creation');
    try {
      await this.performSync();
      console.log('[SyncV2] Initial sync completed successfully');
    } catch (error) {
      console.error('[SyncV2] Initial sync failed:', error);
    }
    
    // CRITICAL VERIFICATION: Before returning, verify everything is correct
    const finalStoredPhrase = await encryptionService.getStoredRecoveryPhrase(syncId);
    const finalGeneratedId = await this.generateSyncId(finalStoredPhrase);
    
    const allMatch = (
      result.syncId === syncId &&
      result.recoveryPhrase === recoveryPhrase &&
      finalStoredPhrase === recoveryPhrase &&
      finalGeneratedId === syncId &&
      this.syncId === syncId
    );
    
    console.log('[SyncV2] CREATE FINAL VERIFICATION:', {
      resultSyncId: result.syncId,
      resultPhrase: result.recoveryPhrase,
      storedPhrase: finalStoredPhrase,
      generatedFromStored: finalGeneratedId,
      serviceSyncId: this.syncId,
      asyncStorageSyncId: await AsyncStorage.getItem('@sync_id'),
      allMatch: allMatch
    });
    
    // Log mismatch if detected (will be stripped in production)
    if (!allMatch) {
      console.error('[SyncV2] CRITICAL: Sync ID mismatch detected during creation!');
    }
    
    // Return the frozen result that was created BEFORE async operations
    // This guarantees the recovery phrase and sync ID match
    return result;
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
      
      // CRITICAL: Do an immediate push of the imported data BEFORE starting the sync timer
      // This ensures our imported data is on the server before any pull can happen
      console.log('[SyncV2] Pushing imported data to server immediately');
      
      // Wait a moment for React state to fully propagate to Zustand stores
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const currentState = this.getCurrentState();
        
        // Verify we have actual data to push
        if (!currentState.users || Object.keys(currentState.users).length === 0) {
          console.error('[SyncV2] WARNING: No users found in store after import! Aborting sync initialization.');
          throw new Error('No data found in stores after import');
        }
        
        console.log('[SyncV2] Pushing imported data:', {
          userCount: Object.keys(currentState.users).length,
          hasLibrary: !!currentState.library
        });
        
        // Push the imported data
        const newVersion = await this.push(currentState);
        this.lastVersion = newVersion;
        await AsyncStorage.setItem('@sync_version', newVersion.toString());
        
        console.log('[SyncV2] Imported data pushed successfully, version:', newVersion);
      } catch (pushError) {
        console.error('[SyncV2] Failed to push imported data:', pushError);
        // Don't throw - we still want to enable sync even if initial push fails
      }
      
      // NOW start sync timer after the initial push
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
    // CRITICAL: Always use the sync ID from AsyncStorage as source of truth
    const storedId = await AsyncStorage.getItem('@sync_id');
    const activeId = storedId || this.syncId;
    
    console.log('[SyncV2] getRecoveryPhrase called:', {
      serviceId: this.syncId,
      storedId: storedId,
      usingId: activeId
    });
    
    if (!activeId) {
      console.log('[SyncV2] No sync ID available, returning null');
      return null;
    }
    
    // Update service sync ID if needed
    if (storedId && storedId !== this.syncId) {
      console.warn('[SyncV2] Updating service sync ID to match stored');
      this.syncId = storedId;
    }
    
    try {
      // Retrieve the stored recovery phrase for the active sync ID
      const phrase = await encryptionService.getStoredRecoveryPhrase(activeId);
      
      if (phrase) {
        // Verify the phrase generates the correct sync ID
        const generatedId = await this.generateSyncId(phrase);
        if (generatedId !== activeId) {
          console.error('[SyncV2] CRITICAL: Stored phrase generates different sync ID!', {
            expectedId: activeId,
            generatedId: generatedId,
            phrasePreview: phrase.substring(0, 4) + '...' + phrase.substring(phrase.length - 4)
          });
          // Return null instead of wrong phrase
          return null;
        }
      } else {
        console.warn('[SyncV2] No recovery phrase found for sync ID:', activeId);
      }
      
      return phrase;
    } catch (error) {
      console.error('[SyncV2] Failed to get recovery phrase:', error);
      return null;
    }
  }

  // Get sync ID
  async getSyncId() {
    console.log('[SyncV2] getSyncId called, current value:', this.syncId);
    
    // CRITICAL: Always verify the sync ID matches what's in AsyncStorage
    const storedId = await AsyncStorage.getItem('@sync_id');
    if (storedId && storedId !== this.syncId) {
      console.error('[SyncV2] CRITICAL: Sync ID mismatch!', {
        serviceId: this.syncId,
        storedId: storedId
      });
      // Use the stored ID as source of truth
      this.syncId = storedId;
    }
    
    return this.syncId;
  }

  // Sync method (backward compatibility with original service)
  async sync() {
    if (!this.syncEnabled) {
      throw new Error('Sync not enabled');
    }
    
    try {
      await this.performSync();
      return { success: true };
    } catch (error) {
      console.error('[SyncV2] Sync failed:', error);
      throw error;
    }
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
        await this.performSync();
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
export default new SyncServiceV2();// FORCE REBUILD 1756331472
