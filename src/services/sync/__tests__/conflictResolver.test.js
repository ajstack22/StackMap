/**
 * Comprehensive unit tests for conflictResolver.js
 * Tests the Last-Write-Wins conflict resolution strategy
 */

import conflictResolverSingleton from '../conflictResolver';
import { 
  testUsers, 
  testActivities, 
  testSettings, 
  testLibrary,
  conflictingData,
} from './fixtures/syncTestData';

// Since conflictResolver exports a singleton, we'll use it directly
// but reset its state before each test

describe('ConflictResolver', () => {
  let resolver;
  
  beforeEach(() => {
    resolver = conflictResolverSingleton;
    resolver.clearLog();
    // Disable logging for tests
    resolver.enableLogging = false;
    console.log = jest.fn();
  });

  describe('initialization', () => {
    it('should have required methods', () => {
      expect(resolver.mergeStates).toBeDefined();
      expect(resolver.mergeUsers).toBeDefined();
      expect(resolver.mergeActivities).toBeDefined();
      expect(resolver.mergeSettings).toBeDefined();
      expect(resolver.mergeLibrary).toBeDefined();
      expect(resolver.clearLog).toBeDefined();
      expect(resolver.getMergeLog).toBeDefined();
    });
  });

  describe('mergeStates', () => {
    it('should return empty state when both inputs are null', () => {
      const result = resolver.mergeStates(null, null);
      expect(result.users).toEqual({});
      expect(result.activities).toEqual({});
      expect(result.settings).toEqual({});
      expect(result.library).toEqual({});
      expect(result.metadata).toBeDefined();
      expect(result.metadata.lastModified).toBeDefined();
      expect(result.metadata.deviceId).toBeDefined();
    });

    it('should use remote state when local is null', () => {
      const remoteState = {
        users: testUsers,
        settings: testSettings,
      };
      const result = resolver.mergeStates(null, remoteState);
      expect(result.users).toEqual(testUsers);
      expect(result.settings).toEqual(testSettings);
    });

    it('should use local state when remote is null', () => {
      const localState = {
        users: testUsers,
        settings: testSettings,
      };
      const result = resolver.mergeStates(localState, null);
      expect(result.users).toEqual(testUsers);
      expect(result.settings).toEqual(testSettings);
    });

    it('should merge both states when both are present', () => {
      const localState = {
        users: { user1: testUsers.user1 },
        activities: {},
        settings: testSettings,
        library: {},
        metadata: { 
          deviceId: 'device1',
          fieldTimestamps: { users: 1000, settings: 1000, library: 1000 }
        },
      };
      const remoteState = {
        users: { user2: testUsers.user2 },
        activities: {},
        settings: { ...testSettings, theme: 'dark' },
        library: testLibrary,
        metadata: { 
          deviceId: 'device2',
          fieldTimestamps: { users: 1000, settings: 1000, library: 1000 }
        },
      };
      
      const result = resolver.mergeStates(localState, remoteState);
      
      // Should have both users (merged individually when timestamps are close)
      expect(result.users.user1).toBeDefined();
      expect(result.users.user2).toBeDefined();
      // Should have merged library
      expect(result.library).toBeDefined();
      // Library should have categories from remote since local was empty
      if (testLibrary.Morning) {
        // If testLibrary is object-based
        expect(Object.keys(result.library).length).toBeGreaterThan(0);
      }
    });
  });

  describe('mergeUsers', () => {
    it('should return empty object when both are null', () => {
      const result = resolver.mergeUsers(null, null, {}, {});
      expect(result).toEqual({});
    });

    it('should use remote users when local is null', () => {
      const result = resolver.mergeUsers(null, testUsers, {}, {});
      expect(result).toEqual(testUsers);
    });

    it('should use local users when remote is null', () => {
      const result = resolver.mergeUsers(testUsers, null, {}, {});
      expect(result).toEqual(testUsers);
    });

    it('should prefer remote users when timestamp is significantly newer (>3s)', () => {
      const localMeta = { fieldTimestamps: { users: 1000000 } };
      const remoteMeta = { fieldTimestamps: { users: 1005000 } }; // 5 seconds newer
      
      const localUsers = { user1: { name: 'Local User' } };
      const remoteUsers = { user1: { name: 'Remote User' } };
      
      const result = resolver.mergeUsers(localUsers, remoteUsers, localMeta, remoteMeta);
      expect(result.user1.name).toBe('Remote User');
    });

    it('should prefer local users when timestamp is significantly newer (>3s)', () => {
      const localMeta = { fieldTimestamps: { users: 1005000 } }; // 5 seconds newer
      const remoteMeta = { fieldTimestamps: { users: 1000000 } };
      
      const localUsers = { user1: { name: 'Local User' } };
      const remoteUsers = { user1: { name: 'Remote User' } };
      
      const result = resolver.mergeUsers(localUsers, remoteUsers, localMeta, remoteMeta);
      expect(result.user1.name).toBe('Local User');
    });

    it('should merge users individually when timestamps are close', () => {
      const localMeta = { fieldTimestamps: { users: 1000000 } };
      const remoteMeta = { fieldTimestamps: { users: 1001000 } }; // Only 1 second newer
      
      const localUsers = {
        user1: { name: 'Local User 1', lastModified: 1000 },
        user2: { name: 'Local User 2', lastModified: 2000 },
      };
      const remoteUsers = {
        user1: { name: 'Remote User 1', lastModified: 2000 },
        user3: { name: 'Remote User 3', lastModified: 1500 },
      };
      
      const result = resolver.mergeUsers(localUsers, remoteUsers, localMeta, remoteMeta);
      
      // user1: remote has newer lastModified
      expect(result.user1.name).toBe('Remote User 1');
      // user2: only exists locally
      expect(result.user2.name).toBe('Local User 2');
      // user3: only exists remotely
      expect(result.user3.name).toBe('Remote User 3');
    });
  });

  describe('mergeIndividualUser', () => {
    it('should use remote user when lastModified is newer', () => {
      const localUser = {
        name: 'Local Name',
        icon: '🔥',
        lastModified: 1000,
      };
      const remoteUser = {
        name: 'Remote Name',
        icon: '💧',
        lastModified: 2000,
      };
      
      const result = resolver.mergeIndividualUser(localUser, remoteUser, 'user1');
      expect(result.name).toBe('Remote Name');
      expect(result.icon).toBe('💧');
    });

    it('should use local user when lastModified is newer', () => {
      const localUser = {
        name: 'Local Name',
        icon: '🔥',
        lastModified: 2000,
      };
      const remoteUser = {
        name: 'Remote Name',
        icon: '💧',
        lastModified: 1000,
      };
      
      const result = resolver.mergeIndividualUser(localUser, remoteUser, 'user1');
      expect(result.name).toBe('Local Name');
      expect(result.icon).toBe('🔥');
    });

    it('should merge user days additively', () => {
      const localUser = {
        name: 'User',
        days: {
          today: {
            activities: [{ id: 'act1', text: 'Local Activity' }],
          },
        },
      };
      const remoteUser = {
        name: 'User',
        days: {
          tomorrow: {
            activities: [{ id: 'act2', text: 'Remote Activity' }],
          },
        },
      };
      
      const result = resolver.mergeIndividualUser(localUser, remoteUser, 'user1');
      expect(result.days.today).toBeDefined();
      expect(result.days.tomorrow).toBeDefined();
      expect(result.days.today.activities[0].text).toBe('Local Activity');
      expect(result.days.tomorrow.activities[0].text).toBe('Remote Activity');
    });

    it('should use tiebreaker when timestamps are equal', () => {
      const localUser = {
        name: 'Local Name',
        icon: '🔥',
        deviceId: 'aaa',
      };
      const remoteUser = {
        name: 'Remote Name',
        icon: '💧',
        deviceId: 'bbb',
      };
      
      const result = resolver.mergeIndividualUser(localUser, remoteUser, 'user1');
      // 'aaa' < 'bbb' alphabetically, so local wins
      expect(result.name).toBe('Local Name');
    });
  });

  describe('mergeUserDays', () => {
    it('should return empty object when both are null', () => {
      const result = resolver.mergeUserDays(null, null);
      expect(result).toEqual({});
    });

    it('should use remote days when local is null', () => {
      const remoteDays = {
        today: { activities: [{ id: '1', text: 'Activity' }] },
      };
      const result = resolver.mergeUserDays(null, remoteDays);
      expect(result).toEqual(remoteDays);
    });

    it('should use local days when remote is null', () => {
      const localDays = {
        today: { activities: [{ id: '1', text: 'Activity' }] },
      };
      const result = resolver.mergeUserDays(localDays, null);
      expect(result).toEqual(localDays);
    });

    it('should merge days from both sources', () => {
      const localDays = {
        today: { activities: [{ id: '1', text: 'Local Today' }] },
        yesterday: { activities: [{ id: '2', text: 'Local Yesterday' }] },
      };
      const remoteDays = {
        today: { activities: [{ id: '3', text: 'Remote Today' }] },
        tomorrow: { activities: [{ id: '4', text: 'Remote Tomorrow' }] },
      };
      
      const result = resolver.mergeUserDays(localDays, remoteDays);
      
      expect(Object.keys(result)).toHaveLength(3);
      expect(result.yesterday).toBeDefined();
      expect(result.today).toBeDefined();
      expect(result.tomorrow).toBeDefined();
    });
  });

  describe('mergeActivitiesArray', () => {
    it('should deduplicate activities by ID', () => {
      const localActivities = [
        { id: '1', text: 'Activity 1' },
        { id: '2', text: 'Activity 2' },
      ];
      const remoteActivities = [
        { id: '2', text: 'Activity 2 Updated' },
        { id: '3', text: 'Activity 3' },
      ];
      
      const result = resolver.mergeActivitiesArray(localActivities, remoteActivities);
      
      expect(result).toHaveLength(3);
      expect(result.find(a => a.id === '1')).toBeDefined();
      expect(result.find(a => a.id === '2')).toBeDefined();
      expect(result.find(a => a.id === '3')).toBeDefined();
    });

    it('should update activity when remote is newer', () => {
      const localActivities = [
        { id: '1', text: 'Old Text', modifiedAt: 1000 },
      ];
      const remoteActivities = [
        { id: '1', text: 'New Text', modifiedAt: 2000 },
      ];
      
      const result = resolver.mergeActivitiesArray(localActivities, remoteActivities);
      
      expect(result[0].text).toBe('New Text');
    });

    it('should keep local activity when remote is older', () => {
      const localActivities = [
        { id: '1', text: 'New Text', modifiedAt: 2000 },
      ];
      const remoteActivities = [
        { id: '1', text: 'Old Text', modifiedAt: 1000 },
      ];
      
      const result = resolver.mergeActivitiesArray(localActivities, remoteActivities);
      
      expect(result[0].text).toBe('New Text');
    });

    it('should handle activities without timestamps', () => {
      const localActivities = [
        { id: '1', text: 'Local' },
      ];
      const remoteActivities = [
        { id: '1', text: 'Remote' },
        { id: '2', text: 'New' },
      ];
      
      const result = resolver.mergeActivitiesArray(localActivities, remoteActivities);
      
      expect(result).toHaveLength(2);
      expect(result.find(a => a.id === '2').text).toBe('New');
    });
  });

  describe('mergeSettings', () => {
    it('should return empty object when both are null', () => {
      const result = resolver.mergeSettings(null, null, {}, {});
      expect(result).toEqual({});
    });

    it('should use LWW based on fieldTimestamps', () => {
      const localSettings = { theme: 'light', sound: true };
      const remoteSettings = { theme: 'dark', sound: false };
      
      const localMeta = { fieldTimestamps: { settings: 1000 } };
      const remoteMeta = { fieldTimestamps: { settings: 2000 } };
      
      const result = resolver.mergeSettings(localSettings, remoteSettings, localMeta, remoteMeta);
      expect(result).toEqual(remoteSettings);
    });

    it('should use tiebreaker when timestamps are equal', () => {
      const localSettings = { theme: 'light' };
      const remoteSettings = { theme: 'dark' };
      
      const localMeta = { fieldTimestamps: { settings: 1000 }, deviceId: 'aaa' };
      const remoteMeta = { fieldTimestamps: { settings: 1000 }, deviceId: 'bbb' };
      
      const result = resolver.mergeSettings(localSettings, remoteSettings, localMeta, remoteMeta);
      // 'aaa' < 'bbb', so local wins
      expect(result.theme).toBe('light');
    });
  });

  describe('mergeLibrary', () => {
    it('should return empty object when both are null', () => {
      const result = resolver.mergeLibrary(null, null, {}, {});
      expect(result).toEqual({});
    });

    it('should merge categories additively', () => {
      const localLibrary = {
        categories: [
          { id: 'cat1', name: 'Category 1' },
        ],
      };
      const remoteLibrary = {
        categories: [
          { id: 'cat2', name: 'Category 2' },
        ],
      };
      
      const result = resolver.mergeLibrary(localLibrary, remoteLibrary, {}, {});
      expect(result.categories).toHaveLength(2);
    });

    it('should merge userAddedActivityIds as union', () => {
      const localLibrary = {
        userAddedActivityIds: ['id1', 'id2'],
      };
      const remoteLibrary = {
        userAddedActivityIds: ['id2', 'id3'],
      };
      
      const result = resolver.mergeLibrary(localLibrary, remoteLibrary, {}, {});
      expect(result.userAddedActivityIds).toEqual(['id1', 'id2', 'id3']);
    });

    it('should preserve other library properties using LWW', () => {
      const localLibrary = {
        customProp: 'local',
        categories: [],
      };
      const remoteLibrary = {
        customProp: 'remote',
        categories: [],
      };
      
      const localMeta = { fieldTimestamps: { library: 1000 } };
      const remoteMeta = { fieldTimestamps: { library: 2000 } };
      
      const result = resolver.mergeLibrary(localLibrary, remoteLibrary, localMeta, remoteMeta);
      expect(result.customProp).toBe('remote');
    });
  });

  describe('mergeMetadata', () => {
    it('should merge metadata with current timestamp', () => {
      const localMeta = {
        deviceId: 'device1',
        fieldTimestamps: { users: 1000, settings: 2000 },
      };
      const remoteMeta = {
        deviceId: 'device2',
        fieldTimestamps: { users: 1500, settings: 1500 },
      };
      
      const result = resolver.mergeMetadata(localMeta, remoteMeta);
      expect(result.lastModified).toBeDefined();
      expect(result.lastMerged).toBeDefined();
      expect(result.lastModified).toBeGreaterThan(0);
      expect(result.deviceId).toBe('device1'); // Uses local device ID
      expect(result.fieldTimestamps.users).toBe(1500); // Max of both
      expect(result.fieldTimestamps.settings).toBe(2000); // Max of both
    });

    it('should include merge log in metadata', () => {
      resolver.enableLogging = true;
      resolver.log('Test log 1');
      resolver.log('Test log 2');
      
      const result = resolver.mergeMetadata({}, {});
      expect(result.mergeLog).toBeDefined();
      expect(Array.isArray(result.mergeLog)).toBe(true);
      // It keeps last 10 merge decisions
      expect(result.mergeLog.length).toBeLessThanOrEqual(10);
    });
  });

  describe('tiebreaker', () => {
    it('should choose based on alphabetical order of device IDs', () => {
      // Returns 'local' if localDeviceId < remoteDeviceId, 'remote' otherwise
      expect(resolver.tiebreaker('aaa', 'bbb')).toBe('local'); // 'aaa' < 'bbb'
      expect(resolver.tiebreaker('bbb', 'aaa')).toBe('remote'); // 'bbb' >= 'aaa'
      expect(resolver.tiebreaker('aaa', 'aaa')).toBe('remote'); // Equal, returns 'remote'
    });

    it('should handle null/undefined device IDs', () => {
      expect(resolver.tiebreaker(null, 'device')).toBe('remote'); // !localDeviceId
      expect(resolver.tiebreaker('device', null)).toBe('local'); // !remoteDeviceId
      expect(resolver.tiebreaker(null, null)).toBe('local'); // Both null
    });
  });

  describe('logging functionality', () => {
    it('should log when enableLogging is true', () => {
      resolver.enableLogging = true;
      resolver.log('Test message');
      expect(resolver.mergeLog.some(log => log.message === 'Test message')).toBe(true);
    });

    it('should not log when enableLogging is false', () => {
      resolver.enableLogging = false;
      resolver.log('Test message');
      expect(resolver.mergeLog).toHaveLength(0);
    });

    it('should provide detailed merge summary', () => {
      const localState = {
        users: { user1: testUsers.user1 },
        activities: {},
        settings: testSettings,
        library: {},
        metadata: {},
      };
      const remoteState = {
        users: { user2: testUsers.user2 },
        activities: {},
        settings: testSettings,
        library: {},
        metadata: {},
      };
      
      resolver.enableLogging = true;
      resolver.mergeStates(localState, remoteState);
      
      expect(resolver.mergeLog.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle malformed data gracefully', () => {
      const malformedLocal = {
        users: 'not-an-object',
        activities: null,
        settings: undefined,
      };
      const malformedRemote = {
        users: [],
        activities: 'string',
        library: 123,
      };
      
      expect(() => {
        resolver.mergeStates(malformedLocal, malformedRemote);
      }).not.toThrow();
    });

    it('should handle circular references', () => {
      const circular = {};
      circular.self = circular;
      
      const localState = {
        users: { user1: circular },
      };
      const remoteState = {
        users: { user1: { name: 'Normal' } },
      };
      
      expect(() => {
        resolver.mergeStates(localState, remoteState);
      }).not.toThrow();
    });

    it('should handle very large datasets', () => {
      const largeLocal = {
        users: {},
        activities: {},
      };
      const largeRemote = {
        users: {},
        activities: {},
      };
      
      // Create 1000 users and activities
      for (let i = 0; i < 1000; i++) {
        largeLocal.users[`user${i}`] = { name: `Local User ${i}` };
        largeRemote.users[`user${i}`] = { name: `Remote User ${i}` };
        largeLocal.activities[`act${i}`] = { text: `Local Activity ${i}` };
        largeRemote.activities[`act${i}`] = { text: `Remote Activity ${i}` };
      }
      
      const startTime = Date.now();
      const result = resolver.mergeStates(largeLocal, largeRemote);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(Object.keys(result.users)).toHaveLength(1000);
      expect(Object.keys(result.activities)).toHaveLength(1000);
    });
  });

  describe('real-world conflict scenarios', () => {
    it('should handle simultaneous edits correctly', () => {
      const local = {
        users: {
          user1: {
            name: 'Alice',
            icon: '👤',
            lastModified: 1000,
            days: {
              today: {
                activities: [
                  { id: '1', text: 'Morning routine', completed: true, modifiedAt: 1100 },
                ],
              },
            },
          },
        },
        metadata: { deviceId: 'phone', fieldTimestamps: { users: 1000 } },
      };
      
      const remote = {
        users: {
          user1: {
            name: 'Alice Smith',
            icon: '🌟',
            lastModified: 1200,
            days: {
              today: {
                activities: [
                  { id: '1', text: 'Morning routine', completed: false, modifiedAt: 900 },
                  { id: '2', text: 'Exercise', completed: false, modifiedAt: 1200 },
                ],
              },
            },
          },
        },
        metadata: { deviceId: 'tablet', fieldTimestamps: { users: 1100 } },
      };
      
      const result = resolver.mergeStates(local, remote);
      
      // User data should use remote (newer lastModified)
      expect(result.users.user1.name).toBe('Alice Smith');
      expect(result.users.user1.icon).toBe('🌟');
      
      // Activities should be merged
      const activities = result.users.user1.days.today.activities;
      expect(activities).toHaveLength(2);
      // Activity 1 should use local version (newer modifiedAt)
      expect(activities.find(a => a.id === '1').completed).toBe(true);
      // Activity 2 should be included from remote
      expect(activities.find(a => a.id === '2')).toBeDefined();
    });

    it('should handle deleted users correctly', () => {
      const local = {
        users: {
          user1: { name: 'User 1' },
          user2: { name: 'User 2' },
        },
        metadata: { fieldTimestamps: { users: 1000 } },
      };
      
      const remote = {
        users: {
          user1: { name: 'User 1' },
          // user2 deleted on remote
        },
        metadata: { fieldTimestamps: { users: 2000 } },
      };
      
      const result = resolver.mergeStates(local, remote);
      
      // When timestamps differ significantly, prefer the newer one
      // In this case, remote is 1 second newer, not enough to override
      // So we do individual merge and keep both users
      expect(result.users.user1).toBeDefined();
      expect(result.users.user2).toBeDefined();
      
      // But if remote is >3 seconds newer
      remote.metadata.fieldTimestamps.users = 5000;
      const result2 = resolver.mergeStates(local, remote);
      
      // Should only have user1 (remote wins entirely)
      expect(result2.users.user1).toBeDefined();
      expect(result2.users.user2).toBeUndefined();
    });
  });
});