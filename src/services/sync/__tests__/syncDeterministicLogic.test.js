/**
 * Comprehensive tests for Sync Deterministic Logic
 *
 * Session 12: Sync Infrastructure Logic Test Implementation
 *
 * Coverage areas:
 * - Time-dependent business logic with mocked time
 * - Timestamp comparison algorithms
 * - Deterministic conflict resolution
 * - Time-sensitive queue operations
 * - Clock synchronization edge cases
 *
 * Focus: Pure deterministic logic functions with controlled time
 */

import ConflictResolver from '../conflictResolver';
import {
  calculateSyncRetryDelay,
  checkSyncOperationRateLimit
} from '../../../utils/syncOperationUtils';

describe('Sync Deterministic Logic Tests', () => {
  const FIXED_TIME = 1705123200000; // Jan 13, 2025 12:00:00 GMT
  const MINUTE = 60 * 1000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  beforeEach(() => {
    // Mock Date.now for deterministic tests
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);

    // Mock crypto for deterministic device IDs
    global.crypto = {
      getRandomValues: jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      })
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Timestamp-Based Conflict Resolution', () => {
    let resolver;

    beforeEach(() => {
      resolver = new ConflictResolver.constructor();
    });

    test('resolves conflicts deterministically based on timestamps', () => {
      const localData = {
        users: {
          '1': { id: '1', name: 'Local User', lastModified: FIXED_TIME - HOUR }
        },
        metadata: {
          deviceId: 'local-device',
          fieldTimestamps: { users: FIXED_TIME - HOUR }
        }
      };

      const remoteData = {
        users: {
          '1': { id: '1', name: 'Remote User', lastModified: FIXED_TIME }
        },
        metadata: {
          deviceId: 'remote-device',
          fieldTimestamps: { users: FIXED_TIME }
        }
      };

      const result = resolver.mergeStates(localData, remoteData);

      // Remote should win due to newer timestamp
      expect(result.users['1'].name).toBe('Remote User');
      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });

    test('produces identical results for identical timestamps with consistent tiebreaker', () => {
      const createData = (deviceId, name) => ({
        users: {
          '1': { id: '1', name, lastModified: FIXED_TIME }
        },
        metadata: {
          deviceId,
          fieldTimestamps: { users: FIXED_TIME }
        }
      });

      // Test multiple runs with same data
      const results = [];
      for (let i = 0; i < 10; i++) {
        const local = createData('device-z', 'User A');
        const remote = createData('device-a', 'User B');
        results.push(resolver.mergeStates(local, remote));
      }

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.users['1'].name).toBe(firstResult.users['1'].name);
      });

      // Device-a should win (device-z > device-a alphabetically means remote wins)
      expect(firstResult.users['1'].name).toBe('User B');
    });

    test('handles timestamp precision and edge cases', () => {
      const testCases = [
        {
          name: 'exact same timestamp',
          localTime: FIXED_TIME,
          remoteTime: FIXED_TIME,
          expectedWinner: 'tiebreaker'
        },
        {
          name: 'one millisecond difference',
          localTime: FIXED_TIME,
          remoteTime: FIXED_TIME + 1,
          expectedWinner: 'remote'
        },
        {
          name: 'one second difference',
          localTime: FIXED_TIME,
          remoteTime: FIXED_TIME + 1000,
          expectedWinner: 'remote'
        },
        {
          name: 'one minute difference',
          localTime: FIXED_TIME,
          remoteTime: FIXED_TIME + MINUTE,
          expectedWinner: 'remote'
        },
        {
          name: 'negative timestamp',
          localTime: -1000,
          remoteTime: FIXED_TIME,
          expectedWinner: 'remote'
        },
        {
          name: 'very large timestamp',
          localTime: FIXED_TIME,
          remoteTime: Number.MAX_SAFE_INTEGER,
          expectedWinner: 'remote'
        }
      ];

      testCases.forEach(({ name, localTime, remoteTime, expectedWinner }) => {
        const local = {
          activities: { 'a1': { text: 'Local', modifiedAt: localTime } },
          metadata: { deviceId: 'device-local' }
        };

        const remote = {
          activities: { 'a1': { text: 'Remote', modifiedAt: remoteTime } },
          metadata: { deviceId: 'device-remote' }
        };

        const result = resolver.mergeStates(local, remote);

        if (expectedWinner === 'remote') {
          expect(result.activities['a1'].text).toBe('Remote');
        } else if (expectedWinner === 'local') {
          expect(result.activities['a1'].text).toBe('Local');
        } else if (expectedWinner === 'tiebreaker') {
          // Device tiebreaker: device-local < device-remote, so local wins
          expect(result.activities['a1'].text).toBe('Local');
        }
      });
    });

    test('handles clock skew scenarios', () => {
      // Simulate client clock being ahead of server
      const clientAheadTime = FIXED_TIME + DAY;
      const serverTime = FIXED_TIME;

      const localData = {
        activities: { 'a1': { text: 'Client Activity', modifiedAt: clientAheadTime } },
        metadata: { deviceId: 'client' }
      };

      const remoteData = {
        activities: { 'a1': { text: 'Server Activity', modifiedAt: serverTime } },
        metadata: { deviceId: 'server' }
      };

      const result = resolver.mergeStates(localData, remoteData);

      // Client should win due to "future" timestamp
      expect(result.activities['a1'].text).toBe('Client Activity');
    });

    test('handles timestamp rollover and edge boundaries', () => {
      const maxTimestamp = Number.MAX_SAFE_INTEGER;
      const minTimestamp = Number.MIN_SAFE_INTEGER;

      const local = {
        settings: { theme: 'local' },
        metadata: {
          deviceId: 'local',
          fieldTimestamps: { settings: maxTimestamp }
        }
      };

      const remote = {
        settings: { theme: 'remote' },
        metadata: {
          deviceId: 'remote',
          fieldTimestamps: { settings: minTimestamp }
        }
      };

      const result = resolver.mergeStates(local, remote);

      expect(result.settings.theme).toBe('local'); // Local has larger timestamp
    });
  });

  describe('Time-Based Field Change Detection', () => {
    test('detectes changes with precise timing', () => {
      // Mock MinimalSyncService for updateMetadata testing
      const service = {
        deviceId: 'test-device',
        updateMetadata: function(newData, oldData) {
          const now = Date.now();
          const metadata = oldData?.metadata || {};
          const fieldTimestamps = metadata.fieldTimestamps || {};

          const updatedTimestamps = { ...fieldTimestamps };

          if (JSON.stringify(newData.users) !== JSON.stringify(oldData?.users)) {
            updatedTimestamps.users = now;
          }

          if (JSON.stringify(newData.activities) !== JSON.stringify(oldData?.activities)) {
            updatedTimestamps.activities = now;
          }

          return {
            ...newData,
            metadata: {
              lastModified: now,
              deviceId: this.deviceId,
              fieldTimestamps: updatedTimestamps
            }
          };
        }
      };

      const baseTime = FIXED_TIME - HOUR;
      const oldData = {
        users: { '1': { name: 'Old User' } },
        activities: { 'a1': { text: 'Old Activity' } },
        metadata: {
          fieldTimestamps: {
            users: baseTime,
            activities: baseTime
          }
        }
      };

      // Test 1: No changes
      const noChanges = service.updateMetadata(oldData, oldData);
      expect(noChanges.metadata.fieldTimestamps.users).toBe(baseTime);
      expect(noChanges.metadata.fieldTimestamps.activities).toBe(baseTime);

      // Test 2: User changes only
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);
      const userChange = {
        users: { '1': { name: 'New User' } },
        activities: { 'a1': { text: 'Old Activity' } }
      };
      const userResult = service.updateMetadata(userChange, oldData);
      expect(userResult.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
      expect(userResult.metadata.fieldTimestamps.activities).toBe(baseTime);

      // Test 3: Activity changes only
      jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME + MINUTE);
      const activityChange = {
        users: { '1': { name: 'Old User' } },
        activities: { 'a1': { text: 'New Activity' } }
      };
      const activityResult = service.updateMetadata(activityChange, oldData);
      expect(activityResult.metadata.fieldTimestamps.users).toBe(baseTime);
      expect(activityResult.metadata.fieldTimestamps.activities).toBe(FIXED_TIME + MINUTE);
    });

    test('handles rapid sequential changes', () => {
      const timestamps = [];
      const service = {
        deviceId: 'test-device',
        updateMetadata: function(newData, oldData) {
          const now = Date.now();
          timestamps.push(now);

          return {
            ...newData,
            metadata: {
              lastModified: now,
              deviceId: this.deviceId,
              fieldTimestamps: { users: now }
            }
          };
        }
      };

      const baseData = { users: { '1': { name: 'User' } } };

      // Simulate rapid changes
      for (let i = 0; i < 5; i++) {
        jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME + i);
        service.updateMetadata(
          { users: { '1': { name: `User ${i}` } } },
          baseData
        );
      }

      // Timestamps should be strictly increasing
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThan(timestamps[i - 1]);
      }
    });
  });

  describe('Deterministic Retry Logic', () => {
    test('calculateSyncRetryDelay produces predictable exponential backoff', () => {
      const baseDelay = 1000;
      const maxDelay = 30000;

      const testCases = [
        { attempt: 1, expected: 1000 },   // 2^0 * 1000
        { attempt: 2, expected: 2000 },   // 2^1 * 1000
        { attempt: 3, expected: 4000 },   // 2^2 * 1000
        { attempt: 4, expected: 8000 },   // 2^3 * 1000
        { attempt: 5, expected: 16000 },  // 2^4 * 1000
        { attempt: 6, expected: 30000 },  // 2^5 * 1000 = 32000, capped at 30000
        { attempt: 10, expected: 30000 }, // Always capped at maxDelay
      ];

      testCases.forEach(({ attempt, expected }) => {
        const result = calculateSyncRetryDelay(attempt, baseDelay, maxDelay);
        expect(result).toBe(expected);
      });
    });

    test('retry delay calculation is deterministic across runs', () => {
      const results1 = [];
      const results2 = [];

      for (let attempt = 1; attempt <= 10; attempt++) {
        results1.push(calculateSyncRetryDelay(attempt));
        results2.push(calculateSyncRetryDelay(attempt));
      }

      expect(results1).toEqual(results2);
    });

    test('handles edge cases in retry delay calculation', () => {
      // Test invalid inputs
      expect(calculateSyncRetryDelay(0)).toBe(1000);
      expect(calculateSyncRetryDelay(-1)).toBe(1000);
      expect(calculateSyncRetryDelay('invalid')).toBe(1000);

      // Test with custom parameters
      expect(calculateSyncRetryDelay(1, 500, 10000)).toBe(500);
      expect(calculateSyncRetryDelay(1, -100)).toBe(1000); // Falls back to default
      expect(calculateSyncRetryDelay(1, 1000, 500)).toBe(1000); // maxDelay < baseDelay
    });
  });

  describe('Time-Based Rate Limiting', () => {
    test('rate limiting decisions are deterministic', () => {
      const baseTime = FIXED_TIME;

      // Test scenarios with precise timing
      const scenarios = [
        {
          name: 'operation allowed - no previous operation',
          lastOperationTime: 0,
          currentTime: baseTime,
          interval: 5000,
          expectedLimited: false
        },
        {
          name: 'operation rate limited - too soon',
          lastOperationTime: baseTime - 3000,
          currentTime: baseTime,
          interval: 5000,
          expectedLimited: true,
          expectedWaitTime: 2000
        },
        {
          name: 'operation allowed - enough time passed',
          lastOperationTime: baseTime - 6000,
          currentTime: baseTime,
          interval: 5000,
          expectedLimited: false
        },
        {
          name: 'edge case - exactly at interval boundary',
          lastOperationTime: baseTime - 5000,
          currentTime: baseTime,
          interval: 5000,
          expectedLimited: false
        },
        {
          name: 'edge case - one millisecond short',
          lastOperationTime: baseTime - 4999,
          currentTime: baseTime,
          interval: 5000,
          expectedLimited: true,
          expectedWaitTime: 1
        }
      ];

      scenarios.forEach(({ name, lastOperationTime, currentTime, interval, expectedLimited, expectedWaitTime }) => {
        jest.spyOn(Date, 'now').mockReturnValue(currentTime);

        const result = checkSyncOperationRateLimit({
          lastOperationTime,
          minIntervalMs: interval
        });

        expect(result.isRateLimited).toBe(expectedLimited);
        if (expectedWaitTime !== undefined) {
          expect(result.waitTimeMs).toBe(expectedWaitTime);
        }
      });
    });

    test('operation-specific rate limits work deterministically', () => {
      const lastOperationTime = FIXED_TIME - 3000; // 3 seconds ago

      const operationTypes = [
        { type: 'manual', interval: 5000, expectedLimited: true, expectedWait: 2000 },
        { type: 'enable', interval: 10000, expectedLimited: true, expectedWait: 7000 },
        { type: 'restore', interval: 10000, expectedLimited: true, expectedWait: 7000 },
        { type: 'disable', interval: 2000, expectedLimited: false }, // 3s > 2s interval
      ];

      operationTypes.forEach(({ type, expectedLimited, expectedWait }) => {
        const result = checkSyncOperationRateLimit({
          lastOperationTime,
          operationType: type
        });

        expect(result.isRateLimited).toBe(expectedLimited);
        if (expectedWait !== undefined) {
          expect(result.waitTimeMs).toBe(expectedWait);
        }
      });
    });

    test('handles time anomalies deterministically', () => {
      // Test clock going backwards
      const result1 = checkSyncOperationRateLimit({
        lastOperationTime: FIXED_TIME + 1000, // Future time
        minIntervalMs: 5000
      });
      expect(result1.isRateLimited).toBe(false); // Should handle gracefully

      // Test very large time differences
      const result2 = checkSyncOperationRateLimit({
        lastOperationTime: 1000, // Very old timestamp
        minIntervalMs: 5000
      });
      expect(result2.isRateLimited).toBe(false);

      // Test invalid timestamps
      const result3 = checkSyncOperationRateLimit({
        lastOperationTime: null,
        minIntervalMs: 5000
      });
      expect(result3.isRateLimited).toBe(false);
    });
  });

  describe('Deterministic Device ID Generation', () => {
    test('device ID generation with mocked crypto is deterministic', () => {
      const resolver = new ConflictResolver.constructor();

      // Generate multiple device IDs with same mock
      const ids = [];
      for (let i = 0; i < 10; i++) {
        ids.push(resolver.generateDeviceId());
      }

      // All should be identical with mocked crypto
      expect(new Set(ids).size).toBe(1);
      expect(ids[0]).toMatch(/^[a-f0-9]+$/);
    });

    test('device ID tiebreaker is deterministic', () => {
      const resolver = new ConflictResolver.constructor();

      const testCases = [
        { local: 'device-a', remote: 'device-z', expected: 'local' },
        { local: 'device-z', remote: 'device-a', expected: 'remote' },
        { local: 'same-device', remote: 'same-device', expected: 'remote' },
        { local: null, remote: 'device', expected: 'remote' },
        { local: 'device', remote: null, expected: 'local' },
        { local: null, remote: null, expected: 'local' },
        { local: '', remote: 'device', expected: 'remote' },
        { local: 'a', remote: 'b', expected: 'local' },
        { local: 'b', remote: 'a', expected: 'remote' }
      ];

      testCases.forEach(({ local, remote, expected }) => {
        const result = resolver.tiebreaker(local, remote);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Temporal Consistency in Complex Scenarios', () => {
    test('maintains temporal consistency during multi-stage merges', () => {
      const resolver = new ConflictResolver.constructor();

      // Create data with different timestamps
      const state1 = {
        users: { '1': { name: 'User 1', lastModified: FIXED_TIME - DAY } },
        metadata: { deviceId: 'device1', fieldTimestamps: { users: FIXED_TIME - DAY } }
      };

      const state2 = {
        users: { '2': { name: 'User 2', lastModified: FIXED_TIME - HOUR } },
        metadata: { deviceId: 'device2', fieldTimestamps: { users: FIXED_TIME - HOUR } }
      };

      const state3 = {
        users: { '3': { name: 'User 3', lastModified: FIXED_TIME } },
        metadata: { deviceId: 'device3', fieldTimestamps: { users: FIXED_TIME } }
      };

      // Merge in sequence: 1+2, then result+3
      const merge1 = resolver.mergeStates(state1, state2);
      const finalMerge = resolver.mergeStates(merge1, state3);

      // Should have all users with correct temporal ordering
      expect(Object.keys(finalMerge.users)).toEqual(['1', '2', '3']);
      expect(finalMerge.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });

    test('handles concurrent operations with deterministic ordering', () => {
      const resolver = new ConflictResolver.constructor();

      // Simulate concurrent operations at different microsecond timestamps
      const concurrentData = [
        {
          activities: { 'a1': { text: 'Concurrent 1', modifiedAt: FIXED_TIME } },
          metadata: { deviceId: 'device-a' }
        },
        {
          activities: { 'a1': { text: 'Concurrent 2', modifiedAt: FIXED_TIME } },
          metadata: { deviceId: 'device-b' }
        },
        {
          activities: { 'a1': { text: 'Concurrent 3', modifiedAt: FIXED_TIME } },
          metadata: { deviceId: 'device-c' }
        }
      ];

      // Merge in different orders - should produce consistent results
      const order1 = concurrentData.reduce((acc, data) => resolver.mergeStates(acc, data));
      const order2 = [concurrentData[2], concurrentData[0], concurrentData[1]]
        .reduce((acc, data) => resolver.mergeStates(acc, data));

      // Results should be deterministic based on device ID tiebreaker
      expect(order1.activities['a1'].text).toBe(order2.activities['a1'].text);
    });

    test('preserves temporal relationships in nested data structures', () => {
      const service = {
        deviceId: 'test-device',
        updateMetadata: function(newData, oldData) {
          const now = Date.now();
          const fieldTimestamps = oldData?.metadata?.fieldTimestamps || {};

          return {
            ...newData,
            metadata: {
              lastModified: now,
              deviceId: this.deviceId,
              fieldTimestamps: {
                ...fieldTimestamps,
                users: now
              }
            }
          };
        }
      };

      const timeSequence = [
        FIXED_TIME,
        FIXED_TIME + MINUTE,
        FIXED_TIME + 2 * MINUTE,
        FIXED_TIME + 3 * MINUTE
      ];

      let currentData = { users: {} };

      timeSequence.forEach((time, index) => {
        jest.spyOn(Date, 'now').mockReturnValue(time);
        currentData = service.updateMetadata(
          { users: { [`user_${index}`]: { name: `User ${index}` } } },
          currentData
        );
      });

      // Final timestamp should be the latest
      expect(currentData.metadata.lastModified).toBe(FIXED_TIME + 3 * MINUTE);
      expect(currentData.metadata.fieldTimestamps.users).toBe(FIXED_TIME + 3 * MINUTE);
    });
  });

  describe('Performance with Time Mocking', () => {
    test('time-dependent operations remain efficient with mocked time', () => {
      const resolver = new ConflictResolver.constructor();

      // Create large dataset with temporal data
      const createLargeState = (deviceId, baseTime) => {
        const users = {};
        const activities = {};

        for (let i = 0; i < 1000; i++) {
          users[`user_${i}`] = {
            id: `user_${i}`,
            name: `User ${i}`,
            lastModified: baseTime + i
          };
          activities[`activity_${i}`] = {
            id: `activity_${i}`,
            text: `Activity ${i}`,
            modifiedAt: baseTime + i
          };
        }

        return {
          users,
          activities,
          metadata: {
            deviceId,
            fieldTimestamps: {
              users: baseTime + 999,
              activities: baseTime + 999
            }
          }
        };
      };

      const local = createLargeState('local-device', FIXED_TIME - HOUR);
      const remote = createLargeState('remote-device', FIXED_TIME);

      const startTime = performance.now();
      const result = resolver.mergeStates(local, remote);
      const endTime = performance.now();

      // Should complete efficiently despite large dataset and time comparisons
      expect(endTime - startTime).toBeLessThan(1000);
      expect(Object.keys(result.users).length).toBe(2000);
      expect(Object.keys(result.activities).length).toBe(2000);
    });
  });
});