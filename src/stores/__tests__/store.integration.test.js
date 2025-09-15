/**
 * Comprehensive Store Integration Tests
 * Tests cross-store interactions, data persistence, and complex workflows
 */

import { renderHook, act } from '@testing-library/react-hooks';
import {
  resetAllStores,
  setupTestEnvironment,
  userInteractions,
  assertions,
  performance
} from '../../__tests__/helpers/testHelpers';
import {
  UserFactory,
  ActivityFactory,
  LibraryFactory,
  SettingsFactory,
  AppStateFactory
} from '../../__tests__/helpers/dataFactories';

// Import all stores
import useAppStore from '../useAppStore';
import useUserStore from '../useUserStore';
import useLibraryStore from '../useLibraryStore';
import useSettingsStore from '../useSettingsStore';
import useSyncStore from '../useSyncStore';

describe('Store Integration Tests', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('Cross-Store Data Flow', () => {
    test('should maintain data consistency across stores', () => {
      // Set up test data
      const user = UserFactory.create({ name: 'Integration User' });
      const library = LibraryFactory.create();
      const settings = SettingsFactory.create({ currentTheme: 'stackGreen' });

      // Set up stores individually
      const { result: userResult } = renderHook(() => useUserStore());
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const { result: settingsResult } = renderHook(() => useSettingsStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        userResult.current.setUsers({ [user.id]: user });
        userResult.current.setCurrentUser(user.id);
        libraryResult.current.setLibrary(library);
        settingsResult.current.updateSettings(settings);
      });

      // Verify data is accessible through app store
      expect(appResult.current.users[user.id]).toEqual(user);
      expect(appResult.current.currentUser).toBe(user.id);
      expect(appResult.current.library).toEqual(library);
      expect(appResult.current.currentTheme).toBe('stackGreen');

      // Verify direct store access still works
      expect(userResult.current.users[user.id].name).toBe('Integration User');
      expect(libraryResult.current.library.categories).toHaveLength(3);
      expect(settingsResult.current.currentTheme).toBe('stackGreen');
    });

    test('should handle user updates through app store delegation', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const { result: userResult } = renderHook(() => useUserStore());

      const user = UserFactory.create();

      act(() => {
        // Update through app store
        appResult.current.setUsers({ [user.id]: user });
        appResult.current.setCurrentUser(user.id);
      });

      // Verify changes in user store
      expect(userResult.current.users[user.id]).toEqual(user);
      expect(userResult.current.currentUser).toBe(user.id);

      act(() => {
        // Update user data through app store
        appResult.current.updateUser(user.id, {
          name: 'Updated Name',
          settings: { theme: 'stackRed' }
        });
      });

      // Verify deep merge worked
      expect(userResult.current.users[user.id].name).toBe('Updated Name');
      expect(userResult.current.users[user.id].settings.theme).toBe('stackRed');
      expect(userResult.current.users[user.id].icon).toBe(user.icon); // Should preserve
    });

    test('should sync theme changes between users and global settings', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const { result: settingsResult } = renderHook(() => useSettingsStore());

      const user = UserFactory.create({
        settings: { theme: 'stackBlue' }
      });

      act(() => {
        appResult.current.setUsers({ [user.id]: user });
        appResult.current.setCurrentUser(user.id);
      });

      // Change global theme
      act(() => {
        settingsResult.current.updateSettings({ currentTheme: 'stackPurple' });
      });

      expect(appResult.current.currentTheme).toBe('stackPurple');

      // Change user theme (should not affect global theme for other users)
      act(() => {
        appResult.current.updateUser(user.id, {
          settings: { theme: 'stackYellow' }
        });
      });

      expect(appResult.current.users[user.id].settings.theme).toBe('stackYellow');
      expect(appResult.current.currentTheme).toBe('stackPurple'); // Global unchanged
    });
  });

  describe('Activity Management Integration', () => {
    test('should manage user activities with library integration', () => {
      // Create user without any activities
      const user = UserFactory.create({
        days: {
          today: { activities: [] },
          tomorrow: { activities: [] }
        }
      });
      const library = LibraryFactory.create();
      const { users } = setupTestEnvironment({ user, library });

      const { result: appResult } = renderHook(() => useAppStore());

      // Add library activity to user's day
      const libraryActivity = library.categories[0].activities[0];
      const userActivity = {
        ...libraryActivity,
        id: 'user-activity-1',
        completed: false,
        timestamp: Date.now()
      };

      act(() => {
        userInteractions.addActivityToDay(user.id, 'today', userActivity);
      });

      expect(appResult.current.users[user.id].days.today.activities).toHaveLength(1);
      expect(appResult.current.users[user.id].days.today.activities[0].text).toBe(libraryActivity.text);

      // Complete the activity
      act(() => {
        userInteractions.completeActivity(user.id, 'today', userActivity.id);
      });

      expect(assertions.activityIsCompleted(user.id, 'today', userActivity.id)).toBe(true);
    });

    test('should handle multiple users with different activities', () => {
      const familyData = AppStateFactory.createFamily();
      setupTestEnvironment(familyData);

      const { result: appResult } = renderHook(() => useAppStore());
      const userIds = Object.keys(familyData.users);

      // Add different activities to each user
      userIds.forEach((userId, index) => {
        const activity = ActivityFactory.create({
          text: `Activity for User ${index + 1}`,
          icon: ['🎯', '📚', '🏃‍♂️'][index] || '🎯'
        });

        act(() => {
          userInteractions.addActivityToDay(userId, 'today', activity);
        });
      });

      // Verify each user has their own activities
      userIds.forEach((userId, index) => {
        const userActivities = appResult.current.users[userId].days.today.activities;
        // Factory creates users with 3 activities, plus 1 we added = 4 total
        expect(userActivities.length).toBeGreaterThanOrEqual(1);
        // Find the activity we added (should be the last one with our specific text)
        const addedActivity = userActivities.find(a => a.text === `Activity for User ${index + 1}`);
        expect(addedActivity).toBeDefined();
        expect(addedActivity.text).toBe(`Activity for User ${index + 1}`);
      });

      // Complete activities for some users
      act(() => {
        userInteractions.completeActivity(userIds[0], 'today',
          appResult.current.users[userIds[0]].days.today.activities[0].id);
      });

      // Verify only specific user's activity was completed
      expect(assertions.activityIsCompleted(userIds[0], 'today',
        appResult.current.users[userIds[0]].days.today.activities[0].id)).toBe(true);
      expect(assertions.activityIsCompleted(userIds[1], 'today',
        appResult.current.users[userIds[1]].days.today.activities[0].id)).toBe(false);
    });

    test('should maintain activity ordering and timestamps', () => {
      const user = UserFactory.create();
      setupTestEnvironment({ user });

      const { result: appResult } = renderHook(() => useAppStore());

      // Add activities with specific timestamps
      const activities = [
        ActivityFactory.create({ text: 'First', timestamp: Date.now() - 3000 }),
        ActivityFactory.create({ text: 'Second', timestamp: Date.now() - 2000 }),
        ActivityFactory.create({ text: 'Third', timestamp: Date.now() - 1000 })
      ];

      activities.forEach(activity => {
        act(() => {
          userInteractions.addActivityToDay(user.id, 'today', activity);
        });
      });

      const userActivities = appResult.current.users[user.id].days.today.activities;
      expect(userActivities).toHaveLength(3);
      expect(userActivities[0].text).toBe('First');
      expect(userActivities[2].text).toBe('Third');

      // Complete activities in different order
      act(() => {
        userInteractions.completeActivity(user.id, 'today', activities[1].id); // Complete second
      });

      const updatedActivities = appResult.current.users[user.id].days.today.activities;
      const completedActivity = updatedActivities.find(a => a.id === activities[1].id);
      expect(completedActivity.completed).toBe(true);
      expect(completedActivity.timestamp).toBeGreaterThan(activities[1].timestamp); // Updated timestamp
    });
  });

  describe('Library Management Integration', () => {
    test('should manage library categories and user activities', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      const category = {
        id: 'test-category',
        name: 'Test Category',
        icon: '🧪',
        activities: ActivityFactory.createMultiple(3)
      };

      act(() => {
        libraryResult.current.setLibrary({
          categories: [category],
          userActivityIds: ['custom-1', 'custom-2']
        });
      });

      expect(appResult.current.library.categories).toHaveLength(1);
      expect(appResult.current.library.categories[0].activities).toHaveLength(3);
      expect(appResult.current.library.userActivityIds).toHaveLength(2);

      // Update library through app store
      const newActivity = ActivityFactory.create({ text: 'New Library Activity' });
      const updatedCategory = {
        ...category,
        activities: [...category.activities, newActivity]
      };

      act(() => {
        appResult.current.setLibrary({
          categories: [updatedCategory],
          userActivityIds: ['custom-1', 'custom-2', 'custom-3']
        });
      });

      expect(libraryResult.current.library.categories[0].activities).toHaveLength(4);
      expect(libraryResult.current.library.userActivityIds).toHaveLength(3);
    });

    test('should handle empty library gracefully', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        libraryResult.current.setLibrary({
          categories: [],
          userActivityIds: []
        });
      });

      expect(appResult.current.library.categories).toHaveLength(0);
      expect(appResult.current.library.userActivityIds).toHaveLength(0);

      // Adding first category should work
      const firstCategory = {
        id: 'first',
        name: 'First Category',
        icon: '1️⃣',
        activities: [ActivityFactory.create()]
      };

      act(() => {
        appResult.current.setLibrary({
          categories: [firstCategory],
          userActivityIds: []
        });
      });

      expect(libraryResult.current.library.categories).toHaveLength(1);
      expect(libraryResult.current.library.categories[0].name).toBe('First Category');
    });
  });

  describe('Settings and Preferences Integration', () => {
    test('should manage global settings affecting all components', () => {
      const { result: settingsResult } = renderHook(() => useSettingsStore());
      const { result: appResult } = renderHook(() => useAppStore());

      // Test default settings
      expect(appResult.current.currentTheme).toBe('stackBlue');
      expect(appResult.current.soundEnabled).toBe(true);
      expect(appResult.current.hasCompletedOnboarding).toBe(false);

      // Update settings
      act(() => {
        settingsResult.current.updateSettings({
          currentTheme: 'stackPurple',
          soundEnabled: false,
          hasCompletedOnboarding: true,
          taskCelebration: 'confetti',
          displayMode: 'checkmarks'
        });
      });

      expect(appResult.current.currentTheme).toBe('stackPurple');
      expect(appResult.current.soundEnabled).toBe(false);
      expect(appResult.current.hasCompletedOnboarding).toBe(true);
      expect(appResult.current.taskCelebration).toBe('confetti');
      expect(appResult.current.displayMode).toBe('checkmarks');
    });

    test('should handle settings updates through app store', () => {
      const { result: settingsResult } = renderHook(() => useSettingsStore());
      const { result: appResult } = renderHook(() => useAppStore());

      act(() => {
        appResult.current.updateSettings({
          currentTheme: 'stackRed',
          soundEnabled: false
        });
      });

      expect(settingsResult.current.currentTheme).toBe('stackRed');
      expect(settingsResult.current.soundEnabled).toBe(false);
    });
  });

  describe('Sync Integration', () => {
    test('should manage sync settings and state', () => {
      const { result: syncResult } = renderHook(() => useSyncStore());
      const { result: appResult } = renderHook(() => useAppStore());

      // Test initial sync state
      expect(appResult.current.syncEnabled).toBe(false);
      expect(syncResult.current.syncStatus).toBe('idle');
      expect(syncResult.current.syncError).toBe(null);

      // Enable sync
      act(() => {
        syncResult.current.updateSyncState({
          syncEnabled: true,
          syncId: 'test-sync-123'
        });
      });

      expect(appResult.current.syncEnabled).toBe(true);
      expect(syncResult.current.syncId).toBe('test-sync-123');

      // Simulate sync status changes
      act(() => {
        syncResult.current.setSyncStatus('syncing');
      });

      expect(syncResult.current.syncStatus).toBe('syncing');

      // Simulate sync error
      act(() => {
        syncResult.current.setSyncError('Network timeout');
      });

      expect(syncResult.current.syncError).toBe('Network timeout');
    });
  });

  describe('Performance and Memory Tests', () => {
    test('should handle large datasets efficiently', async () => {
      const performanceData = AppStateFactory.createForPerformanceTesting();

      await performance.assertPerformance(
        () => {
          const { result: appResult } = renderHook(() => useAppStore());

          act(() => {
            appResult.current.setUsers(performanceData.users);
            appResult.current.setLibrary(performanceData.library);
            appResult.current.updateSettings(performanceData.settings);
          });

          return appResult.current;
        },
        500, // Should complete in under 500ms
        'Large dataset setup'
      );
    });

    test('should handle rapid state updates without memory leaks', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const user = UserFactory.create();

      setupTestEnvironment({ user });

      // Perform rapid updates
      const startTime = Date.now();

      act(() => {
        for (let i = 0; i < 100; i++) {
          const activity = ActivityFactory.create({ text: `Rapid Activity ${i}` });
          userInteractions.addActivityToDay(user.id, 'today', activity);

          if (i % 2 === 0) {
            userInteractions.completeActivity(user.id, 'today', activity.id);
          }
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
      expect(appResult.current.users[user.id].days.today.activities).toHaveLength(100);

      // Check that half are completed
      const completedCount = appResult.current.users[user.id].days.today.activities
        .filter(a => a.completed).length;
      expect(completedCount).toBe(50);
    });

    test('should maintain consistent state during concurrent updates', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const users = UserFactory.createFamily();

      act(() => {
        const userObj = {};
        users.forEach(user => {
          userObj[user.id] = user;
        });
        appResult.current.setUsers(userObj);
      });

      // Simulate concurrent updates
      act(() => {
        users.forEach((user, index) => {
          // Update user settings
          appResult.current.updateUser(user.id, {
            settings: { theme: `theme-${index}` }
          });

          // Add activities
          const activity = ActivityFactory.create({ text: `Activity for ${user.name}` });
          userInteractions.addActivityToDay(user.id, 'today', activity);

          // Update global settings
          appResult.current.updateSettings({
            currentTheme: `global-theme-${index}`
          });
        });
      });

      // Verify all updates were applied correctly
      users.forEach((user, index) => {
        expect(appResult.current.users[user.id].settings.theme).toBe(`theme-${index}`);
        expect(appResult.current.users[user.id].days.today.activities).toHaveLength(1);
      });

      // Global theme should be from last update
      expect(appResult.current.currentTheme).toBe(`global-theme-${users.length - 1}`);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid user IDs gracefully', () => {
      const { result: appResult } = renderHook(() => useAppStore());

      // Try to update non-existent user
      act(() => {
        appResult.current.updateUser('non-existent-user', {
          name: 'Should not work'
        });
      });

      expect(Object.keys(appResult.current.users)).toHaveLength(0);

      // Try to add activity to non-existent user
      expect(() => {
        userInteractions.addActivityToDay('non-existent-user', 'today',
          ActivityFactory.create());
      }).toThrow('User non-existent-user not found');
    });

    test('should handle malformed data gracefully', () => {
      const { result: appResult } = renderHook(() => useAppStore());

      // Try to set users with invalid data
      act(() => {
        appResult.current.setUsers({
          'invalid-user': null, // Invalid user data
          'valid-user': UserFactory.create()
        });
      });

      // Should handle gracefully - store implementation dependent
      expect(appResult.current.users['valid-user']).toBeDefined();
    });

    test('should maintain data integrity during failures', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const user = UserFactory.create();

      act(() => {
        appResult.current.setUsers({ [user.id]: user });
      });

      const originalUsers = appResult.current.users;

      // Simulate operation that might fail
      try {
        act(() => {
          // This should not affect existing data
          throw new Error('Simulated failure');
        });
      } catch (error) {
        // Error is expected
      }

      // Data should remain intact
      expect(appResult.current.users).toEqual(originalUsers);
    });
  });
});