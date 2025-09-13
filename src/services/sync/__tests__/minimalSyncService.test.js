/**
 * Comprehensive test suite for minimalSyncService.js
 * Tests the main sync orchestration including encryption, network, and conflict resolution
 */

import MinimalSyncService from '../minimalSyncService';
import encryptionService from '../encryptionServiceFixed';
import conflictResolver from '../conflictResolver';
import {
  testSyncData,
  conflictingData,
  generateLargeDataset,
  testRecoveryPhrases,
  networkResponses,
} from './fixtures/syncTestData';
import { createFetchMock, createTimerUtils } from './mocks/syncMocks';

// Create mocks before importing the service
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

// Mock dependencies
jest.mock('../encryptionServiceFixed');
jest.mock('../conflictResolver');
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: mockAsyncStorage,
}));
jest.mock('@react-native-community/netinfo');

describe('MinimalSyncService', () => {
  let syncService;
  let fetchMock;
  let timerUtils;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Set up mocks
    fetchMock = createFetchMock();
    timerUtils = createTimerUtils();

    global.fetch = fetchMock;
    global.console.log = jest.fn();
    global.console.error = jest.fn();

    // Reset AsyncStorage mock
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);

    // Mock encryption service
    encryptionService.initialize = jest.fn().mockResolvedValue(true);
    encryptionService.generateRecoveryPhrase = jest
      .fn()
      .mockReturnValue(testRecoveryPhrases.valid);
    encryptionService.encryptData = jest.fn(
      data => `encrypted:${JSON.stringify(data)}`,
    );
    encryptionService.decryptData = jest.fn(data => {
      if (data.startsWith('encrypted:')) {
        return JSON.parse(data.replace('encrypted:', ''));
      }
      throw new Error('Decryption failed');
    });
    encryptionService.deriveKeyFromPhrase = jest.fn().mockResolvedValue({
      key: 'test-key',
      salt: 'test-salt',
    });

    // Mock conflict resolver
    conflictResolver.mergeStates = jest.fn((local, remote) => ({
      ...local,
      ...remote,
      metadata: { lastMerged: Date.now() },
    }));

    // Create sync service instance
    syncService = new MinimalSyncService();
  });

  afterEach(() => {
    jest.useRealTimers();
    if (syncService) {
      syncService.stopAutoSync();
    }
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(syncService.syncId).toBeNull();
      expect(syncService.deviceId).toBeNull();
      expect(syncService.isEnabled).toBe(false);
      expect(syncService.pullInterval).toBeNull();
    });

    it('should load existing sync ID on initialization', async () => {
      const existingSyncId = 'existing-sync-id';
      mockAsyncStorage.getItem.mockResolvedValueOnce(existingSyncId);

      // Wait for delayed initialization
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('syncId');
    });

    it('should handle error loading existing sync ID', async () => {
      mockAsyncStorage.getItem.mockRejectedValueOnce(
        new Error('Storage error'),
      );

      // Wait for delayed initialization
      jest.advanceTimersByTime(1000);
      await Promise.resolve();

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Error loading existing sync ID'),
        expect.any(Error),
      );
    });
  });

  describe('generateRecoveryPhrase', () => {
    it('should generate a valid recovery phrase', () => {
      const phrase = syncService.generateRecoveryPhrase();
      expect(phrase).toBe(testRecoveryPhrases.valid);
      expect(encryptionService.generateRecoveryPhrase).toHaveBeenCalled();
    });
  });

  describe('enable', () => {
    it('should enable sync with valid recovery phrase', async () => {
      const phrase = testRecoveryPhrases.valid;
      const result = await syncService.enable(phrase);

      expect(result.success).toBe(true);
      expect(result.syncId).toBeDefined();
      expect(syncService.isEnabled).toBe(true);
      expect(encryptionService.initialize).toHaveBeenCalledWith(
        phrase,
        expect.any(String),
      );
    });

    it('should reject invalid recovery phrase', async () => {
      const result = await syncService.enable(testRecoveryPhrases.invalid);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recovery phrase');
      expect(syncService.isEnabled).toBe(false);
    });

    it('should handle spaces in recovery phrase', async () => {
      const result = await syncService.enable(testRecoveryPhrases.withSpaces);

      expect(result.success).toBe(true);
      // Should remove spaces before processing
      expect(encryptionService.deriveKeyFromPhrase).toHaveBeenCalledWith(
        testRecoveryPhrases.withSpaces.replace(/\s/g, ''),
      );
    });

    it('should start auto sync when enabled', async () => {
      const phrase = testRecoveryPhrases.valid;
      await syncService.enable(phrase);

      expect(syncService.pullInterval).toBeDefined();

      // Advance timers to trigger pull
      jest.advanceTimersByTime(30000);

      // Auto sync should have triggered
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('disable', () => {
    beforeEach(async () => {
      await syncService.enable(testRecoveryPhrases.valid);
    });

    it('should disable sync and clear data', async () => {
      await syncService.disable();

      expect(syncService.isEnabled).toBe(false);
      expect(syncService.syncId).toBeNull();
      expect(syncService.pullInterval).toBeNull();
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('syncId');
    });

    it('should stop auto sync when disabled', async () => {
      const intervalId = syncService.pullInterval;
      await syncService.disable();

      expect(syncService.pullInterval).toBeNull();
      expect(clearInterval).toHaveBeenCalledWith(intervalId);
    });
  });

  describe('push', () => {
    beforeEach(async () => {
      await syncService.enable(testRecoveryPhrases.valid);
    });

    it('should push data successfully', async () => {
      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true },
      });

      const result = await syncService.push(testSyncData);

      expect(result.success).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/sync/'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('encrypted:'),
        }),
      );
    });

    it('should encrypt data before pushing', async () => {
      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true },
      });

      await syncService.push(testSyncData);

      expect(encryptionService.encryptData).toHaveBeenCalledWith(testSyncData);
    });

    it('should handle push conflicts', async () => {
      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 409,
        data: {
          success: false,
          error: 'Conflict',
          data: 'encrypted:' + JSON.stringify(conflictingData.remote),
        },
      });

      const result = await syncService.push(testSyncData);

      expect(result.success).toBe(true);
      expect(conflictResolver.mergeStates).toHaveBeenCalled();
    });

    it('should retry on rate limit', async () => {
      let attemptCount = 0;
      fetchMock.mockImplementation(() => {
        attemptCount++;
        if (attemptCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 429,
            json: () => Promise.resolve({ error: 'Too many requests' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      });

      const pushPromise = syncService.push(testSyncData);

      // First attempt fails with 429
      await Promise.resolve();

      // Advance timer for retry delay
      jest.advanceTimersByTime(2000);
      await Promise.resolve();

      const result = await pushPromise;

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(2);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await syncService.push(testSyncData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should not push when sync is disabled', async () => {
      await syncService.disable();

      const result = await syncService.push(testSyncData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sync is not enabled');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('pull', () => {
    beforeEach(async () => {
      await syncService.enable(testRecoveryPhrases.valid);
    });

    it('should pull data successfully', async () => {
      const encryptedData = 'encrypted:' + JSON.stringify(testSyncData);
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: {
          success: true,
          data: encryptedData,
        },
      });

      const result = await syncService.pull();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(testSyncData);
      expect(encryptionService.decryptData).toHaveBeenCalledWith(encryptedData);
    });

    it('should handle pull when no data exists', async () => {
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 404,
        data: { success: false, error: 'Not found' },
      });

      const result = await syncService.pull();

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
    });

    it('should handle decryption errors', async () => {
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: {
          success: true,
          data: 'corrupted-data',
        },
      });

      encryptionService.decryptData.mockImplementationOnce(() => {
        throw new Error('Decryption failed');
      });

      const result = await syncService.pull();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Decryption failed');
    });

    it('should not pull when sync is disabled', async () => {
      await syncService.disable();

      const result = await syncService.pull();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Sync is not enabled');
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should throttle pull requests', async () => {
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true, data: 'encrypted:{}' },
      });

      // Make multiple pull requests quickly
      const results = await Promise.all([
        syncService.pull(),
        syncService.pull(),
        syncService.pull(),
      ]);

      // Only first should succeed, others should be throttled
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toContain('Pull already in progress');
      expect(results[2].success).toBe(false);
      expect(results[2].error).toContain('Pull already in progress');

      // Only one fetch call should be made
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('sync (bidirectional)', () => {
    beforeEach(async () => {
      await syncService.enable(testRecoveryPhrases.valid);
    });

    it('should perform bidirectional sync successfully', async () => {
      const localData = testSyncData;
      const remoteData = conflictingData.remote;

      // Set up pull to return remote data
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: {
          success: true,
          data: 'encrypted:' + JSON.stringify(remoteData),
        },
      });

      // Set up push to succeed
      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true },
      });

      const result = await syncService.sync(localData);

      expect(result.success).toBe(true);
      expect(result.merged).toBeDefined();
      expect(conflictResolver.mergeStates).toHaveBeenCalledWith(
        localData,
        remoteData,
      );
    });

    it('should handle sync when no remote data exists', async () => {
      const localData = testSyncData;

      // Pull returns 404
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 404,
        data: { success: false, error: 'Not found' },
      });

      // Push should succeed
      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true },
      });

      const result = await syncService.sync(localData);

      expect(result.success).toBe(true);
      expect(result.merged).toEqual(localData);
    });

    it('should handle sync conflicts', async () => {
      const localData = conflictingData.local;
      const remoteData = conflictingData.remote;

      // Pull returns remote data
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: {
          success: true,
          data: 'encrypted:' + JSON.stringify(remoteData),
        },
      });

      // Push succeeds after conflict resolution
      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true },
      });

      const result = await syncService.sync(localData);

      expect(result.success).toBe(true);
      expect(conflictResolver.mergeStates).toHaveBeenCalled();
    });
  });

  describe('auto sync', () => {
    beforeEach(async () => {
      await syncService.enable(testRecoveryPhrases.valid);
    });

    it('should start auto sync when enabled', () => {
      expect(syncService.pullInterval).toBeDefined();
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('should stop auto sync when disabled', async () => {
      const intervalId = syncService.pullInterval;
      await syncService.disable();

      expect(clearInterval).toHaveBeenCalledWith(intervalId);
      expect(syncService.pullInterval).toBeNull();
    });

    it('should perform periodic pulls', async () => {
      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true, data: 'encrypted:{}' },
      });

      // Register callback
      const callback = jest.fn();
      syncService.onDataReceived = callback;

      // Advance timer to trigger auto pull
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      jest.runAllTimers();

      expect(fetch).toHaveBeenCalled();
    });

    it('should handle auto sync errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      // Advance timer to trigger auto pull
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      // Should not throw or stop the interval
      expect(syncService.pullInterval).toBeDefined();
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', async () => {
      await syncService.enable(testRecoveryPhrases.valid);

      const largeData = generateLargeDataset(1000);

      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true },
      });

      const startTime = Date.now();
      const result = await syncService.push({
        activities: largeData.activities,
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle rapid sync requests', async () => {
      await syncService.enable(testRecoveryPhrases.valid);

      fetchMock.setResponse('GET', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true, data: 'encrypted:{}' },
      });

      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 200,
        data: { success: true },
      });

      // Make 10 rapid sync requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(syncService.sync({ test: `data${i}` }));
      }

      const results = await Promise.all(promises);

      // All should complete without errors
      results.forEach(result => {
        expect(result.success || result.error?.includes('in progress')).toBe(
          true,
        );
      });
    });
  });

  describe('error recovery', () => {
    beforeEach(async () => {
      await syncService.enable(testRecoveryPhrases.valid);
    });

    it('should recover from temporary network failures', async () => {
      let attemptCount = 0;
      fetchMock.mockImplementation(() => {
        attemptCount++;
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });
      });

      // This should retry and eventually succeed
      const result = await syncService.push(testSyncData);

      expect(attemptCount).toBeGreaterThan(1);
      expect(result.success).toBe(true);
    });

    it('should handle server errors gracefully', async () => {
      fetchMock.setResponse('POST', expect.stringContaining('/api/sync/'), {
        status: 500,
        data: { error: 'Internal server error' },
      });

      const result = await syncService.push(testSyncData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('server error');
    });

    it('should handle malformed server responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await syncService.pull();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('getSyncId', () => {
    it('should return null when sync is not enabled', () => {
      expect(syncService.getSyncId()).toBeNull();
    });

    it('should return sync ID when enabled', async () => {
      await syncService.enable(testRecoveryPhrases.valid);
      const syncId = syncService.getSyncId();

      expect(syncId).toBeDefined();
      expect(typeof syncId).toBe('string');
    });
  });

  describe('isEnabled', () => {
    it('should return false initially', () => {
      expect(syncService.isSyncEnabled()).toBe(false);
    });

    it('should return true when enabled', async () => {
      await syncService.enable(testRecoveryPhrases.valid);
      expect(syncService.isSyncEnabled()).toBe(true);
    });

    it('should return false after disabling', async () => {
      await syncService.enable(testRecoveryPhrases.valid);
      await syncService.disable();
      expect(syncService.isSyncEnabled()).toBe(false);
    });
  });

  describe('memory leaks', () => {
    it('should clean up intervals on disable', async () => {
      await syncService.enable(testRecoveryPhrases.valid);
      const intervalId = syncService.pullInterval;

      await syncService.disable();

      expect(clearInterval).toHaveBeenCalledWith(intervalId);
      expect(syncService.pullInterval).toBeNull();
    });

    it('should clean up event listeners', async () => {
      await syncService.enable(testRecoveryPhrases.valid);

      // Create multiple callbacks
      const callbacks = [jest.fn(), jest.fn(), jest.fn()];
      callbacks.forEach(cb => {
        syncService.onDataReceived = cb;
      });

      await syncService.disable();

      // Callbacks should be cleared
      expect(syncService.onDataReceived).toBeNull();
    });
  });
});
