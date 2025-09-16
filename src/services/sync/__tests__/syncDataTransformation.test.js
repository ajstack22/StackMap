/**
 * Comprehensive tests for Sync Data Transformation Functions
 *
 * Session 12: Sync Infrastructure Logic Test Implementation
 *
 * Coverage areas:
 * - Data normalization and field transformations
 * - Metadata addition and updates
 * - State transformation edge cases
 * - Field-level change detection
 * - Recovery phrase and sync ID generation
 *
 * Focus: Pure business logic functions with mocked dependencies
 */

// Mock dependencies
const mockEncryptionService = {
  deriveKeyFromPhrase: jest.fn(() => Promise.resolve({
    key: new Uint8Array(32).fill(0), // Deterministic key for testing
    salt: 'test-salt'
  })),
  generateRecoveryPhrase: jest.fn(() => 'test-recovery-phrase-32-characters')
};

jest.mock('../encryptionServiceFixed', () => mockEncryptionService);

// Import MinimalSyncService class
import MinimalSyncService from '../minimalSyncService';

describe('Sync Data Transformation Functions', () => {
  let service;
  const FIXED_TIME = 1705123200000;

  beforeEach(() => {
    // Create fresh instance
    service = new MinimalSyncService.constructor();

    // Mock Date.now for deterministic tests
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);

    // Set up device ID after initialization
    service.deviceId = 'test-device-id';

    // Reset mock implementations
    mockEncryptionService.deriveKeyFromPhrase.mockResolvedValue({
      key: new Uint8Array(32).map((_, i) => i), // Deterministic key
      salt: 'test-salt'
    });

    // Clear any async operations
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Metadata Addition and Management', () => {
    test('addMetadata creates complete metadata structure for new data', () => {
      const data = {
        users: { '1': { name: 'User 1' } },
        activities: { 'a1': { text: 'Activity 1' } },
        settings: { theme: 'light' },
        library: { categories: [] }
      };

      const result = service.addMetadata(data);

      expect(result).toEqual({
        ...data,
        metadata: expect.objectContaining({
          lastModified: FIXED_TIME,
          deviceId: expect.any(String),
          fieldTimestamps: {
            users: FIXED_TIME,
            activities: FIXED_TIME,
            settings: FIXED_TIME,
            library: FIXED_TIME
          }
        })
      });
    });

    test('addMetadata preserves existing metadata', () => {
      const existingMetadata = {
        lastModified: FIXED_TIME - 1000,
        deviceId: 'existing-device',
        fieldTimestamps: {
          users: FIXED_TIME - 2000,
          activities: FIXED_TIME - 1500
        },
        customField: 'preserved'
      };

      const data = {
        users: {},
        metadata: existingMetadata
      };

      const result = service.addMetadata(data);

      expect(result.metadata).toEqual(existingMetadata);
    });

    test('addMetadata handles null/undefined data', () => {
      const nullResult = service.addMetadata(null);
      expect(nullResult).toEqual({
        users: {},
        activities: {},
        settings: {},
        library: {},
        metadata: {
          lastModified: FIXED_TIME,
          deviceId: 'test-device-id',
          fieldTimestamps: {
            users: FIXED_TIME,
            activities: FIXED_TIME,
            settings: FIXED_TIME,
            library: FIXED_TIME
          }
        }
      });

      const undefinedResult = service.addMetadata(undefined);
      expect(undefinedResult).toEqual({
        users: {},
        activities: {},
        settings: {},
        library: {},
        metadata: {
          lastModified: FIXED_TIME,
          deviceId: 'test-device-id',
          fieldTimestamps: {
            users: FIXED_TIME,
            activities: FIXED_TIME,
            settings: FIXED_TIME,
            library: FIXED_TIME
          }
        }
      });
    });

    test('addMetadata handles empty object', () => {
      const result = service.addMetadata({});

      expect(result.metadata).toBeDefined();
      expect(result.metadata.lastModified).toBe(FIXED_TIME);
      expect(result.metadata.deviceId).toEqual(expect.any(String));
    });
  });

  describe('Metadata Update Logic', () => {
    test('updateMetadata tracks field changes correctly', () => {
      const oldData = {
        users: { '1': { name: 'Old User' } },
        activities: { 'a1': { text: 'Old Activity' } },
        settings: { theme: 'dark' },
        library: { categories: [{ id: 'c1', name: 'Old Category' }] },
        metadata: {
          lastModified: FIXED_TIME - 1000,
          deviceId: 'test-device',
          fieldTimestamps: {
            users: FIXED_TIME - 2000,
            activities: FIXED_TIME - 1500,
            settings: FIXED_TIME - 1000,
            library: FIXED_TIME - 800
          }
        }
      };

      const newData = {
        users: { '1': { name: 'New User' } }, // Changed
        activities: { 'a1': { text: 'Old Activity' } }, // Unchanged
        settings: { theme: 'light' }, // Changed
        library: { categories: [{ id: 'c1', name: 'Old Category' }] } // Unchanged
      };

      const result = service.updateMetadata(newData, oldData);

      expect(result.metadata.lastModified).toBe(FIXED_TIME);
      expect(result.metadata.deviceId).toEqual(expect.any(String));
      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME); // Updated
      expect(result.metadata.fieldTimestamps.activities).toBe(FIXED_TIME - 1500); // Preserved
      expect(result.metadata.fieldTimestamps.settings).toBe(FIXED_TIME); // Updated
      expect(result.metadata.fieldTimestamps.library).toBe(FIXED_TIME - 800); // Preserved
    });

    test('updateMetadata handles missing old data', () => {
      const newData = {
        users: { '1': { name: 'User' } },
        activities: {},
        settings: {},
        library: {}
      };

      const result = service.updateMetadata(newData, null);

      expect(result.metadata.lastModified).toBe(FIXED_TIME);
      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });

    test('updateMetadata handles missing metadata in old data', () => {
      const oldData = {
        users: { '1': { name: 'User' } }
        // Missing metadata
      };

      const newData = {
        users: { '1': { name: 'Updated User' } }
      };

      const result = service.updateMetadata(newData, oldData);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });

    test('updateMetadata detects deep object changes', () => {
      const oldData = {
        users: {
          '1': {
            name: 'User',
            days: {
              '2024-01-01': { activities: [{ id: 'a1', text: 'Activity' }] }
            }
          }
        },
        metadata: {
          fieldTimestamps: { users: FIXED_TIME - 1000 }
        }
      };

      const newData = {
        users: {
          '1': {
            name: 'User',
            days: {
              '2024-01-01': { activities: [{ id: 'a1', text: 'Updated Activity' }] }
            }
          }
        }
      };

      const result = service.updateMetadata(newData, oldData);

      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });

    test('updateMetadata handles complex nested structures', () => {
      const complexOldData = {
        users: {
          '1': {
            profile: {
              personal: { name: 'John', age: 30 },
              preferences: { theme: 'dark', notifications: true }
            },
            history: [
              { date: '2024-01-01', actions: ['login', 'update'] },
              { date: '2024-01-02', actions: ['view', 'edit'] }
            ]
          }
        },
        metadata: { fieldTimestamps: { users: FIXED_TIME - 1000 } }
      };

      const complexNewData = {
        users: {
          '1': {
            profile: {
              personal: { name: 'John', age: 31 }, // Changed age
              preferences: { theme: 'dark', notifications: true }
            },
            history: [
              { date: '2024-01-01', actions: ['login', 'update'] },
              { date: '2024-01-02', actions: ['view', 'edit'] }
            ]
          }
        }
      };

      const result = service.updateMetadata(complexNewData, complexOldData);

      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });
  });

  describe('Recovery Phrase and Sync ID Generation', () => {
    test('generateSyncId produces deterministic results', async () => {
      const recoveryPhrase = 'test-recovery-phrase-32-characters';

      // Mock the encryption service to return deterministic key
      mockEncryptionService.deriveKeyFromPhrase.mockResolvedValue({
        key: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32]),
        salt: 'fixed-salt'
      });

      const syncId1 = await service.generateSyncId(recoveryPhrase);
      const syncId2 = await service.generateSyncId(recoveryPhrase);

      expect(syncId1).toBe(syncId2); // Should be deterministic
      expect(syncId1).toMatch(/^[a-f0-9]{32}$/); // Should be 32 char hex
      expect(syncId1).toBe('0102030405060708090a0b0c0d0e0f10'); // Expected result from mock key
    });

    test('generateSyncId handles different recovery phrases', async () => {
      const phrase1 = 'phrase1-32-characters-long-enough';
      const phrase2 = 'phrase2-32-characters-long-enough';

      // Mock different keys for different phrases
      mockEncryptionService.deriveKeyFromPhrase
        .mockResolvedValueOnce({
          key: new Uint8Array(32).fill(1),
          salt: 'salt1'
        })
        .mockResolvedValueOnce({
          key: new Uint8Array(32).fill(2),
          salt: 'salt2'
        });

      const syncId1 = await service.generateSyncId(phrase1);
      const syncId2 = await service.generateSyncId(phrase2);

      expect(syncId1).not.toBe(syncId2);
      expect(syncId1).toMatch(/^[a-f0-9]{32}$/);
      expect(syncId2).toMatch(/^[a-f0-9]{32}$/);
    });

    test('generateSyncId calls encryption service with correct parameters', async () => {
      const recoveryPhrase = 'test-phrase';
      const expectedSalt = 'U3luY0lkU2FsdDEyMzQ1Njc4OTAxMjM0NQ==';

      await service.generateSyncId(recoveryPhrase);

      expect(mockEncryptionService.deriveKeyFromPhrase).toHaveBeenCalledWith(
        recoveryPhrase,
        expectedSalt
      );
    });
  });

  describe('Device ID Generation', () => {
    test('generateId produces valid format', () => {
      // Mock crypto for deterministic results
      global.crypto = {
        getRandomValues: jest.fn((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = i % 256;
          }
          return array;
        })
      };

      const id = service.generateId();

      expect(id).toMatch(/^[a-f0-9]{32}$/);
      expect(id.length).toBe(32);
      expect(global.crypto.getRandomValues).toHaveBeenCalled();
    });

    test('generateId falls back to web crypto', () => {
      delete global.crypto;
      global.crypto = {
        getRandomValues: jest.fn((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = (i + 100) % 256;
          }
          return array;
        })
      };

      const id = service.generateId();

      expect(id).toMatch(/^[a-f0-9]{32}$/);
      expect(global.crypto.getRandomValues).toHaveBeenCalled();
    });

    test('generateId falls back to nacl when crypto unavailable', () => {
      delete global.crypto;

      const id = service.generateId();

      expect(id).toMatch(/^[a-f0-9]{32}$/);
      expect(id.length).toBe(32);
    });

    test('generateId produces unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(service.generateId());
      }

      expect(ids.size).toBe(100); // All should be unique
    });
  });

  describe('Data Normalization and Validation', () => {
    test('handles malformed user data', () => {
      const malformedData = {
        users: {
          '1': 'not-an-object',
          '2': null,
          '3': { name: 'Valid User' },
          '4': undefined
        }
      };

      const result = service.addMetadata(malformedData);

      expect(result.users).toEqual(malformedData.users); // Preserves original structure
      expect(result.metadata).toBeDefined();
    });

    test('handles malformed activity data', () => {
      const malformedData = {
        activities: {
          'a1': 'string-instead-of-object',
          'a2': { text: 'Valid Activity' },
          'a3': null
        }
      };

      const result = service.addMetadata(malformedData);

      expect(result.activities).toEqual(malformedData.activities);
      expect(result.metadata).toBeDefined();
    });

    test('normalizes mixed data types in collections', () => {
      const mixedData = {
        users: {
          '1': { name: 'User 1', id: 1 }, // Number ID
          '2': { name: 'User 2', id: '2' } // String ID
        },
        activities: {
          'a1': { text: 'Activity 1', timestamp: '2024-01-01' }, // String timestamp
          'a2': { text: 'Activity 2', timestamp: 1704067200000 } // Number timestamp
        }
      };

      const result = service.addMetadata(mixedData);

      expect(result.users).toEqual(mixedData.users);
      expect(result.activities).toEqual(mixedData.activities);
      expect(result.metadata).toBeDefined();
    });

    test('handles empty and sparse collections', () => {
      const sparseData = {
        users: {},
        activities: null,
        settings: undefined,
        library: { categories: [], templates: null }
      };

      const result = service.addMetadata(sparseData);

      expect(result.users).toEqual({});
      expect(result.activities).toBeNull();
      expect(result.settings).toBeUndefined();
      expect(result.library.categories).toEqual([]);
      expect(result.metadata).toBeDefined();
    });
  });

  describe('Field Change Detection', () => {
    test('detects changes in primitive values', () => {
      const oldData = { settings: { theme: 'dark', count: 5 } };
      const newData = { settings: { theme: 'light', count: 5 } };

      const result = service.updateMetadata(newData, oldData);

      expect(result.metadata.fieldTimestamps.settings).toBe(FIXED_TIME);
    });

    test('detects changes in array order', () => {
      const oldData = {
        library: { categories: ['a', 'b', 'c'] },
        metadata: { fieldTimestamps: { library: FIXED_TIME - 1000 } }
      };
      const newData = {
        library: { categories: ['c', 'b', 'a'] }
      };

      const result = service.updateMetadata(newData, oldData);

      expect(result.metadata.fieldTimestamps.library).toBe(FIXED_TIME);
    });

    test('detects addition and removal of properties', () => {
      const oldData = {
        users: { '1': { name: 'User', age: 30 } },
        metadata: { fieldTimestamps: { users: FIXED_TIME - 1000 } }
      };
      const newData = {
        users: { '1': { name: 'User', location: 'New York' } } // age removed, location added
      };

      const result = service.updateMetadata(newData, oldData);

      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });

    test('ignores changes when data is identical', () => {
      const identicalData = {
        users: { '1': { name: 'User', profile: { age: 30, city: 'NY' } } },
        activities: { 'a1': { text: 'Activity', tags: ['work', 'important'] } }
      };

      const oldData = {
        ...identicalData,
        metadata: {
          fieldTimestamps: {
            users: FIXED_TIME - 1000,
            activities: FIXED_TIME - 500
          }
        }
      };

      const result = service.updateMetadata(identicalData, oldData);

      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME - 1000);
      expect(result.metadata.fieldTimestamps.activities).toBe(FIXED_TIME - 500);
    });

    test('handles circular reference detection', () => {
      const circularData = {
        users: { '1': { name: 'User' } }
      };
      // Create circular reference
      circularData.users['1'].self = circularData.users['1'];

      const oldData = {
        users: { '1': { name: 'User' } },
        metadata: { fieldTimestamps: { users: FIXED_TIME - 1000 } }
      };

      // Should handle circular reference during JSON.stringify comparison
      try {
        const result = service.updateMetadata(circularData, oldData);
        // If it doesn't throw, verify it still produces a result
        expect(result.metadata).toBeDefined();
      } catch (error) {
        // If it throws due to circular reference, that's expected behavior
        expect(error.message).toContain('circular');
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('handles undefined device ID gracefully', () => {
      service.deviceId = undefined;

      const result = service.addMetadata({ users: {} });

      expect(result.metadata.deviceId).toBeUndefined();
    });

    test('handles very large timestamp values', () => {
      const largeTimestamp = Number.MAX_SAFE_INTEGER;
      jest.spyOn(Date, 'now').mockReturnValue(largeTimestamp);

      const result = service.addMetadata({ users: {} });

      expect(result.metadata.lastModified).toBe(largeTimestamp);
      expect(result.metadata.fieldTimestamps.users).toBe(largeTimestamp);
    });

    test('handles negative timestamp values', () => {
      const negativeTimestamp = -1000;
      jest.spyOn(Date, 'now').mockReturnValue(negativeTimestamp);

      const result = service.addMetadata({ users: {} });

      expect(result.metadata.lastModified).toBe(negativeTimestamp);
    });

    test('handles data with very deep nesting', () => {
      let deepData = { users: {} };
      let current = deepData.users;

      // Create 50 levels deep
      for (let i = 0; i < 50; i++) {
        current[`level${i}`] = {};
        current = current[`level${i}`];
      }
      current.value = 'deep value';

      expect(() => {
        service.addMetadata(deepData);
      }).not.toThrow();
    });

    test('preserves data types during transformation', () => {
      const data = {
        users: { '1': { name: 'User', active: true, count: 42 } },
        activities: { 'a1': { text: 'Activity', completed: false, priority: 0 } },
        settings: { enabled: true, timeout: 5000, features: ['a', 'b'] },
        library: { version: 1.5, items: null }
      };

      const result = service.addMetadata(data);

      expect(typeof result.users['1'].active).toBe('boolean');
      expect(typeof result.users['1'].count).toBe('number');
      expect(typeof result.activities['a1'].completed).toBe('boolean');
      expect(typeof result.activities['a1'].priority).toBe('number');
      expect(typeof result.settings.timeout).toBe('number');
      expect(Array.isArray(result.settings.features)).toBe(true);
      expect(result.library.items).toBeNull();
    });

    test('handles functions and undefined values in data', () => {
      const dataWithFunctions = {
        users: {
          '1': {
            name: 'User',
            fn: function() { return 'test'; },
            undef: undefined,
            sym: Symbol('test')
          }
        }
      };

      const result = service.addMetadata(dataWithFunctions);

      expect(result.users['1'].name).toBe('User');
      expect(typeof result.users['1'].fn).toBe('function');
      expect(result.users['1'].undef).toBeUndefined();
      expect(typeof result.users['1'].sym).toBe('symbol');
    });
  });

  describe('Performance and Memory Usage', () => {
    test('handles large data sets efficiently', () => {
      const largeData = {
        users: {},
        activities: {}
      };

      // Create 10,000 users and activities
      for (let i = 0; i < 10000; i++) {
        largeData.users[`user_${i}`] = {
          id: `user_${i}`,
          name: `User ${i}`,
          profile: {
            age: i % 100,
            interests: Array.from({ length: 10 }, (_, j) => `interest_${j}`)
          }
        };

        largeData.activities[`activity_${i}`] = {
          id: `activity_${i}`,
          text: `Activity ${i}`,
          tags: Array.from({ length: 5 }, (_, j) => `tag_${j}`)
        };
      }

      const startTime = performance.now();
      const result = service.addMetadata(largeData);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.metadata).toBeDefined();
      expect(Object.keys(result.users).length).toBe(10000);
      expect(Object.keys(result.activities).length).toBe(10000);
    });

    test('updateMetadata is efficient with large unchanged data', () => {
      const largeData = {
        users: {},
        settings: { theme: 'dark' }
      };

      // Create large users object
      for (let i = 0; i < 5000; i++) {
        largeData.users[`user_${i}`] = {
          name: `User ${i}`,
          data: Array.from({ length: 100 }, (_, j) => ({ value: j }))
        };
      }

      const oldData = {
        ...largeData,
        metadata: { fieldTimestamps: { users: FIXED_TIME - 1000, settings: FIXED_TIME - 1000 } }
      };

      const newData = {
        ...largeData,
        settings: { theme: 'light' } // Only settings changed
      };

      const startTime = performance.now();
      const result = service.updateMetadata(newData, oldData);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // Should be fast for partial changes
      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME - 1000); // Unchanged
      expect(result.metadata.fieldTimestamps.settings).toBe(FIXED_TIME); // Changed
    });
  });

  describe('Cross-Platform Compatibility', () => {
    test('generates consistent IDs across different crypto implementations', () => {
      const implementations = [
        // Global crypto mock
        () => {
          global.crypto = {
            getRandomValues: jest.fn((array) => {
              for (let i = 0; i < array.length; i++) {
                array[i] = 42; // Fixed value
              }
              return array;
            })
          };
        },
        // Window crypto mock
        () => {
          delete global.crypto;
          global.crypto = {
            getRandomValues: jest.fn((array) => {
              for (let i = 0; i < array.length; i++) {
                array[i] = 42; // Same fixed value
              }
              return array;
            })
          };
        }
      ];

      const ids = implementations.map(setup => {
        setup();
        return service.generateId();
      });

      // All implementations with same input should produce same output
      expect(ids[0]).toBe(ids[1]);
    });

    test('metadata format is consistent across platforms', () => {
      const testData = { users: { '1': { name: 'Test User' } } };

      const result = service.addMetadata(testData);

      // Verify metadata structure is consistent
      expect(result.metadata).toHaveProperty('lastModified');
      expect(result.metadata).toHaveProperty('deviceId');
      expect(result.metadata).toHaveProperty('fieldTimestamps');
      expect(result.metadata.fieldTimestamps).toHaveProperty('users');
      expect(result.metadata.fieldTimestamps).toHaveProperty('activities');
      expect(result.metadata.fieldTimestamps).toHaveProperty('settings');
      expect(result.metadata.fieldTimestamps).toHaveProperty('library');

      // Verify types
      expect(typeof result.metadata.lastModified).toBe('number');
      expect(typeof result.metadata.deviceId).toBe('string');
      expect(typeof result.metadata.fieldTimestamps).toBe('object');
    });
  });
});