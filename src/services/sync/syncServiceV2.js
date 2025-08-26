/**
 * Simplified Sync Service V2 with CRDT-based conflict resolution
 * Target: ~200 lines of core orchestration logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import encryptionService from './encryptionService';
import crdtMerger from './crdtMerger';
import eventLogger from './eventLogger';
import { normalizeSyncData } from '../../utils/dataNormalizer';

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
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase) {
    try {
      // Generate sync ID from recovery phrase
      this.syncId = await encryptionService.generateSyncId(recoveryPhrase);
      this.deviceId = await encryptionService.getDeviceId();
      
      // Initialize encryption
      await encryptionService.initialize(
        recoveryPhrase,
        this.syncId,
        'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=' // Fixed salt
      );

      // Save state
      await AsyncStorage.multiSet([
        ['@sync_enabled_v2', 'true'],
        ['@sync_id', this.syncId],
        ['@sync_version_v2', '0']
      ]);

      this.syncEnabled = true;
      this.lastVersion = 0;
      
      eventLogger.logSync('ENABLED', { syncId: this.syncId });
      
      // Start sync timer
      this.startSyncTimer();
      
      // Trigger immediate sync
      this.requestSync();
      
      return true;
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
   * Pull data from server
   */
  async pull() {
    const response = await fetch(`${getApiBaseUrl()}/pull.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sync_id: this.syncId })
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Pull failed: ${response.status}`);
    }

    return await response.json();
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
    const { useAppStore } = require('../../stores');
    const { useUserStore } = require('../../stores/useUserStore');
    const { useSettingsStore } = require('../../stores/useSettingsStore');
    const { useLibraryStore } = require('../../stores/useLibraryStore');
    
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
    const { useUserStore } = require('../../stores/useUserStore');
    const { useSettingsStore } = require('../../stores/useSettingsStore');
    const { useLibraryStore } = require('../../stores/useLibraryStore');
    
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
  async initializeForImport(users) {
    // Just save the data without syncing
    const { useUserStore } = require('../../stores/useUserStore');
    useUserStore.getState().setUsers(users);
    
    // If sync is enabled, mark for sync on next interval
    if (this.syncEnabled) {
      this.requestSync();
    }
    
    return true;
  }

  // Stub for share functionality (not implemented in V2 yet)
  hasAutoUpdateShares() {
    return false;
  }

  updateActiveShares() {
    // No-op for now
    return Promise.resolve();
  }

  // Join sync group with recovery phrase
  async join(recoveryPhrase) {
    return this.enable(recoveryPhrase);
  }

  // Create new sync group
  async create() {
    // Generate random recovery phrase
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const recoveryPhrase = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    await this.enable(recoveryPhrase);
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
}

// Export singleton instance
export default new SyncServiceV2();