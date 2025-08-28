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
import CRDTMerger from './crdtMerger';

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
    console.log('[SyncTS] Constructor called');
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
    this.JOIN_PROTECTION_TIME = 5000; // 5 seconds - just enough to prevent race conditions
    this.rateLimitBackoff = 0; // Track rate limit backoff
    
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
    
    // Initialize but catch any errors to prevent constructor failure
    this._initializeOnStartup().catch(err => {
      console.error('[SyncTS] Initialization failed:', err);
    });
  }

  /**
   * Initialize service on startup
   */
  async _initializeOnStartup() {
    console.log('[SyncTS] _initializeOnStartup called');
    try {
      const [enabled, syncId, lastTimestamp, joinTimestamp] = await Promise.all([
        AsyncStorage.getItem('@sync_enabled'),
        AsyncStorage.getItem('@sync_id'),
        AsyncStorage.getItem('@sync_timestamp'),
        AsyncStorage.getItem('@sync_join_timestamp')
      ]);

      console.log('[SyncTS] Initialize loaded from storage:', {
        enabled,
        syncId,
        lastTimestamp,
        joinTimestamp,
        parsedTimestamp: parseInt(lastTimestamp, 10) || 0
      });

      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastSyncTimestamp = parseInt(lastTimestamp, 10) || 0;
        console.log('[SyncTS] Set lastSyncTimestamp to:', this.lastSyncTimestamp);
        this.deviceId = await encryptionService.getDeviceId();
        
        // CRITICAL: Check if we have NO local state but sync is enabled
        // This means Device B lost its state after a restart
        const currentState = this.getCurrentState();
        const hasNoUsers = !currentState.users || Object.keys(currentState.users).length === 0;
        
        if (hasNoUsers) {
          console.log('[SyncTS] CRITICAL: Device has sync enabled but no data - forcing immediate sync');
          console.log('[SyncTS] lastSyncTimestamp:', this.lastSyncTimestamp, '- will pull all records if 0, or newer records if > 0');
          // Force an immediate pull to restore state
          setTimeout(() => {
            this.performSync().catch(err => {
              console.error('[SyncTS] Emergency sync failed:', err);
            });
          }, 1000); // Give stores time to initialize
        }
        
        // Check if we're still in protection period from a previous join
        if (joinTimestamp) {
          const joinTime = parseInt(joinTimestamp, 10);
          const elapsed = Date.now() - joinTime;
          if (elapsed < this.JOIN_PROTECTION_TIME) {
            this._joinedAt = joinTime;
            this._justJoinedSync = true;
            const remainingTime = this.JOIN_PROTECTION_TIME - elapsed;
            console.log(`[SyncTS] Protection period still active for ${Math.ceil(remainingTime / 1000)}s`);
            
            // Set timer to clear protection when it expires
            setTimeout(() => {
              console.log('[SyncTS] Protection period expired - triggering sync');
              this._justJoinedSync = false;
              AsyncStorage.removeItem('@sync_join_timestamp');
              // Trigger immediate sync now that protection is cleared
              if (this.syncEnabled) {
                this.performSync();
              }
            }, remainingTime);
          } else {
            // Protection period has expired, clear the timestamp
            AsyncStorage.removeItem('@sync_join_timestamp');
          }
        }
        
        try {
          const recoveryPhrase = await encryptionService.getStoredRecoveryPhrase(syncId);
          console.log('[SyncTS] Recovery phrase retrieval:', {
            syncId,
            phraseFound: !!recoveryPhrase,
            phraseLength: recoveryPhrase?.length
          });
          
          if (recoveryPhrase) {
            // CRITICAL: Store recovery phrase in memory for this session
            this.currentRecoveryPhrase = recoveryPhrase;
            
            const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
            await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);
            
            console.log('[SyncTS] Encryption initialized, masterKey:', !!encryptionService.masterKey);
            
            eventLogger.logSync('INITIALIZED', { 
              syncId: this.syncId,
              lastTimestamp: this.lastSyncTimestamp,
              encryptionReady: true
            });
          } else {
            console.error('[SyncTS] No recovery phrase found for syncId:', syncId);
          }
        } catch (encryptError) {
          console.error('[SyncTS] Failed to initialize encryption:', encryptError);
        }
        
        // Start sync timer regardless of encryption status - performSync will check if ready
        this.startSyncTimer();
      }
    } catch (error) {
      console.error('[SyncTS] CRITICAL: Initialization failed:', error);
      console.error('[SyncTS] Stack trace:', error.stack);
      // Try to start timer anyway as a failsafe
      if (this.syncEnabled && !this.syncTimer) {
        console.log('[SyncTS] Attempting to start timer despite initialization error');
        try {
          this.startSyncTimer();
        } catch (timerError) {
          console.error('[SyncTS] Failed to start timer:', timerError);
        }
      }
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
        
        // CRITICAL: Store recovery phrase so sync persists after restart!
        console.log('[SyncTS] Storing recovery phrase with syncId:', this.syncId);
        await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
        this.currentRecoveryPhrase = recoveryPhrase;
        
        // Verify it was stored
        const verifyPhrase = await encryptionService.getStoredRecoveryPhrase(this.syncId);
        console.log('[SyncTS] Verify phrase storage:', {
          syncId: this.syncId,
          stored: !!verifyPhrase,
          matches: verifyPhrase === recoveryPhrase
        });
        
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
        
        // Set protection flags and persist the join timestamp
        this._justJoinedSync = true;
        this._joinedAt = Date.now();
        this._applyingRemoteState = true;
        
        // Persist join timestamp so protection survives restarts
        await AsyncStorage.setItem('@sync_join_timestamp', this._joinedAt.toString());
        
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
        
        // Keep protection active for a brief period
        const protectionTime = 10000; // 10 seconds is plenty  
        setTimeout(async () => {
          console.log('[SyncTS] Clearing join protection - triggering sync');
          this._justJoinedSync = false;
          // Clear the persisted timestamp
          await AsyncStorage.removeItem('@sync_join_timestamp');
          // Trigger immediate sync now that protection is cleared
          if (this.syncEnabled) {
            this.performSync();
          }
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
    console.log('[SyncTS] performSync called');
    
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
      console.log('[SyncTS] Protection period passed, clearing flag');
      this._justJoinedSync = false;
      await AsyncStorage.removeItem('@sync_join_timestamp');
    }
    
    if (this._applyingRemoteState) {
      console.log('[SyncTS] FAILED: Applying remote state');
      return { success: false, blocked: true, message: 'Applying remote state' };
    }
    
    console.log('[SyncTS] Check enabled:', this.syncEnabled, 'syncId:', this.syncId);
    if (!this.syncEnabled || !this.syncId) {
      console.log('[SyncTS] FAILED: Sync not enabled or no syncId');
      return { success: false, error: 'Sync not enabled' };
    }
    
    if (this.syncInProgress) {
      console.log('[SyncTS] FAILED: Sync already in progress');
      return { success: false, inProgress: true };
    }

    console.log('[SyncTS] Check encryption - masterKey:', !!encryptionService.masterKey);
    if (!encryptionService.masterKey) {
      console.error('[SyncTS] FAILED: No masterKey - encryption not initialized');
      return { success: false, error: 'Encryption not initialized' };
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();
    console.log('[SyncTS] Starting sync - all checks passed');
    
    try {
      this.updateSyncStatus('syncing');
      
      // Get current local state
      const localState = this.getCurrentState();
      
      // Debug log the state
      console.log('[SyncTS] Current state check:', {
        hasUsers: !!localState.users,
        userCount: localState.users ? Object.keys(localState.users).length : 0,
        currentUser: localState.currentUser,
        storeUsers: useUserStore.getState().users ? Object.keys(useUserStore.getState().users).length : 0
      });
      
      // Safety check - don't push empty state (but allow pull to get data)
      const hasLocalData = localState.users && Object.keys(localState.users).length > 0;
      
      // Pull newer records from server
      console.log('[SyncTS] About to pull from server with params:', {
        syncId: this.syncId,
        deviceId: this.deviceId,
        lastSyncTimestamp: this.lastSyncTimestamp,
        hasLocalData
      });
      
      const pullUrl = `${getApiBaseUrl()}/pull_timestamp.php?sync_id=${this.syncId}&device_id=${this.deviceId}&since=${this.lastSyncTimestamp}`;
      console.log('[SyncTS] Pull URL:', pullUrl);
      
      const pullResponse = await fetch(pullUrl);
      
      if (!pullResponse.ok) {
        if (pullResponse.status === 429) {
          const errorData = await pullResponse.json();
          const waitTime = errorData.seconds_remaining || 60;
          console.log(`[SyncTS] Rate limited - wait ${waitTime}s`);
          this.updateSyncStatus('blocked', `Rate limited - wait ${waitTime}s`);
          
          // Implement exponential backoff
          this.rateLimitBackoff = Math.max(waitTime * 1000, this.SYNC_INTERVAL * 2);
          console.log(`[SyncTS] Backing off for ${this.rateLimitBackoff}ms`);
          
          // Restart timer with backoff
          this.stopSyncTimer();
          setTimeout(() => {
            this.rateLimitBackoff = 0;
            this.startSyncTimer();
          }, this.rateLimitBackoff);
          
          this.syncInProgress = false;
          return { success: false, blocked: true, waitTime: waitTime };
        }
        throw new Error(`Pull failed: ${pullResponse.status}`);
      }
      
      const pullData = await pullResponse.json();
      const remoteRecords = pullData.records || [];
      
      console.log('[SyncTS] Pull response:', {
        recordCount: remoteRecords.length,
        deviceInfo: pullData.device_info,
        serverTime: pullData.server_time,
        ourDeviceId: this.deviceId,
        lastSyncTimestamp: this.lastSyncTimestamp
      });
      
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
        console.log('[SyncTS] Merging', remoteRecords.length, 'remote records from timestamps:', 
          remoteRecords.map(r => ({device: r.device_id.substring(0,8), ts: r.timestamp})));
        
        // CRITICAL DEBUG: Log exact state before merge
        console.log('[SyncTS] LOCAL STATE BEFORE MERGE:', {
          hasUsers: !!localState?.users,
          userCount: localState?.users ? Object.keys(localState.users).length : 0,
          isEmpty: !localState?.users || Object.keys(localState.users).length === 0
        });
        
        // Keep original state for comparison
        const originalState = JSON.parse(JSON.stringify(localState));
        
        // Merge all remote records into local state
        for (const record of remoteRecords) {
          const decryptedRemote = encryptionService.decryptData(record.encrypted_blob);
          const normalizedRemote = normalizeSyncData(decryptedRemote);
          
          console.log('[SyncTS] Processing record from device:', record.device_id, 'timestamp:', record.timestamp);
          
          // Debug: Check if activities have completion timestamps
          if (normalizedRemote.users) {
            for (const [userId, user] of Object.entries(normalizedRemote.users)) {
              if (user.days?.today?.activities) {
                for (const activity of user.days.today.activities) {
                  if (activity.completed || activity.completedAt) {
                    console.log('[SyncTS] Remote activity:', {
                      id: activity.id?.substring(0, 8),
                      completed: activity.completed,
                      completedAt: activity.completedAt,
                      uncompletedAt: activity.uncompletedAt,
                      modifiedAt: activity.modifiedAt
                    });
                  }
                }
              }
            }
          }
          
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
        // CRITICAL: If we had no users and now have users, that's ALWAYS a change
        const wasEmpty = !originalState.users || Object.keys(originalState.users).length === 0;
        const hasDataNow = stateToSync.users && Object.keys(stateToSync.users).length > 0;
        
        // FORCE APPLY if we're empty and received data
        if (wasEmpty && hasDataNow) {
          console.log('[SyncTS] CRITICAL: Empty state receiving initial data - FORCE APPLYING');
          stateChanged = true;
          // IMMEDIATELY APPLY THE STATE - don't wait
          await this.applyState(stateToSync);
          // Also update the timestamp immediately
          if (remoteRecords.length > 0) {
            const latestTimestamp = remoteRecords[remoteRecords.length - 1].timestamp;
            this.lastSyncTimestamp = latestTimestamp;
            await AsyncStorage.setItem('@sync_timestamp', this.lastSyncTimestamp.toString());
            console.log('[SyncTS] FORCED: Applied state and saved timestamp:', latestTimestamp);
          }
          // Mark that we've handled the state application
          // But DON'T return early - let the sync cycle complete normally
        } else {
          stateChanged = this.statesAreDifferent(originalState, stateToSync);
        }
        
        console.log('[SyncTS] State comparison:', {
          stateChanged,
          wasEmpty,
          hasDataNow,
          originalUsers: Object.keys(originalState.users || {}).length,
          mergedUsers: Object.keys(stateToSync.users || {}).length
        });
        
        if (stateChanged && !(wasEmpty && hasDataNow)) {
          console.log('[SyncTS] Merge resulted in changes, applying to stores');
          
          // Debug: Log what's being applied
          if (stateToSync.users) {
            for (const [userId, user] of Object.entries(stateToSync.users)) {
              if (user.days) {
                for (const [day, dayData] of Object.entries(user.days)) {
                  if (dayData.activities) {
                    const completedCount = dayData.activities.filter(a => a.completed).length;
                    console.log(`[SyncTS] User ${userId} Day ${day}: ${dayData.activities.length} activities, ${completedCount} completed`);
                  }
                }
              }
            }
          }
          
          // Apply merged state to stores
          await this.applyState(stateToSync);
        } else {
          console.log('[SyncTS] Merge resulted in no changes, skipping store update');
        }
      }
      
      // Check if local state has changes newer than last sync
      const localTimestamp = this.getLatestLocalTimestamp(localState);
      const hasNewLocalChanges = localTimestamp > this.lastSyncTimestamp;
      
      // Only push if we have actual changes AND have data to push
      if ((hasNewLocalChanges || stateChanged) && hasLocalData) {
        console.log('[SyncTS] Pushing changes - hasNewLocal:', hasNewLocalChanges, 'stateChanged:', stateChanged);
        // Use server timestamp if available, fallback to client timestamp
        const pushTimestamp = pullData.server_time || Date.now();
        
        try {
          const pushResult = await this.push(stateToSync, pushTimestamp);
          if (pushResult && pushResult.server_time) {
            // Update our timestamp to match server
            this.lastSyncTimestamp = pushResult.server_time;
          } else if (pushResult) {
            // Push succeeded, use the timestamp we sent
            this.lastSyncTimestamp = pushTimestamp;
          }
          // Only save timestamp if push succeeded
          await AsyncStorage.setItem('@sync_timestamp', this.lastSyncTimestamp.toString());
        } catch (pushError) {
          console.error('[SyncTS] Push failed, not updating timestamp:', pushError);
          // Don't update lastSyncTimestamp if push failed
        }
      } else {
        console.log('[SyncTS] No changes to push');
        // Still save the timestamp from records we processed
        await AsyncStorage.setItem('@sync_timestamp', this.lastSyncTimestamp.toString());
      }
      
      this.lastSyncSuccess = Date.now();
      this.updateSyncStatus('success');
      this.syncInProgress = false;
      return { success: true };
      
    } catch (error) {
      console.error('[SyncTS] Sync failed with error:', error);
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
   * Merge states using field-level CRDT merging for activities
   */
  mergeStatesByTimestamp(localState, remoteState, remoteTimestamp, remoteDeviceId) {
    // Use CRDT merger for proper field-level conflict resolution
    const merger = new CRDTMerger();
    const mergedState = { ...localState };
    
    // Merge users and their activities
    if (remoteState.users || localState.users) {
      mergedState.users = {};
      
      // Get all user IDs from both states
      const allUserIds = new Set([
        ...Object.keys(localState.users || {}),
        ...Object.keys(remoteState.users || {})
      ]);
      
      for (const userId of allUserIds) {
        const localUser = localState.users?.[userId];
        const remoteUser = remoteState.users?.[userId];
        
        if (!localUser) {
          // User only exists in remote
          mergedState.users[userId] = remoteUser;
        } else if (!remoteUser) {
          // User only exists locally
          mergedState.users[userId] = localUser;
        } else {
          // User exists in both - merge their data
          mergedState.users[userId] = this.mergeUsers(localUser, remoteUser, merger, remoteDeviceId);
        }
      }
    }
    
    // Merge library if present
    if (remoteState.library || localState.library) {
      // For now, take the most recent library (could implement field-level merge later)
      mergedState.library = remoteState.library || localState.library;
    }
    
    // Preserve other state fields
    if (remoteState.currentUser || localState.currentUser) {
      mergedState.currentUser = remoteState.currentUser || localState.currentUser;
    }
    if (remoteState.currentDay || localState.currentDay) {
      mergedState.currentDay = remoteState.currentDay || localState.currentDay;
    }
    
    return mergedState;
  }
  
  /**
   * Merge two user objects with their activities
   */
  mergeUsers(localUser, remoteUser, merger, remoteDeviceId) {
    const merged = { ...localUser };
    
    // Merge basic user fields
    merged.name = remoteUser.name || localUser.name;
    merged.icon = remoteUser.icon || localUser.icon;
    
    // Merge days and activities
    if (localUser.days || remoteUser.days) {
      merged.days = {};
      const allDays = new Set([
        ...Object.keys(localUser.days || {}),
        ...Object.keys(remoteUser.days || {})
      ]);
      
      for (const day of allDays) {
        const localDay = localUser.days?.[day];
        const remoteDay = remoteUser.days?.[day];
        
        if (!localDay) {
          merged.days[day] = remoteDay;
        } else if (!remoteDay) {
          merged.days[day] = localDay;
        } else {
          // Merge activities for this day
          merged.days[day] = {
            activities: this.mergeActivities(
              localDay.activities || [],
              remoteDay.activities || [],
              merger,
              remoteDeviceId
            )
          };
        }
      }
    }
    
    return merged;
  }
  
  /**
   * Merge activity arrays using CRDT logic
   */
  mergeActivities(localActivities, remoteActivities, merger, remoteDeviceId) {
    console.log('[SyncTS] Merging activities:', {
      localCount: localActivities.length,
      remoteCount: remoteActivities.length,
      deviceId: this.deviceId
    });
    
    // Use the CRDT merger's built-in array merging logic
    const merged = merger.mergeActivityArrays(localActivities, remoteActivities, this.deviceId);
    
    console.log('[SyncTS] Merge result:', {
      mergedCount: merged.length,
      completedCount: merged.filter(a => a.completed).length
    });
    
    return merged;
  }

  /**
   * Get latest modification timestamp from state
   */
  getLatestLocalTimestamp(state) {
    let maxTimestamp = 0;
    
    // Check all activities for their modification timestamps
    if (state.users) {
      for (const user of Object.values(state.users)) {
        if (user.days) {
          for (const day of Object.values(user.days)) {
            if (day.activities) {
              for (const activity of day.activities) {
                // Check various timestamp fields
                const timestamps = [
                  activity.modifiedAt,
                  activity.completedAt,
                  activity.uncompletedAt,
                  activity.deletedAt
                ].filter(t => typeof t === 'number');
                
                if (timestamps.length > 0) {
                  maxTimestamp = Math.max(maxTimestamp, ...timestamps);
                }
              }
            }
          }
        }
      }
    }
    
    // Return the maximum timestamp found, or current time if nothing found
    return maxTimestamp || Date.now();
  }

  /**
   * Start periodic sync timer
   */
  startSyncTimer() {
    this.stopSyncTimer();
    
    // Perform an initial sync after protection period (or immediately if not protected)
    const initialDelay = this._justJoinedSync ? 6000 : 2000; // Wait 6s if protected, 2s otherwise
    setTimeout(() => {
      console.log('[SyncTS] Initial sync check - protected:', this._justJoinedSync, 'enabled:', this.syncEnabled);
      if (this.syncEnabled) {
        console.log('[SyncTS] Performing initial sync after timer start');
        this.performSync().catch(err => {
          console.error('[SyncTS] Initial sync failed:', err);
        });
      }
    }, initialDelay);
    
    // Then set up regular interval syncs - performSync will handle protection checks
    this.syncTimer = setInterval(() => {
      console.log('[SyncTS] Timer tick - enabled:', this.syncEnabled);
      if (this.syncEnabled) {
        this.performSync().catch(err => {
          console.error('[SyncTS] Interval sync failed:', err);
        });
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
    
    // This method is called after onboarding imports data
    // We need to properly enable sync without pulling data
    
    // Generate IDs
    this.syncId = await this.generateSyncId(recoveryPhrase);
    this.deviceId = await this.getDeviceId();
    
    // Store recovery phrase for persistence
    this.currentRecoveryPhrase = recoveryPhrase;
    await encryptionService.storeRecoveryPhrase(recoveryPhrase, this.syncId);
    
    // Initialize encryption
    const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
    await encryptionService.initialize(recoveryPhrase, this.syncId, fixedSalt);
    
    // Save sync state to persist across sessions
    await AsyncStorage.multiSet([
      ['@sync_enabled', 'true'],
      ['@sync_id', this.syncId],
      ['@sync_timestamp', '0'] // Start from beginning
    ]);
    
    // Enable sync and start timer
    this.syncEnabled = true;
    this.lastSyncTimestamp = 0;
    
    // Set protection flags since we just joined
    this._justJoinedSync = true;
    this._joinedAt = Date.now();
    
    // Start sync timer (will respect protection period)
    this.startSyncTimer();
    
    // Schedule protection clear
    setTimeout(() => {
      console.log('[SyncTS] Clearing import protection after 61 seconds');
      this._justJoinedSync = false;
    }, this.JOIN_PROTECTION_TIME);
    
    console.log('[SyncTS] Import initialization complete:', {
      syncId: this.syncId,
      deviceId: this.deviceId,
      syncEnabled: this.syncEnabled,
      protectionActive: true
    });
    
    return {
      syncId: this.syncId,
      recoveryPhrase: recoveryPhrase
    };
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
    
    // Format time-based status messages
    let displayMessage = error;
    if (status === 'idle' && this.lastSyncSuccess && !error) {
      const elapsed = Date.now() - this.lastSyncSuccess;
      if (elapsed < 5000) {
        displayMessage = 'Just now';
      } else if (elapsed < 60000) {
        displayMessage = `${Math.floor(elapsed / 1000)}s ago`;
      } else if (elapsed < 3600000) {
        displayMessage = `${Math.floor(elapsed / 60000)}m ago`;
      } else {
        displayMessage = 'Over an hour ago';
      }
    }
    
    this.statusListeners.forEach(listener => {
      listener({ status, error: displayMessage, lastSyncSuccess: this.lastSyncSuccess });
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
    console.log('[SyncTS] Manual sync requested');
    
    // Failsafe: If sync is enabled but timer isn't running, start it
    if (this.syncEnabled && !this.syncTimer) {
      console.warn('[SyncTS] Sync enabled but timer not running - starting it now');
      this.startSyncTimer();
    }
    
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