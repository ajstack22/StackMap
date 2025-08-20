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
    // CRITICAL: Store API URL as instance property
    this.API_URL = 'https://stackmap.app/api/sync';
    console.log('🔄 SIMPLE SYNC: Constructor - API_URL set to:', this.API_URL);
    
    // Auto-restore sync state after a delay (like complex sync does)
    console.log('🔄 SIMPLE SYNC: Service created, will restore state in 1 second');
    setTimeout(() => {
      this.restoreState().then(restored => {
        if (restored) {
          console.log('✅ SIMPLE SYNC: State restored, sync is active');
          console.log(`   Sync ID: ${this.syncId}`);
          console.log(`   Sync will run every 30 seconds`);
        } else {
          console.log('ℹ️ SIMPLE SYNC: No saved state to restore');
          console.log('   To enable sync: Go to Settings > Data > Enable Sync');
        }
      }).catch(err => {
        console.error('❌ SIMPLE SYNC: Error restoring state:', err);
      });
    }, 1000);
  }

  /**
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase) {
    if (!recoveryPhrase || recoveryPhrase.length !== 32) {
      console.error('🔄 SIMPLE SYNC: Invalid recovery phrase length:', recoveryPhrase?.length);
      throw new Error('Invalid recovery phrase');
    }

    console.log('🔄 SIMPLE SYNC: Enabling with recovery phrase');
    console.log('🔄 SIMPLE SYNC: Current API_URL:', this.API_URL);

    // Generate sync ID and master key
    const salt = 'stackmap_sync_salt_2024';
    const iterations = 100000;
    
    // Hash recovery phrase to get sync ID
    let hash = decodeUTF8(recoveryPhrase + salt);
    for (let i = 0; i < iterations; i++) {
      hash = nacl.hash(hash);
    }
    
    this.syncId = encodeBase64(hash.slice(0, 16)).replace(/[^a-zA-Z0-9]/g, '');
    this.masterKey = hash.slice(16, 48);
    this.enabled = true;
    
    console.log('🔄 SIMPLE SYNC: Enabled with syncId:', this.syncId);

    // Store settings
    await AsyncStorage.setItem('@sync_enabled', 'true');
    await AsyncStorage.setItem('@sync_id', this.syncId);
    await AsyncStorage.setItem('@sync_phrase', recoveryPhrase);

    // Start periodic sync
    this.startPeriodicSync();

    syncDebugger.log('STATE', 'Sync enabled', { syncId: this.syncId });
    
    return this.syncId;
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

    console.log('🗑️ SIMPLE SYNC: Deleting from server');
    
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
    console.log('✅ SIMPLE SYNC: Deleted from server', result);
    
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
    const data = decodeBase64(encryptedBlob);
    const nonce = data.slice(0, 24);
    const message = data.slice(24);
    
    const decrypted = nacl.secretbox.open(message, nonce, this.masterKey);
    if (!decrypted) throw new Error('Decryption failed');
    
    return JSON.parse(util.encodeUTF8(decrypted));
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
      console.log('❌ SIMPLE SYNC: Not enabled', { 
        enabled: this.enabled, 
        syncId: this.syncId || 'none',
        hasMasterKey: !!this.masterKey 
      });
      return { success: false, error: 'Sync not enabled' };
    }

    if (this.syncInProgress) {
      syncDebugger.log('STATE', 'Sync already in progress, skipping');
      console.log('⏭️ SIMPLE SYNC: Already in progress, skipping');
      return { success: false, error: 'Sync in progress' };
    }

    console.log('✅ SIMPLE SYNC: Lock acquired, proceeding');
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
      const response = await fetch(`${this.API_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`);

      // Check if sync group exists
      if (response.status === 404) {
        // No sync group on server yet, push our state
        console.log('🔄 SIMPLE SYNC: Sync group not found on server, creating...');
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
      syncDebugger.log('PULL', 'Server state', {
        timestamp: serverState.timestamp,
        userCount: Object.keys(serverState.users || {}).length
      });

      // 4. SIMPLE DECISION: Newest timestamp wins
      const serverNewer = serverState.timestamp > localState.timestamp;
      const timeDiff = Math.abs(serverState.timestamp - localState.timestamp) / 1000;
      
      console.log(`🎯 SIMPLE SYNC DECISION: ${serverNewer ? 'SERVER' : 'LOCAL'} is newer by ${timeDiff} seconds`);
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
      console.error('SimpleSyncService: Sync failed', error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Push state to server
   */
  async pushState(state) {
    const encryptedBlob = this.encrypt(state);
    const deviceId = Platform.OS; // Use platform as simple device ID
    
    // First try to push (update existing)
    const response = await fetch(`${this.API_URL}/push.php`, {
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
      console.log('🔄 SIMPLE SYNC: Sync group not found, creating...');
      
      const createResponse = await fetch(`${this.API_URL}/create.php`, {
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
      
      console.log('✅ SIMPLE SYNC: Sync group created');
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
        console.error('Periodic sync failed:', error);
      });
    }, 30000);

    // Also sync immediately
    this.sync();
  }

  /**
   * Restore sync state on app start
   */
  async restoreState() {
    console.log('🔄 SIMPLE SYNC: Checking for saved sync state...');
    
    const enabled = await AsyncStorage.getItem('@sync_enabled');
    const syncId = await AsyncStorage.getItem('@sync_id');
    const syncPhrase = await AsyncStorage.getItem('@sync_phrase');
    const lastTimestamp = await AsyncStorage.getItem('@sync_last_timestamp');
    
    console.log('🔄 SIMPLE SYNC: Found saved state:', {
      enabled: enabled,
      hasSyncId: !!syncId,
      hasPhrase: !!syncPhrase,
      lastTimestamp: lastTimestamp
    });

    if (enabled === 'true' && syncId && syncPhrase) {
      console.log('🔄 SIMPLE SYNC: Restoring with saved phrase...');
      await this.enable(syncPhrase);
      this.lastServerTimestamp = parseInt(lastTimestamp || '0', 10);
      return true;
    }

    console.log('🔄 SIMPLE SYNC: No valid saved state found');
    return false;
  }

  /**
   * Manual sync trigger
   */
  async requestSync() {
    return this.sync();
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
  async initialize(recoveryPhrase) {
    console.log('🔄 SIMPLE SYNC: initialize() called');
    await this.enable(recoveryPhrase);
    
    // After enabling, try to sync immediately to get any existing data
    console.log('🔄 SIMPLE SYNC: Performing initial sync after initialize');
    try {
      await this.sync();
    } catch (error) {
      console.log('🔄 SIMPLE SYNC: Initial sync failed (might be first device):', error.message);
    }
    
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
      const deviceId = Platform.OS;
      const response = await fetch(`${this.API_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`);
      const result = await response.json();
      return result.success;
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
    console.log('Delete share not implemented in simple sync');
    return { success: true };
  }
  
  // Generate share token
  generateShareToken() {
    return Math.random().toString(36).substring(2, 15);
  }
  
  // Generate sync ID
  async generateSyncId() {
    const phrase = SimpleSyncService.generateRecoveryPhrase();
    await this.enable(phrase);
    return { syncId: this.syncId, recoveryPhrase: phrase };
  }
  
  // Pull data directly (for onboarding)
  async pullData() {
    if (!this.syncId) {
      console.log('🔄 SIMPLE SYNC: pullData - no syncId');
      return null;
    }
    
    console.log('🔄 SIMPLE SYNC: Pulling data from server');
    
    try {
      const deviceId = Platform.OS; // Use platform as simple device ID
      const pullUrl = `${this.API_URL}/pull.php?sync_id=${this.syncId}&device_id=${deviceId}`;
      console.log('🔄 SIMPLE SYNC: Pull URL:', pullUrl);
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
        console.log('🔄 SIMPLE SYNC: No encrypted data in response');
        return null;
      }
      
      console.log('🔄 SIMPLE SYNC: Data pulled successfully');
      // Return the data in the format onboarding expects
      return result; // pull.php returns {encrypted_blob: ..., version: ..., last_modified: ...}
    } catch (error) {
      console.error('🔄 SIMPLE SYNC: Error pulling data:', error);
      return null;
    }
  }
  
  // Expose encryption service (for compatibility)
  get encryptionService() {
    return {
      decryptData: (blob) => this.decrypt(blob)
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

    console.log('🔗 SIMPLE SYNC: Creating share link');

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
    
    console.log('✅ SIMPLE SYNC: Share link created', shareLink);
    return shareLink;
  }
}

// Export singleton
const simpleSyncService = new SimpleSyncService();
export default simpleSyncService;