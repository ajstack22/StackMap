// Common type definitions for StackMap

// User type
export interface User {
  id: string;
  name: string;
  icon: string;
  days: Record<string, Day>;
  deleted?: boolean;
  lastModified?: number;
  version?: number;
}

// Activity type
export interface Activity {
  id: string;
  text: string;
  icon: string;
  completed: boolean;
  completedAt?: number;
  completedBy?: string;
  deleted?: boolean;
  lastModified?: number;
  order?: number;
}

// Day type
export interface Day {
  date: string;
  activities: Activity[];
}

// App State
export interface AppState {
  users: Record<string, User>;
  currentUser: string;
  currentDay: string;
  activities: Activity[];
  theme: string;
  syncEnabled: boolean;
  lastSync?: number;
  version?: number;
}

// Modal types
export interface ModalState {
  visible: boolean;
  mode?: 'add' | 'edit' | 'delete';
  data?: any;
}

// Sync types
export interface SyncData {
  users: Record<string, User>;
  lastModified: number;
  deviceId: string;
  deviceName: string;
  version?: number;
}

export interface SyncConflict {
  path: string;
  localValue: any;
  remoteValue: any;
  resolution?: 'local' | 'remote' | 'merge';
}

// Theme type
export type ThemeColor = '#FF6B6B' | '#4ECDC4' | '#45B7D1' | '#FFA07A' | '#98D8C8' | '#F7DC6F' | '#BB8FCE' | '#85C1E2';

// Navigation types
export interface NavigationParams {
  screen?: string;
  params?: Record<string, any>;
}

// File import/export types
export interface ExportData {
  version: string;
  exportDate: string;
  users: Record<string, User>;
}

// Library types
export interface LibraryCategory {
  id: string;
  name: string;
  icon: string;
  activities: LibraryActivity[];
}

export interface LibraryActivity {
  id: string;
  text: string;
  icon: string;
  category?: string;
}

// Settings types
export interface AppSettings {
  theme: ThemeColor;
  syncEnabled: boolean;
  notifications?: boolean;
  autoBackup?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

// Platform types
export type Platform = 'ios' | 'android' | 'web';

// Gesture types
export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  velocity: number;
  distance: number;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}