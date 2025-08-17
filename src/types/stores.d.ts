// Store type definitions for Zustand stores
import { StateCreator } from 'zustand';
import {
  User,
  Activity,
  LibraryCategory,
  ThemeName,
  CelebrationType,
  ExportData,
} from './index';

// User Store
export interface UserStore {
  // State
  users: Record<string, User>;
  currentUser: string | null;
  currentDay: 'today' | 'tomorrow';
  userContextData: any; // Legacy field

  // Actions
  setUsers: (users: Record<string, User>) => void;
  setCurrentUser: (userId: string | null) => void;
  setCurrentDay: (day: 'today' | 'tomorrow') => void;
  addUser: (userId: string, user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  renameUser: (userId: string, newName: string) => void;

  // Activity Actions
  addActivity: (
    userId: string,
    day: 'today' | 'tomorrow',
    activity: Activity,
  ) => void;
  updateActivity: (
    userId: string,
    day: 'today' | 'tomorrow',
    activityId: string,
    updates: Partial<Activity>,
  ) => void;
  deleteActivity: (
    userId: string,
    day: 'today' | 'tomorrow',
    activityId: string,
  ) => void;
  toggleActivityComplete: (
    userId: string,
    day: 'today' | 'tomorrow',
    activityId: string,
  ) => void;
  toggleActivityPin: (
    userId: string,
    day: 'today' | 'tomorrow',
    activityId: string,
  ) => void;
  reorderActivities: (
    userId: string,
    day: 'today' | 'tomorrow',
    activities: Activity[],
  ) => void;

  // Bulk Operations
  completeAllActivities: (userId: string, day: 'today' | 'tomorrow') => void;
  uncompleteAllActivities: (userId: string, day: 'today' | 'tomorrow') => void;
  deleteCompletedActivities: (
    userId: string,
    day: 'today' | 'tomorrow',
  ) => void;

  // Context Data (Legacy)
  setUserContextData: (data: any) => void;

  // Computed
  getCurrentUserData: () => User | null;
  getActivitiesForDay: (
    userId: string,
    day: 'today' | 'tomorrow',
  ) => Activity[];
}

// Settings Store
export interface SettingsStore {
  // State
  currentTheme: ThemeName;
  bannerPosition: 'top' | 'bottom';
  soundEnabled: boolean;
  taskCelebration: CelebrationType;
  routineCelebration: CelebrationType;
  displayMode: 'numbers' | 'dots';
  dayMode: 'today' | 'tomorrow';
  hasCompletedOnboarding: boolean;

  // Actions
  setCurrentTheme: (theme: ThemeName) => void;
  setBannerPosition: (position: 'top' | 'bottom') => void;
  setSoundEnabled: (enabled: boolean) => void;
  setTaskCelebration: (celebration: CelebrationType) => void;
  setRoutineCelebration: (celebration: CelebrationType) => void;
  setDisplayMode: (mode: 'numbers' | 'dots') => void;
  setDayMode: (mode: 'today' | 'tomorrow') => void;
  setHasCompletedOnboarding: (completed: boolean) => void;

  // Bulk Update
  updateSettings: (settings: Partial<SettingsState>) => void;
}

// Library Store
export interface LibraryStore {
  // State
  categories: LibraryCategory[];
  selectedCategory: string | null;
  searchQuery: string;

  // Actions
  setCategories: (categories: LibraryCategory[]) => void;
  addCategory: (category: LibraryCategory) => void;
  updateCategory: (
    categoryId: string,
    updates: Partial<LibraryCategory>,
  ) => void;
  deleteCategory: (categoryId: string) => void;

  // Activity Actions
  addActivityToCategory: (categoryId: string, activity: Activity) => void;
  updateActivityInCategory: (
    categoryId: string,
    activityId: string,
    updates: Partial<Activity>,
  ) => void;
  deleteActivityFromCategory: (categoryId: string, activityId: string) => void;

  // Selection and Search
  setSelectedCategory: (categoryId: string | null) => void;
  setSearchQuery: (query: string) => void;

  // Bulk Operations
  importLibrary: (data: LibraryCategory[]) => void;
  resetLibrary: () => void;

  // Computed
  getFilteredActivities: () => Activity[];
  getCategoryById: (categoryId: string) => LibraryCategory | undefined;
}

// Sync Store
export interface SyncStore {
  // State
  syncEnabled: boolean;
  syncId: string | null;
  lastSyncAt: number | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  conflictResolution: 'local' | 'remote' | 'merge';
  pendingChanges: number;

  // Actions
  setSyncEnabled: (enabled: boolean) => void;
  setSyncId: (id: string | null) => void;
  setLastSyncAt: (timestamp: number | null) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'success' | 'error') => void;
  setSyncError: (error: string | null) => void;
  setConflictResolution: (resolution: 'local' | 'remote' | 'merge') => void;
  setPendingChanges: (count: number) => void;

  // Sync Operations
  initializeSync: (recoveryPhrase: string) => Promise<void>;
  performSync: () => Promise<void>;
  disconnectSync: () => void;

  // Conflict Resolution
  resolveConflict: (field: string, resolution: 'local' | 'remote') => void;

  // Computed
  isSyncing: () => boolean;
  hasUnsyncedChanges: () => boolean;
}

// Combined App Store (Wrapper)
export interface AppStore
  extends UserStore,
    SettingsStore,
    LibraryStore,
    SyncStore {
  // Additional unified actions
  importData: (data: ExportData) => void;
  exportData: () => ExportData;
  resetApp: () => void;

  // Persistence
  persist: {
    clearStorage: () => void;
    rehydrate: () => Promise<void>;
    hasHydrated: () => boolean;
  };
}

// State slices for create function
export type UserSlice = StateCreator<UserStore>;
export type SettingsSlice = StateCreator<SettingsStore>;
export type LibrarySlice = StateCreator<LibraryStore>;
export type SyncSlice = StateCreator<SyncStore>;

// Helper type for store creation
export type StoreState = UserStore & SettingsStore & LibraryStore & SyncStore;

// Settings state type (for persistence)
export interface SettingsState {
  currentTheme: ThemeName;
  bannerPosition: 'top' | 'bottom';
  soundEnabled: boolean;
  taskCelebration: CelebrationType;
  routineCelebration: CelebrationType;
  displayMode: 'numbers' | 'dots';
  dayMode: 'today' | 'tomorrow';
  hasCompletedOnboarding: boolean;
}
