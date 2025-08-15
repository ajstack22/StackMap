// Core domain types for StackMap

// User and Activity Types
export interface User {
  name: string;
  icon: string; // Standardized from 'emoji'
  days: Record<string, Day>;
  settings?: UserSettings;
  lastModified?: number;
  version?: number;
}

export interface UserSettings {
  theme?: string;
  soundEnabled?: boolean;
  bannerPosition?: 'top' | 'bottom';
  displayMode?: 'numbers' | 'dots';
  taskCelebration?: CelebrationType;
  routineCelebration?: CelebrationType;
}

export interface Activity {
  id: string;
  text: string; // Standardized from 'name' or 'title'
  icon: string; // Standardized from 'emoji'
  completed: boolean;
  pinned: boolean;
  completedAt?: number;
  completedBy?: string;
  description?: string;
  category?: string;
  order?: number;
}

export interface Day {
  activities: Activity[];
  date?: string;
  lastModified?: number;
}

// Library and Template Types
export interface LibraryCategory {
  id: string;
  name: string;
  icon: string;
  activities: LibraryActivity[];
  order?: number;
  isDefault?: boolean;
}

export interface LibraryActivity {
  id: string;
  text: string; // Standardized from 'name'
  icon: string; // Standardized from 'emoji'
  description?: string;
  category?: string;
  tags?: string[];
}

// Theme Types
export type ThemeName = 
  | 'lemonLime'
  | 'mintCherry'
  | 'blueBerry'
  | 'electricBlueViolet'
  | 'orangeInYourFace'
  | 'pinkAndGreenQueen'
  | 'sunFlower'
  | 'lavendarDreams'
  | 'cloudyDay'
  | 'waterMelon'
  | 'grapeFruit'
  | 'blackAndWhite';

export interface Theme {
  name: ThemeName;
  background: string;
  primary: string;
  secondary: string;
  tertiary: string;
  text: string;
  border: string;
  shadow: string;
}

// Celebration Types
export type CelebrationType = 
  | 'none'
  | 'confetti'
  | 'subtle'
  | 'bounce'
  | 'sparkle';

// Sync Types
export interface SyncData {
  users: Record<string, User>;
  timestamp: number;
  version: string;
  deviceId?: string;
  metadata?: SyncMetadata;
}

export interface SyncMetadata {
  lastSyncAt?: number;
  deviceCount?: number;
  conflictResolution?: 'local' | 'remote' | 'merge';
}

export interface SyncConflict {
  field: string;
  local: any;
  remote: any;
  resolution?: 'local' | 'remote' | 'merge';
}

// App State Types
export interface AppState {
  users: Record<string, User>;
  currentUser: string | null;
  currentDay: 'today' | 'tomorrow';
  currentTheme: ThemeName;
  syncEnabled: boolean;
  syncId: string | null;
  hasCompletedOnboarding: boolean;
  userContextData: any; // Legacy field
}

// Modal State Types
export interface ModalState {
  activityModalVisible: boolean;
  selectedActivity: Activity | null;
  settingsModalVisible: boolean;
  dataModalVisible: boolean;
  reorderModalVisible: boolean;
  syncModalVisible: boolean;
  contextModalVisible: boolean;
}

// Export and Import Types
export interface ExportData {
  version: string;
  exportDate: string;
  users: Record<string, User>;
  settings?: AppSettings;
  library?: LibraryCategory[];
}

export interface AppSettings {
  theme: ThemeName;
  soundEnabled: boolean;
  bannerPosition: 'top' | 'bottom';
  displayMode: 'numbers' | 'dots';
  taskCelebration: CelebrationType;
  routineCelebration: CelebrationType;
  hasCompletedOnboarding: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
};