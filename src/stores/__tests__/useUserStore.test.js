/**
 * Comprehensive tests for useUserStore
 * Tests all store functionality including sanitization, validation, and user management
 * Using direct store access pattern (not renderHook) as per Zustand best practices
 */

import useUserStore from '../useUserStore';
import { DEFAULT_USER_ICON } from '../../constants';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store before each test using direct access
    useUserStore.setState({
      users: {},
      currentUser: null,
      currentDay: 'today',
      userContextData: {}
    });
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const state = useUserStore.getState();

      expect(state.users).toEqual({});
      expect(state.currentUser).toBe(null);
      expect(state.currentDay).toBe('today');
      expect(state.userContextData).toEqual({});
    });
  });

  describe('setUsers', () => {
    test('should set users with valid data', () => {
      const users = {
        'user1': {
          id: 'user1',
          name: 'John Doe',
          icon: '👤',
          days: { today: { activities: [] } }
        },
        'user2': {
          id: 'user2',
          name: 'Jane Smith',
          icon: '👩',
          days: { today: { activities: [] } }
        }
      };

      useUserStore.getState().setUsers(users);

      expect(useUserStore.getState().users).toEqual(users);
    });

    test('should sanitize user names from objects', () => {
      const users = {
        'user1': {
          id: 'user1',
          name: { name: 'John Doe' }, // Object with name property
          icon: '👤'
        }
      };

      useUserStore.getState().setUsers(users);

      expect(useUserStore.getState().users['user1'].name).toBe('John Doe');
    });

    test('should sanitize user names from text property', () => {
      const users = {
        'user1': {
          id: 'user1',
          name: { text: 'Jane Smith' }, // Object with text property
          icon: '👤'
        }
      };

      useUserStore.getState().setUsers(users);

      expect(useUserStore.getState().users['user1'].name).toBe('Jane Smith');
    });

    test('should default invalid user names to "User"', () => {
      const users = {
        'user1': { id: 'user1', name: null, icon: '👤' },
        'user2': { id: 'user2', name: undefined, icon: '👤' },
        'user3': { id: 'user3', name: {}, icon: '👤' },
        'user4': { id: 'user4', name: [], icon: '👤' }
      };

      useUserStore.getState().setUsers(users);
      const state = useUserStore.getState();

      expect(state.users['user1'].name).toBe('User');
      expect(state.users['user2'].name).toBe('User');
      expect(state.users['user3'].name).toBe('User');
      expect(state.users['user4'].name).toBe('User');
    });

    test('should handle icon field normalization', () => {
      const users = {
        'user1': { id: 'user1', name: 'Test', emoji: '🎯' }, // emoji instead of icon
        'user2': { id: 'user2', name: 'Test', icon: null }, // null icon
        'user3': { id: 'user3', name: 'Test', icon: '' }, // empty icon
        'user4': { id: 'user4', name: 'Test' } // missing icon
      };

      useUserStore.getState().setUsers(users);
      const state = useUserStore.getState();

      expect(state.users['user1'].icon).toBe('🎯');
      expect(state.users['user1'].emoji).toBeUndefined();
      expect(state.users['user2'].icon).toBe(DEFAULT_USER_ICON);
      expect(state.users['user3'].icon).toBe(DEFAULT_USER_ICON);
      expect(state.users['user4'].icon).toBe(DEFAULT_USER_ICON);
    });
  });

  describe('addUser', () => {
    test('should add a new user with valid data', () => {
      const newUser = {
        id: 'user1',
        name: 'New User',
        icon: '👤'
      };

      useUserStore.getState().addUser(newUser);
      const state = useUserStore.getState();

      expect(state.users['user1']).toMatchObject(newUser);
    });

    test('should sanitize user data when adding', () => {
      const newUser = {
        id: 'user1',
        name: { name: 'Object Name' },
        emoji: '🎯' // Should be normalized to icon
      };

      useUserStore.getState().addUser(newUser);
      const state = useUserStore.getState();

      expect(state.users['user1'].name).toBe('Object Name');
      expect(state.users['user1'].icon).toBe('🎯');
      expect(state.users['user1'].emoji).toBeUndefined();
    });

    test('should provide default icon if missing', () => {
      const newUser = {
        id: 'user1',
        name: 'No Icon User'
      };

      useUserStore.getState().addUser(newUser);
      const state = useUserStore.getState();

      expect(state.users['user1'].icon).toBe(DEFAULT_USER_ICON);
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      // Setup initial user
      useUserStore.setState({
        users: {
          'user1': {
            id: 'user1',
            name: 'Original Name',
            icon: '👤',
            days: {
              today: { activities: ['act1'] },
              tomorrow: { activities: [] }
            },
            userAddedActivityIds: []
          }
        }
      });
    });

    test('should update user properties', () => {
      useUserStore.getState().updateUser('user1', {
        name: 'Updated Name',
        icon: '🎨'
      });

      const user = useUserStore.getState().users['user1'];
      expect(user.name).toBe('Updated Name');
      expect(user.icon).toBe('🎨');
    });

    test('should handle icon validation during update', () => {
      // Test null icon
      useUserStore.getState().updateUser('user1', { icon: null });
      expect(useUserStore.getState().users['user1'].icon).toBe(DEFAULT_USER_ICON);

      // Test empty string icon
      useUserStore.getState().updateUser('user1', { icon: '' });
      expect(useUserStore.getState().users['user1'].icon).toBe(DEFAULT_USER_ICON);

      // Test invalid type icon
      useUserStore.getState().updateUser('user1', { icon: 123 });
      expect(useUserStore.getState().users['user1'].icon).toBe(DEFAULT_USER_ICON);

      // Test valid icon
      useUserStore.getState().updateUser('user1', { icon: '✅' });
      expect(useUserStore.getState().users['user1'].icon).toBe('✅');
    });

    test('should handle deep property updates with dayToUpdate', () => {
      useUserStore.getState().updateUser('user1', {
        days: {
          today: { activities: ['act1', 'act2', 'act3'] }
        },
        dayToUpdate: 'today'
      });

      const user = useUserStore.getState().users['user1'];
      expect(user.days.today.activities).toEqual(['act1', 'act2', 'act3']);
      expect(user.days.tomorrow.activities).toEqual([]); // Unchanged
    });

    test('should merge nested objects correctly', () => {
      useUserStore.getState().updateUser('user1', {
        preferences: {
          theme: 'dark',
          notifications: true
        }
      });

      let user = useUserStore.getState().users['user1'];
      expect(user.preferences).toEqual({
        theme: 'dark',
        notifications: true
      });

      // Update only one nested property
      useUserStore.getState().updateUser('user1', {
        preferences: {
          theme: 'light'
        }
      });

      user = useUserStore.getState().users['user1'];
      expect(user.preferences.theme).toBe('light');
      expect(user.preferences.notifications).toBe(true); // Should be preserved
    });

    test('should not update non-existent user', () => {
      const stateBefore = useUserStore.getState().users;

      useUserStore.getState().updateUser('nonexistent', {
        name: 'Should Not Work'
      });

      const stateAfter = useUserStore.getState().users;
      expect(stateAfter).toEqual(stateBefore);
      expect(stateAfter['nonexistent']).toBeUndefined();
    });

    test('should handle complex nested updates', () => {
      useUserStore.getState().updateUser('user1', {
        days: {
          today: {
            activities: ['new1', 'new2'],
            notes: 'Today was productive'
          },
          tomorrow: {
            activities: ['plan1'],
            notes: 'Planning ahead'
          }
        }
      });

      const user = useUserStore.getState().users['user1'];
      expect(user.days.today.activities).toEqual(['new1', 'new2']);
      expect(user.days.today.notes).toBe('Today was productive');
      expect(user.days.tomorrow.activities).toEqual(['plan1']);
      expect(user.days.tomorrow.notes).toBe('Planning ahead');
    });
  });

  describe('deleteUser', () => {
    beforeEach(() => {
      useUserStore.setState({
        users: {
          'user1': {
            id: 'user1',
            name: 'User to Delete',
            icon: '👤',
            days: { today: { activities: [] } }
          },
          'user2': {
            id: 'user2',
            name: 'Other User',
            icon: '👩',
            days: { today: { activities: [] } }
          }
        }
      });
    });

    test('should soft delete user by adding deleted flag', () => {
      const beforeDelete = Date.now();

      useUserStore.getState().deleteUser('user1');

      const afterDelete = Date.now();
      const user = useUserStore.getState().users['user1'];

      expect(user.deleted).toBe(true);
      expect(user.deletedAt).toBeGreaterThanOrEqual(beforeDelete);
      expect(user.deletedAt).toBeLessThanOrEqual(afterDelete);
      expect(user.name).toBe('User to Delete'); // Data preserved
      expect(user.icon).toBe('👤'); // Data preserved
    });

    test('should not affect other users when deleting', () => {
      useUserStore.getState().deleteUser('user1');

      const state = useUserStore.getState();
      expect(state.users['user1'].deleted).toBe(true);
      expect(state.users['user2'].deleted).toBeUndefined();
      expect(state.users['user2'].name).toBe('Other User');
    });

    test('should handle deletion of non-existent user gracefully', () => {
      const stateBefore = JSON.stringify(useUserStore.getState().users);

      useUserStore.getState().deleteUser('nonexistent');

      const stateAfter = JSON.stringify(useUserStore.getState().users);
      expect(stateAfter).toBe(stateBefore); // No changes
    });

    test('should be able to delete already deleted user (idempotent)', () => {
      useUserStore.getState().deleteUser('user1');
      const firstDeleteTime = useUserStore.getState().users['user1'].deletedAt;

      // Wait a bit to ensure timestamp would be different
      setTimeout(() => {
        useUserStore.getState().deleteUser('user1');
        const secondDeleteTime = useUserStore.getState().users['user1'].deletedAt;

        // Timestamp should update
        expect(secondDeleteTime).toBeGreaterThan(firstDeleteTime);
        expect(useUserStore.getState().users['user1'].deleted).toBe(true);
      }, 10);
    });
  });

  describe('addUserActivityToLibrary', () => {
    beforeEach(() => {
      useUserStore.setState({
        users: {
          'user1': {
            id: 'user1',
            name: 'Test User',
            icon: '👤',
            userAddedActivityIds: ['existing1', 'existing2']
          }
        },
        currentUser: 'user1'
      });
    });

    test('should add new activity to user library', () => {
      const newActivity = {
        id: 'newActivity',
        text: 'New Activity',
        icon: '🎯'
      };

      useUserStore.getState().addUserActivityToLibrary(newActivity);

      const user = useUserStore.getState().users['user1'];
      expect(user.userAddedActivityIds).toContain('newActivity');
      expect(user.userAddedActivityIds).toHaveLength(3);
    });

    test('should not add duplicate activity', () => {
      const existingActivity = {
        id: 'existing1',
        text: 'Existing Activity',
        icon: '📝'
      };

      useUserStore.getState().addUserActivityToLibrary(existingActivity);

      const user = useUserStore.getState().users['user1'];
      expect(user.userAddedActivityIds).toEqual(['existing1', 'existing2']);
      expect(user.userAddedActivityIds).toHaveLength(2); // No change
    });

    test('should initialize userAddedActivityIds if not present', () => {
      // User without userAddedActivityIds array
      useUserStore.setState({
        users: {
          'user2': {
            id: 'user2',
            name: 'User Without Array',
            icon: '👩'
          }
        },
        currentUser: 'user2'
      });

      const activity = {
        id: 'firstActivity',
        text: 'First Activity',
        icon: '🌟'
      };

      useUserStore.getState().addUserActivityToLibrary(activity);

      const user = useUserStore.getState().users['user2'];
      expect(user.userAddedActivityIds).toEqual(['firstActivity']);
    });

    test('should not add activity if no current user', () => {
      useUserStore.setState({ currentUser: null });

      const activity = {
        id: 'shouldNotAdd',
        text: 'Should Not Add',
        icon: '❌'
      };

      const stateBefore = JSON.stringify(useUserStore.getState().users);
      useUserStore.getState().addUserActivityToLibrary(activity);
      const stateAfter = JSON.stringify(useUserStore.getState().users);

      expect(stateAfter).toBe(stateBefore); // No changes
    });

    test('should not add activity if current user does not exist', () => {
      useUserStore.setState({ currentUser: 'nonexistentUser' });

      const activity = {
        id: 'shouldNotAdd',
        text: 'Should Not Add',
        icon: '❌'
      };

      const stateBefore = JSON.stringify(useUserStore.getState().users);
      useUserStore.getState().addUserActivityToLibrary(activity);
      const stateAfter = JSON.stringify(useUserStore.getState().users);

      expect(stateAfter).toBe(stateBefore); // No changes
    });

    test('should handle activities with special characters in ID', () => {
      const specialActivity = {
        id: 'activity-with-special_chars.123',
        text: 'Special Activity',
        icon: '🔧'
      };

      useUserStore.getState().addUserActivityToLibrary(specialActivity);

      const user = useUserStore.getState().users['user1'];
      expect(user.userAddedActivityIds).toContain('activity-with-special_chars.123');
    });
  });

  describe('setCurrentUser', () => {
    test('should set current user', () => {
      useUserStore.getState().setCurrentUser('user123');
      expect(useUserStore.getState().currentUser).toBe('user123');
    });

    test('should handle null current user', () => {
      useUserStore.getState().setCurrentUser('user123');
      useUserStore.getState().setCurrentUser(null);
      expect(useUserStore.getState().currentUser).toBe(null);
    });
  });

  describe('setCurrentDay', () => {
    test('should set current day', () => {
      useUserStore.getState().setCurrentDay('tomorrow');
      expect(useUserStore.getState().currentDay).toBe('tomorrow');
    });

    test('should handle special day values', () => {
      useUserStore.getState().setCurrentDay('2024-01-15');
      expect(useUserStore.getState().currentDay).toBe('2024-01-15');
    });
  });

  describe('setUserContextData', () => {
    test('should set user context data', () => {
      const contextData = {
        lastActivity: 'reading',
        mood: 'happy',
        notes: 'Great day!'
      };

      useUserStore.getState().setUserContextData(contextData);
      expect(useUserStore.getState().userContextData).toEqual(contextData);
    });

    test('should replace entire context data', () => {
      useUserStore.getState().setUserContextData({ old: 'data' });
      useUserStore.getState().setUserContextData({ new: 'data' });

      const context = useUserStore.getState().userContextData;
      expect(context).toEqual({ new: 'data' });
      expect(context.old).toBeUndefined();
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle multiple operations in sequence', () => {
      // Add users
      useUserStore.getState().setUsers({
        'user1': { id: 'user1', name: 'User 1', icon: '👤' }
      });

      // Set current user
      useUserStore.getState().setCurrentUser('user1');

      // Add activity to library
      useUserStore.getState().addUserActivityToLibrary({
        id: 'act1',
        text: 'Activity 1',
        icon: '🎯'
      });

      // Update user
      useUserStore.getState().updateUser('user1', {
        name: 'Updated User 1'
      });

      // Delete user
      useUserStore.getState().deleteUser('user1');

      const state = useUserStore.getState();
      expect(state.users['user1'].deleted).toBe(true);
      expect(state.users['user1'].name).toBe('Updated User 1');
      expect(state.users['user1'].userAddedActivityIds).toContain('act1');
    });
  });
});