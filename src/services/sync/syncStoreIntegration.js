/**
 * PHASE 2: STORE INTEGRATION LAYER
 * 
 * Connects minimal sync service to Zustand stores
 * Handles data normalization and proper store updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import minimalSync from './minimalSyncService';
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
    this.protectionPeriodEnd = 0;
    
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
      
      // Check protection period
      const joinTime = await AsyncStorage.getItem('@minimal_sync_join_time');
      if (joinTime) {
        const msRemaining = 60000 - (Date.now() - parseInt(joinTime, 10));
        if (msRemaining > 0) {
          this.protectionPeriodEnd = Date.now() + msRemaining;
          console.log(`[SyncStore] Protection period active for ${Math.ceil(msRemaining/1000)}s`);
        }
      }
      
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
    
    // Subscribe to all stores
    const unsubUser = useUserStore.subscribe(() => this.handleStoreChange());
    const unsubSettings = useSettingsStore.subscribe(() => this.handleStoreChange());
    const unsubLibrary = useLibraryStore.subscribe(() => this.handleStoreChange());
    
    // Store unsubscribe functions
    this.unsubscribers = [unsubUser, unsubSettings, unsubLibrary];
  }

  /**
   * Handle store changes - debounced push
   */
  handleStoreChange() {
    // Don't sync if we're currently receiving data
    if (this.isSyncing) {
      console.log('[SyncStore] ⏸️ Skipping change during sync');
      return;
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
      
      // Include metadata
      timestamp: Date.now(),
      deviceId: minimalSync.deviceId,
      version: 2 // Store integration version
    };

    // Normalize the data to ensure field consistency
    const normalized = normalizeSyncData(state);
    
    console.log('[SyncStore] 📊 Current state:', {
      userCount: Object.keys(normalized.users || {}).length,
      libraryActivities: normalized.library?.activities?.length || 0,
      hasSettings: !!normalized.settings
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
    
    // Apply the synced state
    await this.applyState(syncedData);
  }

  /**
   * Push current state to sync
   */
  async pushCurrentState() {
    // Check protection period
    if (Date.now() < this.protectionPeriodEnd) {
      const secondsRemaining = Math.ceil((this.protectionPeriodEnd - Date.now()) / 1000);
      console.log(`[SyncStore] ⏳ Protection period active: ${secondsRemaining}s remaining`);
      
      // Schedule retry after protection period
      setTimeout(() => {
        this.pushCurrentState();
      }, secondsRemaining * 1000);
      
      return;
    }

    // Rate limit pushes
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
      
      // Enable periodic sync
      minimalSync.enableSync(this.handleDataReceived);
      console.log('[SyncStore] ✅ Periodic sync enabled');
      
      // Subscribe to store changes if not already subscribed
      if (!this.unsubscribers) {
        this.subscribeToStores();
      }
      
      this.isInitialized = true;
      
      return result.syncId;
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
      
      // Apply the received data
      if (result.data) {
        await this.applyState(result.data);
      }
      
      // Update protection period
      this.protectionPeriodEnd = Date.now() + 60000;
      
      // Enable periodic sync
      minimalSync.enableSync(this.handleDataReceived);
      console.log('[SyncStore] ✅ Periodic sync enabled');
      
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
    
    this.protectionPeriodEnd = 0;
    this.lastPushTime = 0;
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      isEnabled: minimalSync.isEnabled,
      syncId: minimalSync.syncId,
      hasProtectionPeriod: Date.now() < this.protectionPeriodEnd,
      protectionSecondsRemaining: Math.max(0, Math.ceil((this.protectionPeriodEnd - Date.now()) / 1000))
    };
  }
}

// Export singleton
export default new SyncStoreIntegration();