/**
 * Tests for field accessor utility functions
 */

import {
  getActivityText,
  getActivityIcon,
  getUserIcon,
  getUserName,
  normalizeActivity,
  normalizeUser,
} from '../fieldAccessors';

describe('fieldAccessors', () => {
  describe('getActivityText', () => {
    it('should return text field when present', () => {
      const activity = { text: 'Activity Name', name: 'Old Name', title: 'Old Title' };
      expect(getActivityText(activity)).toBe('Activity Name');
    });

    it('should fallback to name when text is missing', () => {
      const activity = { name: 'Activity Name', title: 'Old Title' };
      expect(getActivityText(activity)).toBe('Activity Name');
    });

    it('should fallback to title when text and name are missing', () => {
      const activity = { title: 'Activity Title' };
      expect(getActivityText(activity)).toBe('Activity Title');
    });

    it('should return empty string when all fields are missing', () => {
      const activity = { id: '123' };
      expect(getActivityText(activity)).toBe('');
    });

    it('should return empty string for null/undefined activity', () => {
      expect(getActivityText(null)).toBe('');
      expect(getActivityText(undefined)).toBe('');
    });
  });

  describe('getActivityIcon', () => {
    it('should return icon field when present', () => {
      const activity = { icon: '🎯', emoji: '🔥' };
      expect(getActivityIcon(activity)).toBe('🎯');
    });

    it('should fallback to emoji when icon is missing', () => {
      const activity = { emoji: '🔥' };
      expect(getActivityIcon(activity)).toBe('🔥');
    });

    it('should return default when all fields are missing', () => {
      const activity = { id: '123' };
      expect(getActivityIcon(activity)).toBe('🎯');
    });

    it('should return default for null/undefined activity', () => {
      expect(getActivityIcon(null)).toBe('🎯');
      expect(getActivityIcon(undefined)).toBe('🎯');
    });
  });

  describe('getUserIcon', () => {
    it('should return icon field when present', () => {
      const user = { icon: '👤', emoji: '🔥' };
      expect(getUserIcon(user)).toBe('👤');
    });

    it('should fallback to emoji when icon is missing', () => {
      const user = { emoji: '🔥' };
      expect(getUserIcon(user)).toBe('🔥');
    });

    it('should return default when all fields are missing', () => {
      const user = { id: '123' };
      expect(getUserIcon(user)).toBe('👤');
    });

    it('should return default for null/undefined user', () => {
      expect(getUserIcon(null)).toBe('👤');
      expect(getUserIcon(undefined)).toBe('👤');
    });
  });

  describe('getUserName', () => {
    it('should return name field when present', () => {
      const user = { name: 'John Doe' };
      expect(getUserName(user)).toBe('John Doe');
    });

    it('should handle legacy object format', () => {
      const user = { name: { text: 'John Doe' } };
      expect(getUserName(user)).toBe('John Doe');
    });

    it('should return empty string when name is missing', () => {
      const user = { id: '123' };
      expect(getUserName(user)).toBe('');
    });

    it('should return empty string for null/undefined user', () => {
      expect(getUserName(null)).toBe('');
      expect(getUserName(undefined)).toBe('');
    });
  });

  describe('normalizeActivity', () => {
    it('should normalize activity with text and icon fields', () => {
      const activity = {
        id: '123',
        name: 'Old Name',
        emoji: '🔥',
        description: 'Test description',
      };

      const normalized = normalizeActivity(activity);
      expect(normalized).toEqual({
        id: '123',
        name: 'Old Name',
        emoji: '🔥',
        description: 'Test description',
        text: 'Old Name', // Added via getActivityText
        icon: '🔥', // Added via getActivityIcon
      });
    });

    it('should return null for null/undefined activity', () => {
      expect(normalizeActivity(null)).toBeNull();
      expect(normalizeActivity(undefined)).toBeNull();
    });
  });

  describe('normalizeUser', () => {
    it('should normalize user with name and icon fields', () => {
      const user = {
        id: '123',
        emoji: '👤',
      };

      const normalized = normalizeUser(user);
      expect(normalized).toEqual({
        id: '123',
        emoji: '👤',
        name: '', // Added via getUserName (empty because no name field)
        icon: '👤', // Added via getUserIcon
      });
    });

    it('should handle legacy name object format', () => {
      const user = {
        id: '123',
        name: { text: 'John Doe' },
        emoji: '👤',
      };

      const normalized = normalizeUser(user);
      expect(normalized.name).toBe('John Doe');
    });

    it('should return null for null/undefined user', () => {
      expect(normalizeUser(null)).toBeNull();
      expect(normalizeUser(undefined)).toBeNull();
    });
  });
});
