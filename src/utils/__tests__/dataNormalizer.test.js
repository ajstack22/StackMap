/**
 * Comprehensive unit tests for dataNormalizer.js
 * Tests all field normalization logic to ensure sync consistency
 */

import {
  normalizeActivity,
  normalizeUser,
  normalizeSyncData,
  needsNormalization,
} from '../dataNormalizer';

describe('dataNormalizer', () => {
  describe('normalizeActivity', () => {
    it('should return null/undefined for null/undefined input', () => {
      expect(normalizeActivity(null)).toBeNull();
      expect(normalizeActivity(undefined)).toBeUndefined();
    });

    it('should normalize name field to text', () => {
      const activity = { name: 'Test Activity', icon: '📝' };
      const normalized = normalizeActivity(activity);

      expect(normalized.text).toBe('Test Activity');
      expect(normalized.name).toBeUndefined();
      expect(normalized.icon).toBe('📝');
    });

    it('should normalize title field to text', () => {
      const activity = { title: 'Test Title', icon: '📋' };
      const normalized = normalizeActivity(activity);

      expect(normalized.text).toBe('Test Title');
      expect(normalized.title).toBeUndefined();
      expect(normalized.icon).toBe('📋');
    });

    it('should prefer text over name over title', () => {
      const activity = {
        text: 'Preferred Text',
        name: 'Should Ignore Name',
        title: 'Should Ignore Title',
        icon: '✅',
      };
      const normalized = normalizeActivity(activity);

      expect(normalized.text).toBe('Preferred Text');
      // When text exists, name and title are not removed (only converted if text is missing)
      expect(normalized.name).toBe('Should Ignore Name');
      expect(normalized.title).toBe('Should Ignore Title');
    });

    it('should normalize emoji field to icon', () => {
      const activity = { text: 'Test Activity', emoji: '🎯' };
      const normalized = normalizeActivity(activity);

      expect(normalized.icon).toBe('🎯');
      expect(normalized.emoji).toBeUndefined();
    });

    it('should prefer icon over emoji and remove redundant emoji', () => {
      const activity = {
        text: 'Test Activity',
        icon: '🔥',
        emoji: '💧',
      };
      const normalized = normalizeActivity(activity);

      expect(normalized.icon).toBe('🔥');
      expect(normalized.emoji).toBeUndefined();
    });

    it('should preserve other activity properties', () => {
      const activity = {
        id: 'act-123',
        name: 'Test Activity',
        emoji: '📌',
        completed: true,
        category: 'Work',
        order: 5,
        customField: 'value',
      };
      const normalized = normalizeActivity(activity);

      expect(normalized).toEqual({
        id: 'act-123',
        text: 'Test Activity',
        icon: '📌',
        completed: true,
        category: 'Work',
        order: 5,
        customField: 'value',
      });
    });

    it('should handle activities with no text or icon fields', () => {
      const activity = { id: 'act-456', completed: false };
      const normalized = normalizeActivity(activity);

      expect(normalized).toEqual({ id: 'act-456', completed: false });
    });

    it('should not mutate the original activity object', () => {
      const activity = { name: 'Original', emoji: '🔒' };
      const normalized = normalizeActivity(activity);

      expect(activity.name).toBe('Original');
      expect(activity.emoji).toBe('🔒');
      expect(normalized).not.toBe(activity);
    });

    it('should handle edge case with empty strings', () => {
      const activity = { name: '', emoji: '' };
      const normalized = normalizeActivity(activity);

      // Empty strings are preserved during normalization
      expect(normalized.text).toBe('');
      expect(normalized.icon).toBe('');
      expect(normalized.name).toBeUndefined();
      expect(normalized.emoji).toBeUndefined();
    });
  });

  describe('normalizeUser', () => {
    it('should return null/undefined for null/undefined input', () => {
      expect(normalizeUser(null)).toBeNull();
      expect(normalizeUser(undefined)).toBeUndefined();
    });

    it('should ensure name is a string', () => {
      const user = { id: 'user1', name: 'John Doe', icon: '👤' };
      const normalized = normalizeUser(user);

      expect(normalized.name).toBe('John Doe');
      expect(typeof normalized.name).toBe('string');
    });

    it('should extract name from nested object with name property', () => {
      const user = {
        id: 'user1',
        name: { name: 'Extracted Name' },
        icon: '👤',
      };
      const normalized = normalizeUser(user);

      expect(normalized.name).toBe('Extracted Name');
    });

    it('should extract name from nested object with text property', () => {
      const user = {
        id: 'user1',
        name: { text: 'Text Name' },
        icon: '👤',
      };
      const normalized = normalizeUser(user);

      expect(normalized.name).toBe('Text Name');
    });

    it('should use default "User" when name is object without valid fields', () => {
      const user = {
        id: 'user1',
        name: { invalid: 'field' },
        icon: '👤',
      };
      const normalized = normalizeUser(user);

      expect(normalized.name).toBe('User');
    });

    it('should use default "User" when name is missing or invalid', () => {
      const testCases = [
        { id: 'user1' },
        { id: 'user1', name: null },
        { id: 'user1', name: 123 },
        { id: 'user1', name: [] },
      ];

      testCases.forEach(user => {
        const normalized = normalizeUser(user);
        expect(normalized.name).toBe('User');
      });
    });

    it('should normalize emoji field to icon', () => {
      const user = { id: 'user1', name: 'John', emoji: '😎' };
      const normalized = normalizeUser(user);

      expect(normalized.icon).toBe('😎');
      expect(normalized.emoji).toBeUndefined();
    });

    it('should prefer icon over emoji and remove redundant emoji', () => {
      const user = {
        id: 'user1',
        name: 'John',
        icon: '🔥',
        emoji: '💧',
      };
      const normalized = normalizeUser(user);

      expect(normalized.icon).toBe('🔥');
      expect(normalized.emoji).toBeUndefined();
    });

    it('should use default icon when missing', () => {
      const user = { id: 'user1', name: 'John' };
      const normalized = normalizeUser(user);

      expect(normalized.icon).toBe('👤');
    });

    it('should normalize activities within user days', () => {
      const user = {
        id: 'user1',
        name: 'John',
        days: {
          today: {
            activities: [
              { name: 'Task 1', emoji: '📝' },
              { title: 'Task 2', icon: '✅' },
            ],
          },
          tomorrow: {
            activities: [{ text: 'Task 3', emoji: '🎯' }],
          },
        },
      };
      const normalized = normalizeUser(user);

      expect(normalized.days.today.activities[0]).toEqual({
        text: 'Task 1',
        icon: '📝',
      });
      expect(normalized.days.today.activities[1]).toEqual({
        text: 'Task 2',
        icon: '✅',
      });
      expect(normalized.days.tomorrow.activities[0]).toEqual({
        text: 'Task 3',
        icon: '🎯',
      });
    });

    it('should handle missing or invalid days structure', () => {
      const testCases = [
        { id: 'user1', name: 'John', days: null },
        { id: 'user1', name: 'John', days: {} },
        { id: 'user1', name: 'John', days: { today: null } },
        { id: 'user1', name: 'John', days: { today: { activities: null } } },
        {
          id: 'user1',
          name: 'John',
          days: { today: { activities: 'not-array' } },
        },
      ];

      testCases.forEach(user => {
        expect(() => normalizeUser(user)).not.toThrow();
      });
    });

    it('should preserve other user properties', () => {
      const user = {
        id: 'user1',
        name: 'John',
        theme: 'blue',
        celebration: 'rainbow',
        settings: { soundEnabled: true },
        customField: 'value',
      };
      const normalized = normalizeUser(user);

      expect(normalized.theme).toBe('blue');
      expect(normalized.celebration).toBe('rainbow');
      expect(normalized.settings).toEqual({ soundEnabled: true });
      expect(normalized.customField).toBe('value');
    });

    it('should not mutate the original user object', () => {
      const user = {
        id: 'user1',
        name: { name: 'John' },
        emoji: '😎',
      };
      const normalized = normalizeUser(user);

      expect(user.name).toEqual({ name: 'John' });
      expect(user.emoji).toBe('😎');
      expect(normalized).not.toBe(user);
    });
  });

  describe('normalizeSyncData', () => {
    it('should return null/undefined for null/undefined input', () => {
      expect(normalizeSyncData(null)).toBeNull();
      expect(normalizeSyncData(undefined)).toBeUndefined();
    });

    it('should normalize all users in the data', () => {
      const data = {
        users: {
          user1: { name: 'User 1', emoji: '😎' },
          user2: { name: { text: 'User 2' }, icon: '🔥' },
        },
      };
      const normalized = normalizeSyncData(data);

      expect(normalized.users.user1).toEqual({
        name: 'User 1',
        icon: '😎',
      });
      expect(normalized.users.user2).toEqual({
        name: 'User 2',
        icon: '🔥',
      });
    });

    it('should normalize library categories as array', () => {
      const data = {
        library: {
          categories: [
            {
              id: 'cat1',
              activities: [
                { name: 'Activity 1', emoji: '📝' },
                { title: 'Activity 2', icon: '✅' },
              ],
            },
          ],
        },
      };
      const normalized = normalizeSyncData(data);

      expect(normalized.library.categories[0].activities[0]).toEqual({
        text: 'Activity 1',
        icon: '📝',
      });
      expect(normalized.library.categories[0].activities[1]).toEqual({
        text: 'Activity 2',
        icon: '✅',
      });
    });

    it('should normalize library categories as object', () => {
      const data = {
        library: {
          categories: {
            cat1: {
              id: 'cat1',
              activities: [{ name: 'Activity 1', emoji: '📝' }],
            },
            cat2: {
              id: 'cat2',
              activities: [{ title: 'Activity 2', icon: '✅' }],
            },
          },
        },
      };
      const normalized = normalizeSyncData(data);

      expect(normalized.library.categories.cat1.activities[0]).toEqual({
        text: 'Activity 1',
        icon: '📝',
      });
      expect(normalized.library.categories.cat2.activities[0]).toEqual({
        text: 'Activity 2',
        icon: '✅',
      });
    });

    it('should normalize library.activities array', () => {
      const data = {
        library: {
          activities: [
            { name: 'Lib Activity 1', emoji: '🎯' },
            { title: 'Lib Activity 2', icon: '📚' },
          ],
        },
      };
      const normalized = normalizeSyncData(data);

      expect(normalized.library.activities[0]).toEqual({
        text: 'Lib Activity 1',
        icon: '🎯',
      });
      expect(normalized.library.activities[1]).toEqual({
        text: 'Lib Activity 2',
        icon: '📚',
      });
    });

    it('should normalize libraryTemplates array', () => {
      const data = {
        libraryTemplates: [
          { name: 'Template 1', emoji: '🔖' },
          { text: 'Template 2', icon: '📋' },
        ],
      };
      const normalized = normalizeSyncData(data);

      expect(normalized.libraryTemplates[0]).toEqual({
        text: 'Template 1',
        icon: '🔖',
      });
      expect(normalized.libraryTemplates[1]).toEqual({
        text: 'Template 2',
        icon: '📋',
      });
    });

    it('should normalize legacy activities array', () => {
      const data = {
        activities: [
          { name: 'Legacy 1', emoji: '🕰️' },
          { title: 'Legacy 2', icon: '📼' },
        ],
      };
      const normalized = normalizeSyncData(data);

      expect(normalized.activities[0]).toEqual({
        text: 'Legacy 1',
        icon: '🕰️',
      });
      expect(normalized.activities[1]).toEqual({
        text: 'Legacy 2',
        icon: '📼',
      });
    });

    it('should handle missing or invalid structures gracefully', () => {
      const testCases = [
        { users: null },
        { users: 'not-object' },
        { library: null },
        { library: { categories: null } },
        { library: { categories: 'not-array-or-object' } },
        { library: { activities: 'not-array' } },
        { libraryTemplates: 'not-array' },
        { activities: 'not-array' },
        {},
      ];

      testCases.forEach(data => {
        expect(() => normalizeSyncData(data)).not.toThrow();
      });
    });

    it('should normalize complex nested structure', () => {
      const data = {
        users: {
          user1: {
            name: { name: 'John' },
            emoji: '😎',
            days: {
              today: {
                activities: [{ name: 'Morning', emoji: '☀️' }],
              },
            },
          },
        },
        library: {
          categories: {
            morning: {
              activities: [{ title: 'Brush teeth', emoji: '🦷' }],
            },
          },
          activities: [{ name: 'Exercise', icon: '🏃' }],
        },
        libraryTemplates: [{ title: 'Template', emoji: '📋' }],
        activities: [{ name: 'Legacy', emoji: '📦' }],
      };

      const normalized = normalizeSyncData(data);

      expect(normalized.users.user1.name).toBe('John');
      expect(normalized.users.user1.icon).toBe('😎');
      expect(normalized.users.user1.days.today.activities[0]).toEqual({
        text: 'Morning',
        icon: '☀️',
      });
      expect(normalized.library.categories.morning.activities[0]).toEqual({
        text: 'Brush teeth',
        icon: '🦷',
      });
      expect(normalized.library.activities[0]).toEqual({
        text: 'Exercise',
        icon: '🏃',
      });
      expect(normalized.libraryTemplates[0]).toEqual({
        text: 'Template',
        icon: '📋',
      });
      expect(normalized.activities[0]).toEqual({
        text: 'Legacy',
        icon: '📦',
      });
    });

    it('should not mutate the original data object', () => {
      const data = {
        users: {
          user1: { name: 'Original', emoji: '🔒' },
        },
      };
      const originalCopy = JSON.parse(JSON.stringify(data));
      const normalized = normalizeSyncData(data);

      // Check original data is unchanged
      expect(data).toEqual(originalCopy);
      expect(data.users.user1.name).toBe('Original');
      expect(data.users.user1.emoji).toBe('🔒');

      // Check normalized is different object and has normalized fields
      expect(normalized).not.toBe(data);
      expect(normalized.users.user1.name).toBe('Original');
      expect(normalized.users.user1.icon).toBe('🔒');
      expect(normalized.users.user1.emoji).toBeUndefined();
    });
  });

  describe('needsNormalization', () => {
    it('should return false for null/undefined input', () => {
      expect(needsNormalization(null)).toBe(false);
      expect(needsNormalization(undefined)).toBe(false);
    });

    it('should detect users with emoji field', () => {
      const data = {
        users: {
          user1: { name: 'John', emoji: '😎' },
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect users with object name field', () => {
      const data = {
        users: {
          user1: { name: { name: 'John' }, icon: '👤' },
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect activities with name field in user days', () => {
      const data = {
        users: {
          user1: {
            name: 'John',
            icon: '👤',
            days: {
              today: {
                activities: [{ name: 'Task', icon: '📝' }],
              },
            },
          },
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect activities with title field in user days', () => {
      const data = {
        users: {
          user1: {
            name: 'John',
            icon: '👤',
            days: {
              tomorrow: {
                activities: [{ title: 'Task', icon: '📝' }],
              },
            },
          },
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect activities with emoji field in user days', () => {
      const data = {
        users: {
          user1: {
            name: 'John',
            icon: '👤',
            days: {
              today: {
                activities: [{ text: 'Task', emoji: '📝' }],
              },
            },
          },
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect normalization needs in library categories (array)', () => {
      const data = {
        library: {
          categories: [
            {
              activities: [{ name: 'Activity', icon: '📝' }],
            },
          ],
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect normalization needs in library categories (object)', () => {
      const data = {
        library: {
          categories: {
            cat1: {
              activities: [{ title: 'Activity', icon: '📝' }],
            },
          },
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should detect normalization needs in library.activities', () => {
      const data = {
        library: {
          activities: [{ emoji: '🎯', text: 'Activity' }],
        },
      };
      expect(needsNormalization(data)).toBe(true);
    });

    it('should return false for already normalized data', () => {
      const data = {
        users: {
          user1: {
            name: 'John',
            icon: '👤',
            days: {
              today: {
                activities: [{ text: 'Task', icon: '📝' }],
              },
            },
          },
        },
        library: {
          categories: {
            cat1: {
              activities: [{ text: 'Activity', icon: '✅' }],
            },
          },
          activities: [{ text: 'Lib Activity', icon: '📚' }],
        },
      };
      expect(needsNormalization(data)).toBe(false);
    });

    it('should handle empty data structures', () => {
      const testCases = [
        {},
        { users: {} },
        { users: { user1: {} } },
        { users: { user1: { days: {} } } },
        { users: { user1: { days: { today: {} } } } },
        { users: { user1: { days: { today: { activities: [] } } } } },
        { library: {} },
        { library: { categories: {} } },
        { library: { categories: [] } },
        { library: { activities: [] } },
      ];

      testCases.forEach(data => {
        expect(needsNormalization(data)).toBe(false);
      });
    });

    it('should handle invalid structures without throwing', () => {
      const testCases = [
        { users: null },
        { users: { user1: null } },
        { users: { user1: { days: null } } },
        { users: { user1: { days: { today: null } } } },
        { users: { user1: { days: { today: { activities: null } } } } },
        { users: { user1: { days: { today: { activities: 'not-array' } } } } },
        { library: null },
        { library: { categories: null } },
        { library: { categories: 'not-valid' } },
        { library: { activities: 'not-array' } },
      ];

      testCases.forEach((data, index) => {
        expect(() => needsNormalization(data)).not.toThrow();
        // Also verify it returns false for these invalid structures
        expect(needsNormalization(data)).toBe(false);
      });
    });

    it('should detect any occurrence of old field names', () => {
      // Test various locations where old fields might appear
      const testCases = [
        // User level
        { users: { u1: { emoji: '😎' } } },
        { users: { u1: { name: { text: 'Name' } } } },

        // Activity in user days
        { users: { u1: { days: { today: { activities: [{ name: 'A' }] } } } } },
        {
          users: { u1: { days: { today: { activities: [{ title: 'A' }] } } } },
        },
        {
          users: { u1: { days: { today: { activities: [{ emoji: '📝' }] } } } },
        },

        // Library categories (array)
        { library: { categories: [{ activities: [{ name: 'A' }] }] } },
        { library: { categories: [{ activities: [{ title: 'A' }] }] } },
        { library: { categories: [{ activities: [{ emoji: '📝' }] }] } },

        // Library categories (object)
        { library: { categories: { c1: { activities: [{ name: 'A' }] } } } },
        { library: { categories: { c1: { activities: [{ title: 'A' }] } } } },
        { library: { categories: { c1: { activities: [{ emoji: '📝' }] } } } },

        // Library activities
        { library: { activities: [{ name: 'A' }] } },
        { library: { activities: [{ title: 'A' }] } },
        { library: { activities: [{ emoji: '📝' }] } },
      ];

      testCases.forEach((data, index) => {
        expect(needsNormalization(data)).toBe(true);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle real-world sync data structure', () => {
      const realWorldData = {
        users: {
          'user-abc-123': {
            name: { name: 'Alice Smith' },
            emoji: '🌟',
            theme: 'blue',
            days: {
              '2025-01-13': {
                activities: [
                  {
                    id: 'a1',
                    name: 'Morning routine',
                    emoji: '☀️',
                    completed: true,
                  },
                  {
                    id: 'a2',
                    title: 'Work meeting',
                    icon: '💼',
                    completed: false,
                  },
                ],
              },
            },
          },
        },
        library: {
          categories: {
            morning: {
              name: 'Morning',
              activities: [
                { id: 'lib1', title: 'Brush teeth', emoji: '🦷' },
                { id: 'lib2', name: 'Shower', icon: '🚿' },
              ],
            },
          },
        },
        settings: {
          syncEnabled: true,
          lastSync: '2025-01-13T10:00:00Z',
        },
      };

      expect(needsNormalization(realWorldData)).toBe(true);

      const normalized = normalizeSyncData(realWorldData);

      expect(needsNormalization(normalized)).toBe(false);
      expect(normalized.users['user-abc-123'].name).toBe('Alice Smith');
      expect(normalized.users['user-abc-123'].icon).toBe('🌟');
      expect(
        normalized.users['user-abc-123'].days['2025-01-13'].activities[0].text,
      ).toBe('Morning routine');
      expect(normalized.library.categories.morning.activities[0].text).toBe(
        'Brush teeth',
      );
    });

    it('should be idempotent (normalizing twice gives same result)', () => {
      const data = {
        users: {
          u1: { name: 'User', emoji: '😎' },
        },
        library: {
          activities: [{ title: 'Activity', emoji: '📝' }],
        },
      };

      const normalized1 = normalizeSyncData(data);
      const normalized2 = normalizeSyncData(normalized1);

      expect(normalized2).toEqual(normalized1);
      expect(needsNormalization(normalized2)).toBe(false);
    });

    it('should handle deeply nested normalization', () => {
      const deepData = {
        users: {
          u1: {
            name: { name: { text: 'Nested Name' } },
            emoji: '🎭',
            days: {
              d1: {
                activities: [
                  { name: 'A1', emoji: '1️⃣' },
                  { title: 'A2', icon: '2️⃣' },
                ],
              },
              d2: {
                activities: [{ text: 'A3', emoji: '3️⃣' }],
              },
            },
          },
        },
      };

      const normalized = normalizeSyncData(deepData);

      // The double nested name should still be handled
      expect(normalized.users.u1.name).toBe('User'); // Falls back to default
      expect(normalized.users.u1.icon).toBe('🎭');
      expect(normalized.users.u1.days.d1.activities[0]).toEqual({
        text: 'A1',
        icon: '1️⃣',
      });
    });
  });

  describe('Performance considerations', () => {
    it('should handle large datasets efficiently', () => {
      const largeData = {
        users: {},
        library: { categories: {} },
      };

      // Create 100 users with 10 days each, 20 activities per day
      for (let u = 0; u < 100; u++) {
        const userId = `user-${u}`;
        largeData.users[userId] = {
          name: `User ${u}`,
          emoji: '👤',
          days: {},
        };

        for (let d = 0; d < 10; d++) {
          const dayId = `day-${d}`;
          largeData.users[userId].days[dayId] = {
            activities: [],
          };

          for (let a = 0; a < 20; a++) {
            largeData.users[userId].days[dayId].activities.push({
              name: `Activity ${a}`,
              emoji: '📝',
            });
          }
        }
      }

      // Create 50 categories with 30 activities each
      for (let c = 0; c < 50; c++) {
        const catId = `cat-${c}`;
        largeData.library.categories[catId] = {
          activities: [],
        };

        for (let a = 0; a < 30; a++) {
          largeData.library.categories[catId].activities.push({
            title: `Library Activity ${a}`,
            emoji: '📚',
          });
        }
      }

      const startTime = Date.now();
      const normalized = normalizeSyncData(largeData);
      const endTime = Date.now();

      // Should complete in reasonable time (< 1 second for this dataset)
      expect(endTime - startTime).toBeLessThan(1000);

      // Verify normalization worked
      expect(normalized.users['user-0'].name).toBe('User 0');
      expect(normalized.users['user-0'].icon).toBe('👤');
      expect(normalized.users['user-0'].days['day-0'].activities[0].text).toBe(
        'Activity 0',
      );
      expect(normalized.library.categories['cat-0'].activities[0].text).toBe(
        'Library Activity 0',
      );
    });
  });
});
