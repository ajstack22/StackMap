import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import encryptionService from './encryptionService';
import { useAppStore } from '../../stores';
import syncQueue from './syncQueue';
import networkMonitor from './networkMonitor';
import changeTracker from './changeTracker';
import syncThrottle from './syncThrottle';
import conflictResolver from './conflictResolver';
import syncHistory from './syncHistory';
import { validateSyncedData, repairSyncedData, validateIncrementalSync } from './dataValidator';

// Determine API URL based on environment
const getApiBaseUrl = () => {
  // For iOS/Android development builds, use qual environment
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return 'https://stackmap.app/qual/api/sync';
  }
  
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'https://stackmap.app/api/sync';
    }
    // Check if we're in qual environment
    if (window.location.pathname.startsWith('/qual')) {
      return 'https://stackmap.app/qual/api/sync';
    }
  }
  // Default to production API
  return 'https://stackmap.app/api/sync';
};

const API_BASE_URL = getApiBaseUrl();
console.log('[SyncService] Using API_BASE_URL:', API_BASE_URL);

// Share endpoints use environment-specific API for testing
const getShareApiUrl = () => {
  // For iOS/Android development builds, use qual environment
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return 'https://stackmap.app/qual/api/sync';
  }
  
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'https://stackmap.app/api/sync';
    }
    // Check if we're in qual environment
    if (window.location.pathname.startsWith('/qual')) {
      return 'https://stackmap.app/qual/api/sync';
    }
  }
  // Default to production API
  return 'https://stackmap.app/api/sync';
};

const SHARE_API_URL = getShareApiUrl();
console.log('[SyncService] Using SHARE_API_URL:', SHARE_API_URL);

class SyncService {
  constructor() {
    this.syncEnabled = false;
    this.syncId = null;
    this.lastSyncVersion = 0;
    this.initialized = false;
    this.syncInterval = null;
    this.syncIntervalDuration = 30000; // 30 seconds
    this.lastSyncAttempt = null;
    this.lastSyncSuccess = null;
    this.syncStatus = 'idle'; // idle, syncing, success, error, offline, conflicts
    this.syncError = null;
    this.statusListeners = new Set();
    this.conflictListeners = new Set();
    this.pendingConflicts = [];
    this.storeUnsubscribe = null;
    this.syncDebounceTimer = null;
    this.syncDebounceDelay = 5000; // 5 seconds
    
    // Sync lock mechanism
    this.syncInProgress = false;
    this.syncQueue = [];
    
    // Sync transaction tracking
    this.processedTransactions = new Set();
    this.transactionCleanupInterval = null;
    
    // Initialize network monitoring (now safely disabled internally for iOS)
    networkMonitor.start();
    
    // Listen for network changes (won't actually do anything on iOS now)
    this.networkUnsubscribe = networkMonitor.addListener(this.handleNetworkChange.bind(this));
    
    // Initialize sync queue
    syncQueue.initialize();
    
    // Start change tracking
    changeTracker.startTracking();
    
    // Initialize sync history
    syncHistory.initialize();
    
    // Auto-restore state on construction (non-blocking)
    // Using setTimeout to prevent blocking the constructor
    // Wait 1 second to avoid interfering with onboarding
    setTimeout(() => this.restoreState(), 1000);
  }
  
