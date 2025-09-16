/**
 * Comprehensive tests for ConflictResolver
 *
 * Session 12: Sync Infrastructure Logic Test Implementation
 *
 * Coverage areas:
 * - Conflict resolution algorithms (LWW, field-level merging)
 * - Data transformation and normalization
 * - Metadata management and timestamps
 * - Edge cases and error scenarios
 * - Deterministic behavior testing
 *
 * Focus: Pure business logic functions with mocked dependencies
 */

import ConflictResolver from '../conflictResolver';

describe('ConflictResolver', () => {
  let resolver;
  const FIXED_TIME = 1705123200000; // Fixed timestamp for deterministic tests

  beforeEach(() => {
    // Create fresh instance for each test
    resolver = new ConflictResolver.constructor();
    resolver.enableLogging = true;

    // Mock Date.now for deterministic tests
    jest.spyOn(Date, 'now').mockReturnValue(FIXED_TIME);

    // Mock crypto for deterministic device ID generation
    const mockCrypto = {
      getRandomValues: jest.fn((array) => {
        // Return deterministic values for testing
        for (let i = 0; i < array.length; i++) {
          array[i] = i % 256;
        }
        return array;
      })
    };
    global.crypto = mockCrypto;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Main Merge Algorithm', () => {
    test('mergeStates handles null/empty inputs correctly', () => {
      // Both null
      expect(resolver.mergeStates(null, null)).toEqual({
        users: {},
        activities: {},
        settings: {},
        library: {},
        metadata: expect.objectContaining({
          lastModified: FIXED_TIME,
          deviceId: expect.any(String),
          fieldTimestamps: expect.any(Object)
        })
      });

      // Local null, remote exists
      const remote = { users: { '1': { name: 'Remote User' } } };
      const result = resolver.mergeStates(null, remote);
      expect(result.users).toEqual(remote.users);
      expect(result.metadata).toBeDefined();

      // Remote null, local exists
      const local = { users: { '2': { name: 'Local User' } } };
      const result2 = resolver.mergeStates(local, null);
      expect(result2.users).toEqual(local.users);
    });

    test('mergeStates combines different data sections correctly', () => {
      const local = {
        users: { '1': { id: '1', name: 'Local User', lastModified: FIXED_TIME - 1000 } },
        activities: { 'a1': { id: 'a1', text: 'Local Activity', modifiedAt: FIXED_TIME - 500 } },
        settings: { theme: 'dark' },
        library: { categories: [{ id: 'c1', name: 'Local Category' }] },
        metadata: {
          lastModified: FIXED_TIME - 1000,
          deviceId: 'local-device',
          fieldTimestamps: {
            users: FIXED_TIME - 1000,
            activities: FIXED_TIME - 500,
            settings: FIXED_TIME - 1000,
            library: FIXED_TIME - 1000
          }
        }
      };

      const remote = {
        users: { '2': { id: '2', name: 'Remote User', lastModified: FIXED_TIME } },
        activities: { 'a2': { id: 'a2', text: 'Remote Activity', modifiedAt: FIXED_TIME } },
        settings: { theme: 'light', newSetting: true },
        library: { templates: [{ id: 't1', name: 'Remote Template' }] },
        metadata: {
          lastModified: FIXED_TIME,
          deviceId: 'remote-device',
          fieldTimestamps: {
            users: FIXED_TIME,
            activities: FIXED_TIME,
            settings: FIXED_TIME,
            library: FIXED_TIME
          }
        }
      };

      const result = resolver.mergeStates(local, remote);

      // Should merge users from both
      expect(result.users['1']).toBeDefined();
      expect(result.users['2']).toBeDefined();

      // Should merge activities from both
      expect(result.activities['a1']).toBeDefined();
      expect(result.activities['a2']).toBeDefined();

      // Settings should use remote (newer timestamp)
      expect(result.settings.theme).toBe('light');
      expect(result.settings.newSetting).toBe(true);

      // Library should merge additively
      expect(result.library.categories).toBeDefined();
      expect(result.library.templates).toBeDefined();

      // Metadata should be properly merged
      expect(result.metadata.lastModified).toBe(FIXED_TIME);
      expect(result.metadata.fieldTimestamps.users).toBe(FIXED_TIME);
    });

    test('merge logging captures decision points', () => {
      const local = { users: { '1': { name: 'User1' } } };
      const remote = { users: { '2': { name: 'User2' } } };

      resolver.mergeStates(local, remote);
      const log = resolver.getMergeLog();

      expect(log.length).toBeGreaterThan(0);
      expect(log.some(entry => entry.message.includes('User'))).toBe(true);
    });

    test('clearLog resets merge log', () => {
      resolver.log('Test message');
      expect(resolver.getMergeLog().length).toBe(1);

      resolver.clearLog();
      expect(resolver.getMergeLog().length).toBe(0);
    });
  });

  describe('User Merging Logic', () => {
    test('mergeUsers handles empty inputs', () => {
      expect(resolver.mergeUsers(null, null)).toEqual({});
      expect(resolver.mergeUsers({}, null)).toEqual({});
      expect(resolver.mergeUsers(null, {})).toEqual({});
    });

    test('mergeUsers prefers newer user data based on field timestamps', () => {
      const localMeta = {
        fieldTimestamps: { users: FIXED_TIME - 5000 }
      };
      const remoteMeta = {
        fieldTimestamps: { users: FIXED_TIME }
      };

      const localUsers = { '1': { name: 'Old User' } };
      const remoteUsers = { '1': { name: 'New User' } };

      const result = resolver.mergeUsers(localUsers, remoteUsers, localMeta, remoteMeta);

      expect(result['1'].name).toBe('New User');
    });

    test('mergeUsers performs granular merge when timestamps are close', () => {
      const localMeta = {
        fieldTimestamps: { users: FIXED_TIME - 2000 }
      };
      const remoteMeta = {
        fieldTimestamps: { users: FIXED_TIME - 1000 }
      };

      const localUsers = {
        '1': { id: '1', name: 'User1', lastModified: FIXED_TIME - 1000 },
        '2': { id: '2', name: 'Local Only', lastModified: FIXED_TIME }
      };
      const remoteUsers = {
        '1': { id: '1', name: 'Updated User1', lastModified: FIXED_TIME },
        '3': { id: '3', name: 'Remote Only', lastModified: FIXED_TIME }
      };

      const result = resolver.mergeUsers(localUsers, remoteUsers, localMeta, remoteMeta);

      expect(result['1'].name).toBe('Updated User1'); // Remote newer
      expect(result['2'].name).toBe('Local Only'); // Local only
      expect(result['3'].name).toBe('Remote Only'); // Remote only
    });

    test('mergeIndividualUser handles timestamp comparison', () => {
      const localUser = {
        id: '1',
        name: 'Local Name',
        lastModified: FIXED_TIME - 1000,
        days: { '2024-01-01': { activities: [{ id: 'a1', text: 'Local Activity' }] } }
      };

      const remoteUser = {
        id: '1',
        name: 'Remote Name',
        lastModified: FIXED_TIME,
        days: { '2024-01-02': { activities: [{ id: 'a2', text: 'Remote Activity' }] } }
      };

      const result = resolver.mergeIndividualUser(localUser, remoteUser, '1');

      expect(result.name).toBe('Remote Name'); // Remote is newer
      expect(result.days['2024-01-01']).toBeDefined(); // Local days preserved
      expect(result.days['2024-01-02']).toBeDefined(); // Remote days added
    });

    test('mergeIndividualUser handles tiebreaker for same timestamps', () => {
      const localUser = {
        id: '1',
        name: 'User A',
        deviceId: 'device-z' // Later alphabetically
      };

      const remoteUser = {
        id: '1',
        name: 'User B',
        deviceId: 'device-a' // Earlier alphabetically
      };

      const result = resolver.mergeIndividualUser(localUser, remoteUser, '1');

      // Should use local (device-z > device-a alphabetically means remote wins in tiebreaker)
      expect(result.name).toBe('User B');
    });

    test('mergeUserDays combines day data additively', () => {
      const localDays = {
        '2024-01-01': {
          activities: [{ id: 'a1', text: 'Local Activity 1' }],
          notes: 'Local notes'
        },
        '2024-01-02': {
          activities: [{ id: 'a2', text: 'Local Activity 2' }]
        }
      };

      const remoteDays = {
        '2024-01-01': {
          activities: [{ id: 'a3', text: 'Remote Activity 1' }],
          mood: 'happy'
        },
        '2024-01-03': {
          activities: [{ id: 'a4', text: 'Remote Activity 3' }]
        }
      };

      const result = resolver.mergeUserDays(localDays, remoteDays);

      expect(result['2024-01-01'].activities.length).toBe(2); // Merged
      expect(result['2024-01-01'].notes).toBe('Local notes');
      expect(result['2024-01-01'].mood).toBe('happy');
      expect(result['2024-01-02'].activities.length).toBe(1); // Local only
      expect(result['2024-01-03'].activities.length).toBe(1); // Remote only
    });

    test('mergeActivitiesArray deduplicates and updates based on timestamps', () => {
      const localActivities = [
        { id: 'a1', text: 'Local Activity 1', modifiedAt: FIXED_TIME - 1000 },
        { id: 'a2', text: 'Local Activity 2', modifiedAt: FIXED_TIME }
      ];

      const remoteActivities = [
        { id: 'a1', text: 'Updated Activity 1', modifiedAt: FIXED_TIME }, // Newer
        { id: 'a3', text: 'Remote Activity 3', modifiedAt: FIXED_TIME }
      ];

      const result = resolver.mergeActivitiesArray(localActivities, remoteActivities);

      expect(result.length).toBe(3);
      expect(result.find(a => a.id === 'a1').text).toBe('Updated Activity 1'); // Updated
      expect(result.find(a => a.id === 'a2')).toBeDefined(); // Preserved
      expect(result.find(a => a.id === 'a3')).toBeDefined(); // Added
    });
  });

  describe('Activities Merging Logic', () => {
    test('mergeActivities handles empty inputs', () => {
      expect(resolver.mergeActivities(null, null)).toEqual({});
      expect(resolver.mergeActivities({}, null)).toEqual({});
      expect(resolver.mergeActivities(null, {})).toEqual({});
    });

    test('mergeActivities uses LWW based on modification timestamps', () => {
      const localActivities = {
        'a1': { id: 'a1', text: 'Local Activity', modifiedAt: FIXED_TIME - 1000 },
        'a2': { id: 'a2', text: 'Local Only Activity', modifiedAt: FIXED_TIME }
      };

      const remoteActivities = {
        'a1': { id: 'a1', text: 'Remote Activity', modifiedAt: FIXED_TIME },
        'a3': { id: 'a3', text: 'Remote Only Activity', modifiedAt: FIXED_TIME }
      };

      const localMeta = { deviceId: 'local-device' };
      const remoteMeta = { deviceId: 'remote-device' };

      const result = resolver.mergeActivities(localActivities, remoteActivities, localMeta, remoteMeta);

      expect(result['a1'].text).toBe('Remote Activity'); // Remote is newer
      expect(result['a2'].text).toBe('Local Only Activity'); // Local only
      expect(result['a3'].text).toBe('Remote Only Activity'); // Remote only
    });

    test('mergeActivities uses device ID tiebreaker for same timestamps', () => {
      const localActivities = {
        'a1': { id: 'a1', text: 'Local Activity', modifiedAt: FIXED_TIME }
      };

      const remoteActivities = {
        'a1': { id: 'a1', text: 'Remote Activity', modifiedAt: FIXED_TIME }
      };

      const localMeta = { deviceId: 'device-z' };
      const remoteMeta = { deviceId: 'device-a' };

      const result = resolver.mergeActivities(localActivities, remoteActivities, localMeta, remoteMeta);

      // device-z > device-a alphabetically, so remote should win
      expect(result['a1'].text).toBe('Remote Activity');
    });
  });

  describe('Settings Merging Logic', () => {
    test('mergeSettings uses LWW for entire settings object', () => {
      const localSettings = { theme: 'dark', language: 'en' };
      const remoteSettings = { theme: 'light', newFeature: true };

      const localMeta = {
        fieldTimestamps: { settings: FIXED_TIME - 1000 }
      };
      const remoteMeta = {
        fieldTimestamps: { settings: FIXED_TIME }
      };

      const result = resolver.mergeSettings(localSettings, remoteSettings, localMeta, remoteMeta);

      expect(result).toEqual(remoteSettings); // Remote is newer
    });

    test('mergeSettings uses device ID tiebreaker', () => {
      const localSettings = { theme: 'dark' };
      const remoteSettings = { theme: 'light' };

      const localMeta = {
        fieldTimestamps: { settings: FIXED_TIME },
        deviceId: 'device-a'
      };
      const remoteMeta = {
        fieldTimestamps: { settings: FIXED_TIME },
        deviceId: 'device-z'
      };

      const result = resolver.mergeSettings(localSettings, remoteSettings, localMeta, remoteMeta);

      expect(result).toEqual(localSettings); // Local device ID wins (device-a < device-z)
    });
  });

  describe('Library Merging Logic', () => {
    test('mergeLibrary combines all library components additively', () => {
      const localLibrary = {
        categories: [{ id: 'c1', name: 'Local Category' }],
        templates: [{ id: 't1', name: 'Local Template' }],
        activities: [{ id: 'la1', text: 'Local Library Activity' }],
        userAddedActivityIds: ['la1']
      };

      const remoteLibrary = {
        categories: [{ id: 'c2', name: 'Remote Category' }],
        templates: [{ id: 't2', name: 'Remote Template' }],
        activities: [{ id: 'ra1', text: 'Remote Library Activity' }],
        userAddedActivityIds: ['ra1']
      };

      const result = resolver.mergeLibrary(localLibrary, remoteLibrary, {}, {});

      expect(result.categories.length).toBe(2);
      expect(result.templates.length).toBe(2);
      expect(result.activities.length).toBe(2);
      expect(result.userAddedActivityIds.length).toBe(2);
      expect(result.userAddedActivityIds).toContain('la1');
      expect(result.userAddedActivityIds).toContain('ra1');
    });

    test('mergeLibraryCategories handles array and object formats', () => {
      const localCategories = [{ id: 'c1', name: 'Category 1' }];
      const remoteCategories = [{ id: 'c1', name: 'Category 1' }, { id: 'c2', name: 'Category 2' }];

      const result = resolver.mergeLibraryCategories(localCategories, remoteCategories);

      expect(result.length).toBe(2); // Should deduplicate c1
      expect(result.find(c => c.id === 'c1')).toBeDefined();
      expect(result.find(c => c.id === 'c2')).toBeDefined();
    });

    test('mergeLibraryTemplates deduplicates by ID', () => {
      const localTemplates = [{ id: 't1', name: 'Template 1' }];
      const remoteTemplates = [{ id: 't1', name: 'Template 1' }, { id: 't2', name: 'Template 2' }];

      const result = resolver.mergeLibraryTemplates(localTemplates, remoteTemplates);

      expect(result.length).toBe(2);
    });

    test('mergeLibraryActivities deduplicates by ID', () => {
      const localActivities = [{ id: 'a1', text: 'Activity 1' }];
      const remoteActivities = [{ id: 'a1', text: 'Activity 1' }, { id: 'a2', text: 'Activity 2' }];

      const result = resolver.mergeLibraryActivities(localActivities, remoteActivities);

      expect(result.length).toBe(2);
    });
  });

  describe('Metadata Management', () => {
    test('mergeMetadata combines timestamps and preserves device ID', () => {
      const localMeta = {
        lastModified: FIXED_TIME - 1000,
        deviceId: 'local-device',
        fieldTimestamps: {
          users: FIXED_TIME - 2000,
          activities: FIXED_TIME - 1000,
          settings: FIXED_TIME - 500,
          library: FIXED_TIME - 1500
        }
      };

      const remoteMeta = {
        lastModified: FIXED_TIME - 500,
        deviceId: 'remote-device',
        fieldTimestamps: {
          users: FIXED_TIME,
          activities: FIXED_TIME - 1500,
          settings: FIXED_TIME - 1000,
          library: FIXED_TIME
        }
      };

      const result = resolver.mergeMetadata(localMeta, remoteMeta);

      expect(result.lastModified).toBe(FIXED_TIME);
      expect(result.lastMerged).toBe(FIXED_TIME);
      expect(result.deviceId).toBe('local-device'); // Preserves local device ID
      expect(result.fieldTimestamps.users).toBe(FIXED_TIME); // Max of both
      expect(result.fieldTimestamps.activities).toBe(FIXED_TIME - 1000); // Max of both
      expect(result.fieldTimestamps.settings).toBe(FIXED_TIME - 500); // Max of both
      expect(result.fieldTimestamps.library).toBe(FIXED_TIME); // Max of both
      expect(result.mergeLog).toBeDefined();
    });

    test('addMetadata creates metadata for data without it', () => {
      const data = { users: {}, activities: {} };
      const result = resolver.addMetadata(data);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.lastModified).toBe(FIXED_TIME);
      expect(result.metadata.deviceId).toBeDefined();
      expect(result.metadata.fieldTimestamps).toEqual({
        users: FIXED_TIME,
        activities: FIXED_TIME,
        settings: FIXED_TIME,
        library: FIXED_TIME
      });
    });

    test('addMetadata preserves existing metadata', () => {
      const existingMetadata = {
        lastModified: FIXED_TIME - 1000,
        deviceId: 'existing-device',
        fieldTimestamps: { users: FIXED_TIME - 1000 }
      };

      const data = { users: {}, metadata: existingMetadata };
      const result = resolver.addMetadata(data);

      expect(result.metadata).toEqual(existingMetadata);
    });

    test('createEmptyState generates valid empty state', () => {
      const result = resolver.createEmptyState();

      expect(result.users).toEqual({});
      expect(result.activities).toEqual({});
      expect(result.settings).toEqual({});
      expect(result.library).toEqual({});
      expect(result.metadata.lastModified).toBe(FIXED_TIME);
      expect(result.metadata.deviceId).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    test('tiebreaker uses deterministic device ID comparison', () => {
      expect(resolver.tiebreaker('device-a', 'device-z')).toBe('local');
      expect(resolver.tiebreaker('device-z', 'device-a')).toBe('remote');
      expect(resolver.tiebreaker('same-device', 'same-device')).toBe('remote');
      expect(resolver.tiebreaker(null, 'device')).toBe('remote');
      expect(resolver.tiebreaker('device', null)).toBe('local');
      expect(resolver.tiebreaker(null, null)).toBe('local');
    });

    test('generateDeviceId produces consistent format', () => {
      // Reset crypto mock to produce different values
      global.crypto.getRandomValues = jest.fn((array) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
        return array;
      });

      const deviceId1 = resolver.generateDeviceId();
      const deviceId2 = resolver.generateDeviceId();

      expect(deviceId1).toMatch(/^[a-f0-9]+$/);
      expect(deviceId2).toMatch(/^[a-f0-9]+$/);
      // With random values, they should likely be different (but not guaranteed)
      expect(deviceId1.length).toBe(deviceId2.length);
    });

    test('generateDeviceId handles different crypto environments', () => {
      // Test with global.crypto
      global.crypto = {
        getRandomValues: jest.fn((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = i % 256;
          }
          return array;
        })
      };

      const id1 = resolver.generateDeviceId();
      expect(id1).toMatch(/^[a-f0-9]+$/);

      // Test with window.crypto fallback
      delete global.crypto;
      global.crypto = {
        getRandomValues: jest.fn((array) => {
          for (let i = 0; i < array.length; i++) {
            array[i] = (i + 100) % 256;
          }
          return array;
        })
      };

      const id2 = resolver.generateDeviceId();
      expect(id2).toMatch(/^[a-f0-9]+$/);

      // Test fallback to timestamp + counter
      delete global.crypto;
      global.crypto = undefined;

      const id3 = resolver.generateDeviceId();
      expect(id3).toMatch(/^[a-f0-9]+$/);
    });

    test('logging can be disabled', () => {
      resolver.enableLogging = false;
      resolver.log('Test message');

      expect(resolver.getMergeLog().length).toBe(0);

      resolver.enableLogging = true;
      resolver.log('Test message 2');

      expect(resolver.getMergeLog().length).toBe(1);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('handles corrupted or malformed data gracefully', () => {
      const corruptedLocal = {
        users: 'not-an-object',
        activities: null,
        settings: undefined
      };

      const validRemote = {
        users: { '1': { name: 'Valid User' } },
        activities: { 'a1': { text: 'Valid Activity' } },
        settings: { theme: 'light' }
      };

      // Should not throw and should handle gracefully
      expect(() => {
        const result = resolver.mergeStates(corruptedLocal, validRemote);
        expect(result).toBeDefined();
      }).not.toThrow();
    });

    test('handles missing field timestamps', () => {
      const local = {
        users: { '1': { name: 'User' } },
        metadata: { deviceId: 'local' }
        // Missing fieldTimestamps
      };

      const remote = {
        users: { '2': { name: 'User 2' } },
        metadata: {
          deviceId: 'remote',
          fieldTimestamps: { users: FIXED_TIME }
        }
      };

      const result = resolver.mergeStates(local, remote);

      // Should merge users from both sources
      expect(result.users).toBeDefined();
      expect(Object.keys(result.users).length).toBeGreaterThan(0);
      // Since local has no fieldTimestamps, it should default to 0, so remote should win
      expect(result.users['2']).toBeDefined();
    });

    test('handles activities without timestamps', () => {
      const localActivities = [
        { id: 'a1', text: 'Activity without timestamp' }
      ];

      const remoteActivities = [
        { id: 'a1', text: 'Updated activity', modifiedAt: FIXED_TIME }
      ];

      const result = resolver.mergeActivitiesArray(localActivities, remoteActivities);

      expect(result[0].text).toBe('Updated activity'); // Remote should win
    });

    test('handles large data sets efficiently', () => {
      const largeUserSet = {};
      const largeActivitySet = {};

      // Create large data sets
      for (let i = 0; i < 1000; i++) {
        largeUserSet[`user_${i}`] = {
          id: `user_${i}`,
          name: `User ${i}`,
          lastModified: FIXED_TIME - i
        };
        largeActivitySet[`activity_${i}`] = {
          id: `activity_${i}`,
          text: `Activity ${i}`,
          modifiedAt: FIXED_TIME - i
        };
      }

      const local = {
        users: largeUserSet,
        activities: largeActivitySet,
        metadata: { fieldTimestamps: { users: FIXED_TIME - 500, activities: FIXED_TIME - 500 } }
      };

      const remote = {
        users: { 'new_user': { name: 'New User', lastModified: FIXED_TIME } },
        activities: { 'new_activity': { text: 'New Activity', modifiedAt: FIXED_TIME } },
        metadata: { fieldTimestamps: { users: FIXED_TIME, activities: FIXED_TIME } }
      };

      const startTime = performance.now();
      const result = resolver.mergeStates(local, remote);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(Object.keys(result.users).length).toBe(1001); // All users plus new one
      expect(Object.keys(result.activities).length).toBe(1001); // All activities plus new one
    });

    test('preserves data integrity during complex merges', () => {
      const local = {
        users: {
          '1': {
            id: '1',
            name: 'User 1',
            days: {
              '2024-01-01': {
                activities: [{ id: 'a1', text: 'Activity 1' }],
                notes: 'Important notes'
              }
            }
          }
        },
        metadata: { fieldTimestamps: { users: FIXED_TIME - 1000 } }
      };

      const remote = {
        users: {
          '1': {
            id: '1',
            name: 'Updated User 1',
            days: {
              '2024-01-01': {
                activities: [{ id: 'a2', text: 'Activity 2' }],
                mood: 'happy'
              },
              '2024-01-02': {
                activities: [{ id: 'a3', text: 'Activity 3' }]
              }
            },
            lastModified: FIXED_TIME
          }
        },
        metadata: { fieldTimestamps: { users: FIXED_TIME - 500 } }
      };

      const result = resolver.mergeStates(local, remote);
      const mergedUser = result.users['1'];

      expect(mergedUser.name).toBe('Updated User 1'); // Remote user data is newer
      expect(mergedUser.days['2024-01-01'].activities.length).toBe(2); // Both activities merged
      expect(mergedUser.days['2024-01-01'].notes).toBe('Important notes'); // Local notes preserved
      expect(mergedUser.days['2024-01-01'].mood).toBe('happy'); // Remote mood added
      expect(mergedUser.days['2024-01-02']).toBeDefined(); // Remote day added
    });
  });

  describe('Performance and Memory', () => {
    test('merge log has size limit', () => {
      const local = { users: {} };
      const remote = { users: {} };

      // Generate many log entries
      for (let i = 0; i < 20; i++) {
        resolver.log(`Test message ${i}`);
      }

      const result = resolver.mergeStates(local, remote);

      // Should keep only last 10 entries
      expect(result.metadata.mergeLog.length).toBeLessThanOrEqual(10);
    });

    test('handles deep object structures without stack overflow', () => {
      // Create deeply nested structure
      let deepObject = {};
      let current = deepObject;
      for (let i = 0; i < 100; i++) {
        current.nested = { level: i };
        current = current.nested;
      }

      const local = { users: { deep: deepObject } };
      const remote = { users: { shallow: { name: 'Shallow' } } };

      expect(() => {
        resolver.mergeStates(local, remote);
      }).not.toThrow();
    });
  });

  describe('Deterministic Behavior', () => {
    test('produces identical results for identical inputs', () => {
      const local = {
        users: { '1': { name: 'User 1', lastModified: FIXED_TIME - 1000 } },
        activities: { 'a1': { text: 'Activity 1', modifiedAt: FIXED_TIME } },
        metadata: {
          deviceId: 'local-device',
          fieldTimestamps: { users: FIXED_TIME - 1000, activities: FIXED_TIME }
        }
      };

      const remote = {
        users: { '2': { name: 'User 2', lastModified: FIXED_TIME } },
        activities: { 'a2': { text: 'Activity 2', modifiedAt: FIXED_TIME - 500 } },
        metadata: {
          deviceId: 'remote-device',
          fieldTimestamps: { users: FIXED_TIME, activities: FIXED_TIME - 500 }
        }
      };

      const result1 = resolver.mergeStates(local, remote);
      const result2 = resolver.mergeStates(local, remote);

      // Results should be identical (excluding metadata.lastModified and lastMerged)
      expect(result1.users).toEqual(result2.users);
      expect(result1.activities).toEqual(result2.activities);
      expect(result1.settings).toEqual(result2.settings);
      expect(result1.library).toEqual(result2.library);
    });

    test('merge order independence', () => {
      const data1 = { users: { '1': { name: 'User 1', lastModified: FIXED_TIME } } };
      const data2 = { users: { '2': { name: 'User 2', lastModified: FIXED_TIME - 1000 } } };

      const result1 = resolver.mergeStates(data1, data2);
      const result2 = resolver.mergeStates(data2, data1);

      // Results should be consistent regardless of order
      expect(Object.keys(result1.users).sort()).toEqual(Object.keys(result2.users).sort());
    });
  });
});