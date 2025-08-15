// @ts-check
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import merge from 'lodash/merge';

// Debounce timer for storage writes
let storageWriteTimer = null;
let pendingWrite = null;

// Storage adapter for React Native AsyncStorage with debounced writes
const storage = {
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);
      if (!value) return null;
      
      // Try to parse JSON, but handle cases where value might not be valid JSON
      try {
        return JSON.parse(value);
      } catch (parseError) {
        console.error('Error parsing stored value, clearing corrupted data:', parseError);
        // Clear corrupted data
        await AsyncStorage.removeItem(name);
        return null;
      }
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (name, value) => {
    // Store the pending write
    pendingWrite = { name, value };
    
    // Clear any existing timer
    if (storageWriteTimer) {
      clearTimeout(storageWriteTimer);
    }
    
    // Debounce the write operation by 1 second
    // This prevents blocking during rapid state updates (like sync)
    storageWriteTimer = setTimeout(async () => {
      if (pendingWrite) {
        try {
          const startTime = Date.now();
          await AsyncStorage.setItem(pendingWrite.name, JSON.stringify(pendingWrite.value));
          const duration = Date.now() - startTime;
          if (duration > 100) {
            console.log(`[STORAGE] AsyncStorage write took ${duration}ms`);
          }
        } catch (error) {
          console.error('Error writing to AsyncStorage:', error);
        }
        pendingWrite = null;
      }
    }, 1000); // 1 second debounce
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  },
};


