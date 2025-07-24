import AsyncStorage from '@react-native-async-storage/async-storage';
import encryptionService from './encryptionService';
import { useAppStore } from '../../stores';
import syncQueue from './syncQueue';
import networkMonitor from './networkMonitor';
import changeTracker from './changeTracker';
import syncThrottle from './syncThrottle';
import conflictResolver from './conflictResolver';
import syncHistory from './syncHistory';

const API_BASE_URL = 'https://stackmap.app/api/sync';

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
    
    // Initialize network monitoring
    networkMonitor.start();
    
    // Listen for network changes
    this.networkUnsubscribe = networkMonitor.addListener(this.handleNetworkChange.bind(this));
    
    // Initialize sync queue
    syncQueue.initialize();
    
    // Start change tracking
    changeTracker.startTracking();
    
    // Initialize sync history
    syncHistory.initialize();
    
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
    
    // Add sync metadata
    const dataWithMetadata = {
      ...syncData,
      syncType,
      syncTimestamp: Date.now(),
      deviceInfo: {
        id: deviceId,
        name: deviceName
      }
    };
    
    // Encrypt the data (compression happens inside if beneficial)
    const encryptedBlob = encryptionService.encryptData(dataWithMetadata);
    
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

    try {
      // Pull latest data
      console.log('sync: Pulling latest data...');
      const remoteData = await this.pullData();
      
      if (remoteData && remoteData.version > this.lastSyncVersion) {
        console.log('sync: Remote data is newer, checking for conflicts...');
        
        // Decrypt remote data
        const decryptedData = encryptionService.decryptData(remoteData.encrypted_blob);
        
        // Get current local state
        const localState = this.getCurrentState();
        
        // Detect conflicts
        const conflicts = conflictResolver.detectConflicts(
          localState,
          decryptedData,
          this.lastSyncSuccess || 0
        );
        
        if (conflicts.length > 0) {
          console.log('sync: Found', conflicts.length, 'conflicts');
          
          // Try automatic resolution
          const resolutions = await conflictResolver.resolveConflicts(conflicts);
          
          if (resolutions.pending.length > 0) {
            // Need user input
            this.pendingConflicts = resolutions.pending;
            this.updateSyncStatus('conflicts', `${resolutions.pending.length} conflicts need your attention`);
            this.notifyConflictListeners(resolutions.pending);
            
            // Apply auto-resolved conflicts
            if (resolutions.resolved.length > 0) {
              const partialState = conflictResolver.applyResolutions(resolutions.resolved);
              await this.applyState(partialState);
            }
            
            // Don't complete sync until conflicts are resolved
            throw new Error('Sync paused: conflicts need resolution');
          } else {
            // All conflicts auto-resolved
            console.log('sync: Auto-resolved all conflicts');
            await this.applyState(resolutions.finalState);
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
      }
      
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
      
      console.log('restoreData: Patched state:', patchedState);
      useAppStore.setState(patchedState);
      return;
    }
    
    // Handle full sync data
    if (data.version === 3 && data.templates !== undefined) {
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
      
      // Get current state to preserve certain values
      const currentState = useAppStore.getState();
      
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
        // Preserve local hasCompletedOnboarding if not explicitly set in sync data
        hasCompletedOnboarding: hasCompletedOnboarding !== undefined ? hasCompletedOnboarding : currentState.hasCompletedOnboarding,
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
      
      const currentState = useAppStore.getState();
      
      const newState = {
        activities: activities || [],
        users: users || {},
        completedActivities: completedActivities || [],
        currentUser: currentUser || 'user_1',
        currentTheme: currentTheme || 'stackBlue',
        bannerPosition: bannerPosition || 'top',
        // Preserve local hasCompletedOnboarding if not explicitly set
        hasCompletedOnboarding: hasCompletedOnboarding !== undefined ? hasCompletedOnboarding : currentState.hasCompletedOnboarding
      };
      
      useAppStore.setState(newState);
    }
  }

  /**
   * Merge remote data with local data
   */
  async mergeData(remoteData) {
    // This is now only called when there are no conflicts
    // Just apply the remote data
    await this.restoreData(remoteData);
  }
  
  /**
   * Apply state from conflict resolution
   */
  async applyState(state) {
    // Apply the resolved state
    useAppStore.setState(state);
    
    // Mark as synced
    changeTracker.markAsSynced();
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
    this.syncWithQueue();
    
    // Set up interval
    this.syncInterval = setInterval(() => {
      this.syncWithQueue();
    }, this.syncIntervalDuration);
  }
  
  /**
   * Sync with queue processing
   */
  async syncWithQueue() {
    try {
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
  }
  
  /**
   * Handle network status changes
   */
  handleNetworkChange({ isOnline, wasOnline }) {
    console.log('SyncService: Network changed', { isOnline, wasOnline });
    
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
}

export default new SyncService();