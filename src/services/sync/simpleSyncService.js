// @ts-check
/**
 * SIMPLE SYNC SERVICE - A bulletproof sync implementation
 * 
 * Philosophy: Keep it simple, make it work every time
 * - TRUE last-write-wins (newest timestamp always wins)
 * - Single source of truth (server)
 * - Atomic updates (all or nothing)
 * - Clear debug visibility
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import util from 'tweetnacl-util';
import syncDebugger from '../../utils/syncDebugger';

const encodeBase64 = (arr) => util.encodeBase64(arr);
const decodeBase64 = (str) => util.decodeBase64(str);
const decodeUTF8 = (str) => util.decodeUTF8(str);

class SimpleSyncService {
  constructor() {
    this.enabled = false;
    this.syncId = null;
    this.masterKey = null;
    this.lastServerTimestamp = 0;
    this.syncInProgress = false;
    this.syncInterval = null;
    // Set API URL based on platform
    this._apiUrl = this.getInitialApiUrl();

    // Auto-restore sync state after a delay (like complex sync does)

    setTimeout(() => {
      this.restoreState().then(restored => {
        if (restored) {} else {}
      }).catch(err => {
        if (__DEV__) {
          console.error('❌ SIMPLE SYNC: Error restoring state:', err);
        }
      });
    }, 1000);
  }

  // Determine initial API URL based on platform and environment
  // This mirrors the logic from the complex sync service
  getInitialApiUrl() {
    // For iOS/Android development builds, use qual environment
    if (__DEV__ && (Platform.OS === 'ios' || Platform.OS === 'android')) {
      return 'https://stackmap.app/qual/api/sync';
    }
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // For local development
      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ) {
        return 'https://stackmap.app/api/sync';
      }
      // Check if we're in qual environment
      if (window.location.pathname.startsWith('/qual')) {
        return 'https://stackmap.app/qual/api/sync';
      }
    }
    
    // Default to production API
    return 'https://stackmap.app/api/sync';
  }

  // Getter for API URL
  get API_URL() {
    // Ensure we always return an absolute URL
    if (!this._apiUrl.startsWith('http')) {
      console.warn('🔄 SIMPLE SYNC: API URL is not absolute!', this._apiUrl);
      // Force it to be absolute for qual environment
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/qual')) {
        return 'https://stackmap.app/qual/api/sync';
      }
      return 'https://stackmap.app/api/sync';
    }
    return this._apiUrl;
  }
  
  // Method version for compatibility with components expecting getApiUrl()
  getApiUrl() {
    return this.API_URL;
  }

  /**
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase) {
    console.log('🔄 SIMPLE SYNC: enable() called');
    
    // Generate new phrase if not provided (for compatibility with complex sync)
    if (!recoveryPhrase) {

      recoveryPhrase = SimpleSyncService.generateRecoveryPhrase();
    }
    
    // Type check
    if (typeof recoveryPhrase !== 'string') {
      console.error('❌ SIMPLE SYNC: Recovery phrase is not a string!', typeof recoveryPhrase, recoveryPhrase);
      throw new Error('Invalid recovery phrase - must be a string');
    }
    
    if (recoveryPhrase.length !== 32) {
      console.error('🔄 SIMPLE SYNC: Invalid recovery phrase length:', recoveryPhrase?.length);
      throw new Error('Invalid recovery phrase - must be exactly 32 characters');
    }

    // Generate sync ID and master key using the SAME method as complex sync
    // Use the fixed base64 salt that complex sync uses
    const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
    const saltBytes = decodeBase64(fixedSalt);
    const iterations = 100000;
    
    // Combine phrase and salt the same way as complex sync
    const phraseBytes = decodeUTF8(recoveryPhrase);
    const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
    combined.set(phraseBytes);
    combined.set(saltBytes, phraseBytes.length);
    
    // Hash multiple times for key derivation
    let key = nacl.hash(combined);
    for (let i = 0; i < iterations; i++) {
      key = nacl.hash(key);
    }
    
    // Use first 16 bytes of key as sync ID (matching complex sync)
    const syncIdBytes = key.slice(0, 16);
    this.syncId = Array.from(syncIdBytes, byte =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    
    // Use next 32 bytes as master key
    this.masterKey = key.slice(0, 32);
    this.enabled = true;
    
    // Validate syncId is a string
    if (typeof this.syncId !== 'string') {
      console.error('❌ SIMPLE SYNC: Generated syncId is not a string!', typeof this.syncId, this.syncId);
      throw new Error('Failed to generate valid sync ID');
    }

    // Store settings
    await AsyncStorage.setItem('@sync_enabled', 'true');
    await AsyncStorage.setItem('@sync_id', this.syncId);
    await AsyncStorage.setItem('@sync_phrase', recoveryPhrase);

    // Start periodic sync
    this.startPeriodicSync();

    syncDebugger.log('STATE', 'Sync enabled', { syncId: this.syncId });
    
    // Return format compatible with complex sync service
    return {
      syncId: this.syncId,
      recoveryPhrase: recoveryPhrase
    };
  }

  /**
   * Disable sync
   */
  async disable() {
    this.enabled = false;
    this.syncId = null;
    this.masterKey = null;
    this.lastServerTimestamp = 0;
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    await AsyncStorage.multiRemove([
      '@sync_enabled',
      '@sync_id',
      '@sync_phrase',
      '@sync_last_timestamp'
    ]);

    syncDebugger.log('STATE', 'Sync disabled');
  }

  /**
   * Delete sync data from server
   */
  async deleteFromServer() {
    if (!this.syncId) {
      throw new Error('No sync data to delete');
    }

    const deviceId = Platform.OS; // Use platform as simple device ID
    const response = await fetch(`${this.API_URL}/delete.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    // Disable sync locally after successful deletion
    await this.disable();
    
    return result;
  }

  /**
   * Simple encrypt/decrypt using NaCl
   */
  encrypt(data) {
    const nonce = nacl.randomBytes(24);
    const message = util.decodeUTF8(JSON.stringify(data));
    const encrypted = nacl.secretbox(message, nonce, this.masterKey);
    
    return encodeBase64(new Uint8Array([...nonce, ...encrypted]));
  }

  decrypt(encryptedBlob) {
    console.log('🔄 SIMPLE SYNC: decrypt() called');

    if (!this.masterKey) {
      console.error('❌ SIMPLE SYNC: Cannot decrypt - no master key!');
      throw new Error('No master key available for decryption');
    }
    
    try {
      const data = decodeBase64(encryptedBlob);
      const nonce = data.slice(0, 24);
      const message = data.slice(24);
      
      const decrypted = nacl.secretbox.open(message, nonce, this.masterKey);
      if (!decrypted) {
        console.error('❌ SIMPLE SYNC: Decryption failed - invalid key or corrupted data');
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      const decryptedStr = util.encodeUTF8(decrypted);
      const result = JSON.parse(decryptedStr);

      console.log('🔄 SIMPLE SYNC: User count:', Object.keys(result.users || {}).length);
      return result;
    } catch (error) {
      if (__DEV__) {
        console.error('❌ SIMPLE SYNC: Decrypt error:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get complete state from all stores
   */
  getCompleteState() {
    const userStore = require('../../stores/useUserStore.js').default;
    const settingsStore = require('../../stores/useSettingsStore.js').default;
    const libraryStore = require('../../stores/useLibraryStore.js').default;
    const appStore = require('../../stores/useAppStore.js').default;
    
    const state = {
      timestamp: Date.now(),
      users: userStore.getState().users,
      currentUser: userStore.getState().currentUser,
      currentDay: userStore.getState().currentDay,
      settings: {
        currentTheme: settingsStore.getState().currentTheme,
        soundEnabled: settingsStore.getState().soundEnabled,
        taskCelebration: settingsStore.getState().taskCelebration,
        routineCelebration: settingsStore.getState().routineCelebration,
      },
      library: libraryStore.getState().library,
      libraryTemplates: libraryStore.getState().libraryTemplates,
      hasCompletedOnboarding: appStore.getState().hasCompletedOnboarding,
    };

    return state;
  }

  /**
   * Set complete state to all stores (atomic)
   */
  setCompleteState(state) {
    const userStore = require('../../stores/useUserStore.js').default;
    const settingsStore = require('../../stores/useSettingsStore.js').default;
    const libraryStore = require('../../stores/useLibraryStore.js').default;
    const appStore = require('../../stores/useAppStore.js').default;

    // Use batch update if available, otherwise update sequentially
    // But do it all at once to minimize race conditions
    
    syncDebugger.log('STATE', 'Applying state from server', {
      timestamp: state.timestamp,
      userCount: Object.keys(state.users || {}).length
    });

    // Update all stores
    if (state.users) userStore.getState().setUsers(state.users);
    if (state.currentUser) userStore.getState().setCurrentUser(state.currentUser);
    if (state.currentDay) userStore.getState().setCurrentDay(state.currentDay);
    
    if (state.settings) {
      const settings = state.settings;
      if (settings.currentTheme) settingsStore.getState().setCurrentTheme(settings.currentTheme);
      if (settings.soundEnabled !== undefined) settingsStore.getState().setSoundEnabled(settings.soundEnabled);
      if (settings.taskCelebration !== undefined) settingsStore.getState().setTaskCelebration(settings.taskCelebration);
      if (settings.routineCelebration !== undefined) settingsStore.getState().setRoutineCelebration(settings.routineCelebration);
    }
    
    if (state.library) libraryStore.getState().setLibrary(state.library);
    if (state.libraryTemplates) libraryStore.getState().setLibraryTemplates(state.libraryTemplates);
    if (state.hasCompletedOnboarding !== undefined) {
      appStore.setState({ hasCompletedOnboarding: state.hasCompletedOnboarding });
    }

    // Update activities array for current user/day
    if (state.users && state.currentUser && state.currentDay) {
      const activities = state.users[state.currentUser]?.days?.[state.currentDay]?.activities || [];
      appStore.setState({ activities });
    }
  }

  /**
   * SIMPLE SYNC: Pull from server, compare timestamps, apply newest
   */
  async sync() {
    console.log('🔄 SIMPLE SYNC: sync() called');
    
    if (!this.enabled || !this.syncId || !this.masterKey) {

      return { success: false, error: 'Sync not enabled' };
    }

    if (this.syncInProgress) {
      syncDebugger.log('STATE', 'Sync already in progress, skipping');

      return { success: false, error: 'Sync in progress' };
    }

    this.syncInProgress = true;
    
    try {
      // 1. Get current local state
      const localState = this.getCompleteState();
      syncDebugger.log('STATE', 'Local state', {
        timestamp: localState.timestamp,
        userCount: Object.keys(localState.users || {}).length
      });

      // 2. Fetch from server using existing pull.php endpoint
      const deviceId = Platform.OS; // Use platform as simple device ID
      // Ensure absolute URL for React Native Web
      const baseUrl = this.API_URL.startsWith('http') ? this.API_URL : `https://stackmap.app${this.API_URL}`;
      // Validate syncId before building URL
      if (typeof this.syncId !== 'string') {
        console.error('❌ SIMPLE SYNC: syncId is not a string in sync()!', typeof this.syncId, this.syncId);
        throw new Error('Invalid syncId - not a string');
      }
      
      const pullUrl = `${baseUrl}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;

      // Use absolute URL - React Native requires this
      const response = await fetch(pullUrl);

      // Check if sync group exists
      if (response.status === 404) {
        // No sync group on server yet, push our state

        syncDebugger.log('PUSH', 'No sync group on server, pushing local state');
        return await this.pushState(localState);
      }

      const serverResponse = await response.json();
      
      if (!serverResponse.success || !serverResponse.encrypted_blob) {
        // No data on server yet, push our state
        syncDebugger.log('PUSH', 'No data on server, pushing local state');
        return await this.pushState(localState);
      }

      // 3. Decrypt server data (pull.php returns encrypted_blob directly)

      const serverState = this.decrypt(serverResponse.encrypted_blob);
      // Don't log sensitive data
      console.log('🔄 SIMPLE SYNC: Server user count:', Object.keys(serverState.users || {}).length);
      syncDebugger.log('PULL', 'Server state', {
        timestamp: serverState.timestamp,
        userCount: Object.keys(serverState.users || {}).length
      });

      // 4. SIMPLE DECISION: Newest timestamp wins
      const serverNewer = serverState.timestamp > localState.timestamp;
      const timeDiff = Math.abs(serverState.timestamp - localState.timestamp) / 1000;

      console.log(`   Server time: ${new Date(serverState.timestamp).toISOString()}`);
      console.log(`   Local time:  ${new Date(localState.timestamp).toISOString()}`);
      
      syncDebugger.log('DECISION', `${serverNewer ? 'SERVER' : 'LOCAL'} is newer`, {
        serverTime: serverState.timestamp,
        localTime: localState.timestamp,
        diff: timeDiff + ' seconds'
      });

      if (serverNewer) {
        // Server is newer, apply it
        console.log('📥 SIMPLE SYNC: Applying server state (server was newer)');
        this.setCompleteState(serverState);
        this.lastServerTimestamp = serverState.timestamp;
        await AsyncStorage.setItem('@sync_last_timestamp', serverState.timestamp.toString());
        
        return {
          success: true,
          action: 'pulled',
          timestamp: serverState.timestamp
        };
      } else {
        // Local is newer, push it
        console.log('📤 SIMPLE SYNC: Pushing local state (local was newer)');
        return await this.pushState(localState);
      }

    } catch (error) {
      syncDebugger.log('ERROR', 'Sync failed', { error: error.message });
      if (__DEV__) {
        console.error('SimpleSyncService: Sync failed', error);
      }
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Push state to server
   */
  async pushState(state) {
    // Validate syncId before making request
    if (typeof this.syncId !== 'string') {
      console.error('❌ SIMPLE SYNC: syncId is not a string in pushState()!', typeof this.syncId, this.syncId);
      throw new Error('Invalid syncId - not a string');
    }
    
    const encryptedBlob = this.encrypt(state);
    const deviceId = Platform.OS; // Use platform as simple device ID
    
    // Ensure absolute URL for React Native Web
    const baseUrl = this.API_URL.startsWith('http') ? this.API_URL : `https://stackmap.app${this.API_URL}`;
    const pushUrl = `${baseUrl}/push.php`;

    // First try to push (update existing)
    const response = await fetch(pushUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: this.syncId,
        device_id: deviceId,
        encrypted_blob: encryptedBlob,
        version: 1, // Simple version number
        device_name: Platform.OS,
        sync_type: 'full'
      })
    });

    const result = await response.json();
    
    // If sync group doesn't exist, create it first
    if (response.status === 404) {

      const createResponse = await fetch(`${baseUrl}/create.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sync_id: this.syncId,
          encrypted_blob: encryptedBlob,
          device_id: deviceId,
          device_name: Platform.OS
        })
      });
      
      const createResult = await createResponse.json();
      
      if (!createResult.success) {
        throw new Error(createResult.error || 'Failed to create sync group');
      }

      return {
        success: true,
        action: 'created',
        timestamp: state.timestamp
      };
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Push failed');
    }

    this.lastServerTimestamp = state.timestamp;
    await AsyncStorage.setItem('@sync_last_timestamp', state.timestamp.toString());
    
    syncDebugger.log('PUSH', 'Successfully pushed to server', {
      timestamp: state.timestamp
    });

    return {
      success: true,
      action: 'pushed',
      timestamp: state.timestamp
    };
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      this.sync().catch(error => {
        if (__DEV__) {
          console.error('Periodic sync failed:', error);
        }
      });
    }, 30000);

    // Also sync immediately
    this.sync();
  }

  /**
   * Restore sync state on app start
   */
  async restoreState() {

    const enabled = await AsyncStorage.getItem('@sync_enabled');
    const syncId = await AsyncStorage.getItem('@sync_id');
    const syncPhrase = await AsyncStorage.getItem('@sync_phrase');
    const lastTimestamp = await AsyncStorage.getItem('@sync_last_timestamp');

    if (enabled === 'true' && syncId && syncPhrase) {

      await this.enable(syncPhrase);
      this.lastServerTimestamp = parseInt(lastTimestamp || '0', 10);
      return true;
    }

    return false;
  }

  /**
   * Manual sync trigger
   */
  async requestSync() {
    return this.sync();
  }

  /**
   * Perform manual sync - compatibility with complex sync service
   * @returns {Promise<{success: boolean, message: string, timestamp?: number, error?: any}>}
   */
  async performManualSync() {
    if (!this.enabled || !this.syncId) {
      throw new Error('Sync is not enabled');
    }
    
    try {

      await this.sync();
      
      return { 
        success: true, 
        message: 'Sync completed successfully',
        timestamp: Date.now()
      };
    } catch (error) {
      if (__DEV__) {
        console.error('[Simple Sync] Manual sync failed:', error);
      }
      return { 
        success: false, 
        message: error.message || 'Sync failed',
        error 
      };
    }
  }

  /**
   * Check if sync is enabled
   */
  async isEnabled() {
    const enabled = await AsyncStorage.getItem('@sync_enabled');
    return enabled === 'true';
  }

  /**
   * Get sync ID
   */
  getSyncId() {
    return this.syncId;
  }

  /**
   * Get recovery phrase
   */
  async getRecoveryPhrase() {
    return await AsyncStorage.getItem('@sync_phrase');
  }

  /**
   * Generate a new recovery phrase
   */
  static generateRecoveryPhrase() {
    const chars = '0123456789abcdef';
    let phrase = '';
    for (let i = 0; i < 32; i++) {
      phrase += chars[Math.floor(Math.random() * 16)];
    }
    return phrase;
  }

  /**
   * Initialize a new sync (like the complex service does)
   */
  async initialize(recoveryPhrase, skipInitialSync = false) {
    console.log('🔄 SIMPLE SYNC: initialize() called, skipInitialSync:', skipInitialSync);
    await this.enable(recoveryPhrase);
    
    if (!skipInitialSync) {
      // After enabling, try to sync immediately to get any existing data

      try {
        await this.sync();
      } catch (error) {
        console.log('🔄 SIMPLE SYNC: Initial sync failed (might be first device):', error.message);
      }
    }
    
    return this.syncId;
  }
  
  /**
   * Initialize for preview only (doesn't sync or save state)
   */
  async initializeForPreview(recoveryPhrase) {
    console.log('🔄 SIMPLE SYNC: initializeForPreview() called');
    
    // Generate sync ID and master key WITHOUT saving to storage
    // Use the SAME method as complex sync
    const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
    const saltBytes = decodeBase64(fixedSalt);
    const iterations = 100000;
    
    // Combine phrase and salt the same way as complex sync
    const phraseBytes = decodeUTF8(recoveryPhrase);
    const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
    combined.set(phraseBytes);
    combined.set(saltBytes, phraseBytes.length);
    
    // Hash multiple times for key derivation
    let key = nacl.hash(combined);
    for (let i = 0; i < iterations; i++) {
      key = nacl.hash(key);
    }
    
    // Use first 16 bytes of key as sync ID (matching complex sync)
    const syncIdBytes = key.slice(0, 16);
    this.syncId = Array.from(syncIdBytes, byte =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
    
    // Use next 32 bytes as master key
    this.masterKey = key.slice(0, 32);

    // Don't set enabled flag or save to storage - this is temporary
    
    return this.syncId;
  }

  /**
   * Add missing methods for compatibility with complex sync
   */
  
  // Status listeners (for UI compatibility)
  addStatusListener(listener) {
    // Simple implementation - could be enhanced
    return () => {}; // Return unsubscribe function
  }
  
  // Verify sync exists on server
  async verifySyncExists() {
    if (!this.syncId) return false;
    
    try {
      // Validate syncId type
      if (typeof this.syncId !== 'string') {
        console.error('❌ SIMPLE SYNC: verifySyncExists() - syncId is not a string!', typeof this.syncId, this.syncId);
        return false;
      }
      
      const deviceId = Platform.OS;
      const baseUrl = this.API_URL.startsWith('http') ? this.API_URL : `https://stackmap.app${this.API_URL}`;
      const verifyUrl = `${baseUrl}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;

      const response = await fetch(verifyUrl);
      
      // If we get a 404, sync doesn't exist
      if (response.status === 404) {
        return false;
      }
      
      // If we get a 200, check the response
      if (response.ok) {
        const result = await response.json();
        // Sync exists if we have success OR if we get a "Sync group not found" error
        // (which means the API is working but the sync needs to be created)
        // But if we have encrypted_blob, the sync definitely exists
        return result.success || result.encrypted_blob !== undefined;
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  // Get active shares (stub for now)
  async getActiveShares() {
    return [];
  }
  
  // Check for auto-update shares
  async hasAutoUpdateShares() {
    return false;
  }
  
  // Update active shares (stub)
  async updateActiveShares() {
    return;
  }
  
  // Delete a share
  async deleteShare(shareId) {
    // Stub implementation

    return { success: true };
  }
  
  // Generate share token
  generateShareToken() {
    return Math.random().toString(36).substring(2, 15);
  }
  
  // Generate sync ID from recovery phrase (for preview/validation)
  async generateSyncId(recoveryPhrase) {

    if (!recoveryPhrase) {
      // Generate new one if not provided
      recoveryPhrase = SimpleSyncService.generateRecoveryPhrase();
    }
    
    // Temporarily generate sync ID without fully enabling
    // This is used for preview/checking if sync exists
    const fixedSalt = 'U3RhY2tNYXBTeW5jRW5jcnlwdGlvblNhbHQ=';
    const saltBytes = decodeBase64(fixedSalt);
    const iterations = 100000;
    
    // Combine phrase and salt the same way as complex sync
    const phraseBytes = decodeUTF8(recoveryPhrase);
    const combined = new Uint8Array(phraseBytes.length + saltBytes.length);
    combined.set(phraseBytes);
    combined.set(saltBytes, phraseBytes.length);
    
    // Hash multiple times for key derivation
    let key = nacl.hash(combined);
    for (let i = 0; i < iterations; i++) {
      key = nacl.hash(key);
    }
    
    // Use first 16 bytes of key as sync ID (matching complex sync)
    const syncIdBytes = key.slice(0, 16);
    const syncId = Array.from(syncIdBytes, byte =>
      byte.toString(16).padStart(2, '0'),
    ).join('');

    return syncId;
  }
  
  // Pull data directly (for onboarding)
  async pullData() {
    if (!this.syncId) {

      return null;
    }
    
    if (!this.masterKey) {

      console.log('🔄 SIMPLE SYNC: You must call initialize() or enable() first');
      return null;
    }

    try {
      const deviceId = Platform.OS; // Use platform as simple device ID
      // Ensure absolute URL for React Native Web
      const baseUrl = this.API_URL.startsWith('http') ? this.API_URL : `https://stackmap.app${this.API_URL}`;
      const pullUrl = `${baseUrl}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;

      const response = await fetch(pullUrl);
      
      // Check if sync group exists
      if (response.status === 404) {
        console.log('🔄 SIMPLE SYNC: Sync group not found (404)');
        return null;
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('🔄 SIMPLE SYNC: Server returned non-JSON response');
        const text = await response.text();
        console.error('Response:', text.substring(0, 200));
        return null;
      }
      
      const result = await response.json();
      
      // Note: pull.php doesn't return success:false, it returns the data directly
      // or returns 404 if not found
      if (!result.encrypted_blob) {

        return null;
      }

      // Decrypt the data before returning
      const decryptedData = this.decrypt(result.encrypted_blob);
      // Don't log sensitive decrypted data
      console.log('🔄 SIMPLE SYNC: Pull data user count:', Object.keys(decryptedData.users || {}).length);
      
      // Return the data in the format onboarding expects
      return { data: decryptedData };
    } catch (error) {
      if (__DEV__) {
        console.error('🔄 SIMPLE SYNC: Error pulling data:', error);
      }
      return null;
    }
  }
  
  // Expose encryption service (for compatibility)
  get encryptionService() {
    return {
      decryptData: (blob) => this.decrypt(blob),
      getDeviceId: async () => Platform.OS,
      initialize: async (phrase, syncId, salt) => {
        // Compatibility method - does nothing as we handle this differently
        console.log('🔄 SIMPLE SYNC: encryptionService.initialize called (compatibility mode)');
        return true;
      }
    };
  }
  
  /**
   * Create share link (simplified version)
   */
  async createShareLink(userId, options = {}) {
    if (!this.enabled || !this.syncId) {
      throw new Error('Sync must be enabled to create share links');
    }

    const {
      recipientName = '',
      shareNote = '',
      includeCompleted = true,
      expiresHours = 24,
    } = options;

    // Get the user's current activities
    const userStore = require('../../stores/useUserStore.js').default;
    const users = userStore.getState().users;
    const user = users[userId];
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get today's activities
    const activities = user.days?.today?.activities || [];
    
    // Filter based on options
    const activitiesToShare = includeCompleted 
      ? activities 
      : activities.filter(a => !a.completed);

    // Create share data
    const shareData = {
      activities: activitiesToShare,
      userName: user.name || 'User',
      userIcon: user.icon || '👤',
      recipientName,
      shareNote,
      createdAt: Date.now(),
      expiresAt: Date.now() + (expiresHours * 60 * 60 * 1000),
    };

    // Encrypt share data
    const encryptedData = this.encrypt(shareData);
    
    // Send to server
    const response = await fetch(`${this.API_URL}/create_share.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: this.syncId,
        encrypted_blob: encryptedData,
        expires_hours: expiresHours,
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create share link');
    }

    const result = await response.json();
    const shareLink = `https://stackmap.app/?share=${result.share_id}`;

    return shareLink;
  }
}

// Export singleton
const simpleSyncService = new SimpleSyncService();
export default simpleSyncService;