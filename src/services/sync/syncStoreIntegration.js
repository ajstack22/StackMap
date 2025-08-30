/**
 * PHASE 2: STORE INTEGRATION LAYER
 * 
 * Connects minimal sync service to Zustand stores
 * Handles data normalization and proper store updates
 * 
 * PHASE 4 UPDATE: Added field-level timestamp tracking for conflict resolution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import minimalSync from './minimalSyncService';
import conflictResolver from './conflictResolver';
import { useUserStore, useSettingsStore, useLibraryStore } from '../../stores';
import { normalizeSyncData } from '../../utils/dataNormalizer';

class SyncStoreIntegration {
  constructor() {
    console.log('[SyncStore] 🔗 Integration layer initialized');
    this.isInitialized = false;
    this.isSyncing = false;
    this.lastPushTime = 0;
    this.changeDebounceTimer = null;
    this.changeDebounceDelay = 5000; // 5 seconds after changes
    
    // Track field-level timestamps for conflict resolution
    this.fieldTimestamps = {
      users: 0,
      activities: 0,
      settings: 0,
      library: 0
    };
    
    // Bind methods
    this.handleDataReceived = this.handleDataReceived.bind(this);
    this.handleStoreChange = this.handleStoreChange.bind(this);
  }

  /**
   * Initialize sync integration
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[SyncStore] Already initialized');
      return;
    }

    console.log('[SyncStore] 🚀 Initializing sync integration');
    
    // Load existing sync ID into minimalSync first
    await minimalSync.loadExistingSyncId();
    
    // Check if we have an existing sync
    const syncId = await AsyncStorage.getItem('@minimal_sync_id');
    if (syncId) {
      console.log('[SyncStore] Found existing sync:', syncId);
      
      // Enable periodic sync with our callback
      minimalSync.enableSync(this.handleDataReceived);
      
      // Subscribe to store changes
      this.subscribeToStores();
      
      console.log('[SyncStore] ✅ Sync enabled for existing sync:', syncId);
    } else {
      console.log('[SyncStore] No existing sync found');
    }
    
    this.isInitialized = true;
  }

  /**
   * Subscribe to store changes for automatic sync
   */
  subscribeToStores() {
    console.log('[SyncStore] 📡 Subscribing to store changes');
    
    // Subscribe to all stores with field tracking
    const unsubUser = useUserStore.subscribe(() => {
      this.fieldTimestamps.users = Date.now();
      this.handleStoreChange('users');
    });
    
    const unsubSettings = useSettingsStore.subscribe(() => {
      this.fieldTimestamps.settings = Date.now();
      this.handleStoreChange('settings');
    });
    
    const unsubLibrary = useLibraryStore.subscribe(() => {
      this.fieldTimestamps.library = Date.now();
      this.handleStoreChange('library');
    });
    
    // Store unsubscribe functions
    this.unsubscribers = [unsubUser, unsubSettings, unsubLibrary];
  }

  /**
   * Handle store changes - debounced push
   */
  handleStoreChange(field = null) {
    // Don't sync if we're currently receiving data
    if (this.isSyncing) {
      console.log('[SyncStore] ⏸️ Skipping change during sync');
      return;
    }

    if (field) {
      console.log(`[SyncStore] 📝 ${field} changed`);
    }

    // Clear existing debounce timer
    if (this.changeDebounceTimer) {
      clearTimeout(this.changeDebounceTimer);
    }

    // Set new debounce timer
    this.changeDebounceTimer = setTimeout(() => {
      this.pushCurrentState();
    }, this.changeDebounceDelay);
  }

  /**
   * Get current state from all stores
   */
  getCurrentState() {
    const userState = useUserStore.getState();
    const libraryState = useLibraryStore.getState();
    const settingsState = useSettingsStore.getState();
    
    const state = {
      // Users is an object, not array
      users: userState.users || {},
      currentUser: userState.currentUser,
      currentDay: userState.currentDay,
      userContextData: userState.userContextData || {},
      
      // Library data - match actual store structure
      library: libraryState.library || {
        activities: [],
        categories: [],
        templates: [],
        userAddedActivityIds: []
      },
      
      // Settings
      settings: settingsState || {},
      
      // Include metadata for conflict resolution
      metadata: {
        lastModified: Date.now(),
        deviceId: minimalSync.deviceId,
        fieldTimestamps: { ...this.fieldTimestamps },
        version: 2 // Store integration version
      }
    };

    // Normalize the data to ensure field consistency
    const normalized = normalizeSyncData(state);
    
    // Preserve metadata after normalization
    if (!normalized.metadata) {
      normalized.metadata = state.metadata;
    }
    
    console.log('[SyncStore] 📊 Current state:', {
      userCount: Object.keys(normalized.users || {}).length,
      libraryActivities: normalized.library?.activities?.length || 0,
      hasSettings: !!normalized.settings,
      fieldTimestamps: state.metadata.fieldTimestamps
    });
    
    return normalized;
  }

  /**
   * Apply synced state to stores
   */
  async applyState(syncedData) {
    console.log('[SyncStore] 📥 Applying synced state');
    
    // Set flag to prevent change detection during update
    this.isSyncing = true;
    
    try {
      // Normalize incoming data
      const normalized = normalizeSyncData(syncedData);
      
      // Update stores using proper methods
      // Users is an object, not array
      if (normalized.users && typeof normalized.users === 'object') {
        console.log(`[SyncStore] Setting ${Object.keys(normalized.users).length} users`);
        useUserStore.getState().setUsers(normalized.users);
      }
      
      // Set other user store properties
      if (normalized.currentUser) {
        useUserStore.getState().setCurrentUser(normalized.currentUser);
      }
      if (normalized.currentDay) {
        useUserStore.getState().setCurrentDay(normalized.currentDay);
      }
      if (normalized.userContextData) {
        useUserStore.getState().setUserContextData(normalized.userContextData);
      }
      
      // Update library store - handle both object and array formats
      if (normalized.library) {
        if (typeof normalized.library === 'object' && !Array.isArray(normalized.library)) {
          // Library is an object with activities, categories, etc.
          console.log(`[SyncStore] Setting library object`);
          useLibraryStore.getState().setLibrary(normalized.library);
        } else if (Array.isArray(normalized.library)) {
          // Legacy format - library is just an array of activities
          console.log(`[SyncStore] Setting ${normalized.library.length} library items (legacy format)`);
          useLibraryStore.getState().setLibrary({
            activities: normalized.library,
            categories: [],
            templates: [],
            userAddedActivityIds: []
          });
        }
      }
      
      // Update settings
      if (normalized.settings) {
        console.log('[SyncStore] Updating settings');
        useSettingsStore.getState().updateSettings(normalized.settings);
      }
      
      // Force immediate persistence
      await this.flushStores();
      
      // Create backup as failsafe
      await this.createBackup(normalized);
      
      console.log('[SyncStore] ✅ State applied and persisted');
    } catch (error) {
      console.error('[SyncStore] ❌ Error applying state:', error);
      throw error;
    } finally {
      // Re-enable change detection after a delay
      setTimeout(() => {
        this.isSyncing = false;
      }, 1000);
    }
  }

  /**
   * Force flush all store persistence
   */
  async flushStores() {
    console.log('[SyncStore] 💾 Flushing stores to storage');
    
    // Flush each store's persist middleware
    const flushPromises = [];
    
    if (useUserStore.persist && typeof useUserStore.persist.flush === 'function') {
      flushPromises.push(useUserStore.persist.flush());
    }
    
    if (useSettingsStore.persist && typeof useSettingsStore.persist.flush === 'function') {
      flushPromises.push(useSettingsStore.persist.flush());
    }
    
    if (useLibraryStore.persist && typeof useLibraryStore.persist.flush === 'function') {
      flushPromises.push(useLibraryStore.persist.flush());
    }
    
    await Promise.all(flushPromises);
    console.log('[SyncStore] ✅ All stores flushed');
  }

  /**
   * Create backup of synced data
   */
  async createBackup(data) {
    try {
      await AsyncStorage.setItem('@sync_state_backup', JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('[SyncStore] 💾 Backup created');
    } catch (error) {
      console.error('[SyncStore] Error creating backup:', error);
    }
  }

  /**
   * Restore from backup if needed
   */
  async restoreFromBackup() {
    try {
      const backup = await AsyncStorage.getItem('@sync_state_backup');
      if (backup) {
        const { data, timestamp } = JSON.parse(backup);
        console.log('[SyncStore] 📦 Found backup from', new Date(timestamp).toLocaleString());
        
        // Check if stores are empty
        const currentState = this.getCurrentState();
        const isEmpty = (!currentState.users || Object.keys(currentState.users).length === 0) &&
                       (!currentState.library || !currentState.library.activities || currentState.library.activities.length === 0);
        
        if (isEmpty && data) {
          console.log('[SyncStore] 🔄 Restoring from backup');
          await this.applyState(data);
          return true;
        }
      }
    } catch (error) {
      console.error('[SyncStore] Error restoring backup:', error);
    }
    return false;
  }

  /**
   * Handle data received from sync
   */
  async handleDataReceived(syncedData) {
    console.log('[SyncStore] 📨 Received sync data');
    
    // Get current state for conflict resolution
    const currentState = this.getCurrentState();
    
    // Perform conflict resolution
    console.log('[SyncStore] 🔀 Resolving conflicts...');
    const mergedData = conflictResolver.mergeStates(currentState, syncedData);
    
    // Check if there were conflicts
    const mergeLog = conflictResolver.getMergeLog();
    if (mergeLog.length > 0) {
      console.log('[SyncStore] 📊 Conflict resolution summary:');
      mergeLog.slice(-5).forEach(entry => {
        console.log(`  - ${entry.message}`);
      });
    }
    
    // Apply the merged state
    await this.applyState(mergedData);
    
    // Update our field timestamps from merged data
    if (mergedData.metadata?.fieldTimestamps) {
      this.fieldTimestamps = { ...mergedData.metadata.fieldTimestamps };
    }
  }

  /**
   * Push current state to sync
   */
  async pushCurrentState() {
    // Rate limit pushes (5 second minimum between pushes)
    const now = Date.now();
    if (now - this.lastPushTime < 5000) {
      console.log('[SyncStore] ⏸️ Rate limiting push (too soon)');
      return;
    }

    console.log('[SyncStore] 📤 Pushing current state');
    this.lastPushTime = now;
    
    try {
      const currentState = this.getCurrentState();
      const result = await minimalSync.pushDataWithRetry(currentState);
      
      if (result.success) {
        console.log('[SyncStore] ✅ State pushed successfully');
      } else {
        console.error('[SyncStore] ❌ Push failed:', result.error);
        
        // If it was a rate limit error, schedule a retry
        if (result.rateLimited) {
          console.log('[SyncStore] 🔄 Scheduling retry due to rate limit');
          setTimeout(() => {
            console.log('[SyncStore] 🔁 Retrying push after rate limit');
            this.pushCurrentState();
          }, 10000); // Retry after 10 seconds
        }
      }
    } catch (error) {
      console.error('[SyncStore] ❌ Push error:', error);
    }
  }

  /**
   * Create new sync with current state
   */
  async createSync() {
    console.log('[SyncStore] 🆕 Creating new sync');
    
    const currentState = this.getCurrentState();
    const result = await minimalSync.createSync(currentState);
    
    if (result.success) {
      console.log('[SyncStore] ✅ Sync created:', result.syncId);
      console.log('[SyncStore] 📝 Result contains:', result);
      console.log('[SyncStore] 🔑 Recovery phrase from result:', result.recoveryPhrase);
      console.log('[SyncStore] 🔑 Recovery phrase from minimalSync:', minimalSync.recoveryPhrase);
      
      // Enable periodic sync
      minimalSync.enableSync(this.handleDataReceived);
      console.log('[SyncStore] ✅ Periodic sync enabled');
      
      // Subscribe to store changes if not already subscribed
      if (!this.unsubscribers) {
        this.subscribeToStores();
      }
      
      this.isInitialized = true;
      
      // Return both sync ID and recovery phrase for display
      return { 
        syncId: result.syncId, 
        recoveryPhrase: result.recoveryPhrase || minimalSync.recoveryPhrase || 'NOT_FOUND'
      };
    } else {
      console.error('[SyncStore] ❌ Create sync failed:', result.error);
      throw new Error(result.error);
    }
  }

  /**
   * Join existing sync
   */
  async joinSync(syncId) {
    console.log('[SyncStore] 🔗 Joining sync:', syncId);
    
    const result = await minimalSync.joinSync(syncId);
    
    if (result.success) {
      console.log('[SyncStore] ✅ Joined sync successfully');
      
      // Apply the received data (conflict resolution will handle merging)
      if (result.data) {
        await this.handleDataReceived(result.data);
      }
      
      // Enable periodic sync
      minimalSync.enableSync(this.handleDataReceived);
      console.log('[SyncStore] ✅ Periodic sync enabled - can push immediately');
      
      // Subscribe to store changes if not already subscribed
      if (!this.unsubscribers) {
        this.subscribeToStores();
      }
      
      this.isInitialized = true;
      
      return true;
    } else {
      console.error('[SyncStore] ❌ Join sync failed:', result.error);
      throw new Error(result.error);
    }
  }

  /**
   * Disable sync
   */
  disableSync() {
    console.log('[SyncStore] 🛑 Disabling sync');
    
    // Disable minimal sync
    minimalSync.disableSync();
    
    // Unsubscribe from stores
    if (this.unsubscribers) {
      this.unsubscribers.forEach(unsub => unsub());
      this.unsubscribers = null;
    }
    
    // Clear timers
    if (this.changeDebounceTimer) {
      clearTimeout(this.changeDebounceTimer);
      this.changeDebounceTimer = null;
    }
    
    this.isInitialized = false;
  }

  /**
   * Clear all sync data
   */
  async clearAll() {
    console.log('[SyncStore] 🗑️ Clearing all sync data');
    
    this.disableSync();
    await minimalSync.clearAll();
    await AsyncStorage.removeItem('@sync_state_backup');
    
    this.lastPushTime = 0;
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isEnabled: minimalSync.isEnabled,
      syncId: minimalSync.syncId,
      recoveryPhrase: minimalSync.recoveryPhrase,
      canPushImmediately: true // No more protection period!
    };
  }

  // ============================================
  // Compatibility methods for existing app usage
  // ============================================

  /**
   * Check if sync is enabled (async for compatibility)
   */
  async isEnabled() {
    return minimalSync.isEnabled;
  }

  /**
   * Enable sync (compatibility method)
   * If a recovery phrase is provided, create a new sync with it
   */
  async enable(recoveryPhrase = null) {
    if (recoveryPhrase) {
      // Creating a new sync with the provided recovery phrase
      console.log('[SyncStore] Creating new sync from enable()');
      const result = await this.createSync();
      return result;
    }
    
    if (!minimalSync.syncId) {
      throw new Error('No sync ID - create or join a sync first');
    }
    minimalSync.enableSync(this.handleDataReceived);
    return true;
  }

  /**
   * Disable sync (compatibility method)
   */
  async disable() {
    this.disableSync();
    return true;
  }

  /**
   * Initialize for import (used by onboarding)
   */
  async initializeForImport(recoveryPhrase) {
    console.log('[SyncStore] Initializing for import with recovery phrase');
    
    // Join the sync with the recovery phrase
    const result = await this.joinSync(recoveryPhrase);
    
    if (!result) {
      throw new Error('Failed to join sync');
    }
    
    return true;
  }

  /**
   * Generate sync ID from recovery phrase (for preview)
   */
  async generateSyncId(recoveryPhrase) {
    return minimalSync.generateSyncId(recoveryPhrase);
  }

  /**
   * Pull data without enabling sync (for preview)
   */
  async pullWithoutEnabling(syncId) {
    console.log('[SyncStore] Pulling data for preview');
    
    // Temporarily set sync ID for the pull
    const originalSyncId = minimalSync.syncId;
    minimalSync.syncId = syncId;
    
    try {
      const result = await minimalSync.pullLatestData();
      
      // Restore original sync ID
      minimalSync.syncId = originalSyncId;
      
      if (result.success && result.data) {
        return {
          encrypted_blob: result.data.encrypted_blob || result.data
        };
      }
      
      return null;
    } catch (error) {
      // Restore original sync ID
      minimalSync.syncId = originalSyncId;
      throw error;
    }
  }

  /**
   * Pull data (compatibility)
   */
  async pullData() {
    return this.pullWithoutEnabling(minimalSync.syncId);
  }

  /**
   * Check for auto-update shares (stub for compatibility)
   */
  async hasAutoUpdateShares(userId) {
    // Not implemented in new system yet
    return false;
  }

  /**
   * Update active shares (stub for compatibility)
   */
  async updateActiveShares(userId) {
    // Not implemented in new system yet
    return true;
  }

  /**
   * Get status (compatibility method)
   */
  getStatus() {
    return this.getSyncStatus();
  }

  /**
   * Request sync (compatibility method)
   * Our system already auto-syncs on changes, so this is mostly a no-op
   */
  async requestSync(options = {}) {
    console.log('[SyncStore] Sync requested (auto-sync already active)');
    
    // If we have a sync ID and are enabled, trigger a push
    if (minimalSync.syncId && minimalSync.isEnabled) {
      // Use the delay if specified
      if (options.delay) {
        setTimeout(() => {
          this.pushCurrentState();
        }, options.delay);
      } else if (options.immediate) {
        await this.pushCurrentState();
      }
    }
    
    return true;
  }

  /**
   * Compatibility flags
   */
  get enabled() {
    return minimalSync.isEnabled;
  }

  get syncEnabled() {
    return minimalSync.isEnabled;
  }

  get syncInProgress() {
    return this.isSyncing;
  }
}

// Export singleton
export default new SyncStoreIntegration();