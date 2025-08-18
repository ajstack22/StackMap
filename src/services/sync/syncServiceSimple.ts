// Add immediate console log to verify module is loading
console.warn('[Sync] 🚨🚨🚨 syncServiceSimple.ts MODULE LOADING at', new Date().toISOString());

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';

import encryptionService from './encryptionService';
import { useUserStore, useSettingsStore, useLibraryStore } from '../../stores';
import conflictResolver from './conflictResolver';
import { validateSyncedData, repairSyncedData } from './dataValidator';

console.warn('[Sync] 🚨🚨🚨 Imports completed, defining SimpleSyncService class...');

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = (): string => {
  if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
    return 'https://stackmap.app/qual/api/sync';
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'https://stackmap.app/api/sync';
    }
    if (window.location.pathname.startsWith('/qual')) {
      return 'https://stackmap.app/qual/api/sync';
    }
  }
  return 'https://stackmap.app/api/sync';
};

const API_BASE_URL = getApiBaseUrl();

interface SyncResult {
  success: boolean;
  version?: number;
  lastModified?: string;
  error?: string;
}

/**
 * Simplified Sync Service
 * - No periodic sync
 * - No network monitoring  
 * - No complex initialization
 * - Sync on: app load, mode changes, after user changes (debounced)
 */
class SimpleSyncService {
  // Core sync state
  syncEnabled: boolean = false;
  syncId: string | null = null;
  lastSyncVersion: number = 0;
  initialized: boolean = false;

  // Sync timing
  lastSyncAttempt: number | null = null;
  lastSyncSuccess: number | null = null;

  // Debounce timer for changes
  syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  syncDebounceDelay: number = 10000; // 10 seconds

  // Sync lock to prevent concurrent syncs
  syncInProgress: boolean = false;

  // App state subscription
  private appStateSubscription: any = null;
  
  // Initialization promise to prevent multiple initializations
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    console.warn('[Sync] 🚨 SimpleSyncService constructor called at', new Date().toISOString());
    
    // Add method existence check
    console.warn('[Sync] 🚨 Methods check:', {
      sync: typeof this.sync,
      pullData: typeof this.pullData,
      isEnabled: typeof this.isEnabled,
    });
    