  /**
   * Restore sync state from AsyncStorage
   */
  async restoreState() {
    const startTime = Date.now();
    console.log('[SYNC TIMING] restoreState started');
    
    // Prevent multiple restores
    if (this.initialized) {
      console.log('SyncService: Already initialized, skipping restore');
      return;
    }
    
    try {
      console.log('SyncService: Restoring state...');
      const t1 = Date.now();
      const enabled = await AsyncStorage.getItem('@sync_enabled');
      const syncId = await AsyncStorage.getItem('@sync_id');
      const lastVersion = await AsyncStorage.getItem('@sync_last_version');
      const lastSyncSuccess = await AsyncStorage.getItem('@sync_last_success');
      console.log(`[SYNC TIMING] AsyncStorage reads took ${Date.now() - t1}ms`);
      
      console.log('SyncService: Loaded from storage - enabled:', enabled, 'syncId:', syncId);
      
      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastSyncVersion = parseInt(lastVersion || '0', 10);
        this.lastSyncSuccess = lastSyncSuccess ? parseInt(lastSyncSuccess, 10) : null;
        console.log('SyncService: State restored, syncId:', syncId, 'version:', this.lastSyncVersion);
        
        // Try to restore encryption automatically
        const t2 = Date.now();
        const encryptionRestored = await this.restoreEncryptionFromStorage();
        console.log(`[SYNC TIMING] restoreEncryptionFromStorage took ${Date.now() - t2}ms`);
        
        if (encryptionRestored) {
          // Start periodic sync now that we're restored
          const t3 = Date.now();
          this.startPeriodicSync();
          console.log(`[SYNC TIMING] startPeriodicSync took ${Date.now() - t3}ms`);
          console.log('Sync fully restored and ready, periodic sync started');
        } else {
          console.log('Sync state restored but encryption needs recovery phrase');
        }
      } else {
        console.log('SyncService: No sync state to restore');
      }
      
      this.initialized = true;
      console.log(`[SYNC TIMING] TOTAL restoreState took ${Date.now() - startTime}ms`);
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
    
    // Check if encryption is already initialized (key is cached in memory)
    if (encryptionService.masterKey && encryptionService.syncId === this.syncId) {
      console.log('Encryption already initialized (using cached key)');
      return true;
    }
    
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
   * Enable sync (wrapper for initialize for backward compatibility)
   */
  async enable() {
    const recoveryPhrase = encryptionService.generateRecoveryPhrase();
    await this.initialize(recoveryPhrase);
    return {
      syncId: this.syncId,
      recoveryPhrase: recoveryPhrase
    };
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
          
          // Check if the sync group is essentially empty (just created from web with no real data)
          const isEmptySync = !decryptedData.users || Object.keys(decryptedData.users).length === 0;
          const currentState = this.getCurrentState();
          const hasLocalData = currentState.users && Object.keys(currentState.users).length > 0;
          
          if (isEmptySync && hasLocalData) {
            // The sync group is empty but we have local data - push our data instead of pulling
            console.log('Sync group is empty but we have local data - pushing instead of pulling');
            // Don't restore the empty data, just keep our local data
            // The subsequent sync() call will push our data to the server
          } else {
            // Normal case - restore data from server
            await this.restoreData(decryptedData);
          }
          
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
      
      // Mark current state as baseline for change tracking
      changeTracker.markAsSynced();
      
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
    console.log('[DEBUG] createSyncGroup - Creating sync with state:', {
      userCount: Object.keys(currentState.users || {}).length,
      hasTemplates: !!currentState.templates && currentState.templates.length > 0,
      hasCategories: !!currentState.activityCategories
    });
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
    
    // Check if we should use incremental sync
    let syncData;
    let syncType = 'full';
    
    if (this.lastSyncSuccess && changeTracker.shouldUseIncremental(this.lastSyncSuccess)) {
      const incrementalUpdate = changeTracker.createIncrementalUpdate(this.lastSyncSuccess);
      if (incrementalUpdate) {
        syncData = incrementalUpdate;
        syncType = 'incremental';
        console.log('Using incremental sync with', incrementalUpdate.changes.length, 'changes');
      }
    }
    
    // Fall back to full sync if no incremental update
    if (!syncData) {
      syncData = this.getCurrentState();
      syncType = 'full';
    }
    
    // Generate unique transaction ID
    const transactionId = `${deviceId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if we've already processed this transaction (shouldn't happen with unique IDs)
    if (this.processedTransactions.has(transactionId)) {
      console.warn('Duplicate transaction detected, skipping push');
      return { success: false, duplicate: true };
    }
    
    // Add sync metadata
    const dataWithMetadata = {
      ...syncData,
      syncType,
      syncTimestamp: Date.now(),
      transactionId,
      deviceInfo: {
        id: deviceId,
        name: deviceName
      }
    };
    
    // Validate data before pushing (only for full syncs)
    if (syncType === 'full' && !validateSyncedData(syncData)) {
      console.error('sync: Local data validation failed before push');
      throw new Error('Cannot push invalid data to server');
    }
    
    // Encrypt the data (compression happens inside if beneficial)
    const encryptedBlob = encryptionService.encryptData(dataWithMetadata);
    
    // Track this transaction
    this.processedTransactions.add(transactionId);
    
    const response = await fetch(`${API_BASE_URL}/push.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sync_id: this.syncId,
        device_id: deviceId,
        device_name: deviceName,
        encrypted_blob: encryptedBlob,
        sync_type: syncType
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
    
    const response = await fetch(url);

    if (response.status === 404) {
      // This is expected during sync creation - don't log as error
      return null; // Sync group doesn't exist
    }
    
    console.log('pullData: response status', response.status);

    // Get response text first to check if it's JSON
    const responseText = await response.text();
    
    if (!response.ok) {
      // Try to parse as JSON, but handle HTML responses
      try {
        const error = JSON.parse(responseText);
        console.error('pullData error:', error);
        throw new Error(error.message || 'Failed to pull data');
      } catch (e) {
        // Response is not JSON (likely HTML error page)
        console.error('pullData received non-JSON response:', responseText.substring(0, 200));
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          throw new Error('Server returned an HTML error page. Please check your connection and try again.');
        }
        throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`);
      }
    }

    // Parse successful response
    try {
      const data = JSON.parse(responseText);
      console.log('pullData: received data', data);
      
      // Debug: Log the decrypted data if available (commented out to avoid errors before encryption init)
      // if (data && data.encrypted_blob) {
      //   try {
      //     const decrypted = encryptionService.decryptData(data.encrypted_blob);
      //     console.log('[DEBUG] Decrypted sync data structure:', JSON.stringify(decrypted, null, 2));
      //     
      //     // Check users for missing icons
      //     if (decrypted.users) {
      //       Object.entries(decrypted.users).forEach(([userId, user]) => {
      //         if (!user.icon && !user.emoji) {
      //           console.warn(`[DEBUG] User ${userId} is missing icon/emoji:`, user);
      //         }
      //       });
      //     }
      //   } catch (e) {
      //     console.error('[DEBUG] Failed to decrypt for debugging:', e);
      //   }
      // }
      
      return data;
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText.substring(0, 200));
      throw new Error('Server returned invalid response format');
    }
  }

  /**
   * Request sync with throttling
   */
  async requestSync(options = {}) {
    return syncThrottle.requestSync(
      () => this.sync(),
      options
    );
  }

  /**
   * Sync data (pull, merge, push)
   */
  async sync() {
    // Check if sync is already in progress
    if (this.syncInProgress) {
      console.log('sync: Sync already in progress, queueing request');
      return new Promise((resolve, reject) => {
        this.syncQueue.push({ resolve, reject });
      });
    }
    
    // Set sync lock
    this.syncInProgress = true;
    
    try {
      // Wait for initialization if needed
      if (!this.initialized) {
        await this.restoreState();
      }
      
      console.log('sync: Starting sync, enabled:', this.syncEnabled, 'syncId:', this.syncId);
      
      if (!this.syncEnabled) {
        throw new Error('Sync not enabled');
      }

      // Check network status first
      if (!networkMonitor.isOnline) {
        console.log('sync: Offline, queueing sync operation');
        await syncQueue.enqueue({ type: 'sync', timestamp: Date.now() });
        this.updateSyncStatus('offline', 'No network connection');
        throw new Error('No network connection. Changes will sync when online.');
      }

      // Ensure encryption is initialized
      if (!encryptionService.masterKey) {
        console.log('sync: Encryption not initialized, need recovery phrase');
        throw new Error('Encryption not initialized. Please re-enter your recovery phrase.');
      }

      // Update sync status
      this.updateSyncStatus('syncing');
      this.lastSyncAttempt = Date.now();
      // Pull latest data
      console.log('sync: Pulling latest data...');
      const remoteData = await this.pullData();
      
      // If pullData returns null and we have a lastSyncVersion > 0, it means the sync was deleted on server
      if (remoteData === null && this.lastSyncVersion > 0) {
        console.log('sync: Sync data not found on server, disabling sync');
        await this.disable();
        this.updateSyncStatus('error', 'Sync data not found on server');
        throw new Error('Sync data not found on server. Sync has been disabled.');
      }
      
      if (remoteData && remoteData.version > this.lastSyncVersion) {
        console.log('sync: Remote data is newer, checking for conflicts...');
        
        // Decrypt remote data
        console.log('[DEBUG] Decrypting remote data...');
        let decryptedData = encryptionService.decryptData(remoteData.encrypted_blob);
        
        // Debug log the decrypted data structure
        console.log('[DEBUG] Decrypted data structure:');
        console.log('[DEBUG] - Has users:', !!decryptedData.users);
        console.log('[DEBUG] - User count:', Object.keys(decryptedData.users || {}).length);
        console.log('[DEBUG] - Type:', decryptedData.type || 'full');
        
        // Log activities for each user
        if (decryptedData.users) {
          Object.entries(decryptedData.users).forEach(([userId, user]) => {
            const todayActivities = user.days?.today?.activities?.length || 0;
            const tomorrowActivities = user.days?.tomorrow?.activities?.length || 0;
            console.log(`[DEBUG] Remote user ${userId} (${user.name}): ${todayActivities} today, ${tomorrowActivities} tomorrow activities`);
            if (todayActivities > 0) {
              console.log(`[DEBUG] First activity for ${user.name}:`, user.days.today.activities[0]);
            }
          });
        }
        
        // Validate decrypted data based on type
        if (decryptedData.type === 'incremental') {
          // Validate incremental sync data
          if (!validateIncrementalSync(decryptedData)) {
            console.error('sync: Incremental sync data validation failed');
            throw new Error('Invalid incremental sync data received from server');
          }
          console.log('sync: Incremental sync data validated successfully');
        } else {
          // Validate full sync data
          if (!validateSyncedData(decryptedData)) {
            console.error('sync: Remote data validation failed, attempting repair...');
            const repairedData = repairSyncedData(decryptedData);
            
            if (!validateSyncedData(repairedData)) {
              throw new Error('Remote data is corrupted and cannot be repaired');
            }
            
            console.log('sync: Data repaired successfully');
            decryptedData = repairedData;
          }
        }
        
        // Get current local state
        const localState = this.getCurrentState();
        
        // Detect conflicts
        const conflicts = conflictResolver.detectConflicts(
          localState,
          decryptedData,
          this.lastSyncSuccess || 0
        );
        
        if (conflicts.length > 0) {
          console.log('sync: Found', conflicts.length, 'conflicts - auto-resolving...');
          
          // Auto-resolve all conflicts (no user intervention)
          const resolutions = await conflictResolver.resolveConflicts(conflicts, { autoResolveAll: true });
          
          // Apply all resolutions
          if (resolutions.finalState) {
            console.log('sync: Auto-resolved all conflicts');
            await this.applyState(resolutions.finalState);
          } else if (resolutions.resolved && resolutions.resolved.length > 0) {
            const partialState = conflictResolver.applyResolutions(resolutions.resolved);
            await this.applyState(partialState);
          }
        } else {
          // No conflicts, simple merge
          console.log('sync: No conflicts, merging data');
          await this.mergeData(decryptedData);
        }
        
        this.lastSyncVersion = remoteData.version;
      } else {
        console.log('sync: No newer remote data');
      }
      
      // Push our current state
      console.log('sync: Pushing current state...');
      const pushResult = await this.pushData();
      
      console.log('sync: Sync complete!', pushResult);
      
      // Update success status
      this.lastSyncSuccess = Date.now();
      this.updateSyncStatus('success');
      
      // Persist last sync success time
      await AsyncStorage.setItem('@sync_last_success', this.lastSyncSuccess.toString());
      
      // Mark changes as synced
      changeTracker.markAsSynced();
      
      return {
        success: true,
        version: pushResult.version,
        lastModified: pushResult.last_modified
      };
    } catch (error) {
      console.error('Sync failed:', error);
      
      // Check if it's a network error
      if (syncQueue.isNetworkError(error)) {
        await syncQueue.enqueue({ type: 'sync', timestamp: Date.now() });
        this.updateSyncStatus('offline', 'Network error. Will retry when connection is restored.');
      } else {
        this.updateSyncStatus('error', error.message);
        
        // Log error to sync history for debugging
        await syncHistory.addError({
          errorType: 'sync_failed',
          message: error.message,
          retryable: true,
          networkError: false,
          details: {
            errorStack: error.stack,
            syncId: this.syncId,
            lastAttempt: this.lastSyncAttempt
          }
        });
        
        // Don't let errors break the sync loop entirely
        // Schedule a retry after a delay
        if (this.syncEnabled) {
          console.log('Scheduling sync retry after error in 30 seconds...');
          setTimeout(() => {
            if (this.syncEnabled) {
              this.requestSync({ priority: 'low', reason: 'error_recovery' });
            }
          }, 30000); // 30 seconds
        }
      }
      
      // Don't throw error to prevent breaking the sync loop
      return { 
        success: false, 
        error: error.message 
      };
    } finally {
      // Release sync lock
      this.syncInProgress = false;
      
      // Process queued sync requests
      if (this.syncQueue.length > 0) {
        console.log(`sync: Processing ${this.syncQueue.length} queued sync requests`);
        const queuedRequests = this.syncQueue.splice(0); // Get all and clear queue
        
        // Process the next sync asynchronously to avoid recursion issues
        setTimeout(async () => {
          try {
            const syncResult = await this.sync();
            // Resolve all queued promises with the result
            for (const { resolve } of queuedRequests) {
              resolve(syncResult);
            }
          } catch (error) {
            // Reject all queued promises with the error
            for (const { reject } of queuedRequests) {
              reject(error);
            }
          }
        }, 0);
      }
    }
  }

  /**
   * Get current state from Zustand store
   */
  getCurrentState() {
    const state = useAppStore.getState();
    
    // Ensure users object exists (for empty sync groups from web)
    let users = state.users || {};
    let needsRepair = false;
    
    // Debug: Check users for missing icons and repair them
    console.log('[DEBUG] getCurrentState - Raw users from store:', JSON.stringify(users, null, 2));
    console.log('[DEBUG] getCurrentState - User count:', Object.keys(users).length);
    
    // Debug: Log activities for each user
    Object.entries(users).forEach(([userId, user]) => {
      const todayActivities = user.days?.today?.activities?.length || 0;
      const tomorrowActivities = user.days?.tomorrow?.activities?.length || 0;
      console.log(`[DEBUG] User ${userId} (${user.name}): ${todayActivities} today activities, ${tomorrowActivities} tomorrow activities`);
    });
    
    if (users && Object.keys(users).length > 0) {
      const repairedUsers = { ...users };
      Object.entries(users).forEach(([userId, user]) => {
        if (!user.icon && !user.emoji) {
          console.warn(`[DEBUG] getCurrentState - User ${userId} in store is missing icon/emoji:`, user);
          // Repair by adding default icon
          repairedUsers[userId] = {
            ...user,
            icon: '😀' // Default user icon
          };
          needsRepair = true;
        }
      });
      
      if (needsRepair) {
        console.log('[DEBUG] Repairing users with missing icons...');
        users = repairedUsers;
        useAppStore.getState().setUsers(users);
      }
    }
    
    // Use the same structure as the export functionality
    const currentState = {
      version: 3,
      currentDay: state.currentDay || 'today',
      users: users,
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
      templates: state.libraryTemplates || state.activities || [], // Use new field, fallback to old
      activityCategories: state.library?.categories || state.activityCategories || null, // Include library categories
      currentUser: state.currentUser,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      lastBackup: new Date().toISOString(),
      lastModified: Date.now() // Add timestamp for conflict resolution
    };
    
    console.log('getCurrentState: Full export-style state:', currentState);
    
    return currentState;
  }

  /**
   * Restore data to Zustand store
   */
  async restoreData(data) {
    // Don't log full data as it could be huge
    const dataInfo = data ? `type: ${data.type}, size: ~${Math.round(JSON.stringify(data).length / 1024)}KB` : 'null';
    console.log('restoreData: Incoming data info:', dataInfo);
    
    // Handle incremental sync data
    if (data.type === 'incremental' && data.patch) {
      console.log('restoreData: Applying incremental patch');
      const currentState = useAppStore.getState();
      
      // Apply patch to current state
      const patchedState = { ...currentState };
      
      // Apply each change from the patch
      if (data.patch) {
        Object.keys(data.patch).forEach(key => {
          if (data.patch[key] !== undefined) {
            patchedState[key] = data.patch[key];
          }
        });
      }
      
      // Don't overwrite hasCompletedOnboarding unless explicitly in patch
      if (!data.patch.hasOwnProperty('hasCompletedOnboarding')) {
        patchedState.hasCompletedOnboarding = currentState.hasCompletedOnboarding;
      }
      
      console.log('restoreData: Applied patch to state');
      useAppStore.setState(patchedState);
      return;
    }
    
    // Handle full sync data (only support v3 format)
    const {
      users,
      templates,
      activityCategories,
      currentUser,
      globalSettings,
      hasCompletedOnboarding,
      currentDay
    } = data;
    
    console.log('restoreData: Export format data - Users count:', Object.keys(users || {}).length);
    console.log('restoreData: Export format data - Templates count:', (templates || []).length);
    
    // Debug: Log user activities
    if (users) {
      Object.entries(users).forEach(([userId, user]) => {
        const todayActivities = user.days?.today?.activities?.length || 0;
        const tomorrowActivities = user.days?.tomorrow?.activities?.length || 0;
        console.log(`[DEBUG] restoreData - User ${userId} (${user.name}): ${todayActivities} today activities, ${tomorrowActivities} tomorrow activities`);
      });
    }
    
    // DEBUG: Log data size without stringifying the whole thing
    const dataSize = JSON.stringify(data).length;
    console.log('[DEBUG] Full sync data size:', Math.round(dataSize / 1024), 'KB');
    
    // Get current state to preserve certain values
    const currentState = useAppStore.getState();
    
    // Determine the current user and day
    const finalCurrentUser = currentUser || Object.keys(users || {})[0] || 'user_1';
    const finalCurrentDay = currentDay || 'today';
    
    // Extract activities from the current user's current day
    let currentUserActivities = [];
    if (users && users[finalCurrentUser] && users[finalCurrentUser].days) {
      currentUserActivities = users[finalCurrentUser].days[finalCurrentDay]?.activities || [];
      console.log(`restoreData: Loading ${currentUserActivities.length} activities for user ${finalCurrentUser} on ${finalCurrentDay}`);
      
      // DEBUG: Log first few activities to verify structure
      if (currentUserActivities.length > 0) {
        console.log('[DEBUG] First activity:', JSON.stringify(currentUserActivities[0]));
        console.log('[DEBUG] Activity IDs:', currentUserActivities.map(a => a.id).join(', '));
      }
    }
    
    // Update store with export format data
    const newState = {
      // Set activities from the current user's current day (not templates!)
      activities: currentUserActivities,
      // Map templates to library templates
      libraryTemplates: Array.isArray(templates) ? templates : [],
      activityCategories: activityCategories || null,
      library: {
        categories: activityCategories || null,
        userAddedActivityIds: []
      },
      users: users || {},
      currentUser: finalCurrentUser,
      currentTheme: globalSettings?.currentTheme || 'stackBlue',
      bannerPosition: globalSettings?.bannerPosition || 'top',
      soundEnabled: globalSettings?.soundEnabled !== false,
      taskCelebration: globalSettings?.taskCelebration || 'rainbow',
      routineCelebration: globalSettings?.routineCelebration || 'rainbow',
      // Preserve local hasCompletedOnboarding if not explicitly set in sync data
      hasCompletedOnboarding: hasCompletedOnboarding !== undefined ? hasCompletedOnboarding : currentState.hasCompletedOnboarding,
      currentDay: finalCurrentDay
    };
    
    console.log('restoreData: Setting export format state');
    
    // DEBUG: Log what we're about to set
    console.log('[DEBUG] About to set state with:');
    console.log('[DEBUG] - currentTheme:', newState.currentTheme);
    console.log('[DEBUG] - hasCompletedOnboarding:', newState.hasCompletedOnboarding);
    console.log('[DEBUG] - users count:', Object.keys(newState.users || {}).length);
    console.log('[DEBUG] - activities count being set:', newState.activities?.length || 0);
    console.log('[DEBUG] - activities:', JSON.stringify(newState.activities?.slice(0, 2)));
    console.log('[DEBUG] - currentUser:', newState.currentUser);
    console.log('[DEBUG] - currentDay:', newState.currentDay);
    
    // Store activities in users before setState
    const userActivities = newState.users[newState.currentUser]?.days?.[newState.currentDay]?.activities || [];
    console.log('[DEBUG] User activities before setState:', userActivities.length);
    
    useAppStore.setState(newState);
    
    // DEBUG: Verify what was actually set
    const afterState = useAppStore.getState();
    console.log('[DEBUG] State after setState:');
    console.log('[DEBUG] - currentTheme:', afterState.currentTheme);
    console.log('[DEBUG] - hasCompletedOnboarding:', afterState.hasCompletedOnboarding);
    console.log('[DEBUG] - activities count:', afterState.activities?.length || 0);
    console.log('[DEBUG] - currentUser:', afterState.currentUser);
    console.log('[DEBUG] - currentDay:', afterState.currentDay);
    console.log('[DEBUG] - users count:', Object.keys(afterState.users || {}).length);
    
    // Verify activities in users object
    const afterUserActivities = afterState.users[afterState.currentUser]?.days?.[afterState.currentDay]?.activities || [];
    console.log('[DEBUG] User activities after setState:', afterUserActivities.length);
    if (afterUserActivities.length === 0 && userActivities.length > 0) {
      console.error('[ERROR] Activities lost during setState!');
    }
  }

  /**
   * Merge remote data with local data
   */
  async mergeData(remoteData) {
    // For incremental syncs, the restoreData already handles the merge
    if (remoteData.type === 'incremental') {
      console.log('sync: Applying incremental update');
      await this.restoreData(remoteData);
      
      // Skip validation for incremental updates to prevent data loss
      // The data has already been validated on the sending device
      console.log('sync: Incremental update applied successfully');
      return;
    }
    
    // For full syncs, do the merge with local completion tracking
    // Get current local state before applying remote
    const currentState = useAppStore.getState();
    const currentUsers = currentState.users || {};
    
    // Build a map of local completed activities with timestamps
    const localCompletedMap = new Map();
    Object.keys(currentUsers).forEach(userId => {
      const userDays = currentUsers[userId]?.days || {};
      Object.keys(userDays).forEach(day => {
        const activities = userDays[day]?.activities || [];
        activities.forEach(activity => {
          if (activity.completed && activity.completedAt && activity.completedBy) {
            const key = `${userId}_${day}_${activity.id}`;
            localCompletedMap.set(key, {
              completed: true,
              completedAt: activity.completedAt,
              completedBy: activity.completedBy
            });
          }
        });
      });
    });
    
    // Apply remote data
    await this.restoreData(remoteData);
    
    // Now restore any completed states that were true locally
    const mergedState = useAppStore.getState();
    const mergedUsers = { ...mergedState.users };
    
    Object.keys(mergedUsers).forEach(userId => {
      const userDays = mergedUsers[userId]?.days || {};
      Object.keys(userDays).forEach(day => {
        const activities = userDays[day]?.activities || [];
        mergedUsers[userId].days[day].activities = activities.map(activity => {
          const key = `${userId}_${day}_${activity.id}`;
          const localCompletion = localCompletedMap.get(key);
          
          // If this was completed locally
          if (localCompletion) {
            // If remote also has it completed, use the earlier completion time
            if (activity.completed && activity.completedAt) {
              const useLocal = localCompletion.completedAt < activity.completedAt;
              return {
                ...activity,
                completed: true,
                completedAt: useLocal ? localCompletion.completedAt : activity.completedAt,
                completedBy: useLocal ? localCompletion.completedBy : activity.completedBy
              };
            } else {
              // Remote doesn't have it completed, use local completion
              return {
                ...activity,
                completed: true,
                completedAt: localCompletion.completedAt,
                completedBy: localCompletion.completedBy
              };
            }
          }
          return activity;
        });
      });
    });
    
    // Validate merged users before applying (just validate users, not full state)
    let finalUsers = mergedUsers;
    const tempValidationData = { users: mergedUsers };
    if (!validateSyncedData(tempValidationData)) {
      console.error('sync: Merged data validation failed, attempting repair');
      // Try to repair the users data
      const repairedData = repairSyncedData(tempValidationData);
      if (!validateSyncedData(repairedData)) {
        console.error('sync: Repair failed, applying anyway with warning');
        // Don't throw error - still apply the data but log warning
      } else {
        console.log('sync: Users repaired successfully after merge');
        finalUsers = repairedData.users;
      }
    }
    
    // Update with merged state
    useAppStore.setState({ users: finalUsers });
  }
  
  /**
   * Apply state from conflict resolution
   */
  async applyState(state) {
    // Validate state before applying
    if (!validateSyncedData(state)) {
      console.error('sync: State validation failed in applyState');
      throw new Error('Invalid state cannot be applied');
    }
    
    console.log('[DEBUG] applyState: Using restoreData to properly handle state');
    // Use restoreData to properly extract and set activities
    await this.restoreData(state);
    
    // Mark as synced
    changeTracker.markAsSynced();
  }

  /**
   * Disable sync and clear credentials
   */
  async disable() {
    // Stop periodic sync FIRST before clearing state
    this.stopPeriodicSync();
    
    // Clear sync state
    this.syncEnabled = false;
    this.syncId = null;
    this.lastSyncVersion = 0;
    
    // Clear any pending throttled syncs
    if (syncThrottle) {
      syncThrottle.clear();
    }
    
    // Clear any queued items
    if (syncQueue) {
      syncQueue.clear();
    }
    
    // Clear stored credentials
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
   * Verify sync exists on server
   */
  async verifySyncExists() {
    if (!this.syncEnabled || !this.syncId) {
      return false;
    }

    try {
      const deviceId = await encryptionService.getDeviceId();
      const response = await fetch(`${API_BASE_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`);
      
      if (response.status === 404) {
        // Sync doesn't exist on server, disable locally
        console.log('SyncService: Sync not found on server, disabling locally');
        await this.disable();
        return false;
      }
      
      return response.ok;
    } catch (error) {
      console.error('SyncService: Error verifying sync:', error);
      // Don't disable on network errors
      return this.syncEnabled;
    }
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
   * Get sync ID
   */
  getSyncId() {
    return this.syncId;
  }

  /**
   * Get recovery phrase if available
   */
  async getRecoveryPhrase() {
    if (!this.syncId) return null;
    try {
      return await encryptionService.getStoredRecoveryPhrase(this.syncId);
    } catch (error) {
      console.error('Failed to get recovery phrase:', error);
      return null;
    }
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
    
    // Subscribe to store changes for immediate sync
    this.subscribeToStoreChanges();
    
    // Start transaction cleanup
    this.startTransactionCleanup();
    
    // Run immediate sync
    this.syncWithQueue();
    
    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncWithQueue();
    }, this.syncIntervalDuration);
  }
  
  /**
   * Start transaction cleanup timer
   */
  startTransactionCleanup() {
    // Clear any existing interval
    this.stopTransactionCleanup();
    
    // Clean up old transactions every 5 minutes
    this.transactionCleanupInterval = setInterval(() => {
      this.cleanupOldTransactions();
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  /**
   * Stop transaction cleanup timer
   */
  stopTransactionCleanup() {
    if (this.transactionCleanupInterval) {
      clearInterval(this.transactionCleanupInterval);
      this.transactionCleanupInterval = null;
    }
  }
  
  /**
   * Clean up old transactions to prevent memory leak
   */
  cleanupOldTransactions() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    
    // Parse transaction IDs and remove old ones
    const toRemove = [];
    for (const transactionId of this.processedTransactions) {
      try {
        // Transaction ID format: deviceId-timestamp-random
        const parts = transactionId.split('-');
        if (parts.length >= 2) {
          const timestamp = parseInt(parts[1]);
          if (!isNaN(timestamp) && (now - timestamp) > maxAge) {
            toRemove.push(transactionId);
          }
        }
      } catch (error) {
        // Invalid transaction ID, remove it
        toRemove.push(transactionId);
      }
    }
    
    // Remove old transactions
    for (const id of toRemove) {
      this.processedTransactions.delete(id);
    }
    
    if (toRemove.length > 0) {
      console.log(`Cleaned up ${toRemove.length} old transaction IDs`);
    }
  }
  
  /**
   * Subscribe to store changes to trigger sync
   */
  subscribeToStoreChanges() {
    // Unsubscribe if already subscribed
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
    }
    
    // Subscribe to all state changes
    this.storeUnsubscribe = useAppStore.subscribe(
      (state) => {
        // Only trigger sync if we're enabled and have a sync ID
        if (this.syncEnabled && this.syncId && networkMonitor.isOnline) {
          this.debouncedSync();
        }
      }
    );
    
    console.log('Subscribed to store changes for automatic sync');
  }
  
  /**
   * Debounced sync to avoid too frequent syncs
   */
  debouncedSync() {
    // Clear existing timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    
    // Set new timer
    this.syncDebounceTimer = setTimeout(() => {
      console.log('Store change detected, triggering sync...');
      this.requestSync({ priority: 'high', reason: 'store_change' });
    }, this.syncDebounceDelay);
  }
  
  /**
   * Sync with queue processing
   */
  async syncWithQueue() {
    try {
      // Check if sync is still enabled before processing
      if (!this.syncEnabled || !this.syncId) {
        console.log('Sync is disabled, skipping queue processing');
        return;
      }
      
      // Process any queued items first
      if (networkMonitor.isOnline) {
        await syncQueue.process(this);
      }
      
      // Then do regular sync with throttling
      await this.requestSync({ priority: 'normal' });
    } catch (error) {
      console.error('Sync with queue failed:', error);
    }
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
    
    // Stop transaction cleanup
    this.stopTransactionCleanup();
    
    // Also unsubscribe from store changes
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
      console.log('Unsubscribed from store changes');
    }
    
    // Clear any pending sync timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
  }
  
  /**
   * Handle network status changes
   */
  handleNetworkChange({ isOnline, wasOnline }) {
    if (__DEV__) {
      console.log('SyncService: Network changed', { isOnline, wasOnline });
    }
    
    if (!wasOnline && isOnline && this.syncEnabled) {
      console.log('SyncService: Back online, processing queue');
      // We're back online - process the queue
      setTimeout(() => {
        this.syncWithQueue();
      }, 2000); // Small delay to ensure network is stable
    }
    
    if (wasOnline && !isOnline) {
      this.updateSyncStatus('offline', 'No network connection');
    }
  }
  
  /**
   * Update sync status and notify listeners
   */
  updateSyncStatus(status, error = null) {
    this.syncStatus = status;
    this.syncError = error;
    
    const statusData = {
      status,
      error,
      lastAttempt: this.lastSyncAttempt,
      lastSuccess: this.lastSyncSuccess,
      isOnline: networkMonitor.isOnline,
      queueStatus: syncQueue.getStatus()
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
  
  /**
   * Add a sync status listener
   */
  addStatusListener(callback) {
    this.statusListeners.add(callback);
    
    // Immediately send current status
    callback({
      status: this.syncStatus,
      error: this.syncError,
      lastAttempt: this.lastSyncAttempt,
      lastSuccess: this.lastSyncSuccess,
      isOnline: networkMonitor.isOnline,
      queueStatus: syncQueue.getStatus(),
      hasConflicts: this.pendingConflicts.length > 0,
      conflictCount: this.pendingConflicts.length
    });
    
    // Return unsubscribe function
    return () => this.statusListeners.delete(callback);
  }
  
  /**
   * Add a conflict listener
   */
  addConflictListener(callback) {
    this.conflictListeners.add(callback);
    
    // Immediately send pending conflicts if any
    if (this.pendingConflicts.length > 0) {
      callback(this.pendingConflicts);
    }
    
    // Return unsubscribe function
    return () => this.conflictListeners.delete(callback);
  }
  
  /**
   * Notify conflict listeners
   */
  notifyConflictListeners(conflicts) {
    this.conflictListeners.forEach(callback => {
      try {
        callback(conflicts);
      } catch (err) {
        console.error('Conflict listener error:', err);
      }
    });
  }
  
  /**
   * Get sync queue status
   */
  getQueueStatus() {
    return syncQueue.getStatus();
  }
  
  /**
   * Retry failed sync items
   */
  async retryFailed() {
    const failed = syncQueue.getFailed();
    for (const item of failed) {
      await syncQueue.retry(item.id);
    }
    await this.syncWithQueue();
  }
  
  /**
   * Clear sync queue
   */
  async clearQueue() {
    await syncQueue.clear();
    this.updateSyncStatus(this.syncStatus);
  }
  
  /**
   * Resolve conflicts and continue sync
   */
  async resolveConflictsAndContinue(resolutions) {
    try {
      // Apply resolutions
      const finalState = conflictResolver.applyResolutions(resolutions);
      await this.applyState(finalState);
      
      // Clear pending conflicts
      this.pendingConflicts = [];
      
      // Push the resolved state
      console.log('sync: Pushing resolved state...');
      const pushResult = await this.pushData();
      
      // Update success status
      this.lastSyncSuccess = Date.now();
      this.updateSyncStatus('success');
      
      // Persist last sync success time
      await AsyncStorage.setItem('@sync_last_success', this.lastSyncSuccess.toString());
      
      // Mark changes as synced
      changeTracker.markAsSynced();
      
      return {
        success: true,
        version: pushResult.version,
        lastModified: pushResult.last_modified
      };
    } catch (error) {
      console.error('Failed to complete sync after conflict resolution:', error);
      this.updateSyncStatus('error', error.message);
      throw error;
    }
  }
  
  /**
   * Get pending conflicts
   */
  getPendingConflicts() {
    return this.pendingConflicts;
  }

  /**
   * Create a share link for provider access
   */
  async createShareLink(userId, options = {}) {
    if (!this.syncEnabled || !this.syncId) {
      throw new Error('Sync must be enabled to create share links');
    }

    const {
      recipientName = '',
      shareNote = '',
      includeCompleted = true,
      includeTomorrow = true,
      expiresHours = 24,
      autoUpdate = false
    } = options;
    
    // Always generate V2 secure token
    let accessToken = options.accessToken;
    if (!accessToken) {
      accessToken = this.generateShareToken();
    }

    try {
      // Get current state
      const state = useAppStore.getState();
      const user = state.users[userId];
      
      if (!user) {
        throw new Error('User not found');
      }

      // For local development, return a mock response
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.warn('Share links require deployment to stackmap.app. Returning mock data for local testing.');
          const mockUrl = `https://stackmap.app?share=${accessToken}`;
          return {
            share_id: 'mock-' + Date.now(),
            access_token: accessToken,
            expires_at: new Date(Date.now() + (expiresHours * 60 * 60 * 1000)).toISOString(),
            share_url: mockUrl
          };
        }
      }

      // Prepare user data for sharing
      const userData = {
        id: userId,
        name: user.name,
        icon: user.icon,
        days: user.days || {},
        settings: user.settings || {
          theme: state.currentTheme
        }
      };

      // Filter out deleted activities
      if (userData.days) {
        Object.keys(userData.days).forEach(day => {
          if (userData.days[day]?.activities) {
            userData.days[day].activities = userData.days[day].activities.filter(
              activity => !activity.deleted
            );
          }
        });
      }

      const deviceId = await encryptionService.getDeviceId();
      const deviceName = encryptionService.getDeviceName();

      // Always use V2: Zero-knowledge encrypted share
      // Filter data client-side
      let filteredUserData = { ...userData };
      
      if (!includeCompleted) {
        // Remove completed activities
        if (filteredUserData.days) {
          Object.keys(filteredUserData.days).forEach(day => {
            if (filteredUserData.days[day]?.activities) {
              filteredUserData.days[day].activities = filteredUserData.days[day].activities.filter(
                activity => !activity.completed
              );
            }
          });
        }
      }
      
      if (!includeTomorrow) {
        // Remove tomorrow data
        delete filteredUserData.days?.tomorrow;
      }
      
      // Create share data structure
      const shareData = {
        user: filteredUserData,
        shared_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + (expiresHours * 60 * 60 * 1000)).toISOString(),
        recipient_name: recipientName,
        share_note: shareNote,
        read_only: true,
        version: 2
      };
      
      // Encrypt with the token as the key
      let shareKey;
      if (this._lastShareKeyBytes) {
        // Use the raw bytes we generated
        shareKey = this._lastShareKeyBytes;
        // Clear it after use for security
        this._lastShareKeyBytes = null;
      } else {
        // Fallback: decode the token (for tokens passed in)
        const paddedToken = accessToken.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding if needed
        const padding = (4 - (paddedToken.length % 4)) % 4;
        const fullToken = paddedToken + '='.repeat(padding);
        shareKey = util.decodeBase64(fullToken);
      }
      
      // Use a simplified encryption for shares
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const messageBytes = util.decodeUTF8(JSON.stringify(shareData));
      const encrypted = nacl.secretbox(messageBytes, nonce, shareKey);
      
      // Combine nonce and ciphertext
      const combined = new Uint8Array(nonce.length + encrypted.length);
      combined.set(nonce);
      combined.set(encrypted, nonce.length);
      
      const encryptedData = util.encodeBase64(combined);
      
      const requestBody = {
        sync_id: this.syncId,
        user_id: userId,
        encrypted_data: encryptedData,
        access_token: accessToken,
        expires_hours: expiresHours,
        recipient_name: recipientName,
        share_note: shareNote,
        include_completed: includeCompleted,
        include_tomorrow: includeTomorrow,
        auto_update: autoUpdate,
        device_name: deviceName,
        share_version: 2
      };

      const shareUrl = `${SHARE_API_URL}/create_share.php`;
      console.log('Creating share at URL:', shareUrl);
      console.log('Share API URL base:', SHARE_API_URL);

      const response = await fetch(shareUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        // Try to parse as JSON first
        try {
          const error = JSON.parse(responseText);
          throw new Error(error.error || 'Failed to create share link');
        } catch (e) {
          // If not JSON, it's likely an HTML error page
          console.error('Share API returned non-JSON response:', responseText.substring(0, 200));
          throw new Error(`Share API error (${response.status}): Server returned invalid response`);
        }
      }

      // Parse the successful response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse share API response:', responseText.substring(0, 200));
        throw new Error('Invalid response from share API');
      }
      
