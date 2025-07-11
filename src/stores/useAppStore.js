import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import merge from 'lodash/merge';

// Storage adapter for React Native AsyncStorage
const storage = {
  getItem: async (name) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to AsyncStorage:', error);
    }
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
      
      // Actions for Theme & Settings
      setCurrentTheme: (theme) => set({ currentTheme: theme }, false, 'setCurrentTheme'),
      
      setBannerPosition: (position) => set({ bannerPosition: position }, false, 'setBannerPosition'),
      
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }, false, 'setSoundEnabled'),
      
      setTaskCelebration: (celebration) => set({ taskCelebration: celebration }, false, 'setTaskCelebration'),
      
      setRoutineCelebration: (celebration) => set({ routineCelebration: celebration }, false, 'setRoutineCelebration'),
      
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
      
      addUser: (userId, user) => set((state) => ({
        users: {
          ...state.users,
          [userId]: user
        }
      }), false, 'addUser'),
      
      updateUser: (userId, updates) => set((state) => ({
        users: {
          ...state.users,
          [userId]: merge({}, state.users[userId], updates)
        }
      }), false, 'updateUser'),
      
      deleteUser: (userId) => set((state) => {
        const newUsers = { ...state.users };
        delete newUsers[userId];
        return { users: newUsers };
      }, false, 'deleteUser'),
      
      // Activities and Days
      activities: [],
      currentDay: 'today',
      displayMode: 'numbers',
      dayMode: 'today',
      templates: [],
      activityCategories: null,
      userContextData: {},
      hasCompletedOnboarding: false,
      
      // Activity Actions
      setActivities: (activities) => set({ activities }, false, 'setActivities'),
      
      setCurrentDay: (day) => set({ currentDay: day }, false, 'setCurrentDay'),
      
      setDisplayMode: (mode) => set({ displayMode: mode }, false, 'setDisplayMode'),
      
      setDayMode: (mode) => set({ dayMode: mode }, false, 'setDayMode'),
      
      setTemplates: (templates) => set({ templates }, false, 'setTemplates'),
      
      setActivityCategories: (categories) => set({ activityCategories: categories }, false, 'setActivityCategories'),
      
      setUserContextData: (data) => set({ userContextData: data }, false, 'setUserContextData'),
      
      setHasCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }, false, 'setHasCompletedOnboarding'),
      
      addActivity: (activity) => set((state) => ({
        activities: [...state.activities, activity]
      }), false, 'addActivity'),
      
      updateActivity: (activityId, updates) => set((state) => ({
        activities: state.activities.map(activity => 
          activity.id === activityId ? { ...activity, ...updates } : activity
        )
      }), false, 'updateActivity'),
      
      deleteActivity: (activityId) => set((state) => ({
        activities: state.activities.filter(activity => activity.id !== activityId)
      }), false, 'deleteActivity'),
      
      reorderActivities: (newOrder) => set({ activities: newOrder }, false, 'reorderActivities'),
      
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
        users: state.users,
        currentUser: state.currentUser,
        currentDay: state.currentDay,
        displayMode: state.displayMode,
        dayMode: state.dayMode,
        templates: state.templates,
        activityCategories: state.activityCategories,
        userContextData: state.userContextData,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        // Note: activities are stored per user, so we don't persist them here
      }),
    }
    ),
    {
      name: 'stackmap-store', // name for devtools
    }
  )
);

export default useAppStore;