    // Initialize immediately (no timers)
    console.warn('[Sync] 🚨 Calling initialize()...');
    this.initialize().then(() => {
      console.warn('[Sync] 🚨 Initialize completed, state:', {
        syncEnabled: this.syncEnabled,
        syncId: this.syncId ? this.syncId.substring(0, 8) + '...' : null,
        initialized: this.initialized,
      });
    }).catch(error => {
      console.error('[Sync] 🚨 Initialize FAILED:', error);
    });
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }
    
    if (this.initialized) return;

    // Create and store the initialization promise
    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    console.warn('[Sync] 🚨 _doInitialize started');
    try {
      // Restore sync state from storage
      console.warn('[Sync] 🚨 Reading from AsyncStorage...');
      console.warn('[Sync] 🚨 Getting @sync_enabled...');
      const enabled = await AsyncStorage.getItem('@sync_enabled');
      console.warn('[Sync] 🚨 Got enabled:', enabled);
      
      console.warn('[Sync] 🚨 Getting @sync_id...');
      const syncId = await AsyncStorage.getItem('@sync_id');
      console.warn('[Sync] 🚨 Got syncId:', syncId ? syncId.substring(0, 8) + '...' : null);
      
      console.warn('[Sync] 🚨 Getting @sync_last_version...');
      const lastVersion = await AsyncStorage.getItem('@sync_last_version');
      console.warn('[Sync] 🚨 Got lastVersion:', lastVersion);
      
      console.warn('[Sync] 🚨 Getting @sync_last_success...');
      const lastSyncSuccess = await AsyncStorage.getItem('@sync_last_success');
      console.warn('[Sync] 🚨 Got lastSyncSuccess:', lastSyncSuccess);

      console.warn('[Sync] 🚨 Restored state from AsyncStorage:', {
        enabled,
        syncId: syncId ? syncId.substring(0, 8) + '...' : null,
        lastVersion,
        hasStoredValues: !!(enabled || syncId),
      });

      if (enabled === 'true' && syncId) {
        this.syncEnabled = true;
        this.syncId = syncId;
        this.lastSyncVersion = parseInt(lastVersion || '0', 10);
        this.lastSyncSuccess = lastSyncSuccess
          ? parseInt(lastSyncSuccess, 10)
          : null;

        // Try to restore encryption
        const encryptionRestored = await this.restoreEncryptionFromStorage();
        
        if (encryptionRestored) {
          // Set up app lifecycle listeners
          this.setupLifecycleListeners();
          
          // Do initial sync
          console.log('[Sync] Performing initial sync...');
          this.sync();
        }
      }

      this.initialized = true;
      console.warn('[Sync] 🚨 _doInitialize COMPLETED successfully, initialized:', this.initialized);
    } catch (error) {
      console.error('[Sync] 🚨 _doInitialize FAILED:', error);
      this.initialized = true;
    }
  }

  /**
   * Set up app lifecycle listeners for sync triggers
   */
  private setupLifecycleListeners(): void {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Web: Use visibility change event
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.syncEnabled) {
          console.log('[Sync] Tab became visible, syncing...');
          this.sync();
        }
      });
    } else {
      // Mobile: Use AppState
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active' && this.syncEnabled) {
          console.log('[Sync] App became active, syncing...');
          this.sync();
        }
      });
    }
  }

  /**
   * Restore encryption from stored recovery phrase
   */
  async restoreEncryptionFromStorage(): Promise<boolean> {
    if (!this.syncId) return false;

    // Check if encryption is already initialized
    if (
      encryptionService.masterKey &&
      encryptionService.syncId === this.syncId
    ) {
      return true;
    }

    try {
      const storedPhrase = await encryptionService.getStoredRecoveryPhrase(
        this.syncId,
      );
      if (!storedPhrase) {
        return false;
      }

      const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
      await encryptionService.initialize(storedPhrase, this.syncId, fixedSalt);

      return true;
    } catch (error) {
      console.error('[Sync] Failed to restore encryption:', error);
    }

    return false;
  }

  /**
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase: string | null = null): Promise<{
    syncId: string;
    recoveryPhrase: string;
    isNewSync: boolean;
  }> {
    try {
      // Generate new recovery phrase if not provided
      if (!recoveryPhrase) {
        recoveryPhrase = encryptionService.generateRecoveryPhrase();
      }

      // Generate sync ID from recovery phrase
      const syncId = await this.generateSyncId(recoveryPhrase);
      this.syncId = syncId;

      // Try to pull existing data first
      const existingData = await this.pullData();

      if (!existingData) {
        // New sync group
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        const { salt } = await encryptionService.initialize(
          recoveryPhrase,
          syncId,
          fixedSalt,
        );

        await this.createSyncGroup(syncId, salt);
      } else {
        // Existing sync group
        const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
        await encryptionService.initialize(recoveryPhrase, syncId, fixedSalt);

        try {
          const decryptedData = encryptionService.decryptData(
            existingData.encrypted_blob,
          );

          const isEmptySync =
            !decryptedData.users ||
            Object.keys(decryptedData.users).length === 0;
          const currentState = this.getCurrentState();
          const hasLocalData =
            currentState.users && Object.keys(currentState.users).length > 0;

          if (isEmptySync && hasLocalData) {
            // Keep local data, will push on next sync
          } else {
            await this.restoreData(decryptedData);
          }

          this.lastSyncVersion = existingData.version;
        } catch (decryptError) {
          throw new Error(
            'Invalid recovery phrase. Please check and try again.',
          );
        }
      }

      // Store recovery phrase
      await encryptionService.storeRecoveryPhrase(recoveryPhrase, syncId);

      // Save sync state
      this.syncEnabled = true;
      console.log('[Sync] Saving sync state to AsyncStorage:', {
        syncId: syncId.substring(0, 8) + '...',
        enabled: true,
        version: this.lastSyncVersion,
      });
      await AsyncStorage.setItem('@sync_enabled', 'true');
      await AsyncStorage.setItem('@sync_id', syncId);
      await AsyncStorage.setItem('@sync_last_version', String(this.lastSyncVersion));
      
      // Verify it was saved
      const savedEnabled = await AsyncStorage.getItem('@sync_enabled');
      const savedId = await AsyncStorage.getItem('@sync_id');
      console.log('[Sync] Verified saved state:', {
        savedEnabled,
        savedId: savedId ? savedId.substring(0, 8) + '...' : null,
      });

      // Set up lifecycle listeners
      this.setupLifecycleListeners();

      // Do initial sync
      this.sync();

      return {
        syncId,
        recoveryPhrase,
        isNewSync: !existingData,
      };
    } catch (error) {
      console.error('[Sync] Enable failed:', error);
      this.syncId = null;
      throw error;
    }
  }

  /**
   * Disable sync
   */
  async disable(): Promise<void> {
    // Clear debounce timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }

    // Remove lifecycle listeners
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    // Clear sync state
    this.syncEnabled = false;
    this.syncId = null;
    this.lastSyncVersion = 0;

    // Clear storage
    await AsyncStorage.multiRemove([
      '@sync_enabled',
      '@sync_id',
      '@sync_last_version',
      '@sync_last_success',
    ]);

    // Clear encryption
    encryptionService.masterKey = null;
    encryptionService.syncId = null;
  }

  /**
   * Request a sync (debounced)
   */
  requestSync(): void {
    console.log('[Sync] requestSync called', {
      syncEnabled: this.syncEnabled,
      syncId: this.syncId ? this.syncId.substring(0, 8) + '...' : null,
      initialized: this.initialized,
    });
    
    if (!this.syncEnabled || !this.syncId) {
      console.log('[Sync] Skipping sync - not enabled or no syncId');
      return;
    }

    // Clear existing timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    // Set new timer
    this.syncDebounceTimer = setTimeout(() => {
      console.log('[Sync] Debounced sync triggered after', this.syncDebounceDelay, 'ms');
      this.sync();
    }, this.syncDebounceDelay);
  }

  /**
   * Perform sync immediately
   */
  async sync(): Promise<SyncResult> {
    console.warn('[Sync] 🔴 sync() ENTERED', {
      syncInProgress: this.syncInProgress,
      syncEnabled: this.syncEnabled,
      syncId: this.syncId ? this.syncId.substring(0, 8) + '...' : null,
    });
    
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      console.warn('[Sync] 🔴 RETURNING: Sync already in progress');
      return { success: false, error: 'Sync already in progress' };
    }

    if (!this.syncEnabled || !this.syncId) {
      console.warn('[Sync] 🔴 RETURNING: Sync not enabled or no syncId', {
        syncEnabled: this.syncEnabled,
        syncId: this.syncId,
      });
      return { success: false, error: 'Sync not enabled' };
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();

    try {
      console.warn('[Sync] 🔴 Starting sync process...');

      // Pull remote data
      console.warn('[Sync] 🔴 About to call pullData()...');
      const remoteData = await this.pullData();
      console.warn('[Sync] 🔴 pullData() returned:', !!remoteData);

      if (!remoteData) {
        // No remote data, push local data
        const result = await this.pushData();
        this.syncInProgress = false;
        return result;
      }

      // Decrypt remote data
      const decryptedRemote = encryptionService.decryptData(
        remoteData.encrypted_blob,
      );

      // Get local state
      const localState = this.getCurrentState();

      // Simple conflict resolution: last-write-wins
      const shouldUseRemote = conflictResolver.shouldUseRemoteData(
        localState,
        decryptedRemote,
      );

      if (shouldUseRemote) {
        // Use remote data
        console.log('[Sync] Using remote data (newer)');
        await this.restoreData(decryptedRemote);
        this.lastSyncVersion = remoteData.version;
        this.lastSyncSuccess = Date.now();
        await AsyncStorage.setItem('@sync_last_version', String(remoteData.version));
        await AsyncStorage.setItem('@sync_last_success', String(this.lastSyncSuccess));
      } else {
        // Use local data and push
        console.log('[Sync] Using local data (newer), pushing...');
        const result = await this.pushData();
        if (result.success) {
          this.lastSyncVersion = result.version || this.lastSyncVersion;
          this.lastSyncSuccess = Date.now();
          await AsyncStorage.setItem('@sync_last_version', String(this.lastSyncVersion));
          await AsyncStorage.setItem('@sync_last_success', String(this.lastSyncSuccess));
        }
        this.syncInProgress = false;
        return result;
      }

      this.syncInProgress = false;
      return { success: true, version: this.lastSyncVersion };
    } catch (error) {
      console.error('[Sync] Sync failed:', error);
      this.syncInProgress = false;
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Pull data from server
   */
  async pullData(): Promise<any> {
    console.warn('[Sync] 🔴 pullData() ENTERED');
    if (!this.syncId) {
      console.warn('[Sync] 🔴 pullData() RETURNING null - no syncId');
      return null;
    }

    try {
      console.warn('[Sync] 🔴 Getting device ID...');
      const deviceId = await encryptionService.getDeviceId();
      console.warn('[Sync] 🔴 Got device ID:', deviceId);
      
      const url = `${API_BASE_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;
      console.warn('[Sync] 🔴 Fetching from:', url);
      
      const response = await fetch(url);
      console.warn('[Sync] 🔴 Fetch completed, status:', response.status);

      if (response.status === 404) {
        console.warn('[Sync] 🔴 pullData() RETURNING null - 404');
        return null; // No data exists
      }

      if (!response.ok) {
        console.warn('[Sync] 🔴 pullData() THROWING - bad status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      const data = JSON.parse(responseText);
      return data.data || null;
    } catch (error) {
      console.error('[Sync] Pull failed:', error);
      return null;
    }
  }

  /**
   * Push data to server
   */
  private async pushData(): Promise<SyncResult> {
    console.log('[Sync] pushData called');
    
    if (!this.syncId) {
      console.log('[Sync] No sync ID, cannot push');
      return { success: false, error: 'No sync ID' };
    }

    try {
      const deviceId = await encryptionService.getDeviceId();
      const deviceName = encryptionService.getDeviceName();
      const currentState = this.getCurrentState();
      const encryptedData = encryptionService.encryptData(currentState);
      
      console.log('[Sync] Pushing data to server', {
        syncId: this.syncId.substring(0, 8) + '...',
        deviceId,
        url: `${API_BASE_URL}/push.php`,
      });

      const response = await fetch(`${API_BASE_URL}/push.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sync_id: this.syncId,
          device_id: deviceId,
          device_name: deviceName,
          encrypted_blob: encryptedData,
          sync_type: 'full',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        version: result.version,
        lastModified: result.last_modified,
      };
    } catch (error) {
      console.error('[Sync] Push failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Create new sync group
   */
  private async createSyncGroup(syncId: string, salt: string): Promise<void> {
    const deviceId = await encryptionService.getDeviceId();
    
    // Get current state and encrypt it for initial sync
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
        device_id: deviceId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create sync group');
    }
  }

  /**
   * Get current state from stores
   */
  private getCurrentState(): any {
    const userState = useUserStore.getState();
    const settingsState = useSettingsStore.getState();
    const libraryState = useLibraryStore.getState();

    return {
      users: userState.users,
      currentUser: userState.currentUser,
      library: libraryState.library,
      ...settingsState,
      lastModified: Date.now(),
    };
  }

  /**
   * Restore data to stores
   */
  private async restoreData(data: any): Promise<void> {
    // Validate and repair if needed
    const isValid = validateSyncedData(data);
    if (!isValid) {
      console.warn('[Sync] Data validation failed, attempting repair...');
      data = repairSyncedData(data);
    }

    // Update stores
    if (data.users) {
      useUserStore.getState().setUsers(data.users);
    }
    if (data.currentUser !== undefined) {
      useUserStore.getState().setCurrentUser(data.currentUser);
    }
    if (data.library) {
      useLibraryStore.getState().setLibrary(data.library);
    }

    // Update settings
    const settingsUpdate: any = {};
    if (data.currentTheme) settingsUpdate.currentTheme = data.currentTheme;
    if (data.bannerPosition) settingsUpdate.bannerPosition = data.bannerPosition;
    if (data.soundEnabled !== undefined) settingsUpdate.soundEnabled = data.soundEnabled;
    if (data.taskCelebration !== undefined) settingsUpdate.taskCelebration = data.taskCelebration;
    if (data.routineCelebration !== undefined) settingsUpdate.routineCelebration = data.routineCelebration;
    
    if (Object.keys(settingsUpdate).length > 0) {
      useSettingsStore.getState().updateSettings(settingsUpdate);
    }
  }

  /**
   * Generate sync ID from recovery phrase
   */
  async generateSyncId(recoveryPhrase: string): Promise<string> {
    // Use a fixed salt for sync ID generation to ensure consistency
    const fixedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ=='; // Base64 encoded fixed salt
    const { key } = await encryptionService.deriveKeyFromPhrase(
      recoveryPhrase,
      fixedSalt,
    );
    // Use first 16 bytes of key as sync ID
    const syncIdBytes = key.slice(0, 16);
    return Array.from(syncIdBytes, byte =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
  }

  /**
   * Sync on edit mode toggle
   */
  syncOnModeChange(): void {
    if (this.syncEnabled) {
      console.log('[Sync] Mode changed, syncing...');
      this.sync();
    }
  }

  /**
   * Check if sync is enabled (compatibility method)
   */
  async isEnabled(): Promise<boolean> {
    // Ensure initialization is complete before returning status
    if (!this.initialized) {
      console.log('[Sync] isEnabled called before initialization, waiting...');
      await this.initialize();
    }
    console.log('[Sync] isEnabled returning:', this.syncEnabled);
    return this.syncEnabled;
  }

  /**
   * Check if user has auto-update shares (stub for compatibility)
   */
  async hasAutoUpdateShares(_userId: string): Promise<boolean> {
    // Simplified version doesn't support shares yet
    return false;
  }

  /**
   * Update active shares (stub for compatibility)
   */
  async updateActiveShares(_userId: string): Promise<void> {
    // Simplified version doesn't support shares yet
    console.log('[Sync] Share updates not supported in simplified sync');
  }

  /**
   * Compatibility property for legacy code
   */
  get syncInterval(): any {
    return null; // No periodic sync in simplified version
  }

  /**
   * Add a sync status listener (stub for compatibility)
   */
  addStatusListener(callback: (status: any) => void): () => void {
    // Immediately send a simple status
    callback({
      status: 'idle',
      error: null,
      lastAttempt: this.lastSyncAttempt,
      lastSuccess: this.lastSyncSuccess,
      isOnline: true,
      queueStatus: { pending: 0 },
    });
    
    // Return a no-op unsubscribe function
    return () => {};
  }

  /**
   * Remove a status listener (stub for compatibility)
   */
  removeStatusListener(_callback: (status: any) => void): void {
    // No-op in simplified version
  }

  /**
   * Sync with queue (compatibility wrapper)
   */
  async syncWithQueue(): Promise<SyncResult> {
    return this.sync();
  }

  /**
   * Request sync with options (compatibility wrapper)
   */
  async requestSyncWithOptions(_options?: any): Promise<SyncResult> {
    this.requestSync();
    return { success: true };
  }

  /**
   * Get sync ID
   */
  getSyncId(): string | null {
    return this.syncId;
  }

  /**
   * Get recovery phrase if available
   */
  async getRecoveryPhrase(): Promise<string | null> {
    if (!this.syncId) return null;
    try {
      return await encryptionService.getStoredRecoveryPhrase(this.syncId);
    } catch (error) {
      console.error('[Sync] Failed to get recovery phrase:', error);
      return null;
    }
  }

  /**
   * Verify sync exists on server
   */
  async verifySyncExists(): Promise<boolean> {
    if (!this.syncId) return false;
    try {
      const data = await this.pullData();
      return data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Delete all sync data from server
   */
  async deleteFromServer(): Promise<any> {
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
        device_id: deviceId,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Clear local sync state
      await this.disable();
    }

    return result;
  }

  /**
   * Get API URL for debugging
   */
  getApiUrl(): string {
    return API_BASE_URL;
  }

  // Share functionality - temporarily returning empty/errors until properly implemented
  
  /**
   * Get active shares (not implemented in simplified version yet)
   */
  async getActiveShares(): Promise<any[]> {
    // TODO: Implement share functionality
    return [];
  }

  /**
   * Generate share token (not implemented in simplified version yet)
   */
  generateShareToken(): string {
    // TODO: Implement share functionality
    throw new Error('Share functionality not yet implemented in simplified sync');
  }

  /**
   * Create share link (not implemented in simplified version yet)
   */
  async createShareLink(_userId: string, _options?: any): Promise<any> {
    // TODO: Implement share functionality
    throw new Error('Share functionality not yet implemented in simplified sync');
  }

  /**
   * Delete share (not implemented in simplified version yet)
   */
  async deleteShare(_shareId: string): Promise<boolean> {
    // TODO: Implement share functionality
    console.warn('[Sync] Share deletion not yet implemented in simplified sync');
    return false;
  }
}

// Export singleton instance
console.warn('[Sync] 🚨🚨🚨 About to create SimpleSyncService singleton...');
console.warn('[Sync] 🚨🚨🚨 SimpleSyncService class exists:', typeof SimpleSyncService);

let simpleSyncService;
try {
  simpleSyncService = new SimpleSyncService();
  console.warn('[Sync] 🚨🚨🚨 SimpleSyncService singleton created successfully:', !!simpleSyncService);
} catch (error) {
  console.error('[Sync] 🚨🚨🚨 FAILED to create SimpleSyncService:', error);
  throw error;
}

// Explicitly bind ALL methods to make them accessible
console.warn('[Sync] 🚨🚨🚨 Binding methods...');
const methodsToBind = [
  'enable', 'disable', 'sync', 'isEnabled', 'addStatusListener',
  'syncWithQueue', 'generateSyncId', 'requestSync', 'requestSyncWithOptions',
  'getSyncId', 'getRecoveryPhrase', 'verifySyncExists', 'deleteFromServer',
  'getApiUrl', 'getActiveShares', 'generateShareToken', 'createShareLink',
  'deleteShare', 'pullData', 'initialize'
];

methodsToBind.forEach(method => {
  if (typeof (simpleSyncService as any)[method] === 'function') {
    (simpleSyncService as any)[method] = (simpleSyncService as any)[method].bind(simpleSyncService);
  }
});

console.warn('[Sync] 🚨🚨🚨 Method binding complete');

// Add to window for debugging in browser
if (typeof window !== 'undefined') {
  (window as any).syncService = simpleSyncService;
  console.warn('[Sync] 🚨🚨🚨 Added syncService to window for debugging');
}

console.warn('[Sync] 🚨🚨🚨 Module export ready');
export default simpleSyncService;