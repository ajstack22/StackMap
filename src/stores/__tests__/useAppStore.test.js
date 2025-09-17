/**
 * Comprehensive tests for useAppStore
 * Tests the main app store facade that combines all sub-stores
 */

import { renderHook, act } from '@testing-library/react-hooks';
import useAppStore from '../useAppStore';
import useUserStore from '../useUserStore';
import useSettingsStore from '../useSettingsStore';
import useLibraryStore from '../useLibraryStore';
import useSyncStore from '../useSyncStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useUserStore.setState({
      users: {},
      currentUser: null,
      currentDay: 'today',
      userContextData: {}
    });

    useSettingsStore.setState({
      currentTheme: 'stackBlue',
      bannerPosition: 'top',
      soundEnabled: true,
      taskCelebration: 'rainbow',
      routineCelebration: 'rainbow',
      displayMode: 'numbers',
      dayMode: 'today',
      hasCompletedOnboarding: false,
      syncSkipped: false,
      toolbarOrder: null,
      moreButtonPosition: 'left'
    });

    useLibraryStore.setState({
      library: { categories: [], userActivityIds: [] },
      libraryTemplates: []
    });

    useSyncStore.setState({
      syncEnabled: false,
      syncStatus: 'idle',
      syncId: null,
      lastSync: null,
      syncError: null
    });
  });

  describe('Initial State Aggregation', () => {
    test('should aggregate state from all sub-stores', () => {
      const { result } = renderHook(() => useAppStore());

      // User store state
      expect(result.current.users).toEqual({});
      expect(result.current.currentUser).toBe(null);
      expect(result.current.currentDay).toBe('today');
      expect(result.current.userContextData).toEqual({});

      // Settings store state
      expect(result.current.currentTheme).toBe('stackBlue');
      expect(result.current.soundEnabled).toBe(true);
      expect(result.current.hasCompletedOnboarding).toBe(false);
      expect(result.current.taskCelebration).toBe('rainbow');
      expect(result.current.displayMode).toBe('numbers');

      // Library store state
      expect(result.current.library).toEqual({ categories: [], userActivityIds: [] });
      expect(result.current.libraryTemplates).toEqual([]);

      // Sync store state
      expect(result.current.syncEnabled).toBe(false);
      expect(result.current.syncStatus).toBe('idle');
      expect(result.current.syncId).toBe(null);

      // Derived state
      expect(result.current.activities).toEqual([]);
      expect(result.current.lastModified).toBeGreaterThan(0);
    });

    test('should have activities getter that returns current user activities', () => {
      const { result } = renderHook(() => useAppStore());

      // Initially no activities
      expect(result.current.activities).toEqual([]);

      // Set up user with activities using setState to ensure proper sync
      act(() => {
        result.current.setState({
          users: {
            'user1': {
              name: 'Test User',
              icon: '👤',
              days: {
                today: {
                  activities: [
                    { id: '1', text: 'Morning exercise', completed: false },
                    { id: '2', text: 'Breakfast', completed: true }
                  ]
                }
              }
            }
          },
          currentUser: 'user1',
          currentDay: 'today'
        });
      });

      // Debug: Check what the UserStore actually has
      const userStoreState = useUserStore.getState();
      expect(userStoreState.currentUser).toBe('user1');
      expect(userStoreState.currentDay).toBe('today');
      expect(userStoreState.users['user1']).toBeDefined();
      expect(userStoreState.users['user1'].days.today.activities).toHaveLength(2);

      // Test the activities getter logic directly
      const user = userStoreState.users[userStoreState.currentUser];
      expect(user).toBeDefined();
      expect(user.days).toBeDefined();
      expect(user.days[userStoreState.currentDay]).toBeDefined();
      expect(user.days[userStoreState.currentDay].activities).toHaveLength(2);

      expect(result.current.activities).toHaveLength(2);
      expect(result.current.activities[0].text).toBe('Morning exercise');
      expect(result.current.activities[1].text).toBe('Breakfast');
    });
  });

  describe('User Store Delegation', () => {
    test('should delegate user actions to UserStore', () => {
      const { result } = renderHook(() => useAppStore());

      const testUsers = {
        'user1': { name: 'User 1', icon: '👤' },
        'user2': { name: 'User 2', icon: '👩' }
      };

      act(() => {
        result.current.setUsers(testUsers);
      });

      expect(result.current.users).toEqual(testUsers);

      act(() => {
        result.current.setCurrentUser('user1');
      });

      expect(result.current.currentUser).toBe('user1');

      act(() => {
        result.current.setCurrentDay('tomorrow');
      });

      expect(result.current.currentDay).toBe('tomorrow');
    });

    test('should handle adding and updating users', () => {
      const { result } = renderHook(() => useAppStore());

      const newUser = {
        name: 'New User',
        icon: '🎯',
        days: { today: { activities: [] } }
      };

      act(() => {
        result.current.addUser('newUser', newUser);
      });

      expect(result.current.users['newUser']).toEqual({
        ...newUser,
        id: 'newUser'
      });

      act(() => {
        result.current.updateUser('newUser', {
          name: 'Updated User'
        });
      });

      expect(result.current.users['newUser'].name).toBe('Updated User');
    });

    test('should handle user context data', () => {
      const { result } = renderHook(() => useAppStore());

      const contextData = {
        lastActivity: 'test',
        preferences: { theme: 'dark' }
      };

      act(() => {
        result.current.setUserContextData(contextData);
      });

      expect(result.current.userContextData).toEqual(contextData);
    });
  });

  describe('Settings Store Delegation', () => {
    test('should delegate settings actions to SettingsStore', async () => {
      const { result } = renderHook(() => useAppStore());

      // First verify the initial state
      expect(result.current.currentTheme).toBe('stackBlue');

      act(() => {
        result.current.setCurrentTheme('emerald');
      });

      // Let's also check the SettingsStore directly
      const settingsState = useSettingsStore.getState();
      expect(settingsState.currentTheme).toBe('emerald'); // This should pass if the delegate works

      // Need to wait for subscription to propagate
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.currentTheme).toBe('emerald');

      act(() => {
        result.current.setSoundEnabled(false);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.soundEnabled).toBe(false);

      act(() => {
        result.current.setTaskCelebration('confetti');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.taskCelebration).toBe('confetti');

      act(() => {
        result.current.setDisplayMode('checkmarks');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.displayMode).toBe('checkmarks');
    });

    test('should handle batch settings updates', () => {
      const { result } = renderHook(() => useAppStore());

      const settingsUpdates = {
        currentTheme: 'stackPurple',
        soundEnabled: false,
        hasCompletedOnboarding: true,
        displayMode: 'progress'
      };

      act(() => {
        result.current.updateSettings(settingsUpdates);
      });

      expect(result.current.currentTheme).toBe('stackPurple');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.displayMode).toBe('progress');
    });

    test('should handle toolbar and UI settings', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setBannerPosition('bottom');
        result.current.setMoreButtonPosition('right');
        result.current.setToolbarOrder(['user', 'library', 'settings']);
      });

      expect(result.current.bannerPosition).toBe('bottom');
      expect(result.current.moreButtonPosition).toBe('right');
      expect(result.current.toolbarOrder).toEqual(['user', 'library', 'settings']);
    });
  });

  describe('Library Store Delegation', () => {
    test('should delegate library actions to LibraryStore', () => {
      const { result } = renderHook(() => useAppStore());

      const testLibrary = {
        categories: [
          {
            id: 'cat1',
            name: 'Morning',
            icon: '☀️',
            activities: [
              { id: 'act1', text: 'Brush teeth', icon: '🦷' }
            ]
          }
        ],
        userActivityIds: ['user-act-1']
      };

      act(() => {
        result.current.setLibrary(testLibrary);
      });

      expect(result.current.library).toEqual(testLibrary);

      // Note: addUserActivityId adds to userAddedActivityIds, not userActivityIds
      act(() => {
        result.current.addUserActivityId('user-act-2');
      });

      // Check if userAddedActivityIds array was created and contains the new ID
      expect(result.current.library.userAddedActivityIds || []).toContain('user-act-2');
    });

    test('should handle library templates', () => {
      const { result } = renderHook(() => useAppStore());

      const templates = [
        { id: 'template1', name: 'Morning Routine', activities: [] }
      ];

      act(() => {
        result.current.setLibraryTemplates(templates);
      });

      expect(result.current.libraryTemplates).toEqual(templates);
    });
  });

  describe('Sync Store Delegation', () => {
    test('should delegate sync actions to SyncStore', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setSyncEnabled(true);
      });

      expect(result.current.syncEnabled).toBe(true);

      act(() => {
        result.current.setSyncId('test-sync-123');
      });

      expect(result.current.syncId).toBe('test-sync-123');

      act(() => {
        result.current.setSyncStatus('syncing');
      });

      expect(result.current.syncStatus).toBe('syncing');

      act(() => {
        result.current.setSyncError('Network error');
      });

      expect(result.current.syncError).toBe('Network error');
    });

    test('should handle batch sync updates', () => {
      const { result } = renderHook(() => useAppStore());

      const syncUpdates = {
        syncEnabled: true,
        syncId: 'batch-sync-456',
        syncStatus: 'completed'
      };

      act(() => {
        result.current.updateSyncState(syncUpdates);
      });

      expect(result.current.syncEnabled).toBe(true);
      expect(result.current.syncId).toBe('batch-sync-456');
      expect(result.current.syncStatus).toBe('completed');
    });

    test('should clear sync state', () => {
      const { result } = renderHook(() => useAppStore());

      // First set some sync state
      act(() => {
        result.current.updateSyncState({
          syncEnabled: true,
          syncId: 'test-id',
          syncStatus: 'syncing'
        });
      });

      expect(result.current.syncEnabled).toBe(true);

      // Then clear it
      act(() => {
        result.current.clearSyncState();
      });

      expect(result.current.syncEnabled).toBe(false);
      expect(result.current.syncId).toBe(null);
      expect(result.current.syncStatus).toBe('idle');
    });
  });

  describe('Activities Management', () => {
    test('should handle setActivities for current user', () => {
      const { result } = renderHook(() => useAppStore());

      // Set up a user first using setState for better synchronization
      act(() => {
        result.current.setState({
          users: {
            'user1': {
              name: 'Test User',
              icon: '👤',
              days: { today: { activities: [] } }
            }
          },
          currentUser: 'user1',
          currentDay: 'today'
        });
      });

      const activities = [
        { id: '1', text: 'Test Activity 1', completed: false },
        { id: '2', text: 'Test Activity 2', completed: true }
      ];

      act(() => {
        result.current.setActivities(activities);
      });

      expect(result.current.activities).toEqual(activities);
    });

    test('should handle updateUserActivities for specific user/day', () => {
      const { result } = renderHook(() => useAppStore());

      // Set up a user
      act(() => {
        result.current.addUser('user1', {
          name: 'Test User',
          icon: '👤',
          days: {
            today: { activities: [] },
            tomorrow: { activities: [] }
          }
        });
      });

      const tomorrowActivities = [
        { id: '1', text: 'Tomorrow Activity', completed: false }
      ];

      act(() => {
        result.current.updateUserActivities('user1', 'tomorrow', tomorrowActivities);
      });

      // Should not affect current activities getter (which looks at currentUser/currentDay)
      expect(result.current.activities).toEqual([]);

      // But should update the user's tomorrow activities
      expect(result.current.users['user1'].days.tomorrow.activities).toEqual(tomorrowActivities);
    });

    test('should handle setActivities with no current user gracefully', () => {
      const { result } = renderHook(() => useAppStore());

      const activities = [
        { id: '1', text: 'Test Activity', completed: false }
      ];

      // Should not throw error when no current user
      act(() => {
        result.current.setActivities(activities);
      });

      expect(result.current.activities).toEqual([]);
    });
  });

  describe('Batch State Updates (setState)', () => {
    test('should handle batch updates across all stores', () => {
      const { result } = renderHook(() => useAppStore());

      const batchUpdates = {
        // User store updates
        users: {
          'user1': { name: 'Batch User', icon: '👤' }
        },
        currentUser: 'user1',
        currentDay: 'tomorrow',

        // Settings store updates
        currentTheme: 'stackRed',
        soundEnabled: false,
        hasCompletedOnboarding: true,

        // Library store updates
        library: {
          categories: [{ id: 'cat1', name: 'Test Category', activities: [] }],
          userActivityIds: []
        },

        // Sync store updates
        syncEnabled: true,
        syncId: 'batch-sync'
      };

      act(() => {
        result.current.setState(batchUpdates);
      });

      // Verify all updates were applied
      expect(result.current.users).toEqual(batchUpdates.users);
      expect(result.current.currentUser).toBe('user1');
      expect(result.current.currentDay).toBe('tomorrow');
      expect(result.current.currentTheme).toBe('stackRed');
      expect(result.current.soundEnabled).toBe(false);
      expect(result.current.hasCompletedOnboarding).toBe(true);
      expect(result.current.library).toEqual(batchUpdates.library);
      expect(result.current.syncEnabled).toBe(true);
      expect(result.current.syncId).toBe('batch-sync');
    });

    test('should handle activities update in batch setState', () => {
      const { result } = renderHook(() => useAppStore());

      // Set up user first
      act(() => {
        result.current.setState({
          users: {
            'user1': {
              name: 'Test User',
              icon: '👤',
              days: { today: { activities: [] } }
            }
          },
          currentUser: 'user1',
          currentDay: 'today'
        });
      });

      const activities = [
        { id: '1', text: 'Batch Activity', completed: false }
      ];

      act(() => {
        result.current.setState({ activities });
      });

      expect(result.current.activities).toEqual(activities);
    });

    test('should handle partial updates gracefully', () => {
      const { result } = renderHook(() => useAppStore());

      // Only update some fields
      act(() => {
        result.current.setState({
          currentTheme: 'stackOrange',
          soundEnabled: false
        });
      });

      expect(result.current.currentTheme).toBe('stackOrange');
      expect(result.current.soundEnabled).toBe(false);
      // Other fields should remain unchanged
      expect(result.current.displayMode).toBe('numbers');
      expect(result.current.hasCompletedOnboarding).toBe(false);
    });
  });

  describe('getState Method', () => {
    test('should return complete state from all stores', () => {
      const { result } = renderHook(() => useAppStore());

      // Set up some test data
      act(() => {
        result.current.setState({
          users: { 'user1': { name: 'Test User', icon: '👤' } },
          currentUser: 'user1',
          currentTheme: 'emerald',
          syncEnabled: true
        });
      });

      const fullState = result.current.getState();

      expect(fullState.users).toEqual({ 'user1': { name: 'Test User', icon: '👤' } });
      expect(fullState.currentUser).toBe('user1');
      expect(fullState.currentTheme).toBe('emerald');
      expect(fullState.syncEnabled).toBe(true);
      expect(fullState.activities).toEqual([]);
      expect(fullState.library).toBeDefined();
      expect(fullState.syncStatus).toBeDefined();
    });

    test('should return activities from current user/day in getState', () => {
      const { result } = renderHook(() => useAppStore());

      // Set up user with activities
      act(() => {
        result.current.setState({
          users: {
            'user1': {
              name: 'Test User',
              icon: '👤',
              days: {
                today: {
                  activities: [
                    { id: '1', text: 'State Activity', completed: false }
                  ]
                }
              }
            }
          },
          currentUser: 'user1',
          currentDay: 'today'
        });
      });

      const fullState = result.current.getState();
      expect(fullState.activities).toEqual([
        { id: '1', text: 'State Activity', completed: false }
      ]);
    });
  });

  describe('Store Synchronization', () => {
    test('should sync state when sub-stores change', async () => {
      const { result } = renderHook(() => useAppStore());

      const initialLastModified = result.current.lastModified;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      // Change something in the user store directly
      act(() => {
        useUserStore.getState().setCurrentUser('direct-user');
      });

      expect(result.current.currentUser).toBe('direct-user');
      expect(result.current.lastModified).toBeGreaterThan(initialLastModified);
    });

    test('should update lastModified when user store changes', async () => {
      const { result } = renderHook(() => useAppStore());

      const initialLastModified = result.current.lastModified;

      await new Promise(resolve => setTimeout(resolve, 10));

      act(() => {
        useUserStore.getState().setUsers({ 'test': { name: 'Test', icon: '👤' } });
      });

      expect(result.current.lastModified).toBeGreaterThan(initialLastModified);
    });

    test('should update lastModified when settings store changes', async () => {
      const { result } = renderHook(() => useAppStore());

      const initialLastModified = result.current.lastModified;

      await new Promise(resolve => setTimeout(resolve, 10));

      act(() => {
        useSettingsStore.getState().setCurrentTheme('stackYellow');
      });

      expect(result.current.lastModified).toBeGreaterThan(initialLastModified);
    });

    test('should NOT update lastModified when sync store changes', async () => {
      const { result } = renderHook(() => useAppStore());

      const initialLastModified = result.current.lastModified;

      await new Promise(resolve => setTimeout(resolve, 10));

      act(() => {
        useSyncStore.getState().setSyncStatus('syncing');
      });

      // lastModified should NOT change for sync store updates
      expect(result.current.lastModified).toBe(initialLastModified);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined values in setState gracefully', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setState({
          currentTheme: undefined,
          users: undefined,
          syncEnabled: undefined
        });
      });

      // Should not crash and should not change values
      expect(result.current.currentTheme).toBe('stackBlue'); // unchanged
      expect(result.current.users).toEqual({}); // unchanged
      expect(result.current.syncEnabled).toBe(false); // unchanged
    });

    test('should handle activities getter with invalid user data', () => {
      const { result } = renderHook(() => useAppStore());

      // Set invalid user data
      act(() => {
        result.current.setState({
          users: {
            'user1': { name: 'Test User', icon: '👤' } // No days property
          },
          currentUser: 'user1'
        });
      });

      expect(result.current.activities).toEqual([]);

      // Test with missing currentDay
      act(() => {
        result.current.setState({
          users: {
            'user1': {
              name: 'Test User',
              icon: '👤',
              days: { today: { activities: [] } }
            }
          },
          currentUser: 'user1',
          currentDay: 'nonexistent'
        });
      });

      expect(result.current.activities).toEqual([]);
    });

    test('should handle missing user in activities getter', () => {
      const { result } = renderHook(() => useAppStore());

      act(() => {
        result.current.setCurrentUser('nonexistent-user');
      });

      expect(result.current.activities).toEqual([]);
    });
  });
});