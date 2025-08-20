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
      console.log('[LibraryStore] Returning pending write instead of stale storage');
      return pendingWrite.value;
    }
    
    try {
      const value = await AsyncStorage.getItem(name);
      if (!value) return null;

      try {
        return JSON.parse(value);
      } catch (parseError) {
        console.error(
          'Error parsing stored value, clearing corrupted data:',
          parseError,
        );
        await AsyncStorage.removeItem(name);
        return null;
      }
    } catch (error) {
      console.error('Error reading from AsyncStorage:', error);
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
          console.error('Error writing to AsyncStorage:', error);
        }
        pendingWrite = null;
      }
    }, 1000);
  },
  removeItem: async name => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from AsyncStorage:', error);
    }
  },
};

/**
 * Library store
 * Handles activity library, templates, and categories
 */
const useLibraryStore = create(
  devtools(
    persist(
      (set, get) => ({
        // Library State
        libraryTemplates: [],
        library: {
          categories: null,
          userAddedActivityIds: [],
        },

        // Library Actions
        setLibraryTemplates: templates =>
          set(
            {
              libraryTemplates: templates,
            },
            false,
            'setLibraryTemplates',
          ),

        setLibrary: library =>
          set(
            {
              library,
            },
            false,
            'setLibrary',
          ),

        updateLibraryCategories: categories =>
          set(
            state => ({
              library: {
                ...state.library,
                categories,
              },
            }),
            false,
            'updateLibraryCategories',
          ),

        addUserActivityId: activityId =>
          set(
            state => {
              const userAddedIds = state.library.userAddedActivityIds || [];
              if (!userAddedIds.includes(activityId)) {
                return {
                  library: {
                    ...state.library,
                    userAddedActivityIds: [...userAddedIds, activityId],
                  },
                };
              }
              return state;
            },
            false,
            'addUserActivityId',
          ),

        removeUserActivityId: activityId =>
          set(
            state => ({
              library: {
                ...state.library,
                userAddedActivityIds: (
                  state.library.userAddedActivityIds || []
                ).filter(id => id !== activityId),
              },
            }),
            false,
            'removeUserActivityId',
          ),

        // Template management
        addTemplate: template =>
          set(
            state => ({
              libraryTemplates: [...state.libraryTemplates, template],
            }),
            false,
            'addTemplate',
          ),

        updateTemplate: (templateId, updates) =>
          set(
            state => ({
              libraryTemplates: state.libraryTemplates.map(template =>
                template.id === templateId
                  ? { ...template, ...updates }
                  : template,
              ),
            }),
            false,
            'updateTemplate',
          ),

        deleteTemplate: templateId =>
          set(
            state => ({
              libraryTemplates: state.libraryTemplates.filter(
                template => template.id !== templateId,
              ),
            }),
            false,
            'deleteTemplate',
          ),
      }),
      {
        name: 'stackmap-library-storage',
        storage,
        partialize: state => ({
          libraryTemplates: state.libraryTemplates,
          library: state.library,
        }),
      },
    ),
    {
      name: 'LibraryStore',
    },
  ),
);

export default useLibraryStore;
