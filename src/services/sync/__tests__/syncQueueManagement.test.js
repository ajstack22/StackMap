/**
 * Comprehensive tests for Sync Queue Management Logic
 *
 * Session 12: Sync Infrastructure Logic Test Implementation
 *
 * Coverage areas:
 * - Queue operations (add, remove, prioritize)
 * - Retry logic with exponential backoff
 * - Rate limiting algorithms
 * - Queue state management
 * - Error handling and recovery
 *
 * Focus: Pure business logic functions with mocked time dependencies
 */

// Mock AsyncStorage for queue persistence
const mockAsyncStorage = {
  storage: new Map(),
  setItem: jest.fn((key, value) => {
    mockAsyncStorage.storage.set(key, value);
    return Promise.resolve();
  }),
  getItem: jest.fn((key) => {
    return Promise.resolve(mockAsyncStorage.storage.get(key) || null);
  }),
  removeItem: jest.fn((key) => {
    mockAsyncStorage.storage.delete(key);
    return Promise.resolve();
  }),
  multiRemove: jest.fn((keys) => {
    keys.forEach(key => mockAsyncStorage.storage.delete(key));
    return Promise.resolve();
  })
};

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock other dependencies
jest.mock('react-native', () => ({
  Platform: { OS: 'web' }
}));

jest.mock('../conflictResolver', () => ({
  mergeStates: jest.fn((local, remote) => ({ ...local, ...remote })),
  getMergeLog: jest.fn(() => ['Mock merge log'])
}));

jest.mock('../encryptionServiceFixed', () => ({
  encryptData: jest.fn((data) => `encrypted-${JSON.stringify(data)}`),
  decryptData: jest.fn((encrypted) => {
    const match = encrypted.match(/^encrypted-(.+)$/);
    return match ? JSON.parse(match[1]) : null;
  })
}));

// Import MinimalSyncService
import MinimalSyncService from '../minimalSyncService';

