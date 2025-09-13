/**
 * Comprehensive test suite for syncStoreIntegration.js
 * Tests the integration between sync service and Zustand stores
 */

import syncStoreIntegration from '../syncStoreIntegration';
import minimalSyncService from '../minimalSyncService';
import { 
  testUsers,
  testSettings,
  testLibrary,
  testSyncData,
  conflictingData,
} from './fixtures/syncTestData';
import { createStoreMock } from './mocks/syncMocks';

// Mock the sync service
jest.mock('../minimalSyncService');

// Mock the stores
jest.mock('../../../stores/useUserStore');
jest.mock('../../../stores/useSettingsStore');
jest.mock('../../../stores/useLibraryStore');
jest.mock('../../../stores/useAppStore');

describe('SyncStoreIntegration', () => {
  let userStoreMock;
  let settingsStoreMock;
  let libraryStoreMock;
  let appStoreMock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Create store mocks
    userStoreMock = createStoreMock({ users: testUsers });
    settingsStoreMock = createStoreMock({ settings: testSettings });
    libraryStoreMock = createStoreMock({ library: testLibrary });
    appStoreMock = createStoreMock({ syncStatus: 'idle' });
    
    // Set up store mocks
    require('../../../stores/useUserStore').default = userStoreMock;
    require('../../../stores/useSettingsStore').default = settingsStoreMock;
    require('../../../stores/useLibraryStore').default = libraryStoreMock;
    require('../../../stores/useAppStore').default = appStoreMock;
    
    // Mock sync service methods
    minimalSyncService.isSyncEnabled = jest.fn().mockReturnValue(false);
    minimalSyncService.enable = jest.fn().mockResolvedValue({ success: true, syncId: 'test-sync-id' });
    minimalSyncService.disable = jest.fn().mockResolvedValue(true);
    minimalSyncService.push = jest.fn().mockResolvedValue({ success: true });
    minimalSyncService.pull = jest.fn().mockResolvedValue({ success: true, data: null });
    minimalSyncService.sync = jest.fn().mockResolvedValue({ success: true, merged: testSyncData });
    minimalSyncService.getSyncId = jest.fn().mockReturnValue(null);
    minimalSyncService.generateRecoveryPhrase = jest.fn().mockReturnValue('test-recovery-phrase');
    minimalSyncService.onDataReceived = null;
    
    // Initialize integration
    syncStoreIntegration.initialize();
  });

  afterEach(() => {
    jest.useRealTimers();
    syncStoreIntegration.stopSync();
  });

  describe('initialization', () => {
    it('should set up data received callback', () => {
      expect(minimalSyncService.onDataReceived).toBeDefined();
      expect(typeof minimalSyncService.onDataReceived).toBe('function');
    });

    it('should not start sync if disabled', () => {
      expect(minimalSyncService.pull).not.toHaveBeenCalled();
    });

    it('should perform initial sync if enabled', () => {
      minimalSyncService.isSyncEnabled.mockReturnValue(true);
      syncStoreIntegration.initialize();
      
      expect(minimalSyncService.pull).toHaveBeenCalled();
    });
  });

  describe('getCurrentState', () => {
    it('should aggregate state from all stores', () => {
      const state = syncStoreIntegration.getCurrentState();
      
      expect(state).toEqual({
        users: testUsers,
        settings: testSettings,
        library: testLibrary,
        activities: {}, // Empty by default
        metadata: expect.objectContaining({
          lastModified: expect.any(Number),
          deviceId: expect.any(String),
        }),
      });
    });

    it('should include field timestamps in metadata', () => {
      const state = syncStoreIntegration.getCurrentState();
      
      expect(state.metadata.fieldTimestamps).toEqual({
        users: expect.any(Number),
        settings: expect.any(Number),
        library: expect.any(Number),
        activities: expect.any(Number),
      });
    });
  });

  describe('restoreData', () => {
    it('should update all stores with synced data', () => {
      const syncedData = {
        users: { user3: { name: 'New User' } },
        settings: { theme: 'dark' },
        library: { NewCategory: [] },
      };
      
      syncStoreIntegration.restoreData(syncedData);
      
      expect(userStoreMock.setState).toHaveBeenCalledWith({ users: syncedData.users });
      expect(settingsStoreMock.setState).toHaveBeenCalledWith({ settings: syncedData.settings });
      expect(libraryStoreMock.setState).toHaveBeenCalledWith({ library: syncedData.library });
    });

    it('should handle partial data updates', () => {
      const partialData = {
        users: { user1: { name: 'Updated' } },
      };
      
      syncStoreIntegration.restoreData(partialData);
      
      expect(userStoreMock.setState).toHaveBeenCalledWith({ users: partialData.users });
      // Other stores should not be called if data is not present
      expect(settingsStoreMock.setState).not.toHaveBeenCalled();
      expect(libraryStoreMock.setState).not.toHaveBeenCalled();
    });

    it('should handle null/undefined data gracefully', () => {
      syncStoreIntegration.restoreData(null);
      expect(userStoreMock.setState).not.toHaveBeenCalled();
      
      syncStoreIntegration.restoreData(undefined);
      expect(userStoreMock.setState).not.toHaveBeenCalled();
      
      syncStoreIntegration.restoreData({});
      expect(userStoreMock.setState).not.toHaveBeenCalled();
    });
  });

  describe('enableSync', () => {
    it('should enable sync with recovery phrase', async () => {
      const phrase = 'test-recovery-phrase';
      const result = await syncStoreIntegration.enableSync(phrase);
      
      expect(result.success).toBe(true);
      expect(result.syncId).toBe('test-sync-id');
      expect(minimalSyncService.enable).toHaveBeenCalledWith(phrase);
      expect(appStoreMock.setState).toHaveBeenCalledWith({ 
        syncEnabled: true,
        syncId: 'test-sync-id',
      });
    });

    it('should perform initial sync after enabling', async () => {
      minimalSyncService.pull.mockResolvedValueOnce({
        success: true,
        data: testSyncData,
      });
      
      await syncStoreIntegration.enableSync('test-phrase');
      
      expect(minimalSyncService.pull).toHaveBeenCalled();
    });

    it('should handle enable errors', async () => {
      minimalSyncService.enable.mockResolvedValueOnce({
        success: false,
        error: 'Invalid phrase',
      });
      
      const result = await syncStoreIntegration.enableSync('bad-phrase');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phrase');
      expect(appStoreMock.setState).not.toHaveBeenCalledWith(
        expect.objectContaining({ syncEnabled: true })
      );
    });

    it('should set up periodic sync after enabling', async () => {
      await syncStoreIntegration.enableSync('test-phrase');
      
      // Advance timer to trigger periodic sync
      jest.advanceTimersByTime(5000); // 5 second debounce
      
      expect(minimalSyncService.push).toHaveBeenCalled();
    });
  });

  describe('disableSync', () => {
    beforeEach(async () => {
      await syncStoreIntegration.enableSync('test-phrase');
    });

    it('should disable sync and clear state', async () => {
      await syncStoreIntegration.disableSync();
      
      expect(minimalSyncService.disable).toHaveBeenCalled();
      expect(appStoreMock.setState).toHaveBeenCalledWith({
        syncEnabled: false,
        syncId: null,
      });
    });

    it('should stop periodic sync', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      await syncStoreIntegration.disableSync();
      
      // Should clear any intervals
      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('pushChanges', () => {
    beforeEach(async () => {
      minimalSyncService.isSyncEnabled.mockReturnValue(true);
      await syncStoreIntegration.enableSync('test-phrase');
    });

    it('should push current state to sync service', async () => {
      await syncStoreIntegration.pushChanges();
      
      expect(minimalSyncService.push).toHaveBeenCalledWith(
        expect.objectContaining({
          users: testUsers,
          settings: testSettings,
          library: testLibrary,
        })
      );
    });

    it('should update sync status during push', async () => {
      const pushPromise = syncStoreIntegration.pushChanges();
      
      expect(appStoreMock.setState).toHaveBeenCalledWith({ syncStatus: 'syncing' });
      
      await pushPromise;
      
      expect(appStoreMock.setState).toHaveBeenCalledWith({ 
        syncStatus: 'success',
        lastSyncTime: expect.any(Number),
      });
    });

    it('should handle push errors', async () => {
      minimalSyncService.push.mockResolvedValueOnce({
        success: false,
        error: 'Network error',
      });
      
      await syncStoreIntegration.pushChanges();
      
      expect(appStoreMock.setState).toHaveBeenCalledWith({
        syncStatus: 'error',
        syncError: 'Network error',
      });
    });

    it('should not push when sync is disabled', async () => {
      minimalSyncService.isSyncEnabled.mockReturnValue(false);
      
      await syncStoreIntegration.pushChanges();
      
      expect(minimalSyncService.push).not.toHaveBeenCalled();
    });
  });

  describe('pullChanges', () => {
    beforeEach(async () => {
      minimalSyncService.isSyncEnabled.mockReturnValue(true);
    });

    it('should pull and restore data', async () => {
      minimalSyncService.pull.mockResolvedValueOnce({
        success: true,
        data: testSyncData,
      });
      
      await syncStoreIntegration.pullChanges();
      
      expect(minimalSyncService.pull).toHaveBeenCalled();
      expect(userStoreMock.setState).toHaveBeenCalledWith({ 
        users: testSyncData.users,
      });
    });

    it('should handle pull with no data', async () => {
      minimalSyncService.pull.mockResolvedValueOnce({
        success: true,
        data: null,
      });
      
      await syncStoreIntegration.pullChanges();
      
      expect(userStoreMock.setState).not.toHaveBeenCalled();
    });

    it('should handle pull errors', async () => {
      minimalSyncService.pull.mockResolvedValueOnce({
        success: false,
        error: 'Decryption failed',
      });
      
      await syncStoreIntegration.pullChanges();
      
      expect(appStoreMock.setState).toHaveBeenCalledWith({
        syncStatus: 'error',
        syncError: 'Decryption failed',
      });
    });
  });

  describe('syncData (bidirectional)', () => {
    beforeEach(async () => {
      minimalSyncService.isSyncEnabled.mockReturnValue(true);
    });

    it('should perform bidirectional sync', async () => {
      const mergedData = {
        ...testSyncData,
        users: { ...testUsers, user3: { name: 'Merged User' } },
      };
      
      minimalSyncService.sync.mockResolvedValueOnce({
        success: true,
        merged: mergedData,
      });
      
      await syncStoreIntegration.syncData();
      
      expect(minimalSyncService.sync).toHaveBeenCalledWith(
        expect.objectContaining({
          users: testUsers,
          settings: testSettings,
          library: testLibrary,
        })
      );
      
      expect(userStoreMock.setState).toHaveBeenCalledWith({
        users: mergedData.users,
      });
    });

    it('should handle sync conflicts', async () => {
      const localState = conflictingData.local;
      const remoteState = conflictingData.remote;
      
      userStoreMock.getState.mockReturnValue({ users: localState.users });
      
      minimalSyncService.sync.mockResolvedValueOnce({
        success: true,
        merged: remoteState, // Remote wins in this test
      });
      
      await syncStoreIntegration.syncData();
      
      expect(userStoreMock.setState).toHaveBeenCalledWith({
        users: remoteState.users,
      });
    });
  });

  describe('debounced sync', () => {
    beforeEach(async () => {
      minimalSyncService.isSyncEnabled.mockReturnValue(true);
      await syncStoreIntegration.enableSync('test-phrase');
    });

    it('should debounce multiple sync requests', async () => {
      // Trigger multiple syncs quickly
      syncStoreIntegration.triggerSync();
      syncStoreIntegration.triggerSync();
      syncStoreIntegration.triggerSync();
      
      // Should not sync immediately
      expect(minimalSyncService.push).not.toHaveBeenCalled();
      
      // Advance timer past debounce period
      jest.advanceTimersByTime(5000);
      
      // Should only sync once
      expect(minimalSyncService.push).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer on new changes', () => {
      syncStoreIntegration.triggerSync();
      
      // Advance timer partially
      jest.advanceTimersByTime(2000);
      
      // Trigger again - should reset timer
      syncStoreIntegration.triggerSync();
      
      // Advance 3 more seconds (total 5)
      jest.advanceTimersByTime(3000);
      
      // Should not have synced yet (timer was reset)
      expect(minimalSyncService.push).not.toHaveBeenCalled();
      
      // Advance remaining time
      jest.advanceTimersByTime(2000);
      
      // Now should sync
      expect(minimalSyncService.push).toHaveBeenCalledTimes(1);
    });
  });

  describe('onDataReceived callback', () => {
    it('should restore data when callback is triggered', () => {
      const callback = minimalSyncService.onDataReceived;
      const newData = {
        users: { user4: { name: 'Callback User' } },
      };
      
      callback(newData);
      
      expect(userStoreMock.setState).toHaveBeenCalledWith({
        users: newData.users,
      });
    });

    it('should update sync status on data received', () => {
      const callback = minimalSyncService.onDataReceived;
      
      callback(testSyncData);
      
      expect(appStoreMock.setState).toHaveBeenCalledWith({
        syncStatus: 'success',
        lastSyncTime: expect.any(Number),
      });
    });
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', () => {
      appStoreMock.getState.mockReturnValue({
        syncEnabled: true,
        syncId: 'test-id',
        syncStatus: 'success',
        lastSyncTime: Date.now(),
      });
      
      const status = syncStoreIntegration.getSyncStatus();
      
      expect(status).toEqual({
        enabled: true,
        syncId: 'test-id',
        status: 'success',
        lastSyncTime: expect.any(Number),
      });
    });

    it('should return disabled status when not enabled', () => {
      minimalSyncService.isSyncEnabled.mockReturnValue(false);
      appStoreMock.getState.mockReturnValue({
        syncEnabled: false,
        syncId: null,
      });
      
      const status = syncStoreIntegration.getSyncStatus();
      
      expect(status.enabled).toBe(false);
      expect(status.syncId).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should handle store errors gracefully', () => {
      userStoreMock.getState.mockImplementation(() => {
        throw new Error('Store error');
      });
      
      expect(() => syncStoreIntegration.getCurrentState()).not.toThrow();
    });

    it('should handle sync service errors', async () => {
      minimalSyncService.sync.mockRejectedValueOnce(new Error('Sync failed'));
      
      await syncStoreIntegration.syncData();
      
      expect(appStoreMock.setState).toHaveBeenCalledWith({
        syncStatus: 'error',
        syncError: expect.stringContaining('Sync failed'),
      });
    });
  });

  describe('memory management', () => {
    it('should clean up on stopSync', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      syncStoreIntegration.stopSync();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should not leak memory with rapid state changes', () => {
      // Simulate rapid state changes
      for (let i = 0; i < 1000; i++) {
        syncStoreIntegration.triggerSync();
      }
      
      // Should only have one pending sync
      jest.advanceTimersByTime(5000);
      
      expect(minimalSyncService.push).toHaveBeenCalledTimes(1);
    });
  });
});