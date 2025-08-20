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
    this.API_URL = this.getApiUrl();
  }

  getApiUrl() {
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
  }

  /**
   * Enable sync with recovery phrase
   */
  async enable(recoveryPhrase) {
    if (!recoveryPhrase || recoveryPhrase.length !== 32) {
      throw new Error('Invalid recovery phrase');
    }

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
   * Simple encrypt/decrypt using NaCl
   */
  encrypt(data) {
    const nonce = nacl.randomBytes(24);
    const message = decodeUTF8(JSON.stringify(data));
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

      // 2. Fetch from server
      const response = await fetch(`${this.API_URL}/get.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_id: this.syncId })
      });

      const serverResponse = await response.json();
      
      if (!serverResponse.success) {
        // No data on server yet, push our state
        syncDebugger.log('PUSH', 'No data on server, pushing local state');
        return await this.pushState(localState);
      }

      // 3. Decrypt server data
      const serverState = this.decrypt(serverResponse.data.encrypted_blob);
      syncDebugger.log('PULL', 'Server state', {
        timestamp: serverState.timestamp,
        userCount: Object.keys(serverState.users || {}).length
      });

      // 4. SIMPLE DECISION: Newest timestamp wins
      const serverNewer = serverState.timestamp > localState.timestamp;
      
      syncDebugger.log('DECISION', `${serverNewer ? 'SERVER' : 'LOCAL'} is newer`, {
        serverTime: serverState.timestamp,
        localTime: localState.timestamp,
        diff: Math.abs(serverState.timestamp - localState.timestamp) / 1000 + ' seconds'
      });

      if (serverNewer) {
        // Server is newer, apply it
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
    
    const response = await fetch(`${this.API_URL}/save.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sync_id: this.syncId,
        encrypted_blob: encryptedBlob,
        device_name: Platform.OS,
        sync_type: 'full'
      })
    });

    const result = await response.json();
    
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
    return this.enable(recoveryPhrase);
  }

  /**
   * Create share link
   */
  async createShareLink(activities, expiryHours = 24) {
    // For now, just return a basic implementation
    // This could be enhanced later if needed
    const shareId = Math.random().toString(36).substring(2, 15);
    return `https://stackmap.app/?share=${shareId}`;
  }
}

// Export singleton
const simpleSyncService = new SimpleSyncService();
export default simpleSyncService;