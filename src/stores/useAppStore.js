// @ts-check
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import useUserStore from './useUserStore.js';
import useSettingsStore from './useSettingsStore.js';
import useLibraryStore from './useLibraryStore.js';
import useSyncStore from './useSyncStore.js';

/**
 * Main app store - combines all sub-stores for backwards compatibility
 * This is a thin wrapper that delegates to specialized stores
 */
const useAppStore = create(
  devtools(
    (set, get) => ({
      // Store actual values (not getters) to trigger re-renders
      users: useUserStore.getState().users,
      currentUser: useUserStore.getState().currentUser,
      currentDay: useUserStore.getState().currentDay,
      userContextData: useUserStore.getState().userContextData,

      currentTheme: useSettingsStore.getState().currentTheme,
      bannerPosition: useSettingsStore.getState().bannerPosition,
      soundEnabled: useSettingsStore.getState().soundEnabled,
      taskCelebration: useSettingsStore.getState().taskCelebration,
      routineCelebration: useSettingsStore.getState().routineCelebration,
      displayMode: useSettingsStore.getState().displayMode,
      dayMode: useSettingsStore.getState().dayMode,
      hasCompletedOnboarding:
        useSettingsStore.getState().hasCompletedOnboarding,
      toolbarOrder: useSettingsStore.getState().toolbarOrder,
      moreButtonPosition: useSettingsStore.getState().moreButtonPosition,

      libraryTemplates: useLibraryStore.getState().libraryTemplates,
      library: useLibraryStore.getState().library,

      syncEnabled: useSyncStore.getState().syncEnabled,
      syncStatus: useSyncStore.getState().syncStatus,
      syncId: useSyncStore.getState().syncId,
      lastSync: useSyncStore.getState().lastSync,
      syncError: useSyncStore.getState().syncError,
      
      // Global timestamp for last-write-wins sync
      lastModified: Date.now(),

      // Activities are stored per user/day - synced from UserStore subscription
      activities: (() => {
        const state = useUserStore.getState();
        const user = state.users[state.currentUser];
        if (!user || !user.days || !user.days[state.currentDay]) {
          return [];
        }
        return user.days[state.currentDay].activities || [];
      })(),

      // Re-export all actions from sub-stores
      setUsers: users => useUserStore.getState().setUsers(users),
      setCurrentUser: userId => useUserStore.getState().setCurrentUser(userId),
      setCurrentDay: day => useUserStore.getState().setCurrentDay(day),
      setUserContextData: data =>
        useUserStore.getState().setUserContextData(data),
      addUser: (userId, user) => useUserStore.getState().addUser(userId, user),
      updateUser: (userId, updates) =>
        useUserStore.getState().updateUser(userId, updates),
      deleteUser: userId => useUserStore.getState().deleteUser(userId),
      addUserActivityToLibrary: activity =>
        useUserStore.getState().addUserActivityToLibrary(activity),

      setCurrentTheme: theme =>
        useSettingsStore.getState().setCurrentTheme(theme),
      setBannerPosition: position =>
        useSettingsStore.getState().setBannerPosition(position),
      setSoundEnabled: enabled =>
        useSettingsStore.getState().setSoundEnabled(enabled),
      setTaskCelebration: celebration =>
        useSettingsStore.getState().setTaskCelebration(celebration),
      setRoutineCelebration: celebration =>
        useSettingsStore.getState().setRoutineCelebration(celebration),
      setDisplayMode: mode => useSettingsStore.getState().setDisplayMode(mode),
      setDayMode: mode => useSettingsStore.getState().setDayMode(mode),
      setHasCompletedOnboarding: completed =>
        useSettingsStore.getState().setHasCompletedOnboarding(completed),
      setToolbarOrder: order =>
        useSettingsStore.getState().setToolbarOrder(order),
      setMoreButtonPosition: position =>
        useSettingsStore.getState().setMoreButtonPosition(position),
      updateSettings: settings =>
        useSettingsStore.getState().updateSettings(settings),

      setLibraryTemplates: templates =>
        useLibraryStore.getState().setLibraryTemplates(templates),
      setLibrary: library => useLibraryStore.getState().setLibrary(library),
      updateLibraryCategories: categories =>
        useLibraryStore.getState().updateLibraryCategories(categories),
      addUserActivityId: activityId =>
        useLibraryStore.getState().addUserActivityId(activityId),
      removeUserActivityId: activityId =>
        useLibraryStore.getState().removeUserActivityId(activityId),
      addTemplate: template => useLibraryStore.getState().addTemplate(template),
      updateTemplate: (templateId, updates) =>
        useLibraryStore.getState().updateTemplate(templateId, updates),
      deleteTemplate: templateId =>
        useLibraryStore.getState().deleteTemplate(templateId),

      setSyncEnabled: enabled =>
        useSyncStore.getState().setSyncEnabled(enabled),
      setSyncStatus: status => useSyncStore.getState().setSyncStatus(status),
      setSyncId: id => useSyncStore.getState().setSyncId(id),
      setLastSync: timestamp => useSyncStore.getState().setLastSync(timestamp),
      setSyncError: error => useSyncStore.getState().setSyncError(error),
      updateSyncState: updates =>
        useSyncStore.getState().updateSyncState(updates),
      clearSyncState: () => useSyncStore.getState().clearSyncState(),

      // Activities setter (for compatibility)
      setActivities: activities => {
        const state = useUserStore.getState();
        if (!state.currentUser) return;

        useUserStore.getState().updateUser(state.currentUser, {
          dayToUpdate: state.currentDay,
          days: {
            [state.currentDay]: {
              activities,
            },
          },
        });
      },

      // Update activities for a specific user/day
      updateUserActivities: (userId, day, activities) => {
        useUserStore.getState().updateUser(userId, {
          dayToUpdate: day,
          days: {
            [day]: {
              activities,
            },
          },
        });
      },

      // Configuration for mapping fields to stores
      FIELD_MAPPINGS: {
        // User store fields
        users: 'user',
        currentUser: 'user',
        currentDay: 'user',
        userContextData: 'user',

        // Settings store fields
        currentTheme: 'settings',
        bannerPosition: 'settings',
        soundEnabled: 'settings',
        taskCelebration: 'settings',
        routineCelebration: 'settings',
        displayMode: 'settings',
        dayMode: 'settings',
        hasCompletedOnboarding: 'settings',
        toolbarOrder: 'settings',
        moreButtonPosition: 'settings',

        // Library store fields
        libraryTemplates: 'library',
        library: 'library',

        // Sync store fields
        syncEnabled: 'sync',
        syncStatus: 'sync',
        syncId: 'sync',
        lastSync: 'sync',
        syncError: 'sync',
      },

      // Special handlers for fields that need custom logic
      SPECIAL_HANDLERS: {
        activities: (value) => {
          const userState = useUserStore.getState();
          if (userState.currentUser) {
            useUserStore.getState().updateUser(userState.currentUser, {
              dayToUpdate: userState.currentDay,
              days: {
                [userState.currentDay]: {
                  activities: value,
                },
              },
            });
          }
        },
      },

      // Batch state updates (used by sync) - configuration-driven approach
      setState: updates => {
        // Get field mappings and special handlers from the store instance
        const FIELD_MAPPINGS = get().FIELD_MAPPINGS;
        const SPECIAL_HANDLERS = get().SPECIAL_HANDLERS;

        // Group updates by target store
        const storeUpdates = {
          user: {},
          settings: {},
          library: {},
          sync: {},
        };

        const unhandledFields = {};

        // Process each update field
        Object.entries(updates).forEach(([field, value]) => {
          // Skip undefined values (maintain original behavior)
          if (value === undefined) {
            return;
          }

          // Check for special handler first
          if (SPECIAL_HANDLERS[field]) {
            SPECIAL_HANDLERS[field](value);
          }
          // Check for field mapping
          else if (FIELD_MAPPINGS[field]) {
            const targetStore = FIELD_MAPPINGS[field];
            storeUpdates[targetStore][field] = value;
          }
          // Track unhandled fields
          else {
            unhandledFields[field] = value;
          }
        });

        // Apply updates to each store
        if (Object.keys(storeUpdates.user).length) {
          useUserStore.setState(storeUpdates.user);
        }
        if (Object.keys(storeUpdates.settings).length) {
          useSettingsStore.setState(storeUpdates.settings);
        }
        if (Object.keys(storeUpdates.library).length) {
          useLibraryStore.setState(storeUpdates.library);
        }
        if (Object.keys(storeUpdates.sync).length) {
          useSyncStore.setState(storeUpdates.sync);
        }

        // Log unhandled properties (development warning)
        if (Object.keys(unhandledFields).length) {
          // Development warning for unhandled fields
        }
      },

      // Get full state (for sync/export)
      getState: () => ({
        // User state
        users: useUserStore.getState().users,
        currentUser: useUserStore.getState().currentUser,
        currentDay: useUserStore.getState().currentDay,
        userContextData: useUserStore.getState().userContextData,

        // Settings state
        currentTheme: useSettingsStore.getState().currentTheme,
        bannerPosition: useSettingsStore.getState().bannerPosition,
        soundEnabled: useSettingsStore.getState().soundEnabled,
        taskCelebration: useSettingsStore.getState().taskCelebration,
        routineCelebration: useSettingsStore.getState().routineCelebration,
        displayMode: useSettingsStore.getState().displayMode,
        dayMode: useSettingsStore.getState().dayMode,
        hasCompletedOnboarding:
          useSettingsStore.getState().hasCompletedOnboarding,
        toolbarOrder: useSettingsStore.getState().toolbarOrder,
        moreButtonPosition: useSettingsStore.getState().moreButtonPosition,

        // Library state
        libraryTemplates: useLibraryStore.getState().libraryTemplates,
        library: useLibraryStore.getState().library,

        // Sync state
        syncEnabled: useSyncStore.getState().syncEnabled,
        syncStatus: useSyncStore.getState().syncStatus,
        syncId: useSyncStore.getState().syncId,
        lastSync: useSyncStore.getState().lastSync,
        syncError: useSyncStore.getState().syncError,

        // Activities (derived from current user/day)
        activities: (() => {
          const state = useUserStore.getState();
          const user = state.users[state.currentUser];
          if (!user || !user.days || !user.days[state.currentDay]) {
            return [];
          }
          return user.days[state.currentDay].activities || [];
        })(),
      }),

      // Subscribe to all stores for changes
      subscribe: callback => {
        const unsubUser = useUserStore.subscribe(callback);
        const unsubSettings = useSettingsStore.subscribe(callback);
        const unsubLibrary = useLibraryStore.subscribe(callback);
        const unsubSync = useSyncStore.subscribe(callback);

        // Return combined unsubscribe function
        return () => {
          unsubUser();
          unsubSettings();
          unsubLibrary();
          unsubSync();
        };
      },
    }),
    {
      name: 'AppStore',
    },
  ),
);

