import type { Activity, User } from '../types';

/**
 * Data normalization utilities to ensure consistent field naming
 * across the application, handling historical variations.
 */

// Extended types for raw data that might have variations
interface RawActivity {
  id?: string;
  text?: string;
  name?: string;
  title?: string;
  icon?: string;
  completed?: boolean;
  pinned?: boolean;
  order?: number;
  completedAt?: number;
  completedBy?: string;
  uncompletedAt?: number;
  uncompletedBy?: string;
  description?: string;
  [key: string]: any;
}

interface RawUser {
  name?: string | { name?: string; text?: string; value?: string };
  icon?: string;
  days?: Record<string, any>;
  [key: string]: any;
}

interface RawExportData {
  users?: Record<string, any>;
  activities?: any[];
  activityCards?: Record<string, any[]>;
  templates?: Record<string, any>;
  last_modified?: number;
  lastModified?: number;
  created_at?: string;
  createdAt?: string;
  [key: string]: any;
}

/**
 * Normalize an activity object to use consistent field names
 * Handles variations like name/text/title for activity naming
 * @param activity - Raw activity object
 * @returns Normalized activity or null if invalid
 */
export const normalizeActivity = (activity: RawActivity | null | undefined): Partial<Activity> | null => {
  if (!activity || typeof activity !== 'object') return null;
  
  // All activities should have text and icon fields now
  const text = activity.text || 'Untitled';
  const icon = activity.icon || '';
  
  // Build normalized activity with only valid fields
  const normalized: Partial<Activity> = {
    id: activity.id || `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    icon,
    completed: activity.completed === true,
    pinned: activity.pinned === true
  };
  
  // Add optional fields if they exist
  if (activity.order !== undefined) normalized.order = activity.order;
  if (activity.completedAt) normalized.completedAt = activity.completedAt;
  if (activity.completedBy) normalized.completedBy = activity.completedBy;
  if (activity.uncompletedAt) (normalized as any).uncompletedAt = activity.uncompletedAt;
  if (activity.uncompletedBy) (normalized as any).uncompletedBy = activity.uncompletedBy;
  if (activity.description) normalized.description = activity.description;
  
  return normalized;
};

/**
 * Normalize a user object to use consistent field names
 * Handles variations in name field
 * @param user - Raw user object
 * @returns Normalized user or null if invalid
 */
export const normalizeUser = (user: RawUser | null | undefined): Partial<User> | null => {
  if (!user || typeof user !== 'object') return null;
  
  // Normalize name field
  let name: string = '';
  if (typeof user.name === 'string') {
    name = user.name;
  } else if (typeof user.name === 'object' && user.name !== null) {
    name = user.name.name || user.name.text || user.name.value || 'User';
  } else {
    name = 'User';
  }
  
  // All users should have icon field now
  const icon = user.icon || '👤';
  
  // Normalize days with activities
  const days: Record<string, any> = {};
  if (user.days && typeof user.days === 'object') {
    Object.entries(user.days).forEach(([dayKey, dayData]) => {
      if (dayData && typeof dayData === 'object') {
        days[dayKey] = {
          ...dayData,
          activities: Array.isArray(dayData.activities) 
            ? dayData.activities.map(normalizeActivity).filter(Boolean)
            : []
        };
      }
    });
  }
  
  // Build clean user object without redundant fields
  const cleanUser: any = {
    name,
    icon,
    days
  };
  
  // Copy over other valid fields
  Object.keys(user).forEach(key => {
    if (key !== 'name' && key !== 'icon' && key !== 'days') {
      cleanUser[key] = user[key];
    }
  });
  
  return cleanUser;
};

/**
 * Normalize export/import data to use consistent field names
 * Handles variations in field naming across different versions
 * @param data - Raw export/import data
 * @returns Normalized data or null if invalid
 */
export const normalizeExportData = (data: RawExportData | null | undefined): Record<string, any> | null => {
  if (!data || typeof data !== 'object') return null;
  
  const normalized: Record<string, any> = { ...data };
  
  // Normalize users
  if (data.users && typeof data.users === 'object') {
    normalized.users = {};
    Object.entries(data.users).forEach(([userId, user]) => {
      const normalizedUser = normalizeUser(user);
      if (normalizedUser) {
        normalized.users[userId] = normalizedUser;
      }
    });
  }
  
  // Normalize standalone activities (if present)
  if (data.activities && Array.isArray(data.activities)) {
    normalized.activities = data.activities.map(normalizeActivity).filter(Boolean);
  }
  
  // Normalize activity cards (if present)
  if (data.activityCards && typeof data.activityCards === 'object') {
    normalized.activityCards = {};
    Object.entries(data.activityCards).forEach(([key, activities]) => {
      if (Array.isArray(activities)) {
        normalized.activityCards[key] = activities.map(normalizeActivity).filter(Boolean);
      }
    });
  }
  
  // Normalize templates/library activities
  if (data.templates && typeof data.templates === 'object') {
    normalized.templates = {};
    Object.entries(data.templates).forEach(([categoryId, category]) => {
      if (category && typeof category === 'object') {
        normalized.templates[categoryId] = {
          ...category,
          activities: Array.isArray(category.activities)
            ? category.activities.map((activity: any) => normalizeActivity(activity))
            : []
        };
      }
    });
  }
  
  // Handle camelCase vs snake_case for timestamps
  if (data.last_modified !== undefined) {
    normalized.lastModified = data.last_modified;
    delete normalized.last_modified;
  }
  if (data.created_at !== undefined) {
    normalized.createdAt = data.created_at;
    delete normalized.created_at;
  }
  
  return normalized;
};

/**
 * Normalize sync data before applying to state
 * Uses the same normalization as export data for consistency
 * @param data - Raw sync data
 * @returns Normalized sync data or null if invalid
 */
export const normalizeSyncData = (data: RawExportData | null | undefined): Record<string, any> | null => {
  // Use the same normalization as export data
  return normalizeExportData(data);
};