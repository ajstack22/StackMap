import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

// Type helpers for tweetnacl-util
const decodeUTF8 = (str: string): Uint8Array => 
  (util as any).decodeUTF8(str);

import encryptionService from './encryptionService';
import { useUserStore, useSettingsStore, useLibraryStore } from '../../stores';
import conflictResolver from './conflictResolver';
import { validateSyncedData, repairSyncedData } from './dataValidator';

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

  constructor() {
    console.log('[Sync] SimpleSyncService initialized');
    
    // Initialize immediately (no timers)
    this.initialize();
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Restore sync state from storage
      const enabled = await AsyncStorage.getItem('@sync_enabled');
      const syncId = await AsyncStorage.getItem('@sync_id');
      const lastVersion = await AsyncStorage.getItem('@sync_last_version');
      const lastSyncSuccess = await AsyncStorage.getItem('@sync_last_success');

      console.log('[Sync] Restored state:', {
        enabled,
        syncId: syncId ? syncId.substring(0, 8) + '...' : null,
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
    } catch (error) {
      console.error('[Sync] Failed to initialize:', error);
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
      await AsyncStorage.setItem('@sync_enabled', 'true');
      await AsyncStorage.setItem('@sync_id', syncId);
      await AsyncStorage.setItem('@sync_last_version', String(this.lastSyncVersion));

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
    if (!this.syncEnabled || !this.syncId) return;

    // Clear existing timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    // Set new timer
    this.syncDebounceTimer = setTimeout(() => {
      console.log('[Sync] Debounced sync triggered');
      this.sync();
    }, this.syncDebounceDelay);
  }

  /**
   * Perform sync immediately
   */
  async sync(): Promise<SyncResult> {
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      console.log('[Sync] Sync already in progress, skipping');
      return { success: false, error: 'Sync already in progress' };
    }

    if (!this.syncEnabled || !this.syncId) {
      return { success: false, error: 'Sync not enabled' };
    }

    this.syncInProgress = true;
    this.lastSyncAttempt = Date.now();

    try {
      console.log('[Sync] Starting sync...');

      // Pull remote data
      const remoteData = await this.pullData();

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
  private async pullData(): Promise<any> {
    if (!this.syncId) return null;

    try {
      const deviceId = await encryptionService.getDeviceId();
      const url = `${API_BASE_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;
      
      const response = await fetch(url);

      if (response.status === 404) {
        return null; // No data exists
      }

      if (!response.ok) {
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
    if (!this.syncId) {
      return { success: false, error: 'No sync ID' };
    }

    try {
      const deviceId = await encryptionService.getDeviceId();
      const deviceName = encryptionService.getDeviceName();
      const currentState = this.getCurrentState();
      const encryptedData = encryptionService.encryptData(currentState);

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
    const phraseBytes = decodeUTF8(recoveryPhrase.toLowerCase());
    const hash = nacl.hash(phraseBytes);
    const syncIdBytes = hash.slice(0, 16);
    const syncId = Array.from(syncIdBytes)
      .map(b => ('0' + b.toString(16)).slice(-2))
      .join('');
    return syncId;
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
}

// Export singleton instance
const simpleSyncService = new SimpleSyncService();

// Explicitly bind methods to make them accessible
(simpleSyncService as any).enable = simpleSyncService.enable.bind(simpleSyncService);
(simpleSyncService as any).disable = simpleSyncService.disable.bind(simpleSyncService);
(simpleSyncService as any).sync = simpleSyncService.sync.bind(simpleSyncService);
(simpleSyncService as any).isEnabled = simpleSyncService.isEnabled.bind(simpleSyncService);
(simpleSyncService as any).addStatusListener = simpleSyncService.addStatusListener.bind(simpleSyncService);
(simpleSyncService as any).syncWithQueue = simpleSyncService.syncWithQueue.bind(simpleSyncService);

export default simpleSyncService;