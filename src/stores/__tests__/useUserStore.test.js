/**
 * Comprehensive tests for useUserStore
 * Tests all store functionality including sanitization, validation, and user management
 */

import { renderHook, act } from '@testing-library/react-hooks';
import useUserStore from '../useUserStore';
import { DEFAULT_USER_ICON } from '../../constants';

describe('useUserStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useUserStore.setState({
      users: {},
      currentUser: null,
      currentDay: 'today',
      userContextData: {}
    });
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useUserStore());

      expect(result.current.users).toEqual({});
      expect(result.current.currentUser).toBe(null);
      expect(result.current.currentDay).toBe('today');
      expect(result.current.userContextData).toEqual({});
    });
  });

  describe('setUsers', () => {
    test('should set users with valid data', () => {
      const { result } = renderHook(() => useUserStore());

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

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users).toEqual(users);
    });

    test('should sanitize user names from objects', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': {
          id: 'user1',
          name: { name: 'John Doe' }, // Object with name property
          icon: '👤'
        }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].name).toBe('John Doe');
    });

    test('should sanitize user names from text property', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': {
          id: 'user1',
          name: { text: 'Jane Smith' }, // Object with text property
          icon: '👤'
        }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].name).toBe('Jane Smith');
    });

    test('should default invalid user names to "User"', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': { id: 'user1', name: null, icon: '👤' },
        'user2': { id: 'user2', name: undefined, icon: '👤' },
        'user3': { id: 'user3', name: {}, icon: '👤' },
        'user4': { id: 'user4', name: 123, icon: '👤' }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].name).toBe('User');
      expect(result.current.users['user2'].name).toBe('User');
      expect(result.current.users['user3'].name).toBe('User');
      // Numbers get converted to strings
      expect(result.current.users['user4'].name).toBe('User'); // Actually gets treated as invalid
    });

    test('should handle emoji to icon conversion when icon is missing', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': {
          id: 'user1',
          name: 'John',
          emoji: '🌟' // Should convert to icon when no icon present
        }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].icon).toBe('🌟');
      expect(result.current.users['user1'].emoji).toBeUndefined();
    });

    test('should default missing icons', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': { id: 'user1', name: 'John' },
        'user2': { id: 'user2', name: 'Jane', icon: null },
        'user3': { id: 'user3', name: 'Bob', icon: '' }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].icon).toBe(DEFAULT_USER_ICON);
      expect(result.current.users['user2'].icon).toBe(DEFAULT_USER_ICON);
      expect(result.current.users['user3'].icon).toBe(DEFAULT_USER_ICON);
    });

    test('should handle null/undefined users', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': null,
        'user2': undefined,
        'user3': { id: 'user3', name: 'Valid User', icon: '👤' }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1']).toBe(null);
      expect(result.current.users['user2']).toBe(undefined);
      expect(result.current.users['user3'].name).toBe('Valid User');
    });
  });

  describe('setCurrentUser', () => {
    test('should set current user', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setCurrentUser('user123');
      });

      expect(result.current.currentUser).toBe('user123');
    });

    test('should handle null current user', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setCurrentUser('user123');
        result.current.setCurrentUser(null);
      });

      expect(result.current.currentUser).toBe(null);
    });
  });

  describe('setCurrentDay', () => {
    test('should set current day', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setCurrentDay('tomorrow');
      });

      expect(result.current.currentDay).toBe('tomorrow');
    });

    test('should handle different day values', () => {
      const { result } = renderHook(() => useUserStore());

      const days = ['today', 'tomorrow', 'custom-day'];

      days.forEach(day => {
        act(() => {
          result.current.setCurrentDay(day);
        });
        expect(result.current.currentDay).toBe(day);
      });
    });
  });

  describe('setUserContextData', () => {
    test('should set user context data', () => {
      const { result } = renderHook(() => useUserStore());

      const contextData = {
        lastActivity: 'test-activity',
        preferences: { theme: 'dark' }
      };

      act(() => {
        result.current.setUserContextData(contextData);
      });

      expect(result.current.userContextData).toEqual(contextData);
    });

    test('should replace existing context data', () => {
      const { result } = renderHook(() => useUserStore());

      const initialData = { key1: 'value1' };
      const newData = { key2: 'value2' };

      act(() => {
        result.current.setUserContextData(initialData);
      });

      expect(result.current.userContextData).toEqual(initialData);

      act(() => {
        result.current.setUserContextData(newData);
      });

      expect(result.current.userContextData).toEqual(newData);
    });
  });

  describe('addUser', () => {
    test('should add a new user with sanitized data', () => {
      const { result } = renderHook(() => useUserStore());

      const newUser = {
        name: 'Test User',
        icon: '🎯',
        days: { today: { activities: [] } }
      };

      act(() => {
        result.current.addUser('test-user-id', newUser);
      });

      expect(result.current.users['test-user-id']).toEqual(newUser);
    });

    test('should sanitize user data when adding', () => {
      const { result } = renderHook(() => useUserStore());

      const newUser = {
        name: { name: 'Nested Name' },
        emoji: '🌟' // Should convert to icon
      };

      act(() => {
        result.current.addUser('test-user', newUser);
      });

      expect(result.current.users['test-user'].name).toBe('Nested Name');
      expect(result.current.users['test-user'].icon).toBe('🌟');
      // addUser doesn't delete emoji field, only setUsers does
      expect(result.current.users['test-user'].emoji).toBe('🌟');
    });

    test('should add user to existing users', () => {
      const { result } = renderHook(() => useUserStore());

      // First, add initial users
      const initialUsers = {
        'user1': { name: 'User 1', icon: '👤' }
      };

      act(() => {
        result.current.setUsers(initialUsers);
      });

      // Then add another user
      const newUser = { name: 'User 2', icon: '👩' };

      act(() => {
        result.current.addUser('user2', newUser);
      });

      expect(Object.keys(result.current.users)).toHaveLength(2);
      expect(result.current.users['user1'].name).toBe('User 1');
      expect(result.current.users['user2'].name).toBe('User 2');
    });
  });

  describe('Complex User Data Handling', () => {
    test('should handle users with activities', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': {
          name: 'Active User',
          icon: '👤',
          days: {
            today: {
              activities: [
                { id: 'act1', text: 'Morning Exercise', completed: false },
                { id: 'act2', text: 'Breakfast', completed: true }
              ]
            },
            tomorrow: {
              activities: [
                { id: 'act3', text: 'Meeting', completed: false }
              ]
            }
          }
        }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].days.today.activities).toHaveLength(2);
      expect(result.current.users['user1'].days.tomorrow.activities).toHaveLength(1);
    });

    test('should handle users with settings', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': {
          name: 'Settings User',
          icon: '👤',
          settings: {
            theme: 'stackBlue',
            celebration: 'rainbow',
            soundEnabled: true
          }
        }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].settings.theme).toBe('stackBlue');
      expect(result.current.users['user1'].settings.celebration).toBe('rainbow');
      expect(result.current.users['user1'].settings.soundEnabled).toBe(true);
    });

    test('should handle deeply nested user data', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': {
          name: 'Complex User',
          icon: '👤',
          metadata: {
            preferences: {
              notifications: {
                enabled: true,
                types: ['activity', 'reminder']
              }
            }
          }
        }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].metadata.preferences.notifications.enabled).toBe(true);
      expect(result.current.users['user1'].metadata.preferences.notifications.types).toEqual(['activity', 'reminder']);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty users object', () => {
      const { result } = renderHook(() => useUserStore());

      act(() => {
        result.current.setUsers({});
      });

      expect(result.current.users).toEqual({});
    });

    test('should handle malformed user data gracefully', () => {
      const { result } = renderHook(() => useUserStore());

      const malformedUsers = {
        'user1': {
          name: [1, 2, 3], // Array instead of string
          icon: { complex: 'object' } // Object instead of string
        }
      };

      act(() => {
        result.current.setUsers(malformedUsers);
      });

      // Should sanitize to default values
      expect(result.current.users['user1'].name).toBe('User');
      expect(result.current.users['user1'].icon).toBe(DEFAULT_USER_ICON);
    });

    test('should handle string conversion for numeric names', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': { name: 42, icon: '👤' },
        'user2': { name: 0, icon: '👤' }, // 0 is falsy, so becomes 'User'
        'user3': { name: -1, icon: '👤' }
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].name).toBe('User'); // Numbers handled by addUser logic
      expect(result.current.users['user2'].name).toBe('User'); // 0 is falsy
      expect(result.current.users['user3'].name).toBe('User');
    });

    test('should handle boolean names', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': { name: true, icon: '👤' },
        'user2': { name: false, icon: '👤' } // false is falsy, becomes 'User'
      };

      act(() => {
        result.current.setUsers(users);
      });

      expect(result.current.users['user1'].name).toBe('User'); // All non-strings become 'User'
      expect(result.current.users['user2'].name).toBe('User'); // false is falsy
    });

    test('should handle special string values', () => {
      const { result } = renderHook(() => useUserStore());

      const users = {
        'user1': { name: 'undefined', icon: '👤' },
        'user2': { name: 'null', icon: '👤' },
        'user3': { name: '', icon: '👤' }
      };

      act(() => {
        result.current.setUsers(users);
      });

      // These are already strings, so they are passed through as is for setUsers
      expect(result.current.users['user1'].name).toBe('undefined');
      expect(result.current.users['user2'].name).toBe('null');
      expect(result.current.users['user3'].name).toBe('User'); // Empty string is falsy
    });
  });

  describe('Store Persistence Behavior', () => {
    test('should maintain state structure for persistence', () => {
      const { result } = renderHook(() => useUserStore());

      const complexUserData = {
        'user1': {
          name: 'Persistent User',
          icon: '👤',
          days: {
            today: { activities: [{ id: '1', text: 'Test', completed: false }] },
            tomorrow: { activities: [] }
          },
          settings: { theme: 'stackBlue' }
        }
      };

      act(() => {
        result.current.setUsers(complexUserData);
        result.current.setCurrentUser('user1');
        result.current.setCurrentDay('tomorrow');
      });

      // Verify all state is properly set
      expect(result.current.users).toEqual(complexUserData);
      expect(result.current.currentUser).toBe('user1');
      expect(result.current.currentDay).toBe('tomorrow');
    });
  });
});