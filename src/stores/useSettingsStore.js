// @ts-check
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debounce timer for storage writes
let storageWriteTimer = null;
let pendingWrite = null;

// Storage adapter for React Native AsyncStorage with debounced writes
const storage = {
  getItem: async name => {
    // CRITICAL FIX: If there's a pending write, return that instead of stale storage
    if (pendingWrite && pendingWrite.name === name) {
      // Returning pending write instead of stale storage
      return pendingWrite.value;
    }

    try {
      const value = await AsyncStorage.getItem(name);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        // Error parsing stored value, clearing corrupted data
        await AsyncStorage.removeItem(name);
        return null;
      }
    } catch (error) {
      // Error reading from AsyncStorage
      return null;
    }
  },
  setItem: async (name, value) => {
    pendingWrite = { name, value };

    if (storageWriteTimer) {
      clearTimeout(storageWriteTimer);
    }

    storageWriteTimer = setTimeout(async () => {
      if (pendingWrite) {
        try {
          await AsyncStorage.setItem(
            pendingWrite.name,
            JSON.stringify(pendingWrite.value),
          );
        } catch (error) {
          // Error writing to AsyncStorage
        }
        pendingWrite = null;
      }
    }, 500); // Reduced from 1000ms to 500ms for faster persistence
  },
  removeItem: async name => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      // Error removing from AsyncStorage
    }
  },
};

/**
 * Settings store
 * Handles theme, display, and app settings
 */
const useSettingsStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Theme & Display Settings
        currentTheme: 'stackBlue',
        bannerPosition: 'top',
        soundEnabled: true,
        taskCelebration: 'rainbow',
        routineCelebration: 'rainbow',
        displayMode: 'numbers',
        dayMode: 'today',
        hasCompletedOnboarding: false,

        // Device-specific toolbar settings (not synced)
        toolbarOrder: null,
        moreButtonPosition: 'left',

        // Actions for Theme & Settings
        setCurrentTheme: theme => {
          // Import THEMES if needed (lazy import to avoid circular dependency)
          const { THEMES } = require('../constants');

          // Validate the theme before setting
          if (!theme || !THEMES[theme]) {
            // Silently default to stackBlue without logging
            set({ currentTheme: 'stackBlue' }, false, 'setCurrentTheme');
            return;
          }

          set({ currentTheme: theme }, false, 'setCurrentTheme');
        },
        setBannerPosition: position => {
          set({ bannerPosition: position }, false, 'setBannerPosition');
        },
        setSoundEnabled: enabled =>
          set({ soundEnabled: enabled }, false, 'setSoundEnabled'),
        setTaskCelebration: celebration =>
          set({ taskCelebration: celebration }, false, 'setTaskCelebration'),
        setRoutineCelebration: celebration =>
          set(
            { routineCelebration: celebration },
            false,
            'setRoutineCelebration',
          ),
        setDisplayMode: mode =>
          set({ displayMode: mode }, false, 'setDisplayMode'),
        setDayMode: mode => set({ dayMode: mode }, false, 'setDayMode'),
        setHasCompletedOnboarding: completed =>
          set(
            { hasCompletedOnboarding: completed },
            false,
            'setHasCompletedOnboarding',
          ),

        // Toolbar settings (device-specific)
        setToolbarOrder: order =>
          set({ toolbarOrder: order }, false, 'setToolbarOrder'),
        setMoreButtonPosition: position =>
          set({ moreButtonPosition: position }, false, 'setMoreButtonPosition'),

        // Batch update for settings
        updateSettings: settings =>
          set(
            state => ({
              ...state,
              ...settings,
            }),
            false,
            'updateSettings',
          ),
      }),
      {
        name: 'stackmap-settings-storage',
        storage,
        partialize: state => ({
          currentTheme: state.currentTheme,
          bannerPosition: state.bannerPosition,
          soundEnabled: state.soundEnabled,
          taskCelebration: state.taskCelebration,
          routineCelebration: state.routineCelebration,
          displayMode: state.displayMode,
          dayMode: state.dayMode,
          hasCompletedOnboarding: state.hasCompletedOnboarding,
          toolbarOrder: state.toolbarOrder,
          moreButtonPosition: state.moreButtonPosition,
        }),
      },
    ),
    {
      name: 'SettingsStore',
    },
  ),
);

export default useSettingsStore;