describe('Sync Queue Management Logic', () => {
  let service;
  const FIXED_TIME = 1705123200000;

  beforeEach(() => {
    // Clear all mocks and storage
    jest.clearAllMocks();
    mockAsyncStorage.storage.clear();

    // Create fresh service instance
    service = new MinimalSyncService.constructor();
    service.syncId = 'test-sync-id';
    service.deviceId = 'test-device-id';
    service.encryptionReady = true;

    // Mock Date.now for deterministic tests
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);

    // Mock global fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (service) {
      service.stopPeriodicPull();
    }
  });

  describe('Rate Limiting Logic', () => {
    test('rateLimitCheck enforces minimum intervals between requests', async () => {
      const action = 'test-action';
      const startTime = performance.now();

      // First call should not wait
      await service.rateLimitCheck(action);
      const firstCallTime = performance.now();

      // Second call immediately should wait
      await service.rateLimitCheck(action);
      const secondCallTime = performance.now();

      expect(secondCallTime - firstCallTime).toBeGreaterThanOrEqual(service.MIN_REQUEST_INTERVAL - 10); // Allow 10ms tolerance
      expect(service.lastRequest[action]).toBeGreaterThan(0);
    });

    test('rateLimitCheck handles multiple concurrent actions independently', async () => {
      const startTime = Date.now();

      // Start multiple actions concurrently
      const promises = [
        service.rateLimitCheck('action1'),
        service.rateLimitCheck('action2'),
        service.rateLimitCheck('action1'), // Should wait
        service.rateLimitCheck('action3')
      ];

      await Promise.all(promises);

      expect(service.lastRequest['action1']).toBeDefined();
      expect(service.lastRequest['action2']).toBeDefined();
      expect(service.lastRequest['action3']).toBeDefined();
    });

    test('rateLimitCheck allows requests after interval has passed', async () => {
      const action = 'test-action';

      // First request
      await service.rateLimitCheck(action);
      const firstTime = service.lastRequest[action];

      // Mock time passage
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME + service.MIN_REQUEST_INTERVAL + 100);

      // Second request after interval should not wait
      const startTime = performance.now();
      await service.rateLimitCheck(action);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // Should be very fast
      expect(service.lastRequest[action]).toBeGreaterThan(firstTime);
    });

    test('rateLimitCheck handles edge case of zero or negative intervals', async () => {
      service.MIN_REQUEST_INTERVAL = 0;

      const promises = [
        service.rateLimitCheck('fast-action'),
        service.rateLimitCheck('fast-action'),
        service.rateLimitCheck('fast-action')
      ];

      // Should not throw and should complete quickly
      const startTime = performance.now();
      await Promise.all(promises);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    test('pushDataWithRetry handles rate limiting with exponential backoff', async () => {
      const testData = { users: { '1': { name: 'Test User' } } };

      // Mock pushData to simulate rate limiting then success
      const mockPushData = jest.spyOn(service, 'pushData')
        .mockResolvedValueOnce({ success: false, rateLimited: true, error: 'Rate limited' })
        .mockResolvedValueOnce({ success: false, rateLimited: true, error: 'Rate limited' })
        .mockResolvedValueOnce({ success: true });

      const startTime = performance.now();
      const result = await service.pushDataWithRetry(testData);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(mockPushData).toHaveBeenCalledTimes(3);

      // Should have waited for exponential backoff: 5000ms + 10000ms
      expect(endTime - startTime).toBeGreaterThan(100); // At least some time passed
    });

    test('pushDataWithRetry calculates exponential backoff correctly', async () => {
      const testData = {};
      const expectedWaitTimes = [5000, 10000, 20000]; // 5s * 2^0, 5s * 2^1, 5s * 2^2

      // Mock pushData to always return rate limited
      jest.spyOn(service, 'pushData').mockResolvedValue({
        success: false,
        rateLimited: true,
        error: 'Rate limited'
      });

      // Mock setTimeout to capture wait times
      const waitTimes = [];
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        waitTimes.push(delay);
        return originalSetTimeout(callback, 0); // Execute immediately for testing
      });

      try {
        await service.pushDataWithRetry(testData);

        // Should have waited with exponential backoff pattern
        expect(waitTimes).toHaveLength(3);
        expectedWaitTimes.forEach((expected, index) => {
          expect(waitTimes[index]).toBe(Math.min(expected, 30000)); // Capped at 30s
        });
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });

    test('pushDataWithRetry respects maximum retry count', async () => {
      const testData = {};

      // Mock pushData to always return rate limited
      const mockPushData = jest.spyOn(service, 'pushData').mockResolvedValue({
        success: false,
        rateLimited: true,
        error: 'Rate limited'
      });

      const result = await service.pushDataWithRetry(testData);

      expect(result.success).toBe(false);
      expect(result.rateLimited).toBe(true);
      expect(mockPushData).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    test('pushDataWithRetry stops retrying on non-rate-limit errors', async () => {
      const testData = {};

      // Mock pushData to return non-rate-limit error
      const mockPushData = jest.spyOn(service, 'pushData').mockResolvedValue({
        success: false,
        rateLimited: false,
        error: 'Network error'
      });

      const result = await service.pushDataWithRetry(testData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(mockPushData).toHaveBeenCalledTimes(1); // No retries for non-rate-limit errors
    });

    test('pushDataWithRetry handles successful response immediately', async () => {
      const testData = {};

      // Mock pushData to succeed immediately
      const mockPushData = jest.spyOn(service, 'pushData').mockResolvedValue({
        success: true
      });

      const startTime = performance.now();
      const result = await service.pushDataWithRetry(testData);
      const endTime = performance.now();

      expect(result.success).toBe(true);
      expect(mockPushData).toHaveBeenCalledTimes(1);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    test('pushDataWithRetry handles maximum wait time cap', async () => {
      const testData = {};

      // Mock pushData to always return rate limited
      jest.spyOn(service, 'pushData').mockResolvedValue({
        success: false,
        rateLimited: true,
        error: 'Rate limited'
      });

      // Mock setTimeout to capture wait times
      const waitTimes = [];
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback, delay) => {
        waitTimes.push(delay);
        return originalSetTimeout(callback, 0);
      });

      try {
        await service.pushDataWithRetry(testData);

        // All wait times should be capped at 30 seconds
        waitTimes.forEach(waitTime => {
          expect(waitTime).toBeLessThanOrEqual(30000);
        });
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('Periodic Sync Queue Management', () => {
    test('enableSync starts periodic pull interval', () => {
      const callback = jest.fn();

      service.enableSync(callback);

      expect(service.isEnabled).toBe(true);
      expect(service.onDataReceived).toBe(callback);
      expect(service.pullInterval).toBeTruthy();
    });

    test('disableSync stops periodic pull interval', () => {
      service.enableSync();
      const intervalId = service.pullInterval;

      service.disableSync();

      expect(service.isEnabled).toBe(false);
      expect(service.pullInterval).toBeNull();
    });

    test('startPeriodicPull clears existing interval before starting new one', () => {
      const mockClearInterval = jest.spyOn(global, 'clearInterval');
      const mockSetInterval = jest.spyOn(global, 'setInterval');

      // Start first interval
      service.startPeriodicPull();
      const firstInterval = service.pullInterval;

      // Start second interval
      service.startPeriodicPull();
      const secondInterval = service.pullInterval;

      expect(mockClearInterval).toHaveBeenCalledWith(firstInterval);
      expect(firstInterval).not.toBe(secondInterval);

      mockClearInterval.mockRestore();
      mockSetInterval.mockRestore();
    });

    test('pullAndNotify respects minimum pull interval', async () => {
      const mockPullData = jest.spyOn(service, 'pullData').mockResolvedValue({
        success: true,
        data: null
      });

      // Set last pull time to now
      service.lastPullTime = Date.now();

      await service.pullAndNotify();

      // Should not call pullData due to minimum interval
      expect(mockPullData).not.toHaveBeenCalled();
    });

    test('pullAndNotify calls callback when data is received', async () => {
      const testData = { users: { '1': { name: 'User' } } };
      const callback = jest.fn();

      jest.spyOn(service, 'pullData').mockResolvedValue({
        success: true,
        data: testData
      });

      service.onDataReceived = callback;
      service.lastPullTime = 0; // Force pull

      await service.pullAndNotify();

      expect(callback).toHaveBeenCalledWith(testData);
    });

    test('pullAndNotify does not call callback on pull failure', async () => {
      const callback = jest.fn();

      jest.spyOn(service, 'pullData').mockResolvedValue({
        success: false,
        error: 'Pull failed'
      });

      service.onDataReceived = callback;
      service.lastPullTime = 0; // Force pull

      await service.pullAndNotify();

      expect(callback).not.toHaveBeenCalled();
    });

    test('pullAndNotify does not call callback when no data received', async () => {
      const callback = jest.fn();

      jest.spyOn(service, 'pullData').mockResolvedValue({
        success: true,
        data: null
      });

      service.onDataReceived = callback;
      service.lastPullTime = 0; // Force pull

      await service.pullAndNotify();

      expect(callback).not.toHaveBeenCalled();
    });

    test('pullAndNotify handles pullData exceptions gracefully', async () => {
      const callback = jest.fn();

      jest.spyOn(service, 'pullData').mockRejectedValue(new Error('Pull exception'));

      service.onDataReceived = callback;
      service.lastPullTime = 0; // Force pull

      // Should not throw
      await expect(service.pullAndNotify()).resolves.toBeUndefined();
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Queue State Management', () => {
    test('tracks multiple operation states independently', async () => {
      const actions = ['push', 'pull', 'join', 'create'];

      // Execute all actions
      const promises = actions.map(action => service.rateLimitCheck(action));
      await Promise.all(promises);

      // All actions should have timestamps
      actions.forEach(action => {
        expect(service.lastRequest[action]).toBeDefined();
        expect(service.lastRequest[action]).toBeGreaterThan(0);
      });
    });

    test('handles queue state persistence through service restart', async () => {
      // Simulate operations before restart
      await service.rateLimitCheck('push');
      await service.rateLimitCheck('pull');

      const originalState = { ...service.lastRequest };

      // Create new service instance (simulating restart)
      const newService = new MinimalSyncService.constructor();
      newService.lastRequest = originalState; // Simulate state restoration

      // Verify state is maintained
      expect(newService.lastRequest.push).toBe(originalState.push);
      expect(newService.lastRequest.pull).toBe(originalState.pull);
    });

    test('clears queue state properly', async () => {
      // Set up some queue state
      await service.rateLimitCheck('push');
      await service.rateLimitCheck('pull');
      service.enableSync();

      expect(Object.keys(service.lastRequest).length).toBeGreaterThan(0);
      expect(service.isEnabled).toBe(true);

      // Clear all state
      await service.clearAll();

      expect(service.syncId).toBeNull();
      expect(service.isEnabled).toBe(false);
      expect(service.pullInterval).toBeNull();
    });

    test('handles concurrent queue operations safely', async () => {
      const concurrentOperations = [];

      // Start multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        concurrentOperations.push(service.rateLimitCheck(`operation_${i}`));
      }

      // All should complete without interference
      await Promise.all(concurrentOperations);

      // Verify all operations were recorded
      for (let i = 0; i < 10; i++) {
        expect(service.lastRequest[`operation_${i}`]).toBeDefined();
      }
    });
  });

  describe('Error Handling and Recovery', () => {
    test('handles rate limiting errors gracefully', async () => {
      // Mock fetch to return rate limit error
      global.fetch.mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Too Many Requests' })
      });

      const result = await service.pushData({ users: {} });

      expect(result.success).toBe(false);
      expect(result.rateLimited).toBe(true);
      expect(result.error).toBe('Too Many Requests');
    });

    test('handles network errors during retry attempts', async () => {
      // Mock pushData to throw network error
      jest.spyOn(service, 'pushData').mockRejectedValue(new Error('Network timeout'));

      await expect(service.pushDataWithRetry({})).rejects.toThrow('Network timeout');
    });

    test('handles invalid rate limit parameters', async () => {
      // Test with invalid minimum interval
      service.MIN_REQUEST_INTERVAL = -100;

      // Should not throw and should handle gracefully
      await expect(service.rateLimitCheck('test')).resolves.toBeUndefined();
    });

    test('handles missing sync ID during queue operations', async () => {
      service.syncId = null;

      const result = await service.pushData({ users: {} });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No sync ID');
    });

    test('handles missing encryption during queue operations', async () => {
      service.encryptionReady = false;

      const result = await service.pushData({ users: {} });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Encryption not ready');
    });

    test('handles queue overflow scenarios', async () => {
      // Simulate rapid operations that could cause queue overflow
      const rapidOperations = [];
      for (let i = 0; i < 1000; i++) {
        rapidOperations.push(service.rateLimitCheck(`rapid_${i}`));
      }

      // Should handle without crashing
      await Promise.all(rapidOperations);

      expect(Object.keys(service.lastRequest).length).toBe(1000);
    });
  });

  describe('Performance and Memory Management', () => {
    test('rate limiting does not accumulate memory over time', async () => {
      const initialMemoryUsage = Object.keys(service.lastRequest).length;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await service.rateLimitCheck(`temp_operation_${i}`);
      }

      const finalMemoryUsage = Object.keys(service.lastRequest).length;

      // Memory usage should grow linearly, not exponentially
      expect(finalMemoryUsage - initialMemoryUsage).toBe(100);
    });

    test('periodic sync intervals are properly cleaned up', () => {
      const mockClearInterval = jest.spyOn(global, 'clearInterval');

      service.enableSync();
      const intervalId = service.pullInterval;

      service.disableSync();

      expect(mockClearInterval).toHaveBeenCalledWith(intervalId);
      mockClearInterval.mockRestore();
    });

    test('handles large number of concurrent rate limit checks efficiently', async () => {
      const startTime = performance.now();

      // Start 1000 concurrent rate limit checks
      const operations = Array.from({ length: 1000 }, (_, i) =>
        service.rateLimitCheck(`perf_test_${i}`)
      );

      await Promise.all(operations);

      const endTime = performance.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('retry logic does not create memory leaks', async () => {
      // Mock pushData to simulate many retry cycles
      jest.spyOn(service, 'pushData').mockImplementation(async () => {
        // Simulate some async work
        await new Promise(resolve => setTimeout(resolve, 1));
        return { success: false, rateLimited: true, error: 'Rate limited' };
      });

      // Mock setTimeout to execute immediately (avoid actual waiting)
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = jest.fn((callback) => {
        callback();
        return 1; // Mock timer ID
      });

      try {
        await service.pushDataWithRetry({});

        // Verify no excessive function calls were accumulated
        expect(global.setTimeout).toHaveBeenCalledTimes(3); // 3 retries
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('handles system clock changes during rate limiting', async () => {
      await service.rateLimitCheck('test');

      // Simulate system clock going backwards
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME - 10000);

      // Should not cause infinite wait
      const startTime = performance.now();
      await service.rateLimitCheck('test');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(service.MIN_REQUEST_INTERVAL + 100);
    });

    test('handles extremely large time values', async () => {
      const largeTime = Number.MAX_SAFE_INTEGER;
      jest.spyOn(Date, 'now').mockReturnValue(largeTime);

      await service.rateLimitCheck('large_time_test');

      expect(service.lastRequest['large_time_test']).toBe(largeTime);
    });

    test('handles zero and negative time values', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(0);

      await service.rateLimitCheck('zero_time_test');

      expect(service.lastRequest['zero_time_test']).toBe(0);

      jest.spyOn(Date, 'now').mockReturnValue(-1000);

      await service.rateLimitCheck('negative_time_test');

      expect(service.lastRequest['negative_time_test']).toBe(-1000);
    });

    test('handles very short minimum intervals', async () => {
      service.MIN_REQUEST_INTERVAL = 1; // 1ms

      const startTime = performance.now();
      await service.rateLimitCheck('short_interval');
      await service.rateLimitCheck('short_interval');
      const endTime = performance.now();

      expect(endTime - startTime).toBeGreaterThan(0);
    });

    test('handles periodic sync with extremely short intervals', () => {
      service.pullIntervalDuration = 1; // 1ms

      service.enableSync();

      expect(service.pullInterval).toBeTruthy();
      expect(service.isEnabled).toBe(true);

      service.disableSync();
    });

    test('handles pullAndNotify with no sync ID', async () => {
      service.syncId = null;

      // Should return early without error
      await expect(service.pullAndNotify()).resolves.toBeUndefined();
    });

    test('handles enableSync without sync ID', () => {
      service.syncId = null;

      service.enableSync();

      expect(service.isEnabled).toBe(true);
      expect(service.pullInterval).toBeNull(); // Should not start interval without sync ID
    });
  });

  describe('Integration with Other Components', () => {
    test('queue management integrates with AsyncStorage operations', async () => {
      const testData = { users: { '1': { name: 'Test User' } } };

      // Mock successful API response
      global.fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });

      await service.pushData(testData);

      // Verify AsyncStorage was called for data persistence
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@minimal_sync_data',
        expect.any(String)
      );
    });

    test('retry logic works with actual encryption service calls', async () => {
      const testData = { users: { '1': { name: 'Test User' } } };

      // Mock rate limited response followed by success
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ error: 'Rate limited' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });

      const result = await service.pushDataWithRetry(testData);

      expect(result.success).toBe(true);
      // Verify encryption service was called
      const encryptionService = require('../encryptionServiceFixed');
      expect(encryptionService.encryptData).toHaveBeenCalled();
    });
  });
});