      // Store share info locally for reference
      const shares = await this.getActiveShares();
      shares.push({
        shareId: result.share_id,
        token: result.access_token,
        userId,
        userName: user.name,
        recipientName,
        shareNote,
        includeCompleted,
        includeTomorrow,
        autoUpdate: options.autoUpdate || false,
        shareVersion: 2, // Always V2 now
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

  /**
   * Update an existing share with fresh data (V2 only)
   */
  async updateShare(token, userId) {
    if (!this.syncEnabled || !this.syncId) {
      throw new Error('Sync must be enabled to update shares');
    }

    try {
      // Extra safety check - only update tokens that look like V2
      if (!token || token.length < 24) {
        console.log(`Skipping invalid token ${token?.substring(0, 6) || 'null'}... - not a V2 token`);
        return;
      }
      // Get current state
      const state = useAppStore.getState();
      const user = state.users[userId];
      
      if (!user) {
        throw new Error('User not found');
      }

      // Get share metadata to apply same filters
      const shares = await this.getActiveShares();
      const shareInfo = shares.find(s => s.token === token);
      
      if (!shareInfo) {
        console.warn('Share not found locally, skipping update');
        return;
      }

      // Prepare user data (same as create)
      const userData = {
        id: userId,
        name: user.name,
        icon: user.icon,
        days: user.days || {},
        settings: user.settings || {
          theme: state.currentTheme
        }
      };

      // Filter out deleted activities
      if (userData.days) {
        Object.keys(userData.days).forEach(day => {
          if (userData.days[day]?.activities) {
            userData.days[day].activities = userData.days[day].activities.filter(
              activity => !activity.deleted
            );
          }
        });
      }

      // Apply same filters as original share
      let filteredUserData = { ...userData };
      
      if (!shareInfo.includeCompleted) {
        // Remove completed activities
        if (filteredUserData.days) {
          Object.keys(filteredUserData.days).forEach(day => {
            if (filteredUserData.days[day]?.activities) {
              filteredUserData.days[day].activities = filteredUserData.days[day].activities.filter(
                activity => !activity.completed
              );
            }
          });
        }
      }
      
      if (!shareInfo.includeTomorrow) {
        // Remove tomorrow data
        delete filteredUserData.days?.tomorrow;
      }
      
      // V2 only: Encrypted share
      const shareData = {
        user: filteredUserData,
        shared_at: shareInfo.createdAt, // Keep original creation time
        expires_at: shareInfo.expiresAt,
        recipient_name: shareInfo.recipientName,
        share_note: shareInfo.shareNote,
        read_only: true,
        version: 2,
        last_updated: new Date().toISOString() // Add update timestamp
      };
      
      // Encrypt with the same key
      let shareKey;
      try {
        // Validate token format before decoding
        if (!/^[A-Za-z0-9_-]+$/.test(token)) {
          console.log(`Invalid token characters in ${token.substring(0, 6)}..., skipping update`);
          return;
        }
        
        // Add padding back for base64 decoding
        const paddedToken = token.replace(/-/g, '+').replace(/_/g, '/');
        const padding = paddedToken.length % 4;
        const finalToken = paddedToken + (padding ? '='.repeat(4 - padding) : '');
        
        shareKey = util.decodeBase64(finalToken);
        
        // Verify key length for secretbox
        if (shareKey.length !== 32) {
          console.log(`Invalid key length ${shareKey.length} for ${token.substring(0, 6)}..., skipping update`);
          return;
        }
      } catch (error) {
        console.log(`Failed to decode token ${token.substring(0, 6)}...: ${error.message}`);
        return;
      }
      
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const messageBytes = util.decodeUTF8(JSON.stringify(shareData));
      const encrypted = nacl.secretbox(messageBytes, nonce, shareKey);
      
      const combined = new Uint8Array(nonce.length + encrypted.length);
      combined.set(nonce);
      combined.set(encrypted, nonce.length);
      
      const encryptedData = util.encodeBase64(combined);

      // For local development, skip API call
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('Share update skipped in local development');
          return;
        }
      }

      // Update on server
      const response = await fetch(`${SHARE_API_URL}/update_share.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: token,
          encrypted_data: encryptedData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update share');
      }

      console.log(`Share ${token.substring(0, 6)}... updated successfully`);
    } catch (error) {
      console.error('Failed to update share:', error);
      // Don't throw - we don't want share updates to break the app
    }
  }

  /**
   * Update all auto-update shares for a user (V2 only)
   */
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
          console.error(`Failed to update share ${share.token?.substring(0, 6)}...:`, error.message);
        }
      })
    );
  }

  /**
   * Check if user has any auto-update shares
   */
  async hasAutoUpdateShares(userId) {
    const shares = await this.getActiveShares();
    return shares.some(share => share.userId === userId && share.autoUpdate);
  }

  /**
   * Generate a V2 share token (always secure)
   */
  generateShareToken() {
    // Generate a secure token for v2 shares (encryption key)
    // We need 32 bytes for nacl.secretbox key
    const bytes = nacl.randomBytes(32); // 32 bytes for secretbox key
    const token = util.encodeBase64(bytes)
      .replace(/\+/g, '-')  // URL-safe
      .replace(/\//g, '_')
      .replace(/=/g, '');   // Remove padding
    
    // Store the raw bytes for use as encryption key
    this._lastShareKeyBytes = bytes;
    
    return token;
  }

  /**
   * Get active shares created by this device
   */
  async getActiveShares() {
    try {
      const stored = await AsyncStorage.getItem('@stackmap_shares');
      if (!stored) return [];
      
      const shares = JSON.parse(stored);
      const now = new Date();
      
      // Process shares to mark as idle if expired but within grace period
      const processedShares = shares.map(share => {
        const expiryDate = new Date(share.expiresAt);
        const gracePeriodEnd = new Date(expiryDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days grace
        
        if (expiryDate < now && gracePeriodEnd > now) {
          // Mark as idle if expired but within grace period
          return { ...share, status: 'idle' };
        } else if (expiryDate >= now) {
          // Still active
          return { ...share, status: 'active' };
        }
        // Return null for shares past grace period
        return null;
      });
      
      // Filter out null entries (shares past grace period)
      return processedShares.filter(share => share !== null);
    } catch (error) {
      console.error('Failed to get active shares:', error);
      return [];
    }
  }

  /**
   * Delete a share link
   */
  async deleteShare(shareId) {
    try {
      // First, delete from server
      const deleteUrl = `${SHARE_API_URL}/delete_share.php`;
      console.log('Deleting share from server:', shareId);
      
      const response = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          share_id: shareId
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        console.error('Server error deleting share:', result);
        // Continue to remove from local storage even if server fails
      } else {
        console.log('Share deleted from server successfully');
      }
      
      // Then remove from local storage
      const stored = await AsyncStorage.getItem('@stackmap_shares');
      const shares = stored ? JSON.parse(stored) : [];
      const filtered = shares.filter(share => share.shareId !== shareId);
      await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(filtered));
      
      return true;
    } catch (error) {
      console.error('Failed to delete share:', error);
      throw error;
    }
  }

  /**
   * Extend a share link
   */
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
      
      // If expired or idle, extend from now, otherwise extend from current expiry
      const baseTime = currentExpiry < now || share.status === 'idle' ? now : currentExpiry;
      const newExpiry = new Date(baseTime.getTime() + (additionalHours * 60 * 60 * 1000));
      
      shares[shareIndex] = {
        ...share,
        expiresAt: newExpiry.toISOString(),
        status: 'active', // Re-activate if it was idle
        extendedAt: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(shares));
      
      // In production, would also update the server
      console.log(`Extended share ${shareId} by ${additionalHours} hours`);
      
      return shares[shareIndex];
    } catch (error) {
      console.error('Failed to extend share:', error);
      throw error;
    }
  }
  
  /**
   * Get the API URL for sync operations
   */
  getApiUrl() {
    return API_BASE_URL;
  }
}

const syncService = new SyncService();
syncService.generateSyncId = syncService.generateSyncId.bind(syncService);
syncService.API_BASE_URL = API_BASE_URL;
syncService.encryptionService = encryptionService;

export default syncService;