// Create the store with devtools and persistence
const useAppStore = create(
  devtools(
    persist(
    (set, get) => ({
      // Theme & Display Settings
      currentTheme: 'stackBlue',
      bannerPosition: 'top',
      soundEnabled: true,
      taskCelebration: 'rainbow',
      routineCelebration: 'rainbow',
      
      // Device-specific toolbar settings (not synced)
      toolbarOrder: null,
      moreButtonPosition: 'left',
      
      // Actions for Theme & Settings
      setCurrentTheme: (theme) => set({ currentTheme: theme }, false, 'setCurrentTheme'),
      
      setBannerPosition: (position) => set({ bannerPosition: position }, false, 'setBannerPosition'),
      
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }, false, 'setSoundEnabled'),
      
      setTaskCelebration: (celebration) => set({ taskCelebration: celebration }, false, 'setTaskCelebration'),
      
      setRoutineCelebration: (celebration) => set({ routineCelebration: celebration }, false, 'setRoutineCelebration'),
      
      // Toolbar settings (device-specific)
      setToolbarOrder: (order) => set({ toolbarOrder: order }, false, 'setToolbarOrder'),
      
      setMoreButtonPosition: (position) => set({ moreButtonPosition: position }, false, 'setMoreButtonPosition'),
      
      // Batch update for settings
      updateSettings: (settings) => set((state) => ({
        ...state,
        ...settings
      }), false, 'updateSettings'),
      
      // User Management
      users: {},
      currentUser: null,
      
      // User Actions
      setUsers: (users) => set({ users }, false, 'setUsers'),
      
      setCurrentUser: (userId) => set({ currentUser: userId }, false, 'setCurrentUser'),
      
      addUser: (userId, user) => set((state) => {
        // Validate user data
        const sanitizedUser = { ...user };
        
        // Fix user name if it's not a string
        if (!sanitizedUser.name || typeof sanitizedUser.name !== 'string') {
          console.warn('Invalid user name in addUser:', sanitizedUser.name);
          // If it's an object, try to extract a name from it
          if (typeof sanitizedUser.name === 'object' && sanitizedUser.name !== null) {
            sanitizedUser.name = sanitizedUser.name.name || sanitizedUser.name.text || sanitizedUser.name.value || 'User';
          } else if (!sanitizedUser.name) {
            sanitizedUser.name = 'User';
          } else {
            // Only use String() for primitive types, not objects
            sanitizedUser.name = 'User';
          }
        }
        
        // Normalize icon field - always use 'icon', not 'emoji'
        // IMPORTANT: Do NOT use .trim() on emoji strings as it can damage complex Unicode sequences
        if (!sanitizedUser.icon || typeof sanitizedUser.icon !== 'string' || sanitizedUser.icon.length === 0) {
          if (sanitizedUser.emoji && typeof sanitizedUser.emoji === 'string') {
            console.log('addUser: Migrating emoji to icon field for user');
            sanitizedUser.icon = sanitizedUser.emoji;
          } else {
            console.warn('Invalid user icon in addUser:', sanitizedUser.icon);
            sanitizedUser.icon = '👤'; // Default user icon
          }
        }
        
        // Remove redundant emoji field to prevent confusion
        if (sanitizedUser.emoji) {
          delete sanitizedUser.emoji;
        }
        // This preserves complex emojis like 🦍, ⛑️ that have multiple code points
        
        return {
          users: {
            ...state.users,
            [userId]: sanitizedUser
          }
        };
      }, false, 'addUser'),
      
      updateUser: (userId, updates) => set((state) => {
        // Special handling for arrays in settings to ensure they're replaced, not merged
        const currentUser = state.users[userId];
        if (!currentUser) return state;
        
        // Validate and sanitize updates
        const sanitizedUpdates = { ...updates };
        
        // Fix user name if provided and not a string
        if ('name' in sanitizedUpdates) {
          if (!sanitizedUpdates.name || typeof sanitizedUpdates.name !== 'string') {
            console.warn('Invalid user name in updateUser:', sanitizedUpdates.name);
            // If it's an object, try to extract a name from it
            if (typeof sanitizedUpdates.name === 'object' && sanitizedUpdates.name !== null) {
              sanitizedUpdates.name = sanitizedUpdates.name.name || sanitizedUpdates.name.text || sanitizedUpdates.name.value || currentUser.name || 'User';
            } else {
              sanitizedUpdates.name = currentUser.name || 'User';
            }
          }
        }
        
        // Normalize icon field when updating
        // IMPORTANT: Do NOT use .trim() on emoji strings as it can damage complex Unicode sequences
        if ('icon' in sanitizedUpdates) {
          if (typeof sanitizedUpdates.icon !== 'string' || !sanitizedUpdates.icon || sanitizedUpdates.icon.length === 0) {
            console.warn('Invalid user icon in updateUser:', sanitizedUpdates.icon);
            sanitizedUpdates.icon = currentUser.icon || '👤';
          }
          // Keep the icon as-is if it's a valid non-empty string
          // This preserves complex emojis like 🦍, ⛑️ that have multiple code points
        }
        
        // Handle emoji field migration
        if ('emoji' in sanitizedUpdates) {
          if (!sanitizedUpdates.icon && sanitizedUpdates.emoji) {
            console.log('updateUser: Migrating emoji to icon field');
            sanitizedUpdates.icon = sanitizedUpdates.emoji;
          }
          // Always remove emoji field to prevent confusion
          delete sanitizedUpdates.emoji;
        }
        
        let updatedUser = merge({}, currentUser, sanitizedUpdates);
        
        // If updating settings with arrays, replace them instead of merging
        if (updates.settings) {
          updatedUser.settings = {
            ...updatedUser.settings,
            ...updates.settings
          };
        }
        
        // Final validation of the complete user object
        if (!updatedUser.name || typeof updatedUser.name !== 'string') {
          console.error('User name became non-string after merge:', updatedUser.name);
          if (typeof updatedUser.name === 'object' && updatedUser.name !== null) {
            updatedUser.name = updatedUser.name.name || updatedUser.name.text || currentUser.name || 'User';
          } else {
            updatedUser.name = currentUser.name || 'User';
          }
        }
        if (typeof updatedUser.icon !== 'string' || updatedUser.icon.trim() === '') {
          console.error('User icon became invalid after merge:', updatedUser.icon);
          updatedUser.icon = updatedUser.emoji || currentUser.icon || '👤';
        }
        
        return {
          users: {
            ...state.users,
            [userId]: updatedUser
          }
        };
      }, false, 'updateUser'),
      
      deleteUser: (userId) => set((state) => {
        const newUsers = { ...state.users };
        // Instead of deleting, mark as deleted with timestamp
        // This allows sync to properly handle deletions
        if (newUsers[userId]) {
          newUsers[userId] = {
            ...newUsers[userId],
            deleted: true,
            deletedAt: Date.now()
          };
        }
        return { users: newUsers };
      }, false, 'deleteUser'),
      
      // Library data
      libraryTemplates: [],
      library: {
        categories: null,
        userAddedActivityIds: []
      },
      
      // Days and display
      currentDay: 'today',
      displayMode: 'numbers',
      dayMode: 'today',
      
      userContextData: {},
      hasCompletedOnboarding: false,
      
      // Library Actions
      setLibraryTemplates: (templates) => set({ 
        libraryTemplates: templates
      }, false, 'setLibraryTemplates'),
      
      setCurrentDay: (day) => set({ currentDay: day }, false, 'setCurrentDay'),
      
      setDisplayMode: (mode) => set({ displayMode: mode }, false, 'setDisplayMode'),
      
      setDayMode: (mode) => set({ dayMode: mode }, false, 'setDayMode'),
      
      // NEW: Library actions
      setLibrary: (library) => set({ library }, false, 'setLibrary'),
      
      setLibraryCategories: (categories) => set((state) => ({
        library: {
          ...state.library,
          categories
        }
      }), false, 'setLibraryCategories'),
      
      addUserActivityToLibrary: (activityId) => set((state) => ({
        library: {
          ...state.library,
          userAddedActivityIds: [...(state.library.userAddedActivityIds || []), activityId]
        }
      }), false, 'addUserActivityToLibrary'),
      
      setUserContextData: (data) => set({ userContextData: data }, false, 'setUserContextData'),
      
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }, false, 'setHasCompletedOnboarding'),
      
      addActivity: (activity) => set((state) => ({
        activities: [...state.activities, activity],
        libraryTemplates: [...state.libraryTemplates, activity] // Keep both in sync
      }), false, 'addActivity'),
      
      updateActivity: (activityId, updates) => set((state) => {
        const updatedActivities = state.activities.map(activity => 
          activity.id === activityId ? { ...activity, ...updates } : activity
        );
        return {
          activities: updatedActivities,
          libraryTemplates: updatedActivities // Keep both in sync
        };
      }, false, 'updateActivity'),
      
      deleteActivity: (activityId) => set((state) => {
        const filteredActivities = state.activities.filter(activity => activity.id !== activityId);
        return {
          activities: filteredActivities,
          libraryTemplates: filteredActivities // Keep both in sync
        };
      }, false, 'deleteActivity'),
      
      reorderActivities: (newOrder) => set({ 
        activities: newOrder,
        libraryTemplates: newOrder // Keep both in sync
      }, false, 'reorderActivities'),
      
      // Helper function for updating user activities with proper null checking
      updateUserActivities: (userId, day, activities) => set((state) => {
        if (!state.users[userId]) return state;
        
        return {
          users: {
            ...state.users,
            [userId]: {
              ...state.users[userId],
              days: {
                ...state.users[userId].days || {},
                [day]: { 
                  ...state.users[userId].days?.[day] || {},
                  activities 
                }
              }
            }
          }
        };
      }, false, 'updateUserActivities'),
    }),
    {
      name: 'stackmap-storage', // unique name for storage
      storage, // use our AsyncStorage adapter
      partialize: (state) => ({
        // Only persist specific parts of the state
        currentTheme: state.currentTheme,
        bannerPosition: state.bannerPosition,
        soundEnabled: state.soundEnabled,
        taskCelebration: state.taskCelebration,
        routineCelebration: state.routineCelebration,
        toolbarOrder: state.toolbarOrder,
        moreButtonPosition: state.moreButtonPosition,
        users: state.users,
        currentUser: state.currentUser,
        currentDay: state.currentDay,
        displayMode: state.displayMode,
        dayMode: state.dayMode,
        library: state.library,
        libraryTemplates: state.libraryTemplates,
        userContextData: state.userContextData,
        hasCompletedOnboarding: state.hasCompletedOnboarding
      }),
    }
    ),
    {
      name: 'stackmap-store', // name for devtools
    }
  )
);

export default useAppStore;
