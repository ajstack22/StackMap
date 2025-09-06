/**
 * PHASE 2: STORE INTEGRATION LAYER
 * 
 * Connects minimal sync service to Zustand stores
 * Handles data normalization and proper store updates
 * 
 * PHASE 4 UPDATE: Added field-level timestamp tracking for conflict resolution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import minimalSync from './minimalSyncService';
import conflictResolver from './conflictResolver';
// Use fixed encryption service that works on iOS
import encryptionService from './encryptionServiceFixed';
import { useUserStore, useSettingsStore, useLibraryStore } from '../../stores';
import { normalizeSyncData } from '../../utils/dataNormalizer';
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

class SyncStoreIntegration {
  constructor() {
    console.log('[SyncStore] 🔗 Integration layer initialized v39');
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
    
    // Status listeners for UI updates
    this.statusListeners = new Set();
    
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
    console.log('[SyncStore] After loadExistingSyncId - minimalSync state:', {
      syncId: minimalSync.syncId,
      isEnabled: minimalSync.isEnabled,
      encryptionReady: minimalSync.encryptionReady,
      recoveryPhrase: !!minimalSync.recoveryPhrase
    });
    
    if (syncId && minimalSync.encryptionReady) {
      console.log('[SyncStore] Found existing sync:', syncId);
      
      // Enable periodic sync with our callback
      minimalSync.enableSync(this.handleDataReceived);
      console.log('[SyncStore] After enableSync - minimalSync.isEnabled:', minimalSync.isEnabled);
      
      // Subscribe to store changes
      this.subscribeToStores();
      
      // Do an initial pull to get latest data
      console.log('[SyncStore] 🔄 Performing initial sync on app load');
      try {
        const pullResult = await minimalSync.pullData();
        if (pullResult.success && pullResult.data) {
          await this.handleDataReceived(pullResult.data);
          console.log('[SyncStore] ✅ Initial sync complete');
        }
      } catch (error) {
        console.error('[SyncStore] Initial sync failed:', error);
      }
      
      console.log('[SyncStore] ✅ Sync enabled for existing sync:', syncId);
    } else {
      console.log('[SyncStore] No existing sync found or encryption not ready');
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
      console.log(`[SyncStore] 📝 ${field} changed - pushing immediately`);
    }
    
    // Push immediately to reduce conflicts
    this.pushCurrentState();

    // Debounce the pull to avoid too many requests
    if (this.changeDebounceTimer) {
      clearTimeout(this.changeDebounceTimer);
    }

    // Pull after a short delay to get any other changes
    this.changeDebounceTimer = setTimeout(async () => {
      console.log('[SyncStore] ⏰ Pulling latest changes');
      const pullResult = await minimalSync.pullData();
      if (pullResult.success && pullResult.data) {
        await this.handleDataReceived(pullResult.data);
      }
    }, 1000); // 1 second debounce for pulls
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
    
    console.log('[SyncStore] 📊 Current state details:');
    console.log('[SyncStore]   - Users count:', Object.keys(state.users || {}).length);
    console.log('[SyncStore]   - User IDs:', Object.keys(state.users || {}));
    console.log('[SyncStore]   - Library activities:', state.library?.activities?.length || 0);
    console.log('[SyncStore]   - Library categories:', state.library?.categories?.length || 0);
    console.log('[SyncStore]   - Has settings:', !!state.settings);
    console.log('[SyncStore]   - Current user:', state.currentUser);
    
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
    this.isSyncing = true;
    this.notifyStatusListeners('syncing');
    
    try {
      const currentState = this.getCurrentState();
      const result = await minimalSync.pushDataWithRetry(currentState);
      
      if (result.success) {
        console.log('[SyncStore] ✅ State pushed successfully');
        this.notifyStatusListeners('idle');
      } else {
        console.error('[SyncStore] ❌ Push failed:', result.error);
        this.notifyStatusListeners('error');
        
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
      this.notifyStatusListeners('error');
    } finally {
      this.isSyncing = false;
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
   * Create method alias (for DataModal compatibility)
   */
  async create() {
    return this.createSync();
  }

  /**
   * Join existing sync
   */
  async joinSync(recoveryPhrase) {
    console.log('[SyncStore] 🔗 Joining sync with recovery phrase');
    
    const result = await minimalSync.joinSync(recoveryPhrase);
    
    if (result.success) {
      console.log('[SyncStore] ✅ Joined sync successfully');
      
      // IMPORTANT: When joining a sync, we completely replace local data
      // with remote data - no merging. This is intentional to ensure
      // the device fully adopts the sync group's state.
      if (result.data) {
        console.log('[SyncStore] 📥 Replacing local data with sync group data (no merge)');
        await this.applyState(result.data);
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
      // Check if the error is because sync doesn't exist (404)
      const is404 = result.error && (
        result.error.includes('404') || 
        result.error.includes('not found') || 
        result.error.includes('Sync group not found') || 
        result.error.includes('does not exist')
      );
      
      if (is404) {
        // Sync group doesn't exist, create it with the recovery phrase
        // This will use the same sync ID derived from the recovery phrase
        const createResult = await this.createSync();
        
        if (createResult) {
          return { ...createResult, isNewSync: true };
        }
      }
      
      // Only throw error if it's not a 404 or if create failed
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
    // Check both if sync is enabled AND if we have a sync ID
    const result = minimalSync.isEnabled && !!minimalSync.syncId;
    console.log('[SyncStore] isEnabled check:', {
      minimalSync_isEnabled: minimalSync.isEnabled,
      minimalSync_syncId: minimalSync.syncId,
      returning: result
    });
    return result;
  }

  /**
   * Enable sync (compatibility method)
   * If a recovery phrase is provided, create a new sync with it
   */
  async enable(recoveryPhrase = null) {
    if (recoveryPhrase) {
      // Joining existing sync with the provided recovery phrase
      console.log('[SyncStore] 🔗 Joining sync from enable() with recovery phrase');
      const result = await this.joinSync(recoveryPhrase);
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
      const result = await minimalSync.pullData();
      
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
   * Pull latest data (compatibility method)
   */
  async pullLatestData() {
    console.log('[SyncStore] Pulling latest data');
    
    if (!minimalSync.syncId) {
      throw new Error('No sync ID set');
    }
    
    const result = await minimalSync.pullData();
    
    if (result.success && result.data) {
      // Handle the received data
      await this.handleDataReceived(result.data);
      return result;
    }
    
    return result;
  }

  /**
   * Initialize encryption (for onboarding)
   */
  async initializeEncryption(recoveryPhrase, syncId) {
    console.log('[SyncStore] Initializing encryption for onboarding', { syncId });
    // CRITICAL: Set the syncId on minimalSync so pullData works
    minimalSync.syncId = syncId;
    await minimalSync.initializeEncryption(recoveryPhrase, syncId);
  }
  
  /**
   * Pull data directly (for onboarding preview)
   * @param {boolean} forceFullPull - If true, pulls all data ignoring timestamps (for initial sync)
   */
  async pullData(forceFullPull = false) {
    console.log('[SyncStore] Direct pullData called, forceFullPull:', forceFullPull);
    console.log('[SyncStore] minimalSync.syncId:', minimalSync.syncId);
    console.log('[SyncStore] minimalSync.encryptionReady:', minimalSync.encryptionReady);
    
    // Direct pass-through to minimalSync for onboarding preview
    // This doesn't update stores, just returns the raw data
    return await minimalSync.pullData(forceFullPull);
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
   * Generate share token for secure sharing (V2 legacy format)
   */
  generateShareToken(isAutoUpdate = false) {
    // For V3, generate both ID and key
    const { shareId, encryptionKey } = this.generateV3ShareComponents();
    
    // Return just the key for backward compatibility
    // The shareId will be used separately
    this._lastShareId = shareId;
    return encryptionKey;
  }
  
  /**
   * Generate V3 share ID and key components
   */
  generateV3ShareComponents() {
    // Generate a short ID (8 chars hex)
    const idBytes = nacl.randomBytes(4);
    const shareId = Array.from(idBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Generate encryption key (32 bytes)
    const keyBytes = nacl.randomBytes(32);
    this._lastShareKeyBytes = keyBytes;
    
    // Convert key to URL-safe base64
    const fullToken = encodeBase64(keyBytes);
    const encryptionKey = fullToken
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    return { shareId, encryptionKey };
  }

  /**
   * Create share link (stub for compatibility)
   */
  async createShareLink(userId, options = {}) {
    if (!minimalSync.isEnabled || !minimalSync.syncId) {
      throw new Error('Sync must be enabled to create share links');
    }

    const {
      recipientName = '',
      shareNote = '',
      includeCompleted = true,
      includeTomorrow = true,
      expiresHours = 24,
      autoUpdate = false,
    } = options;

    // Always generate V2 secure token
    let accessToken = options.accessToken;
    if (!accessToken) {
      accessToken = this.generateShareToken();
    }

    try {
      // Get current state
      const userStore = useUserStore.getState();
      const settingsStore = useSettingsStore.getState();
      const user = userStore.users[userId];
      
      if (!user) {
        throw new Error('User not found');
      }

      // For local development, return a mock response
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          if (__DEV__) {
            console.warn('Share links require deployment to stackmap.app. Returning mock data for local testing.');
          }
          const mockUrl = `https://stackmap.app?share=${accessToken}`;
          return {
            share_id: 'mock-' + Date.now(),
            access_token: accessToken,
            expires_at: new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString(),
            share_url: mockUrl,
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
          theme: settingsStore.currentTheme,
        },
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

      const deviceName = encryptionService.getDeviceName();

      // Filter data client-side based on options
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
        expires_at: new Date(Date.now() + expiresHours * 60 * 60 * 1000).toISOString(),
        recipient_name: recipientName,
        share_note: shareNote,
        read_only: true,
        version: 2,
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
        shareKey = decodeBase64(fullToken);
      }

      // Use a simplified encryption for shares
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const messageBytes = decodeUTF8(JSON.stringify(shareData));
      const encrypted = nacl.secretbox(messageBytes, nonce, shareKey);

      // Combine nonce and ciphertext
      const combined = new Uint8Array(nonce.length + encrypted.length);
      combined.set(nonce);
      combined.set(encrypted, nonce.length);
      const encryptedData = encodeBase64(combined);

      // Get API URL based on environment
      const getShareApiUrl = () => {
        // Mobile builds use production API (release builds will hit production)
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          // Note: Debug/release detection happens in minimalSyncService.js
          return 'https://stackmap.app/api/sync';
        }
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (pathname.includes('/qual/')) {
            return 'https://stackmap.app/qual/api/sync';
          }
        }
        return 'https://stackmap.app/api/sync';
      };

      const SHARE_API_URL = getShareApiUrl();
      const requestBody = {
        sync_id: minimalSync.syncId,
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
        share_version: 3,  // Use new secure version
      };

      const shareUrl = `${SHARE_API_URL}/create_share.php`;
      const response = await fetch(shareUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      if (!response.ok) {
        // Try to parse as JSON first
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch (e) {
          throw new Error(`Failed to create share: ${responseText}`);
        }
      }

      const result = JSON.parse(responseText);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create share link');
      }

      // For V3, the share_url is /share/[id] and we append the key as fragment
      // The access_token is the encryption key
      const secureShareUrl = result.share_url + '#' + (result.access_token || accessToken);
      
      // Store share info locally for later management
      const shareInfo = {
        shareId: result.share_id,
        userId,
        recipientName,
        shareNote,
        expiresAt: result.expires_at,
        shareUrl: secureShareUrl,  // Use secure URL with fragment
        accessToken: result.access_token || accessToken,
        createdAt: new Date().toISOString(),
        autoUpdate,
      };

      // Get existing shares and add new one
      const stored = await AsyncStorage.getItem('@stackmap_shares');
      const shares = stored ? JSON.parse(stored) : [];
      shares.push(shareInfo);
      await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(shares));

      return {
        share_id: result.share_id,
        access_token: result.access_token || accessToken,
        expires_at: result.expires_at,
        share_url: secureShareUrl,  // Return secure URL with fragment
      };
    } catch (error) {
      console.error('[SyncStore] Failed to create share link:', error);
      throw error;
    }
  }

  /**
   * Get status (compatibility method)
   */
  getStatus() {
    return this.getSyncStatus();
  }

  /**
   * Add status listener for UI updates
   */
  addStatusListener(listener) {
    this.statusListeners.add(listener);
    
    // Immediately send current status
    const currentStatus = {
      status: minimalSync.isEnabled ? 'idle' : 'disabled',
      syncEnabled: minimalSync.isEnabled,
      syncId: minimalSync.syncId,
      lastSuccess: this.lastPushTime,
      isSyncing: this.isSyncing
    };
    
    listener(currentStatus);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Remove status listener
   */
  removeStatusListener(listener) {
    this.statusListeners.delete(listener);
  }

  /**
   * Notify all status listeners
   */
  notifyStatusListeners(status) {
    const statusUpdate = {
      status: status || (minimalSync.isEnabled ? 'idle' : 'disabled'),
      syncEnabled: minimalSync.isEnabled,
      syncId: minimalSync.syncId,
      lastSuccess: this.lastPushTime,
      isSyncing: this.isSyncing
    };
    
    this.statusListeners.forEach(listener => {
      try {
        listener(statusUpdate);
      } catch (error) {
        console.error('[SyncStore] Error notifying status listener:', error);
      }
    });
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

  // ============================================
  // Additional compatibility methods
  // ============================================

  /**
   * Delete all data from server - tries both QUAL and PROD to ensure data is truly deleted
   */
  async deleteFromServer() {
    console.log('[SyncStore] Deleting all data from server...');
    
    try {
      // Get sync ID using the getSyncId method
      const syncId = this.getSyncId();
      
      // Check if we have sync credentials
      if (!syncId) {
        throw new Error('No sync ID available');
      }
      
      const deviceId = minimalSync.deviceId || 'unknown';
      
      const requestBody = {
        sync_id: syncId,
        device_id: deviceId
      };
      
      // Try to delete from BOTH environments to ensure data is truly gone
      const environments = [
        { name: 'QUAL', url: 'https://stackmap.app/qual/api/sync/delete.php' },
        { name: 'Production', url: 'https://stackmap.app/api/sync/delete.php' }
      ];
      
      let deletedFromAny = false;
      let errors = [];
      
      for (const env of environments) {
        console.log(`[SyncStore] Attempting delete from ${env.name}: ${env.url}`);
        
        try {
          const response = await fetch(env.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });
          
          const data = await response.json();
          console.log(`[SyncStore] ${env.name} response:`, response.status, data);
          
          if (response.ok) {
            console.log(`[SyncStore] Successfully deleted from ${env.name}`);
            deletedFromAny = true;
          } else if (response.status === 404) {
            console.log(`[SyncStore] No data found in ${env.name} (already deleted or never existed)`);
            // Not an error - data doesn't exist
          } else {
            errors.push(`${env.name}: ${data.error || response.status}`);
          }
        } catch (fetchError) {
          console.error(`[SyncStore] Failed to contact ${env.name}:`, fetchError);
          errors.push(`${env.name}: ${fetchError.message}`);
        }
      }
      
      // If we deleted from at least one environment, that's a success
      if (deletedFromAny) {
        console.log('[SyncStore] Server data deleted successfully from at least one environment');
        return { success: true, message: 'Server data deleted successfully' };
      }
      
      // If all attempts resulted in 404 (not found), that's okay - data is gone
      if (errors.length === 0) {
        console.log('[SyncStore] No data found in any environment - already deleted');
        return { success: true, message: 'Data already deleted or never existed on server' };
      }
      
      // If we have errors from both environments, report them
      throw new Error(`Failed to delete from all environments: ${errors.join('; ')}`);
      
    } catch (error) {
      console.error('[SyncStore] Error deleting server data:', error);
      throw error;
    }
  }

  /**
   * Delete share
   */
  async deleteShare(shareId) {
    try {
      // Get API URL based on environment
      const getShareApiUrl = () => {
        // Mobile builds use production API (release builds will hit production)
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          // Note: Debug/release detection happens in minimalSyncService.js
          return 'https://stackmap.app/api/sync';
        }
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (pathname.includes('/qual/')) {
            return 'https://stackmap.app/qual/api/sync';
          }
        }
        return 'https://stackmap.app/api/sync';
      };

      const SHARE_API_URL = getShareApiUrl();
      const deleteUrl = `${SHARE_API_URL}/delete_share.php`;
      
      const response = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          share_id: shareId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        console.error('Server error deleting share:', result);
        // Continue to remove from local storage even if server fails
      }

      // Then remove from local storage
      const stored = await AsyncStorage.getItem('@stackmap_shares');
      const shares = stored ? JSON.parse(stored) : [];
      const filtered = shares.filter(share => share.shareId !== shareId);
      await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(filtered));

      return true;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to delete share:', error);
      }
      throw error;
    }
  }

  /**
   * Get active shares
   */
  async getActiveShares(userId) {
    try {
      // Try to fetch from server first
      const deviceId = await this.getDeviceId();
      
      // Get API URL based on environment
      const getShareApiUrl = () => {
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          return 'https://stackmap.app/api/sync';
        }
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (pathname.includes('/qual/')) {
            return 'https://stackmap.app/qual/api/sync';
          }
        }
        return 'https://stackmap.app/api/sync';
      };
      
      const SHARE_API_URL = getShareApiUrl();
      const listUrl = `${SHARE_API_URL}/list_shares.php?device_id=${deviceId}`;
      
      try {
        const response = await fetch(listUrl);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Convert server format to local format
            const shares = data.active_shares.map(share => ({
              shareId: share.share_id,
              userId: userId || 'unknown',
              recipientName: share.recipient_name,
              shareNote: share.share_note,
              expiresAt: share.expires_at,
              createdAt: share.created_at,
              accessCount: share.access_count,
              status: 'active'
            }));
            
            // Update local storage with server data
            await AsyncStorage.setItem('@stackmap_shares', JSON.stringify(shares));
            
            if (userId) {
              return shares.filter(share => share.userId === userId);
            }
            return shares;
          }
        }
      } catch (fetchError) {
        console.log('[SyncService] Could not fetch shares from server, using local storage');
      }
      
      // Fallback to local storage
      const stored = await AsyncStorage.getItem('@stackmap_shares');
      if (!stored) return [];
      
      const shares = JSON.parse(stored);
      const now = new Date();
      
      // Process shares to mark as idle if expired but within grace period
      const processedShares = shares.map(share => {
        const expiryDate = new Date(share.expiresAt);
        const gracePeriodEnd = new Date(expiryDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days grace
        
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
      
      // Filter out null entries (shares past grace period) and filter by userId if provided
      const validShares = processedShares.filter(share => share !== null);
      
      if (userId) {
        return validShares.filter(share => share.userId === userId);
      }
      
      return validShares;
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to get active shares:', error);
      }
      return [];
    }
  }

  /**
   * Get API URL
   */
  getApiUrl() {
    // This method is deprecated - API URL is determined dynamically based on environment
    // Mobile: Uses minimalSyncService.js which detects debug/release
    // Web: Uses window.location to detect qual vs prod
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.includes('/qual/')) {
        return 'https://stackmap.app/qual/api/sync/';
      }
    }
    return 'https://stackmap.app/api/sync/';
  }

  /**
   * Get recovery phrase
   */
  getRecoveryPhrase() {
    return minimalSync.recoveryPhrase || '';
  }

  /**
   * Get sync ID
   */
  getSyncId() {
    return minimalSync.syncId || '';
  }
  
  /**
   * Set sync ID (for onboarding preview)
   */
  set syncId(value) {
    console.log('[SyncStore] Setting syncId:', value);
    minimalSync.syncId = value;
  }
  
  /**
   * Get sync ID (property getter)
   */
  get syncId() {
    return minimalSync.syncId;
  }

  /**
   * Has completed initial sync
   */
  hasCompletedInitialSync() {
    return this.isInitialized && minimalSync.syncId && minimalSync.isEnabled;
  }

  /**
   * Is initializing (property)
   */
  get isInitializing() {
    return false; // We initialize synchronously
  }

  /**
   * On progress change (stub)
   */
  onProgressChange(callback) {
    // Not implemented - could track sync progress
    return () => {};
  }

  /**
   * On status change
   */
  onStatusChange(callback) {
    return this.addStatusListener(callback);
  }

  /**
   * Perform manual sync
   */
  async performManualSync() {
    console.log('[SyncStore] Manual sync requested');
    if (minimalSync.isEnabled) {
      await this.pushCurrentState();
      const pullResult = await minimalSync.pullData();
      if (pullResult.success && pullResult.data) {
        await this.handleDataReceived(pullResult.data);
      }
    }
    return { success: true };
  }

  /**
   * Retry failed sync (stub)
   */
  async retryFailed() {
    console.log('[SyncStore] Retry failed sync');
    return this.performManualSync();
  }

  /**
   * Sync method (alias for performManualSync)
   */
  async sync() {
    return this.performManualSync();
  }

  /**
   * Verify sync exists
   */
  async verifySyncExists(syncId) {
    console.log('[SyncStore] Verifying sync exists:', syncId);
    // Could make an API call to verify, for now assume it exists
    return { exists: true };
  }

  /**
   * Compatibility properties
   */
  get _applyingRemoteState() {
    return this.isSyncing;
  }

  get _justJoinedSync() {
    // Check if we just joined within last 5 seconds
    return false; // Simplified for now
  }

  /**
   * Trigger immediate sync (for AppState changes on mobile)
   */
  async triggerSync() {
    console.log('[SyncStore] Manual sync triggered');
    
    if (!minimalSync.isEnabled || !minimalSync.syncId) {
      console.log('[SyncStore] Sync not enabled or no sync ID');
      return { success: false, error: 'Sync not enabled' };
    }
    
    try {
      // First push any local changes
      await this.pushCurrentState();
      
      // Then pull latest changes
      const pullResult = await minimalSync.pullData();
      if (pullResult.success && pullResult.data) {
        await this.handleDataReceived(pullResult.data);
        console.log('[SyncStore] ✅ Manual sync complete');
        return { success: true };
      }
      
      return pullResult;
    } catch (error) {
      console.error('[SyncStore] Manual sync failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Create an invite code for others to join sync
   * @param {number} expiresHours - Hours until expiration (1-168)
   * @param {number} maxUses - Maximum number of uses (1-10)
   * @param {string} note - Optional note about the invite
   * @returns {Promise<{success: boolean, inviteCode?: string, inviteUrl?: string, error?: string}>}
   */
  async createInviteCode(expiresHours = 24, maxUses = 1, note = null) {
    return minimalSync.createInviteCode(expiresHours, maxUses, note);
  }

  /**
   * Join a sync group using an invite code
   * @param {string} inviteCode - The invite code (XXXX-XXXX format)
   * @param {string} recoveryPhrase - The recovery phrase for decryption
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async joinWithInviteCode(inviteCode, recoveryPhrase) {
    return minimalSync.joinWithInviteCode(inviteCode, recoveryPhrase);
  }

  /**
   * Validate an invite code without joining
   * @param {string} inviteCode - The invite code to validate
   * @returns {Promise<{success: boolean, syncId?: string, error?: string}>}
   */
  async validateInviteCode(inviteCode) {
    return minimalSync.validateInviteCode(inviteCode);
  }
}

// Export singleton
export default new SyncStoreIntegration();