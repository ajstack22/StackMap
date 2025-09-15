/**
 * Integration Test Helpers for StackMap
 * Provides utilities for setting up test environments and mock data
 */

import { renderHook, act } from '@testing-library/react-hooks';
import useUserStore from '../../stores/useUserStore';
import useLibraryStore from '../../stores/useLibraryStore';
import useSettingsStore from '../../stores/useSettingsStore';
import useSyncStore from '../../stores/useSyncStore';

/**
 * Reset all stores to their initial state
 * Call this in beforeEach for clean test isolation
 */
export const resetAllStores = () => {
  // Reset user store
  useUserStore.setState({
    users: {},
    currentUser: null,
    currentDay: 'today'
  });

  // Reset library store
  useLibraryStore.setState({
    library: {
      categories: [],
      userActivityIds: []
    }
  });

  // Reset settings store
  useSettingsStore.setState({
    currentTheme: 'stackBlue',
    soundEnabled: true,
    hasCompletedOnboarding: false,
    taskCelebration: 'rainbow',
    routineCelebration: 'rainbow',
    displayMode: 'numbers',
    bannerPosition: 'top',
    dayMode: 'today',
    syncSkipped: false,
    toolbarOrder: null,
    moreButtonPosition: 'left'
  });

  // Reset sync store
  useSyncStore.setState({
    syncEnabled: false,
    syncId: null,
    lastSyncTime: null,
    isConnected: true,
    isSyncing: false,
    syncError: null,
    autoSyncEnabled: false
  });
};

/**
 * Wait for async operations to complete
 * @param {number} ms - milliseconds to wait
 */
export const waitFor = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Create a mock user with all required fields
 * @param {object} overrides - properties to override
 */
export const createMockUser = (overrides = {}) => {
  const defaultUser = {
    id: 'test-user-1',
    name: 'Test User',
    icon: '👤',
    settings: {
      theme: 'stackBlue',
      celebration: 'rainbow',
      soundEnabled: true,
      displayMode: 'numbers'
    },
    days: {
      today: { activities: [] },
      tomorrow: { activities: [] }
    }
  };

  return {
    ...defaultUser,
    ...overrides,
    settings: {
      ...defaultUser.settings,
      ...overrides.settings
    },
    days: {
      ...defaultUser.days,
      ...overrides.days
    }
  };
};

/**
 * Create a mock activity with all required fields
 * @param {object} overrides - properties to override
 */
export const createMockActivity = (overrides = {}) => {
  return {
    id: `activity-${Date.now()}-${Math.random()}`,
    text: 'Test Activity',
    icon: '🎯',
    completed: false,
    timestamp: Date.now(),
    ...overrides
  };
};

/**
 * Create a mock library category with activities
 * @param {object} overrides - properties to override
 */
export const createMockCategory = (overrides = {}) => {
  return {
    id: `category-${Date.now()}`,
    name: 'Test Category',
    icon: '📁',
    activities: [
      createMockActivity({ text: 'Activity 1' }),
      createMockActivity({ text: 'Activity 2' })
    ],
    ...overrides
  };
};

/**
 * Create a complete mock library structure
 * @param {object} overrides - properties to override
 */
export const createMockLibrary = (overrides = {}) => {
  return {
    categories: [
      createMockCategory({ name: 'Morning', icon: '☀️' }),
      createMockCategory({ name: 'Evening', icon: '🌙' })
    ],
    userActivityIds: ['user-activity-1', 'user-activity-2'],
    ...overrides
  };
};

/**
 * Set up a complete test environment with user, library, and settings
 * @param {object} config - configuration options
 */
