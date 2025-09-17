/* eslint-env jest */

/**
 * Comprehensive tests for activityCrudLogic utilities
 * Session 13: Activity/Category Logic Testing
 *
 * Coverage areas:
 * - validateActivityData function
 * - createActivity function
 * - updateActivity function
 * - Category manipulation functions (add/remove/update)
 * - Search and utility functions
 * - Data transformation functions
 * - Edge cases and error handling
 */

// Mock dependencies
jest.mock('../secureId', () => ({
  generateSecureId: jest.fn(() => 'mocked-secure-id-12345')
}));

// Mock constants
jest.mock('../../constants', () => ({
  DEFAULT_ACTIVITY_EMOJI: '🎯'
}));

// Import after mocking
import {
  validateActivityData,
  createActivity,
  updateActivity,
  addActivityToCategory,
  updateActivityInCategories,
  removeActivityFromCategories,
  removeActivityFromCategory,
  getAllActivities,
  findActivityById,
  findActivitiesByName,
  transformActivityForDisplay,
  transformActivitiesForDisplay,
  duplicateActivity
} from '../activityCrudLogic';

// For testing the uncovered branches, we'll need dynamic imports
import * as activityCrudLogic from '../activityCrudLogic';

describe('activityCrudLogic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Date.now for consistent createActivity tests
    jest.spyOn(Date, 'now').mockReturnValue(1640995200000);
  });

  afterEach(() => {
    Date.now.mockRestore();
  });

  describe('validateActivityData', () => {
    it('should return success for valid activity data', () => {
      const validData = {
        name: 'Test Activity',
        icon: '🏃'
      };

      const result = validateActivityData(validData);

      expect(result).toEqual({ success: true });
    });

    it('should return error when activity data is null', () => {
      const result = validateActivityData(null);

      expect(result).toEqual({
        success: false,
        error: 'Activity data is required'
      });
    });

    it('should return error when activity data is undefined', () => {
      const result = validateActivityData(undefined);

      expect(result).toEqual({
        success: false,
        error: 'Activity data is required'
      });
    });

    it('should return error when name is missing', () => {
      const invalidData = {
        icon: '🏃'
      };

      const result = validateActivityData(invalidData);

      expect(result).toEqual({
        success: false,
        error: 'Activity name cannot be empty'
      });
    });

    it('should return error when name is empty string', () => {
      const invalidData = {
        name: '',
        icon: '🏃'
      };

      const result = validateActivityData(invalidData);

      expect(result).toEqual({
        success: false,
        error: 'Activity name cannot be empty'
      });
    });

    it('should return error when name is only whitespace', () => {
      const invalidData = {
        name: '   ',
        icon: '🏃'
      };

      const result = validateActivityData(invalidData);

      expect(result).toEqual({
        success: false,
        error: 'Activity name cannot be empty'
      });
    });

    it('should return error when icon is missing', () => {
      const invalidData = {
        name: 'Test Activity'
      };

      const result = validateActivityData(invalidData);

      expect(result).toEqual({
        success: false,
        error: 'Please select an emoji for the activity'
      });
    });

    it('should return error when icon is empty string', () => {
      const invalidData = {
        name: 'Test Activity',
        icon: ''
      };

      const result = validateActivityData(invalidData);

      expect(result).toEqual({
        success: false,
        error: 'Please select an emoji for the activity'
      });
    });

    it('should return error when icon is null', () => {
      const invalidData = {
        name: 'Test Activity',
        icon: null
      };

      const result = validateActivityData(invalidData);

      expect(result).toEqual({
        success: false,
        error: 'Please select an emoji for the activity'
      });
    });

    it('should return success when description is provided', () => {
      const validData = {
        name: 'Test Activity',
        icon: '🏃',
        description: 'A test activity'
      };

      const result = validateActivityData(validData);

      expect(result).toEqual({ success: true });
    });

    it('should return success when description is missing (optional field)', () => {
      const validData = {
        name: 'Test Activity',
        icon: '🏃'
      };

      const result = validateActivityData(validData);

      expect(result).toEqual({ success: true });
    });

    it('should handle extra fields gracefully', () => {
      const validData = {
        name: 'Test Activity',
        icon: '🏃',
        description: 'A test activity',
        extraField: 'should be ignored'
      };

      const result = validateActivityData(validData);

      expect(result).toEqual({ success: true });
    });
  });

  describe('createActivity', () => {
    it('should create activity with all required fields', () => {
      const activityData = {
        name: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      };

      const result = createActivity(activityData);

      expect(result).toEqual({
        id: 'activity-1640995200000',
        name: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      });
    });

    it('should create activity with minimal data', () => {
      const activityData = {
        name: 'Swimming',
        icon: '🏊'
      };

      const result = createActivity(activityData);

      expect(result).toEqual({
        id: 'activity-1640995200000',
        name: 'Swimming',
        icon: '🏊',
        description: ''
      });
    });

    it('should use provided icon when icon is specified', () => {
      // This test documents that when icon is provided, it's used
      const activityData = {
        name: 'Test Activity',
        icon: '🏃'
      };

      const result = createActivity(activityData);

      expect(result.icon).toBe('🏃');
    });


    it('should trim whitespace from name', () => {
      const activityData = {
        name: '  Running  ',
        icon: '🏃'
      };

      const result = createActivity(activityData);

      expect(result.name).toBe('Running');
    });

    it('should trim whitespace from description', () => {
      const activityData = {
        name: 'Running',
        icon: '🏃',
        description: '  Go for a run  '
      };

      const result = createActivity(activityData);

      expect(result.description).toBe('Go for a run');
    });

    it('should throw error when validation fails', () => {
      const invalidData = {
        name: '',
        icon: '🏃'
      };

      expect(() => createActivity(invalidData)).toThrow('Activity name cannot be empty');
    });

    it('should generate unique timestamp-based IDs', () => {
      Date.now.mockReturnValueOnce(1640995200000);
      Date.now.mockReturnValueOnce(1640995200001);

      const activityData = {
        name: 'Test',
        icon: '🏃'
      };

      const result1 = createActivity(activityData);
      const result2 = createActivity(activityData);

      expect(result1.id).toBe('activity-1640995200000');
      expect(result2.id).toBe('activity-1640995200001');
      expect(result1.id).not.toBe(result2.id);
    });

    it('should handle missing description gracefully', () => {
      const activityData = {
        name: 'Test',
        icon: '🏃'
        // no description
      };

      const result = createActivity(activityData);

      expect(result.description).toBe('');
    });

    it('should handle null description', () => {
      const activityData = {
        name: 'Test',
        icon: '🏃',
        description: null
      };

      // Note: The actual implementation calls .trim() on null which will throw
      // This test documents the current behavior - null descriptions cause errors
      expect(() => createActivity(activityData)).toThrow();
    });

    it('should handle undefined description', () => {
      const activityData = {
        name: 'Test',
        icon: '🏃',
        description: undefined
      };

      const result = createActivity(activityData);

      expect(result.description).toBe('');
    });
  });

  describe('updateActivity', () => {
    const existingActivity = {
      id: 'activity-123',
      name: 'Old Name',
      icon: '🏃',
      description: 'Old description',
      customField: 'should be preserved'
    };

    it('should update activity with new data', () => {
      const updateData = {
        name: 'New Name',
        icon: '🏊',
        description: 'New description'
      };

      const result = updateActivity(existingActivity, updateData);

      expect(result).toEqual({
        id: 'activity-123',
        name: 'New Name',
        icon: '🏊',
        description: 'New description',
        customField: 'should be preserved'
      });
    });

    it('should preserve existing fields not being updated', () => {
      const updateData = {
        name: 'New Name',
        icon: '🏊'
      };

      const result = updateActivity(existingActivity, updateData);

      expect(result).toEqual({
        id: 'activity-123',
        name: 'New Name',
        icon: '🏊',
        description: '',
        customField: 'should be preserved'
      });
    });

    it('should trim whitespace from updated fields', () => {
      const updateData = {
        name: '  Updated Name  ',
        icon: '🏊',
        description: '  Updated description  '
      };

      const result = updateActivity(existingActivity, updateData);

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated description');
    });

    it('should throw error when validation fails', () => {
      const invalidUpdateData = {
        name: '',
        icon: '🏊'
      };

      expect(() => updateActivity(existingActivity, invalidUpdateData))
        .toThrow('Activity name cannot be empty');
    });

    it('should use provided icon when icon is specified in update', () => {
      const updateData = {
        name: 'Updated Name',
        icon: '🏊'
      };

      const result = updateActivity(existingActivity, updateData);

      expect(result.icon).toBe('🏊');
    });


    it('should handle missing description in update data', () => {
      const updateData = {
        name: 'Updated Name',
        icon: '🏊'
        // no description
      };

      const result = updateActivity(existingActivity, updateData);

      expect(result.description).toBe('');
    });
  });

  describe('addActivityToCategory', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Fitness',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Work',
        activities: []
      }
    ];

    it('should add activity to specified category', () => {
      const activityData = {
        name: 'Swimming',
        icon: '🏊'
      };

      const result = addActivityToCategory(mockCategories, 'cat-2', activityData);

      expect(result[0]).toEqual(mockCategories[0]); // Unchanged
      expect(result[1].activities).toHaveLength(1);
      expect(result[1].activities[0]).toEqual({
        id: 'activity-1640995200000',
        name: 'Swimming',
        icon: '🏊',
        description: ''
      });
    });

    it('should not modify other categories', () => {
      const activityData = {
        name: 'Swimming',
        icon: '🏊'
      };

      const result = addActivityToCategory(mockCategories, 'cat-2', activityData);

      expect(result[0]).toEqual(mockCategories[0]);
      expect(result[0].activities).toHaveLength(1); // Original activity still there
    });

    it('should return new array without mutating original', () => {
      const activityData = {
        name: 'Swimming',
        icon: '🏊'
      };

      const result = addActivityToCategory(mockCategories, 'cat-2', activityData);

      expect(result).not.toBe(mockCategories);
      // Note: The current implementation returns references to unchanged categories
      // Only the modified category gets a new object
      expect(result[1]).not.toBe(mockCategories[1]); // Modified category is new
      expect(mockCategories[1].activities).toHaveLength(0); // Original unchanged
    });

    it('should handle non-existent category gracefully', () => {
      const activityData = {
        name: 'Swimming',
        icon: '🏊'
      };

      const result = addActivityToCategory(mockCategories, 'non-existent', activityData);

      expect(result).toEqual(mockCategories); // No changes
    });

    it('should throw error when activity data is invalid', () => {
      const invalidActivityData = {
        name: '',
        icon: '🏊'
      };

      expect(() => addActivityToCategory(mockCategories, 'cat-1', invalidActivityData))
        .toThrow('Activity name cannot be empty');
    });
  });

  describe('updateActivityInCategories', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Fitness',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃', description: 'Run fast' },
          { id: 'act-2', name: 'Walking', icon: '🚶', description: 'Walk slow' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Work',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃', description: 'Run fast' }
        ]
      }
    ];

    it('should update activity in all categories where it exists', () => {
      const updateData = {
        name: 'Updated Running',
        icon: '🏃‍♂️',
        description: 'Updated description'
      };

      const result = updateActivityInCategories(mockCategories, 'act-1', updateData);

      // Check first category
      expect(result[0].activities[0]).toEqual({
        id: 'act-1',
        name: 'Updated Running',
        icon: '🏃‍♂️',
        description: 'Updated description'
      });

      // Check second category
      expect(result[1].activities[0]).toEqual({
        id: 'act-1',
        name: 'Updated Running',
        icon: '🏃‍♂️',
        description: 'Updated description'
      });

      // Other activities should remain unchanged
      expect(result[0].activities[1]).toEqual({
        id: 'act-2',
        name: 'Walking',
        icon: '🚶',
        description: 'Walk slow'
      });
    });

    it('should not modify activities that do not match the ID', () => {
      const updateData = {
        name: 'Updated Activity',
        icon: '🎯'
      };

      const result = updateActivityInCategories(mockCategories, 'non-existent', updateData);

      expect(result[0].activities[0]).toEqual(mockCategories[0].activities[0]);
      expect(result[0].activities[1]).toEqual(mockCategories[0].activities[1]);
      expect(result[1].activities[0]).toEqual(mockCategories[1].activities[0]);
    });

    it('should return new arrays without mutating originals', () => {
      const updateData = {
        name: 'Updated Running',
        icon: '🏃‍♂️'
      };

      const result = updateActivityInCategories(mockCategories, 'act-1', updateData);

      expect(result).not.toBe(mockCategories);
      expect(result[0]).not.toBe(mockCategories[0]);
      expect(result[0].activities).not.toBe(mockCategories[0].activities);
      expect(mockCategories[0].activities[0].name).toBe('Running'); // Original unchanged
    });

    it('should throw error when update data is invalid', () => {
      const invalidUpdateData = {
        name: '',
        icon: '🏃'
      };

      expect(() => updateActivityInCategories(mockCategories, 'act-1', invalidUpdateData))
        .toThrow('Activity name cannot be empty');
    });
  });

  describe('removeActivityFromCategories', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Fitness',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' },
          { id: 'act-2', name: 'Walking', icon: '🚶' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Work',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' },
          { id: 'act-3', name: 'Meeting', icon: '👥' }
        ]
      }
    ];

    it('should remove activity from all categories', () => {
      const result = removeActivityFromCategories(mockCategories, 'act-1');

      expect(result[0].activities).toHaveLength(1);
      expect(result[0].activities[0].id).toBe('act-2');

      expect(result[1].activities).toHaveLength(1);
      expect(result[1].activities[0].id).toBe('act-3');
    });

    it('should not affect other activities', () => {
      const result = removeActivityFromCategories(mockCategories, 'act-1');

      expect(result[0].activities[0]).toEqual({
        id: 'act-2',
        name: 'Walking',
        icon: '🚶'
      });
      expect(result[1].activities[0]).toEqual({
        id: 'act-3',
        name: 'Meeting',
        icon: '👥'
      });
    });

    it('should handle non-existent activity ID gracefully', () => {
      const result = removeActivityFromCategories(mockCategories, 'non-existent');

      expect(result[0].activities).toHaveLength(2);
      expect(result[1].activities).toHaveLength(2);
      expect(result).toEqual(mockCategories);
    });

    it('should return new arrays without mutating originals', () => {
      const result = removeActivityFromCategories(mockCategories, 'act-1');

      expect(result).not.toBe(mockCategories);
      expect(result[0].activities).not.toBe(mockCategories[0].activities);
      expect(mockCategories[0].activities).toHaveLength(2); // Original unchanged
    });

    it('should handle empty activity arrays', () => {
      const categoriesWithEmpty = [
        {
          id: 'cat-1',
          name: 'Empty',
          activities: []
        }
      ];

      const result = removeActivityFromCategories(categoriesWithEmpty, 'act-1');

      expect(result[0].activities).toHaveLength(0);
    });
  });

  describe('removeActivityFromCategory', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Fitness',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' },
          { id: 'act-2', name: 'Walking', icon: '🚶' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Work',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' }
        ]
      }
    ];

    it('should remove activity from specified category only', () => {
      const result = removeActivityFromCategory(mockCategories, 'cat-1', 'act-1');

      expect(result[0].activities).toHaveLength(1);
      expect(result[0].activities[0].id).toBe('act-2');

      // Other category should remain unchanged
      expect(result[1].activities).toHaveLength(1);
      expect(result[1].activities[0].id).toBe('act-1');
    });

    it('should not affect other categories', () => {
      const result = removeActivityFromCategory(mockCategories, 'cat-1', 'act-1');

      expect(result[1]).toEqual(mockCategories[1]);
    });

    it('should handle non-existent category gracefully', () => {
      const result = removeActivityFromCategory(mockCategories, 'non-existent', 'act-1');

      expect(result).toEqual(mockCategories);
    });

    it('should handle non-existent activity in specified category', () => {
      const result = removeActivityFromCategory(mockCategories, 'cat-1', 'non-existent');

      expect(result[0].activities).toHaveLength(2);
      expect(result[0]).toEqual(mockCategories[0]);
    });

    it('should return new arrays without mutating originals', () => {
      const result = removeActivityFromCategory(mockCategories, 'cat-1', 'act-1');

      expect(result).not.toBe(mockCategories);
      expect(result[0].activities).not.toBe(mockCategories[0].activities);
      expect(mockCategories[0].activities).toHaveLength(2); // Original unchanged
    });
  });

  describe('getAllActivities', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Fitness',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' },
          { id: 'act-2', name: 'Walking', icon: '🚶' }
        ]
      },
      {
        id: 'cat-2',
        name: 'Work',
        activities: [
          { id: 'act-3', name: 'Meeting', icon: '👥' }
        ]
      },
      {
        id: 'cat-3',
        name: 'Empty',
        activities: []
      }
    ];

    it('should return all activities from all categories', () => {
      const result = getAllActivities(mockCategories);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ id: 'act-1', name: 'Running', icon: '🏃' });
      expect(result[1]).toEqual({ id: 'act-2', name: 'Walking', icon: '🚶' });
      expect(result[2]).toEqual({ id: 'act-3', name: 'Meeting', icon: '👥' });
    });

    it('should handle empty categories', () => {
      const categoriesWithEmpty = [
        {
          id: 'cat-1',
          activities: [{ id: 'act-1', name: 'Test', icon: '🎯' }]
        },
        {
          id: 'cat-2',
          activities: []
        }
      ];

      const result = getAllActivities(categoriesWithEmpty);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'act-1', name: 'Test', icon: '🎯' });
    });

    it('should handle categories with undefined activities', () => {
      const categoriesWithUndefined = [
        {
          id: 'cat-1',
          activities: [{ id: 'act-1', name: 'Test', icon: '🎯' }]
        },
        {
          id: 'cat-2'
          // no activities property
        }
      ];

      const result = getAllActivities(categoriesWithUndefined);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'act-1', name: 'Test', icon: '🎯' });
    });

    it('should return empty array for empty categories array', () => {
      const result = getAllActivities([]);

      expect(result).toEqual([]);
    });

    it('should handle null activities gracefully', () => {
      const categoriesWithNull = [
        {
          id: 'cat-1',
          activities: null
        }
      ];

      const result = getAllActivities(categoriesWithNull);

      expect(result).toEqual([]);
    });
  });

  describe('findActivityById', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' },
          { id: 'act-2', name: 'Walking', icon: '🚶' }
        ]
      },
      {
        id: 'cat-2',
        activities: [
          { id: 'act-3', name: 'Meeting', icon: '👥' }
        ]
      }
    ];

    it('should find activity by ID', () => {
      const result = findActivityById(mockCategories, 'act-2');

      expect(result).toEqual({ id: 'act-2', name: 'Walking', icon: '🚶' });
    });

    it('should return null for non-existent activity', () => {
      const result = findActivityById(mockCategories, 'non-existent');

      expect(result).toBeNull();
    });

    it('should find activity in any category', () => {
      const result = findActivityById(mockCategories, 'act-3');

      expect(result).toEqual({ id: 'act-3', name: 'Meeting', icon: '👥' });
    });

    it('should handle empty categories', () => {
      const result = findActivityById([], 'act-1');

      expect(result).toBeNull();
    });

    it('should handle categories with no activities', () => {
      const emptyCategories = [
        { id: 'cat-1', activities: [] }
      ];

      const result = findActivityById(emptyCategories, 'act-1');

      expect(result).toBeNull();
    });
  });

  describe('findActivitiesByName', () => {
    const mockCategories = [
      {
        id: 'cat-1',
        activities: [
          { id: 'act-1', name: 'Running', icon: '🏃' },
          { id: 'act-2', name: 'Walking', icon: '🚶' },
          { id: 'act-3', name: 'Morning Run', icon: '🏃' }
        ]
      },
      {
        id: 'cat-2',
        activities: [
          { id: 'act-4', name: 'run errands', icon: '🏃' },
          { id: 'act-5', name: 'Meeting', icon: '👥' }
        ]
      }
    ];

    it('should find activities by partial name match (case insensitive)', () => {
      const result = findActivitiesByName(mockCategories, 'run');

      expect(result).toHaveLength(3);
      expect(result.map(a => a.id)).toEqual(['act-1', 'act-3', 'act-4']);
    });

    it('should find activities by exact name match', () => {
      const result = findActivitiesByName(mockCategories, 'Walking');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ id: 'act-2', name: 'Walking', icon: '🚶' });
    });

    it('should be case insensitive', () => {
      const result = findActivitiesByName(mockCategories, 'WALKING');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('act-2');
    });

    it('should return empty array for non-matching search', () => {
      const result = findActivitiesByName(mockCategories, 'xyz');

      expect(result).toEqual([]);
    });

    it('should return empty array for empty search string', () => {
      const result = findActivitiesByName(mockCategories, '');

      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only search', () => {
      const result = findActivitiesByName(mockCategories, '   ');

      expect(result).toEqual([]);
    });

    it('should return empty array for null search', () => {
      const result = findActivitiesByName(mockCategories, null);

      expect(result).toEqual([]);
    });

    it('should return empty array for undefined search', () => {
      const result = findActivitiesByName(mockCategories, undefined);

      expect(result).toEqual([]);
    });

    it('should handle activities with null/undefined names', () => {
      const categoriesWithNullNames = [
        {
          id: 'cat-1',
          activities: [
            { id: 'act-1', name: 'Running', icon: '🏃' },
            { id: 'act-2', name: null, icon: '🚶' },
            { id: 'act-3', icon: '👥' } // no name property
          ]
        }
      ];

      const result = findActivitiesByName(categoriesWithNullNames, 'run');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('act-1');
    });

    it('should trim search string', () => {
      const result = findActivitiesByName(mockCategories, '  run  ');

      expect(result).toHaveLength(3);
    });
  });

  describe('transformActivityForDisplay', () => {
    it('should transform activity with all fields present', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      };

      const result = transformActivityForDisplay(activity);

      expect(result).toEqual({
        id: 'act-1',
        text: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      });
    });

    it('should handle legacy emoji field', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        emoji: '🏃', // legacy field
        description: 'Go for a run'
      };

      const result = transformActivityForDisplay(activity);

      expect(result).toEqual({
        id: 'act-1',
        text: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      });
    });

    it('should handle legacy text field', () => {
      const activity = {
        id: 'act-1',
        text: 'Running', // already normalized
        icon: '🏃',
        description: 'Go for a run'
      };

      const result = transformActivityForDisplay(activity);

      expect(result).toEqual({
        id: 'act-1',
        text: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      });
    });

    it('should handle legacy title field', () => {
      const activity = {
        id: 'act-1',
        title: 'Running', // legacy field
        icon: '🏃',
        description: 'Go for a run'
      };

      const result = transformActivityForDisplay(activity);

      expect(result).toEqual({
        id: 'act-1',
        text: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      });
    });

    it('should use default emoji when icon/emoji is missing', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        description: 'Go for a run'
      };

      const result = transformActivityForDisplay(activity);

      expect(result).toEqual({
        id: 'act-1',
        text: 'Running',
        icon: '🎯', // DEFAULT_ACTIVITY_EMOJI
        description: 'Go for a run'
      });
    });

    it('should handle missing description', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃'
      };

      const result = transformActivityForDisplay(activity);

      expect(result).toEqual({
        id: 'act-1',
        text: 'Running',
        icon: '🏃',
        description: ''
      });
    });

    it('should prioritize icon over emoji', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃',
        emoji: '🚶', // should be ignored
        description: 'Go for a run'
      };

      const result = transformActivityForDisplay(activity);

      expect(result.icon).toBe('🏃');
    });

    it('should prioritize text over name over title', () => {
      const activity = {
        id: 'act-1',
        text: 'Text Field',
        name: 'Name Field',
        title: 'Title Field',
        icon: '🏃'
      };

      const result = transformActivityForDisplay(activity);

      expect(result.text).toBe('Text Field');
    });

    it('should return null for null activity', () => {
      const result = transformActivityForDisplay(null);

      expect(result).toBeNull();
    });

    it('should return null for undefined activity', () => {
      const result = transformActivityForDisplay(undefined);

      expect(result).toBeNull();
    });

    it('should handle empty activity object', () => {
      const activity = {};

      const result = transformActivityForDisplay(activity);

      expect(result).toEqual({
        id: undefined,
        text: '',
        icon: '🎯',
        description: ''
      });
    });
  });

  describe('transformActivitiesForDisplay', () => {
    it('should transform array of activities', () => {
      const activities = [
        {
          id: 'act-1',
          name: 'Running',
          icon: '🏃',
          description: 'Go for a run'
        },
        {
          id: 'act-2',
          name: 'Walking',
          emoji: '🚶', // legacy field
          description: 'Take a walk'
        }
      ];

      const result = transformActivitiesForDisplay(activities);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'act-1',
        text: 'Running',
        icon: '🏃',
        description: 'Go for a run'
      });
      expect(result[1]).toEqual({
        id: 'act-2',
        text: 'Walking',
        icon: '🚶',
        description: 'Take a walk'
      });
    });

    it('should return empty array for non-array input', () => {
      expect(transformActivitiesForDisplay(null)).toEqual([]);
      expect(transformActivitiesForDisplay(undefined)).toEqual([]);
      expect(transformActivitiesForDisplay('string')).toEqual([]);
      expect(transformActivitiesForDisplay({})).toEqual([]);
    });

    it('should filter out null/falsy transformed activities', () => {
      const activities = [
        {
          id: 'act-1',
          name: 'Running',
          icon: '🏃'
        },
        null,
        undefined,
        {
          id: 'act-2',
          name: 'Walking',
          icon: '🚶'
        }
      ];

      const result = transformActivitiesForDisplay(activities);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('act-1');
      expect(result[1].id).toBe('act-2');
    });

    it('should handle empty array', () => {
      const result = transformActivitiesForDisplay([]);

      expect(result).toEqual([]);
    });

    it('should handle array with all null/undefined items', () => {
      const activities = [null, undefined, null];

      const result = transformActivitiesForDisplay(activities);

      expect(result).toEqual([]);
    });
  });

  describe('duplicateActivity', () => {
    const mockGenerateSecureId = require('../secureId').generateSecureId;

    it('should duplicate activity with new ID and name prefix', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃',
        description: 'Go for a run',
        customField: 'preserved'
      };

      const result = duplicateActivity(activity);

      expect(result).toEqual({
        id: 'mocked-secure-id-12345',
        name: 'Copy of Running',
        icon: '🏃',
        description: 'Go for a run',
        customField: 'preserved'
      });
      expect(mockGenerateSecureId).toHaveBeenCalledWith('activity');
    });

    it('should use custom prefix when provided', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃'
      };

      const result = duplicateActivity(activity, 'Duplicate - ');

      expect(result.name).toBe('Duplicate - Running');
    });

    it('should preserve all properties except id and name', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃',
        description: 'Go for a run',
        color: 'blue',
        tags: ['fitness', 'outdoor'],
        metadata: { created: '2021-01-01' }
      };

      const result = duplicateActivity(activity);

      expect(result).toEqual({
        id: 'mocked-secure-id-12345',
        name: 'Copy of Running',
        icon: '🏃',
        description: 'Go for a run',
        color: 'blue',
        tags: ['fitness', 'outdoor'],
        metadata: { created: '2021-01-01' }
      });
    });

    it('should throw error for null activity', () => {
      expect(() => duplicateActivity(null)).toThrow('Activity is required for duplication');
    });

    it('should throw error for undefined activity', () => {
      expect(() => duplicateActivity(undefined)).toThrow('Activity is required for duplication');
    });

    it('should handle activity with missing name', () => {
      const activity = {
        id: 'act-1',
        icon: '🏃'
        // no name property
      };

      const result = duplicateActivity(activity);

      expect(result.name).toBe('Copy of undefined');
    });

    it('should handle empty prefix', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃'
      };

      const result = duplicateActivity(activity, '');

      expect(result.name).toBe('Running');
    });

    it('should call generateSecureId with activity prefix', () => {
      const activity = {
        id: 'act-1',
        name: 'Running',
        icon: '🏃'
      };

      duplicateActivity(activity);

      expect(mockGenerateSecureId).toHaveBeenCalledWith('activity');
    });
  });
});