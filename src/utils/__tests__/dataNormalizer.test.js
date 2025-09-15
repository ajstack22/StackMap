/* eslint-env jest */
import {
  normalizeActivity,
  normalizeUser,
  normalizeSyncData,
  needsNormalization
} from '../dataNormalizer';

describe('dataNormalizer', () => {
  describe('normalizeActivity', () => {
    it('should return unchanged activity with correct fields', () => {
      const activity = {
        id: '1',
        text: 'Brush teeth',
        icon: '🦷',
        isCompleted: false
      };
      const result = normalizeActivity(activity);
      expect(result).toEqual(activity);
    });

    it('should handle null/undefined activity', () => {
      expect(normalizeActivity(null)).toBeNull();
      expect(normalizeActivity(undefined)).toBeUndefined();
    });

    it('should normalize name field to text', () => {
      const activity = {
        id: '1',
        name: 'Brush teeth',
        icon: '🦷'
      };
      const result = normalizeActivity(activity);
      expect(result).toEqual({
        id: '1',
        text: 'Brush teeth',
        icon: '🦷'
      });
      expect(result.name).toBeUndefined();
    });

    it('should normalize title field to text', () => {
      const activity = {
        id: '1',
        title: 'Brush teeth',
        icon: '🦷'
      };
      const result = normalizeActivity(activity);
      expect(result).toEqual({
        id: '1',
        text: 'Brush teeth',
        icon: '🦷'
      });
      expect(result.title).toBeUndefined();
    });

    it('should prefer text over name when both exist', () => {
      const activity = {
        id: '1',
        text: 'Brush teeth',
        name: 'Wrong name',
        icon: '🦷'
      };
      const result = normalizeActivity(activity);
      expect(result.text).toBe('Brush teeth');
      expect(result.name).toBe('Wrong name'); // Should not delete if text exists
    });

    it('should prefer name over title when text is missing', () => {
      const activity = {
        id: '1',
        name: 'Brush teeth',
        title: 'Wrong title',
        icon: '🦷'
      };
      const result = normalizeActivity(activity);
      expect(result.text).toBe('Brush teeth');
      expect(result.name).toBeUndefined();
      expect(result.title).toBe('Wrong title'); // Should not delete if name was used
    });

    it('should normalize emoji field to icon', () => {
      const activity = {
        id: '1',
        text: 'Brush teeth',
        emoji: '🦷'
      };
      const result = normalizeActivity(activity);
      expect(result).toEqual({
        id: '1',
        text: 'Brush teeth',
        icon: '🦷'
      });
      expect(result.emoji).toBeUndefined();
    });

    it('should prefer icon over emoji when both exist', () => {
      const activity = {
        id: '1',
        text: 'Brush teeth',
        icon: '🦷',
        emoji: '❌'
      };
      const result = normalizeActivity(activity);
      expect(result.icon).toBe('🦷');
      expect(result.emoji).toBeUndefined();
    });

    it('should handle complex normalization with multiple fields', () => {
      const activity = {
        id: '1',
        name: 'Brush teeth',
        title: 'Wrong title',
        emoji: '🦷',
        isCompleted: false,
        category: 'hygiene'
      };
      const result = normalizeActivity(activity);
      expect(result).toEqual({
        id: '1',
        text: 'Brush teeth',
        title: 'Wrong title',
        icon: '🦷',
        isCompleted: false,
        category: 'hygiene'
      });
    });
  });

  describe('normalizeUser', () => {
    it('should return unchanged user with correct fields', () => {
      const user = {
        id: 'user1',
        name: 'John',
        icon: '👤',
        days: {}
      };
      const result = normalizeUser(user);
      expect(result).toEqual(user);
    });

    it('should handle null/undefined user', () => {
      expect(normalizeUser(null)).toBeNull();
      expect(normalizeUser(undefined)).toBeUndefined();
    });

    it('should normalize emoji field to icon', () => {
      const user = {
        id: 'user1',
        name: 'John',
        emoji: '👤'
      };
      const result = normalizeUser(user);
      expect(result).toEqual({
        id: 'user1',
        name: 'John',
        icon: '👤'
      });
      expect(result.emoji).toBeUndefined();
    });

    it('should provide default icon when none exists', () => {
      const user = {
        id: 'user1',
        name: 'John'
      };
      const result = normalizeUser(user);
      expect(result.icon).toBe('👤');
    });

    it('should prefer icon over emoji when both exist', () => {
      const user = {
        id: 'user1',
        name: 'John',
        icon: '🧑',
        emoji: '👤'
      };
      const result = normalizeUser(user);
      expect(result.icon).toBe('🧑');
      expect(result.emoji).toBeUndefined();
    });

    it('should handle object name by extracting string', () => {
      const user = {
        id: 'user1',
        name: { name: 'John' },
        icon: '👤'
      };
      const result = normalizeUser(user);
      expect(result.name).toBe('John');
    });

    it('should handle object name with text field', () => {
      const user = {
        id: 'user1',
        name: { text: 'John' },
        icon: '👤'
      };
      const result = normalizeUser(user);
      expect(result.name).toBe('John');
    });

    it('should default name when object name has no extractable string', () => {
      const user = {
        id: 'user1',
        name: { invalid: 'field' },
        icon: '👤'
      };
      const result = normalizeUser(user);
      expect(result.name).toBe('User');
    });

    it('should default name when missing or invalid type', () => {
      const user1 = { id: 'user1', icon: '👤' };
      const user2 = { id: 'user2', name: 123, icon: '👤' };

      expect(normalizeUser(user1).name).toBe('User');
      expect(normalizeUser(user2).name).toBe('User');
    });

    it('should normalize activities in user days', () => {
      const user = {
        id: 'user1',
        name: 'John',
        icon: '👤',
        days: {
          '2025-01-01': {
            activities: [
              { id: '1', name: 'Brush teeth', emoji: '🦷' },
              { id: '2', text: 'Eat breakfast', icon: '🍳' }
            ]
          }
        }
      };
      const result = normalizeUser(user);
      expect(result.days['2025-01-01'].activities).toEqual([
        { id: '1', text: 'Brush teeth', icon: '🦷' },
        { id: '2', text: 'Eat breakfast', icon: '🍳' }
      ]);
    });

    it('should handle days with invalid structure', () => {
      const user = {
        id: 'user1',
        name: 'John',
        icon: '👤',
        days: {
          '2025-01-01': null,
          '2025-01-02': { activities: 'invalid' },
          '2025-01-03': { activities: [{ id: '1', name: 'Test' }] }
        }
      };
      const result = normalizeUser(user);
      expect(result.days['2025-01-01']).toBeNull();
      expect(result.days['2025-01-02'].activities).toBe('invalid');
      expect(result.days['2025-01-03'].activities[0].text).toBe('Test');
    });
  });

  describe('normalizeSyncData', () => {
    it('should handle null/undefined data', () => {
      expect(normalizeSyncData(null)).toBeNull();
      expect(normalizeSyncData(undefined)).toBeUndefined();
    });

    it('should normalize users in sync data', () => {
      const data = {
        users: {
          user1: { name: 'John', emoji: '👤' },
          user2: { name: 'Jane', icon: '👩' }
        }
      };
      const result = normalizeSyncData(data);
      expect(result.users.user1).toEqual({
        name: 'John',
        icon: '👤'
      });
      expect(result.users.user2).toEqual({
        name: 'Jane',
        icon: '👩'
      });
    });

    it('should normalize library categories as array', () => {
      const data = {
        library: {
          categories: [
            {
              id: 'cat1',
              name: 'Hygiene',
              activities: [
                { id: '1', name: 'Brush teeth', emoji: '🦷' }
              ]
            }
          ]
        }
      };
      const result = normalizeSyncData(data);
      expect(result.library.categories[0].activities[0]).toEqual({
        id: '1',
        text: 'Brush teeth',
        icon: '🦷'
      });
    });

    it('should normalize library categories as object', () => {
      const data = {
        library: {
          categories: {
            cat1: {
              id: 'cat1',
              name: 'Hygiene',
              activities: [
                { id: '1', name: 'Brush teeth', emoji: '🦷' }
              ]
            }
          }
        }
      };
      const result = normalizeSyncData(data);
      expect(result.library.categories.cat1.activities[0]).toEqual({
        id: '1',
        text: 'Brush teeth',
        icon: '🦷'
      });
    });

    it('should handle categories with no activities', () => {
      const data = {
        library: {
          categories: {
            cat1: { id: 'cat1', name: 'Empty' },
            cat2: { id: 'cat2', name: 'Invalid', activities: 'not-array' }
          }
        }
      };
      const result = normalizeSyncData(data);
      expect(result.library.categories.cat1.activities).toBeUndefined();
      expect(result.library.categories.cat2.activities).toBe('not-array');
    });

    it('should normalize library.activities array', () => {
      const data = {
        library: {
          activities: [
            { id: '1', name: 'Activity 1', emoji: '🔥' },
            { id: '2', text: 'Activity 2', icon: '⭐' }
          ]
        }
      };
      const result = normalizeSyncData(data);
      expect(result.library.activities).toEqual([
        { id: '1', text: 'Activity 1', icon: '🔥' },
        { id: '2', text: 'Activity 2', icon: '⭐' }
      ]);
    });

    it('should normalize libraryTemplates', () => {
      const data = {
        libraryTemplates: [
          { id: '1', name: 'Template 1', emoji: '📝' }
        ]
      };
      const result = normalizeSyncData(data);
      expect(result.libraryTemplates[0]).toEqual({
        id: '1',
        text: 'Template 1',
        icon: '📝'
      });
    });

    it('should normalize legacy activities array', () => {
      const data = {
        activities: [
          { id: '1', name: 'Legacy activity', emoji: '🔄' }
        ]
      };
      const result = normalizeSyncData(data);
      expect(result.activities[0]).toEqual({
        id: '1',
        text: 'Legacy activity',
        icon: '🔄'
      });
    });

    it('should handle complex sync data with all structures', () => {
      const data = {
        users: {
          user1: { name: 'John', emoji: '👤' }
        },
        library: {
          categories: [
            { id: 'cat1', activities: [{ name: 'Activity', emoji: '🎯' }] }
          ],
          activities: [{ name: 'Library activity', emoji: '📚' }]
        },
        libraryTemplates: [{ name: 'Template', emoji: '📝' }],
        activities: [{ name: 'Legacy', emoji: '🔄' }]
      };
      const result = normalizeSyncData(data);

      expect(result.users.user1.icon).toBe('👤');
      expect(result.library.categories[0].activities[0].text).toBe('Activity');
      expect(result.library.activities[0].text).toBe('Library activity');
      expect(result.libraryTemplates[0].text).toBe('Template');
      expect(result.activities[0].text).toBe('Legacy');
    });
  });

  describe('needsNormalization', () => {
    it('should return false for null/undefined data', () => {
      expect(needsNormalization(null)).toBe(false);
      expect(needsNormalization(undefined)).toBe(false);
    });

    it('should return false for already normalized data', () => {
      const data = {
        users: {
          user1: { name: 'John', icon: '👤' }
        }
      };
      expect(needsNormalization(data)).toBe(false);
    });

    it('should detect users needing normalization', () => {
      const data1 = {
        users: {
          user1: { name: 'John', emoji: '👤' }
        }
      };
      const data2 = {
        users: {
          user1: { name: { name: 'John' }, icon: '👤' }
        }
      };

      expect(needsNormalization(data1)).toBe(true);
      expect(needsNormalization(data2)).toBe(true);
    });

    it('should detect user activities needing normalization', () => {
      const data = {
        users: {
          user1: {
            name: 'John',
            icon: '👤',
            days: {
              '2025-01-01': {
                activities: [
                  { id: '1', name: 'Old activity' }
                ]
              }
            }
          }
        }
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect library categories (array) needing normalization', () => {
      const data = {
        library: {
          categories: [
            {
              activities: [
                { id: '1', title: 'Old activity' }
              ]
            }
          ]
        }
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect library categories (object) needing normalization', () => {
      const data = {
        library: {
          categories: {
            cat1: {
              activities: [
                { id: '1', emoji: '🎯' }
              ]
            }
          }
        }
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect library.activities needing normalization', () => {
      const data = {
        library: {
          activities: [
            { id: '1', name: 'Old activity' }
          ]
        }
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should handle invalid data structures gracefully', () => {
      const data = {
        users: {
          user1: {
            days: {
              '2025-01-01': {
                activities: 'invalid'
              }
            }
          }
        },
        library: {
          categories: {
            cat1: {
              activities: null
            }
          }
        }
      };
      expect(needsNormalization(data)).toBe(false);
    });

    it('should return false for empty structures', () => {
      const data = {
        users: {},
        library: { categories: [] },
        libraryTemplates: []
      };
      expect(needsNormalization(data)).toBe(false);
    });
  });
});