export const setupTestEnvironment = (config = {}) => {
  const {
    user = createMockUser(),
    users = null,
    library = createMockLibrary(),
    settings = {},
    sync = {}
  } = config;

  // Set up users (single user or multiple users)
  if (users) {
    // Multiple users case (for family/multi-user scenarios)
    const userStore = useUserStore.getState();
    userStore.setUsers(users);
    const firstUserId = Object.keys(users)[0];
    if (firstUserId) {
      userStore.setCurrentUser(firstUserId);
    }
  } else if (user) {
    // Single user case
    const userStore = useUserStore.getState();
    userStore.setUsers({ [user.id]: user });
    userStore.setCurrentUser(user.id);
  }

  // Set up library
  if (library) {
    useLibraryStore.getState().setLibrary(library);
  }

  // Set up settings
  if (Object.keys(settings).length > 0) {
    useSettingsStore.getState().updateSettings(settings);
  }

  // Set up sync
  if (Object.keys(sync).length > 0) {
    useSyncStore.getState().updateSyncState(sync);
  }

  return { user: users ? Object.values(users)[0] : user, users, library, settings, sync };
};

/**
 * Simulate user interactions for testing workflows
 */
export const userInteractions = {
  /**
   * Add an activity to a user's day
   */
  addActivityToDay: (userId, day, activity) => {
    const userStore = useUserStore.getState();
    const user = userStore.users[userId];
    if (!user) throw new Error(`User ${userId} not found`);

    const updatedActivities = [
      ...(user.days?.[day]?.activities || []),
      activity
    ];

    userStore.updateUser(userId, {
      days: {
        [day]: { activities: updatedActivities }
      }
    });
  },

  /**
   * Complete an activity for a user
   */
  completeActivity: (userId, day, activityId) => {
    const userStore = useUserStore.getState();
    const user = userStore.users[userId];
    if (!user) throw new Error(`User ${userId} not found`);

    const activities = user.days?.[day]?.activities || [];
    const updatedActivities = activities.map(activity =>
      activity.id === activityId
        ? { ...activity, completed: true, timestamp: Date.now() }
        : activity
    );

    userStore.updateUser(userId, {
      days: {
        [day]: { activities: updatedActivities }
      }
    });
  },

  /**
   * Change user theme
   */
  changeTheme: (themeName) => {
    useSettingsStore.getState().updateSettings({ currentTheme: themeName });
  },

  /**
   * Enable sync for user
   */
  enableSync: (syncId = 'test-sync-id') => {
    useSyncStore.getState().updateSyncState({
      syncEnabled: true,
      syncId
    });
  }
};

/**
 * Assertion helpers for common test patterns
 */
export const assertions = {
  /**
   * Assert user has activity
   */
  userHasActivity: (userId, day, activityText) => {
    const user = useUserStore.getState().users[userId];
    const activities = user?.days?.[day]?.activities || [];
    return activities.some(activity => activity.text === activityText);
  },

  /**
   * Assert activity is completed
   */
  activityIsCompleted: (userId, day, activityId) => {
    const user = useUserStore.getState().users[userId];
    const activities = user?.days?.[day]?.activities || [];
    const activity = activities.find(a => a.id === activityId);
    return activity?.completed === true;
  },

  /**
   * Assert library has category
   */
  libraryHasCategory: (categoryName) => {
    const library = useLibraryStore.getState().library;
    return library.categories.some(category => category.name === categoryName);
  },

  /**
   * Assert sync is enabled
   */
  syncIsEnabled: () => {
    return useSyncStore.getState().syncEnabled === true;
  }
};

/**
 * Performance measurement utilities
 */
export const performance = {
  /**
   * Measure execution time of a function
   */
  measureTime: async (fn, description) => {
    const start = Date.now();
    const result = await fn();
    const end = Date.now();
    const duration = end - start;


    return { result, duration };
  },

  /**
   * Assert operation completes within time limit
   */
  assertPerformance: async (fn, maxMs, description) => {
    const { duration } = await performance.measureTime(fn, description);
    expect(duration).toBeLessThan(maxMs);
  }
};

export default {
  resetAllStores,
  waitFor,
  createMockUser,
  createMockActivity,
  createMockCategory,
  createMockLibrary,
  setupTestEnvironment,
  userInteractions,
  assertions,
  performance
};