// Subscribe to sub-stores to keep wrapper in sync and update lastModified
useUserStore.subscribe(state => {
  // Derive activities from current state
  const user = state.users[state.currentUser];
  const activities = (user && user.days && user.days[state.currentDay])
    ? user.days[state.currentDay].activities || []
    : [];

  useAppStore.setState({
    users: state.users,
    currentUser: state.currentUser,
    currentDay: state.currentDay,
    userContextData: state.userContextData,
    activities: activities,
    lastModified: Date.now(), // Update timestamp on any change
  });
});

useSettingsStore.subscribe(state => {
  useAppStore.setState({
    currentTheme: state.currentTheme,
    bannerPosition: state.bannerPosition,
    soundEnabled: state.soundEnabled,
    lastModified: Date.now(), // Update timestamp on any change
    taskCelebration: state.taskCelebration,
    routineCelebration: state.routineCelebration,
    displayMode: state.displayMode,
    dayMode: state.dayMode,
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    toolbarOrder: state.toolbarOrder,
    moreButtonPosition: state.moreButtonPosition,
  });
});

useLibraryStore.subscribe(state => {
  useAppStore.setState({
    libraryTemplates: state.libraryTemplates,
    library: state.library,
    lastModified: Date.now(), // Update timestamp on any change
  });
});

// Don't update lastModified for sync store changes (would cause infinite loop)
useSyncStore.subscribe(state => {
  useAppStore.setState({
    syncEnabled: state.syncEnabled,
    syncStatus: state.syncStatus,
    syncId: state.syncId,
    lastSync: state.lastSync,
    syncError: state.syncError,
    // DON'T update lastModified here - sync status changes shouldn't trigger sync
  });
});

export default useAppStore;
