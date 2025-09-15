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

      // Activities are stored per user/day - provide a getter
      get activities() {
        const state = useUserStore.getState();
        const user = state.users[state.currentUser];
        if (!user || !user.days || !user.days[state.currentDay]) {
          return [];
        }
        return user.days[state.currentDay].activities || [];
      },

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

      // Batch state updates (used by sync)
      setState: updates => {
        // Split updates into appropriate stores
        const {
          users,
          currentUser,
          currentDay,
          userContextData,
          currentTheme,
          bannerPosition,
          soundEnabled,
          taskCelebration,
          routineCelebration,
          displayMode,
          dayMode,
          hasCompletedOnboarding,
          toolbarOrder,
          moreButtonPosition,
          libraryTemplates,
          library,
          syncEnabled,
          syncStatus,
          syncId,
          lastSync,
          syncError,
          activities,
          ...rest
        } = updates;

        // Update user store
        if (users !== undefined) useUserStore.setState({ users });
        if (currentUser !== undefined) useUserStore.setState({ currentUser });
        if (currentDay !== undefined) useUserStore.setState({ currentDay });
        if (userContextData !== undefined)
          useUserStore.setState({ userContextData });

        // Update settings store
        const settingsUpdates = {};
        if (currentTheme !== undefined)
          settingsUpdates.currentTheme = currentTheme;
        if (bannerPosition !== undefined)
          settingsUpdates.bannerPosition = bannerPosition;
        if (soundEnabled !== undefined)
          settingsUpdates.soundEnabled = soundEnabled;
        if (taskCelebration !== undefined)
          settingsUpdates.taskCelebration = taskCelebration;
        if (routineCelebration !== undefined)
          settingsUpdates.routineCelebration = routineCelebration;
        if (displayMode !== undefined)
          settingsUpdates.displayMode = displayMode;
        if (dayMode !== undefined) settingsUpdates.dayMode = dayMode;
        if (hasCompletedOnboarding !== undefined)
          settingsUpdates.hasCompletedOnboarding = hasCompletedOnboarding;
        if (toolbarOrder !== undefined)
          settingsUpdates.toolbarOrder = toolbarOrder;
        if (moreButtonPosition !== undefined)
          settingsUpdates.moreButtonPosition = moreButtonPosition;
        if (Object.keys(settingsUpdates).length > 0) {
          useSettingsStore.setState(settingsUpdates);
        }

        // Update library store
        if (libraryTemplates !== undefined)
          useLibraryStore.setState({ libraryTemplates });
        if (library !== undefined) useLibraryStore.setState({ library });

        // Update sync store
        const syncUpdates = {};
        if (syncEnabled !== undefined) syncUpdates.syncEnabled = syncEnabled;
        if (syncStatus !== undefined) syncUpdates.syncStatus = syncStatus;
        if (syncId !== undefined) syncUpdates.syncId = syncId;
        if (lastSync !== undefined) syncUpdates.lastSync = lastSync;
        if (syncError !== undefined) syncUpdates.syncError = syncError;
        if (Object.keys(syncUpdates).length > 0) {
          useSyncStore.setState(syncUpdates);
        }

        // Handle activities update
        if (activities !== undefined) {
          const userState = useUserStore.getState();
          if (userState.currentUser) {
            useUserStore.getState().updateUser(userState.currentUser, {
              dayToUpdate: userState.currentDay,
              days: {
                [userState.currentDay]: {
                  activities,
                },
              },
            });
          }
        }

        // Log unhandled properties
        if (Object.keys(rest).length > 0) {
//           
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
  useAppStore.setState({
    users: state.users,
    currentUser: state.currentUser,
    currentDay: state.currentDay,
    userContextData: state.userContextData,
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
