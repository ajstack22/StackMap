/**
 * End-to-End User Journey Integration Tests
 * Tests complete user workflows across multiple components and stores
 */

import { renderHook, act } from '@testing-library/react-hooks';
import {
  resetAllStores,
  setupTestEnvironment,
  userInteractions,
  assertions,
  performance,
  waitFor
} from '../helpers/testHelpers';
import {
  UserFactory,
  ActivityFactory,
  CategoryFactory,
  LibraryFactory,
  SettingsFactory,
  AppStateFactory
} from '../helpers/dataFactories';

// Import all stores for comprehensive testing
import useAppStore from '../../stores/useAppStore';
import useUserStore from '../../stores/useUserStore';
import useLibraryStore from '../../stores/useLibraryStore';
import useSettingsStore from '../../stores/useSettingsStore';
import useSyncStore from '../../stores/useSyncStore';

describe('End-to-End User Journey Tests', () => {
  beforeEach(() => {
    resetAllStores();
  });

  describe('New User Onboarding Journey', () => {
    test('should complete full new user setup workflow', () => {
      const { result: appResult } = renderHook(() => useAppStore());
      const { result: settingsResult } = renderHook(() => useSettingsStore());
      const { result: libraryResult } = renderHook(() => useLibraryStore());

      // 1. Initial state - new user hasn't completed onboarding
      expect(appResult.current.hasCompletedOnboarding).toBe(false);
      expect(Object.keys(appResult.current.users)).toHaveLength(0);

      // 2. Create first user
      const newUser = UserFactory.create({
        name: 'New User',
        settings: { theme: 'stackBlue' }
      });

      act(() => {
        appResult.current.setUsers({ [newUser.id]: newUser });
        appResult.current.setCurrentUser(newUser.id);
      });

      expect(appResult.current.currentUser).toBe(newUser.id);
      expect(appResult.current.users[newUser.id].name).toBe('New User');

      // 3. Set up initial library with default categories
      const defaultLibrary = LibraryFactory.create();
      act(() => {
        libraryResult.current.setLibrary(defaultLibrary);
      });

      expect(appResult.current.library.categories).toHaveLength(3);

      // 4. Complete onboarding
      act(() => {
        settingsResult.current.setHasCompletedOnboarding(true);
      });

      expect(appResult.current.hasCompletedOnboarding).toBe(true);

      // 5. Verify complete setup
      expect(appResult.current.users[newUser.id]).toBeDefined();
      expect(appResult.current.library.categories.length).toBeGreaterThan(0);
      expect(appResult.current.currentTheme).toBe('stackBlue');
      expect(appResult.current.hasCompletedOnboarding).toBe(true);
    });

    test('should handle user creation with custom preferences', () => {
      const { result: appResult } = renderHook(() => useAppStore());

      // Create user with specific preferences
      const customUser = UserFactory.create({
        name: 'Custom User',
        settings: {
          theme: 'stackPurple',
          celebration: 'confetti',
          soundEnabled: false,
          displayMode: 'checkmarks'
        }
      });

      act(() => {
        appResult.current.setUsers({ [customUser.id]: customUser });
        appResult.current.setCurrentUser(customUser.id);
        appResult.current.updateSettings({
          currentTheme: customUser.settings.theme,
          soundEnabled: customUser.settings.soundEnabled
        });
      });

      // Verify custom preferences are applied
      expect(appResult.current.users[customUser.id].settings.theme).toBe('stackPurple');
      expect(appResult.current.users[customUser.id].settings.celebration).toBe('confetti');
      expect(appResult.current.currentTheme).toBe('stackPurple');
      expect(appResult.current.soundEnabled).toBe(false);
    });
  });

  describe('Daily Activity Management Journey', () => {
    test('should complete full daily routine workflow', () => {
      // Set up user and library
      const user = UserFactory.create({ name: 'Daily User' });
      const library = LibraryFactory.create();
      setupTestEnvironment({ user, library });

      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Start with empty day
      expect(appResult.current.users[user.id].days.today.activities).toHaveLength(0);

      // 2. Add morning activities from library
      const morningCategory = library.categories.find(cat => cat.name === 'Morning Routine');
      if (morningCategory) {
        morningCategory.activities.forEach(libraryActivity => {
          const userActivity = {
            ...libraryActivity,
            id: `user-${Date.now()}-${Math.random()}`,
            completed: false,
            timestamp: Date.now()
          };

          act(() => {
            userInteractions.addActivityToDay(user.id, 'today', userActivity);
          });
        });
      }

      const todayActivities = appResult.current.users[user.id].days.today.activities;
      expect(todayActivities.length).toBeGreaterThan(0);

      // 3. Complete activities throughout the day
      const activityIds = todayActivities.map(a => a.id);

      // Complete first activity
      act(() => {
        userInteractions.completeActivity(user.id, 'today', activityIds[0]);
      });

      expect(assertions.activityIsCompleted(user.id, 'today', activityIds[0])).toBe(true);

      // Complete more activities
      activityIds.slice(1, 3).forEach(activityId => {
        act(() => {
          userInteractions.completeActivity(user.id, 'today', activityId);
        });
      });

      // 4. Verify progress
      const completedCount = appResult.current.users[user.id].days.today.activities
        .filter(a => a.completed).length;
      expect(completedCount).toBe(3);

      // 5. Add custom activity
      const customActivity = ActivityFactory.create({
        text: 'Custom Evening Task',
        icon: '🌟'
      });

      act(() => {
        userInteractions.addActivityToDay(user.id, 'today', customActivity);
      });

      const finalActivities = appResult.current.users[user.id].days.today.activities;
      expect(finalActivities.some(a => a.text === 'Custom Evening Task')).toBe(true);
    });

    test('should handle activity editing and reordering', () => {
      const user = UserFactory.createWithActivities('today', 5);
      setupTestEnvironment({ user });

      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Get initial activities
      const initialActivities = appResult.current.users[user.id].days.today.activities;
      expect(initialActivities).toHaveLength(5);

      // 2. Edit activity text and icon
      const activityToEdit = initialActivities[0];
      const editedActivity = {
        ...activityToEdit,
        text: 'Edited Activity Text',
        icon: '✏️'
      };

      act(() => {
        const updatedActivities = initialActivities.map(activity =>
          activity.id === activityToEdit.id ? editedActivity : activity
        );
        appResult.current.updateUserActivities(user.id, 'today', updatedActivities);
      });

      const updatedActivities = appResult.current.users[user.id].days.today.activities;
      const editedResult = updatedActivities.find(a => a.id === activityToEdit.id);
      expect(editedResult.text).toBe('Edited Activity Text');
      expect(editedResult.icon).toBe('✏️');

      // 3. Reorder activities (move first to last)
      act(() => {
        const reorderedActivities = [
          ...updatedActivities.slice(1),
          updatedActivities[0]
        ];
        appResult.current.updateUserActivities(user.id, 'today', reorderedActivities);
      });

      const reorderedResult = appResult.current.users[user.id].days.today.activities;
      expect(reorderedResult[reorderedResult.length - 1].id).toBe(activityToEdit.id);
    });

    test('should handle activity deletion workflow', () => {
      const user = UserFactory.createWithActivities('today', 4);
      setupTestEnvironment({ user });

      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Get initial state
      const initialActivities = appResult.current.users[user.id].days.today.activities;
      expect(initialActivities).toHaveLength(4);

      // 2. Delete middle activity
      const activityToDelete = initialActivities[1];

      act(() => {
        const updatedActivities = initialActivities.filter(
          activity => activity.id !== activityToDelete.id
        );
        appResult.current.updateUserActivities(user.id, 'today', updatedActivities);
      });

      // 3. Verify deletion
      const finalActivities = appResult.current.users[user.id].days.today.activities;
      expect(finalActivities).toHaveLength(3);
      expect(finalActivities.find(a => a.id === activityToDelete.id)).toBeUndefined();
    });
  });

  describe('Multi-User Family Workflow', () => {
    test('should manage activities for multiple family members', () => {
      const familyData = AppStateFactory.createFamily();

      // Set up the family users properly
      useUserStore.getState().setUsers(familyData.users);
      useUserStore.getState().setCurrentUser(familyData.currentUser);
      useLibraryStore.getState().setLibrary(familyData.library);
      useSettingsStore.getState().updateSettings(familyData.settings);

      const { result: appResult } = renderHook(() => useAppStore());
      const userIds = Object.keys(familyData.users);

      // 1. Verify family setup
      expect(userIds).toHaveLength(3);
      expect(appResult.current.currentUser).toBe(familyData.currentUser);

      // 2. Add different activities to each family member
      userIds.forEach((userId, index) => {
        const activities = [
          ActivityFactory.create({ text: `${familyData.users[userId].name}'s Morning Task` }),
          ActivityFactory.create({ text: `${familyData.users[userId].name}'s Evening Task` })
        ];

        activities.forEach(activity => {
          act(() => {
            userInteractions.addActivityToDay(userId, 'today', activity);
          });
        });
      });

      // 3. Verify each user has their own activities
      userIds.forEach(userId => {
        const userActivities = appResult.current.users[userId].days.today.activities;
        expect(userActivities.length).toBeGreaterThan(0);

        // Each user should have activities with their name
        const hasPersonalActivity = userActivities.some(activity =>
          activity.text.includes(familyData.users[userId].name)
        );
        expect(hasPersonalActivity).toBe(true);
      });

      // 4. Switch between users
      act(() => {
        appResult.current.setCurrentUser(userIds[1]);
      });

      expect(appResult.current.currentUser).toBe(userIds[1]);

      // 5. Complete activities for current user
      const currentUserActivities = appResult.current.users[userIds[1]].days.today.activities;
      if (currentUserActivities.length > 0) {
        act(() => {
          userInteractions.completeActivity(userIds[1], 'today', currentUserActivities[0].id);
        });

        expect(assertions.activityIsCompleted(userIds[1], 'today', currentUserActivities[0].id)).toBe(true);
      }

      // 6. Verify other users' activities are unchanged
      const otherUserId = userIds[0];
      const otherUserActivities = appResult.current.users[otherUserId].days.today.activities;
      if (otherUserActivities.length > 0) {
        expect(assertions.activityIsCompleted(otherUserId, 'today', otherUserActivities[0].id)).toBe(false);
      }
    });

    test('should handle family theme preferences', () => {
      const familyData = AppStateFactory.createFamily();

      // Set up the family users properly
      useUserStore.getState().setUsers(familyData.users);
      useUserStore.getState().setCurrentUser(familyData.currentUser);
      useLibraryStore.getState().setLibrary(familyData.library);
      useSettingsStore.getState().updateSettings(familyData.settings);

      const { result: appResult } = renderHook(() => useAppStore());
      const userIds = Object.keys(familyData.users);

      // 1. Set different themes for each user
      const themes = ['stackBlue', 'stackGreen', 'stackPink'];

      userIds.forEach((userId, index) => {
        act(() => {
          appResult.current.updateUser(userId, {
            settings: { theme: themes[index] }
          });
        });
      });

      // 2. Verify user-specific themes
      userIds.forEach((userId, index) => {
        expect(appResult.current.users[userId].settings.theme).toBe(themes[index]);
      });

      // 3. Change global theme
      act(() => {
        appResult.current.updateSettings({ currentTheme: 'stackRed' });
      });

      expect(appResult.current.currentTheme).toBe('stackRed');

      // 4. User-specific themes should remain unchanged
      userIds.forEach((userId, index) => {
        expect(appResult.current.users[userId].settings.theme).toBe(themes[index]);
      });
    });
  });

  describe('Library Management Workflow', () => {
    test('should create custom library categories and activities', () => {
      const user = UserFactory.create();
      const emptyLibrary = LibraryFactory.createEmpty();
      setupTestEnvironment({ user, library: emptyLibrary });

      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Start with empty library
      expect(appResult.current.library.categories).toHaveLength(0);

      // 2. Create custom category
      const customCategory = CategoryFactory.create({
        name: 'My Custom Routine',
        icon: '⭐',
        activities: []
      });

      act(() => {
        appResult.current.setLibrary({
          categories: [customCategory],
          userActivityIds: []
        });
      });

      expect(appResult.current.library.categories).toHaveLength(1);
      expect(appResult.current.library.categories[0].name).toBe('My Custom Routine');

      // 3. Add activities to custom category
      const customActivities = [
        ActivityFactory.create({ text: 'Custom Activity 1', icon: '1️⃣' }),
        ActivityFactory.create({ text: 'Custom Activity 2', icon: '2️⃣' }),
        ActivityFactory.create({ text: 'Custom Activity 3', icon: '3️⃣' })
      ];

      const updatedCategory = {
        ...customCategory,
        activities: customActivities
      };

      act(() => {
        appResult.current.setLibrary({
          categories: [updatedCategory],
          userActivityIds: []
        });
      });

      expect(appResult.current.library.categories[0].activities).toHaveLength(3);

      // 4. Use library activities in user's day
      customActivities.forEach(libraryActivity => {
        const userActivity = {
          ...libraryActivity,
          id: `user-${Date.now()}-${Math.random()}`,
          completed: false,
          timestamp: Date.now()
        };

        act(() => {
          userInteractions.addActivityToDay(user.id, 'today', userActivity);
        });
      });

      const userActivities = appResult.current.users[user.id].days.today.activities;
      expect(userActivities).toHaveLength(3);
      expect(userActivities[0].text).toBe('Custom Activity 1');
    });

    test('should manage library across multiple categories', () => {
      const user = UserFactory.create();
      setupTestEnvironment({ user });

      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Create multiple categories
      const categories = [
        CategoryFactory.createMorningRoutine(),
        CategoryFactory.createEveningRoutine(),
        CategoryFactory.create({ name: 'Work Tasks', icon: '💼' }),
        CategoryFactory.create({ name: 'Exercise', icon: '🏃‍♂️' })
      ];

      act(() => {
        appResult.current.setLibrary({
          categories,
          userActivityIds: []
        });
      });

      expect(appResult.current.library.categories).toHaveLength(4);

      // 2. Add activities from different categories to user's day
      categories.forEach(category => {
        const activityFromCategory = category.activities[0];
        if (activityFromCategory) {
          const userActivity = {
            ...activityFromCategory,
            id: `user-${category.id}-${Date.now()}`,
            completed: false,
            timestamp: Date.now()
          };

          act(() => {
            userInteractions.addActivityToDay(user.id, 'today', userActivity);
          });
        }
      });

      const userActivities = appResult.current.users[user.id].days.today.activities;
      expect(userActivities.length).toBeGreaterThan(0);

      // 3. Verify activities from different categories are mixed
      const categoryNames = categories.map(c => c.name);
      const hasActivitiesFromMultipleCategories = userActivities.length >= categories.length;
      expect(hasActivitiesFromMultipleCategories).toBe(true);
    });
  });

  describe('Performance and Stress Test Workflows', () => {
    test('should handle high-volume activity management efficiently', async () => {
      const performanceData = AppStateFactory.createForPerformanceTesting();

      await performance.assertPerformance(
        () => {
          // Set up performance test data properly
          useUserStore.getState().setUsers(performanceData.users);
          useUserStore.getState().setCurrentUser(performanceData.currentUser);
          useLibraryStore.getState().setLibrary(performanceData.library);
          useSettingsStore.getState().updateSettings(performanceData.settings);

          const { result } = renderHook(() => useAppStore());

          // Add many activities to multiple users
          const userIds = Object.keys(performanceData.users);
          userIds.forEach(userId => {
            for (let i = 0; i < 50; i++) {
              const activity = ActivityFactory.create({ text: `Bulk Activity ${i}` });
              userInteractions.addActivityToDay(userId, 'today', activity);
            }
          });

          return result.current;
        },
        2000, // Should complete in under 2 seconds
        'High-volume activity management'
      );
    });

    test('should maintain performance with frequent state updates', async () => {
      const user = UserFactory.create();
      setupTestEnvironment({ user });

      const { result: appResult } = renderHook(() => useAppStore());

      await performance.assertPerformance(
        () => {
          // Simulate rapid user interactions
          for (let i = 0; i < 100; i++) {
            const activity = ActivityFactory.create({ text: `Rapid Activity ${i}` });

            act(() => {
              userInteractions.addActivityToDay(user.id, 'today', activity);

              if (i % 2 === 0) {
                userInteractions.completeActivity(user.id, 'today', activity.id);
              }
            });
          }

          return appResult.current;
        },
        1000, // Should handle rapid updates in under 1 second
        'Rapid state updates'
      );
    });
  });

  describe('Error Recovery Workflows', () => {
    test('should recover gracefully from data corruption', () => {
      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Set up valid initial state
      const user = UserFactory.create();
      const library = LibraryFactory.create();

      act(() => {
        appResult.current.setUsers({ [user.id]: user });
        appResult.current.setLibrary(library);
        appResult.current.setCurrentUser(user.id);
      });

      expect(appResult.current.users[user.id]).toBeDefined();

      // 2. Simulate corruption scenarios
      try {
        act(() => {
          // Try to set invalid user data
          appResult.current.setUsers({ 'invalid': null });
        });
      } catch (error) {
        // Should handle gracefully
      }

      // 3. Verify app still functions
      const newUser = UserFactory.create({ name: 'Recovery User' });
      act(() => {
        appResult.current.setUsers({ [newUser.id]: newUser });
        appResult.current.setCurrentUser(newUser.id);
      });

      expect(appResult.current.currentUser).toBe(newUser.id);
    });

    test.skip('should handle network connectivity issues during sync', () => {
      const { result: syncResult } = renderHook(() => useSyncStore());
      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Enable sync
      act(() => {
        syncResult.current.updateSyncState({
          syncEnabled: true,
          syncId: 'test-sync-id'
        });
      });

      expect(appResult.current.syncEnabled).toBe(true);

      // 2. Simulate network connectivity loss
      act(() => {
        syncResult.current.setSyncStatus({
          isConnected: false,
          syncError: 'Network unavailable'
        });
      });

      expect(appResult.current.isConnected).toBe(false);
      expect(appResult.current.syncError).toBe('Network unavailable');

      // 3. App should continue functioning offline
      const user = UserFactory.create();
      act(() => {
        appResult.current.setUsers({ [user.id]: user });
      });

      expect(appResult.current.users[user.id]).toBeDefined();

      // 4. Simulate network recovery
      act(() => {
        syncResult.current.setSyncStatus({
          isConnected: true,
          syncError: null
        });
      });

      expect(appResult.current.isConnected).toBe(true);
      expect(appResult.current.syncError).toBe(null);
    });
  });

  describe('Complex Multi-Day Workflows', () => {
    test('should manage activities across multiple days', () => {
      const user = UserFactory.create();
      setupTestEnvironment({ user });

      const { result: appResult } = renderHook(() => useAppStore());

      // 1. Add activities to today
      const todayActivities = ActivityFactory.createMultiple(3, { text: 'Today Task' });
      todayActivities.forEach(activity => {
        act(() => {
          userInteractions.addActivityToDay(user.id, 'today', activity);
        });
      });

      // 2. Add activities to tomorrow
      const tomorrowActivities = ActivityFactory.createMultiple(3, { text: 'Tomorrow Task' });
      tomorrowActivities.forEach(activity => {
        act(() => {
          userInteractions.addActivityToDay(user.id, 'tomorrow', activity);
        });
      });

      // 3. Verify separate day tracking
      const todayCount = appResult.current.users[user.id].days.today.activities.length;
      const tomorrowCount = appResult.current.users[user.id].days.tomorrow.activities.length;

      expect(todayCount).toBe(3);
      expect(tomorrowCount).toBe(3);

      // 4. Complete some activities on each day
      const todayActivityId = appResult.current.users[user.id].days.today.activities[0].id;
      const tomorrowActivityId = appResult.current.users[user.id].days.tomorrow.activities[0].id;

      act(() => {
        userInteractions.completeActivity(user.id, 'today', todayActivityId);
        userInteractions.completeActivity(user.id, 'tomorrow', tomorrowActivityId);
      });

      expect(assertions.activityIsCompleted(user.id, 'today', todayActivityId)).toBe(true);
      expect(assertions.activityIsCompleted(user.id, 'tomorrow', tomorrowActivityId)).toBe(true);
    });
  });
});