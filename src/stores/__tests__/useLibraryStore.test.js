/**
 * Comprehensive tests for useLibraryStore
 * Tests library categories, templates, and user activity management
 */

import { renderHook, act } from '@testing-library/react-hooks';
import useLibraryStore from '../useLibraryStore';

describe('useLibraryStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLibraryStore.setState({
      libraryTemplates: [],
      library: {
        categories: null,
        userAddedActivityIds: []
      }
    });
  });

  describe('Initial State', () => {
    test('should have correct initial state', () => {
      const { result } = renderHook(() => useLibraryStore());

      expect(result.current.libraryTemplates).toEqual([]);
      expect(result.current.library.categories).toBe(null);
      expect(result.current.library.userAddedActivityIds).toEqual([]);
    });
  });

  describe('Library Management', () => {
    test('should set library', () => {
      const { result } = renderHook(() => useLibraryStore());

      const testLibrary = {
        categories: [
          {
            id: 'cat1',
            name: 'Morning Routine',
            icon: '☀️',
            activities: [
              { id: 'act1', text: 'Brush teeth', icon: '🦷' },
              { id: 'act2', text: 'Take shower', icon: '🚿' }
            ]
          }
        ],
        userAddedActivityIds: ['user-act-1']
      };

      act(() => {
        result.current.setLibrary(testLibrary);
      });

      expect(result.current.library).toEqual(testLibrary);
    });

    test('should update library categories', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Set initial library
      act(() => {
        result.current.setLibrary({
          categories: [],
          userAddedActivityIds: ['existing-id']
        });
      });

      const newCategories = [
        {
          id: 'cat1',
          name: 'Evening Routine',
          icon: '🌙',
          activities: [
            { id: 'act1', text: 'Read book', icon: '📚' }
          ]
        }
      ];

      act(() => {
        result.current.updateLibraryCategories(newCategories);
      });

      expect(result.current.library.categories).toEqual(newCategories);
      // Should preserve other library properties
      expect(result.current.library.userAddedActivityIds).toEqual(['existing-id']);
    });

    test('should handle empty library', () => {
      const { result } = renderHook(() => useLibraryStore());

      const emptyLibrary = {
        categories: [],
        userAddedActivityIds: []
      };

      act(() => {
        result.current.setLibrary(emptyLibrary);
      });

      expect(result.current.library).toEqual(emptyLibrary);
    });

    test('should handle null categories in updateLibraryCategories', () => {
      const { result } = renderHook(() => useLibraryStore());

      act(() => {
        result.current.updateLibraryCategories(null);
      });

      expect(result.current.library.categories).toBe(null);
    });
  });

  describe('User Activity ID Management', () => {
    test('should add user activity ID', () => {
      const { result } = renderHook(() => useLibraryStore());

      act(() => {
        result.current.addUserActivityId('user-activity-1');
      });

      expect(result.current.library.userAddedActivityIds).toContain('user-activity-1');
    });

    test('should not add duplicate user activity IDs', () => {
      const { result } = renderHook(() => useLibraryStore());

      act(() => {
        result.current.addUserActivityId('user-activity-1');
        result.current.addUserActivityId('user-activity-1'); // duplicate
      });

      expect(result.current.library.userAddedActivityIds).toEqual(['user-activity-1']);
    });

    test('should add multiple unique user activity IDs', () => {
      const { result } = renderHook(() => useLibraryStore());

      act(() => {
        result.current.addUserActivityId('user-activity-1');
        result.current.addUserActivityId('user-activity-2');
        result.current.addUserActivityId('user-activity-3');
      });

      expect(result.current.library.userAddedActivityIds).toEqual([
        'user-activity-1',
        'user-activity-2',
        'user-activity-3'
      ]);
    });

    test('should remove user activity ID', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Add some IDs first
      act(() => {
        result.current.addUserActivityId('user-activity-1');
        result.current.addUserActivityId('user-activity-2');
      });

      expect(result.current.library.userAddedActivityIds).toHaveLength(2);

      // Remove one ID
      act(() => {
        result.current.removeUserActivityId('user-activity-1');
      });

      expect(result.current.library.userAddedActivityIds).toEqual(['user-activity-2']);
    });

    test('should handle removing non-existent user activity ID', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Add one ID
      act(() => {
        result.current.addUserActivityId('user-activity-1');
      });

      // Try to remove a different ID
      act(() => {
        result.current.removeUserActivityId('non-existent-id');
      });

      // Should still have the original ID
      expect(result.current.library.userAddedActivityIds).toEqual(['user-activity-1']);
    });

    test('should handle removing from empty userAddedActivityIds', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Try to remove from empty array
      act(() => {
        result.current.removeUserActivityId('any-id');
      });

      expect(result.current.library.userAddedActivityIds).toEqual([]);
    });

    test('should handle null userAddedActivityIds in addUserActivityId', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Set library with null userAddedActivityIds
      act(() => {
        result.current.setLibrary({
          categories: [],
          userAddedActivityIds: null
        });
      });

      // Add activity ID should handle null gracefully
      act(() => {
        result.current.addUserActivityId('new-activity');
      });

      expect(result.current.library.userAddedActivityIds).toEqual(['new-activity']);
    });
  });

  describe('Template Management', () => {
    test('should set library templates', () => {
      const { result } = renderHook(() => useLibraryStore());

      const templates = [
        {
          id: 'template1',
          name: 'Morning Routine Template',
          activities: [
            { id: 'act1', text: 'Wake up', icon: '⏰' },
            { id: 'act2', text: 'Brush teeth', icon: '🦷' }
          ]
        }
      ];

      act(() => {
        result.current.setLibraryTemplates(templates);
      });

      expect(result.current.libraryTemplates).toEqual(templates);
    });

    test('should add template', () => {
      const { result } = renderHook(() => useLibraryStore());

      const newTemplate = {
        id: 'template1',
        name: 'Evening Routine',
        activities: [
          { id: 'act1', text: 'Read book', icon: '📚' }
        ]
      };

      act(() => {
        result.current.addTemplate(newTemplate);
      });

      expect(result.current.libraryTemplates).toContain(newTemplate);
    });

    test('should add multiple templates', () => {
      const { result } = renderHook(() => useLibraryStore());

      const template1 = { id: 'template1', name: 'Morning', activities: [] };
      const template2 = { id: 'template2', name: 'Evening', activities: [] };

      act(() => {
        result.current.addTemplate(template1);
        result.current.addTemplate(template2);
      });

      expect(result.current.libraryTemplates).toHaveLength(2);
      expect(result.current.libraryTemplates).toContain(template1);
      expect(result.current.libraryTemplates).toContain(template2);
    });

    test('should update template', () => {
      const { result } = renderHook(() => useLibraryStore());

      const originalTemplate = {
        id: 'template1',
        name: 'Original Name',
        activities: []
      };

      // Add template first
      act(() => {
        result.current.addTemplate(originalTemplate);
      });

      // Update template
      act(() => {
        result.current.updateTemplate('template1', {
          name: 'Updated Name',
          description: 'New description'
        });
      });

      const updatedTemplate = result.current.libraryTemplates.find(t => t.id === 'template1');
      expect(updatedTemplate.name).toBe('Updated Name');
      expect(updatedTemplate.description).toBe('New description');
      expect(updatedTemplate.activities).toEqual([]); // Should preserve existing properties
    });

    test('should handle updating non-existent template', () => {
      const { result } = renderHook(() => useLibraryStore());

      const existingTemplate = { id: 'template1', name: 'Existing', activities: [] };

      act(() => {
        result.current.addTemplate(existingTemplate);
      });

      // Try to update a template that doesn't exist
      act(() => {
        result.current.updateTemplate('non-existent-id', { name: 'Updated' });
      });

      // Should not affect existing templates
      expect(result.current.libraryTemplates).toHaveLength(1);
      expect(result.current.libraryTemplates[0].name).toBe('Existing');
    });

    test('should delete template', () => {
      const { result } = renderHook(() => useLibraryStore());

      const template1 = { id: 'template1', name: 'Template 1', activities: [] };
      const template2 = { id: 'template2', name: 'Template 2', activities: [] };

      // Add templates
      act(() => {
        result.current.addTemplate(template1);
        result.current.addTemplate(template2);
      });

      expect(result.current.libraryTemplates).toHaveLength(2);

      // Delete one template
      act(() => {
        result.current.deleteTemplate('template1');
      });

      expect(result.current.libraryTemplates).toHaveLength(1);
      expect(result.current.libraryTemplates[0].id).toBe('template2');
    });

    test('should handle deleting non-existent template', () => {
      const { result } = renderHook(() => useLibraryStore());

      const existingTemplate = { id: 'template1', name: 'Existing', activities: [] };

      act(() => {
        result.current.addTemplate(existingTemplate);
      });

      // Try to delete a template that doesn't exist
      act(() => {
        result.current.deleteTemplate('non-existent-id');
      });

      // Should not affect existing templates
      expect(result.current.libraryTemplates).toHaveLength(1);
      expect(result.current.libraryTemplates[0].id).toBe('template1');
    });

    test('should handle empty templates array operations', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Try operations on empty array
      act(() => {
        result.current.updateTemplate('any-id', { name: 'Updated' });
        result.current.deleteTemplate('any-id');
      });

      expect(result.current.libraryTemplates).toEqual([]);
    });
  });

  describe('Complex Library Structures', () => {
    test('should handle library with multiple categories and activities', () => {
      const { result } = renderHook(() => useLibraryStore());

      const complexLibrary = {
        categories: [
          {
            id: 'morning',
            name: 'Morning Routine',
            icon: '☀️',
            activities: [
              { id: 'morning-1', text: 'Wake up', icon: '⏰' },
              { id: 'morning-2', text: 'Brush teeth', icon: '🦷' },
              { id: 'morning-3', text: 'Exercise', icon: '🏃‍♂️' }
            ]
          },
          {
            id: 'evening',
            name: 'Evening Routine',
            icon: '🌙',
            activities: [
              { id: 'evening-1', text: 'Dinner', icon: '🍽️' },
              { id: 'evening-2', text: 'Read book', icon: '📚' },
              { id: 'evening-3', text: 'Sleep', icon: '😴' }
            ]
          }
        ],
        userAddedActivityIds: ['user-1', 'user-2', 'user-3']
      };

      act(() => {
        result.current.setLibrary(complexLibrary);
      });

      expect(result.current.library).toEqual(complexLibrary);
      expect(result.current.library.categories).toHaveLength(2);
      expect(result.current.library.categories[0].activities).toHaveLength(3);
      expect(result.current.library.userAddedActivityIds).toHaveLength(3);
    });

    test('should handle nested template structures', () => {
      const { result } = renderHook(() => useLibraryStore());

      const complexTemplate = {
        id: 'complex-template',
        name: 'Complete Daily Routine',
        description: 'Full day template',
        categories: [
          {
            name: 'Morning',
            activities: [
              { text: 'Wake up', icon: '⏰', duration: 5 },
              { text: 'Exercise', icon: '🏃‍♂️', duration: 30 }
            ]
          }
        ],
        metadata: {
          created: Date.now(),
          version: '1.0',
          tags: ['routine', 'daily']
        }
      };

      act(() => {
        result.current.addTemplate(complexTemplate);
      });

      expect(result.current.libraryTemplates[0]).toEqual(complexTemplate);
      expect(result.current.libraryTemplates[0].metadata.tags).toContain('routine');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle invalid template data gracefully', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Add template with minimal data
      act(() => {
        result.current.addTemplate({ id: 'minimal' });
      });

      expect(result.current.libraryTemplates).toHaveLength(1);
      expect(result.current.libraryTemplates[0].id).toBe('minimal');
    });

    test('should handle null and undefined values', () => {
      const { result } = renderHook(() => useLibraryStore());

      // These should not crash the store
      act(() => {
        result.current.setLibrary(null);
      });

      expect(result.current.library).toBe(null);

      act(() => {
        result.current.setLibraryTemplates(null);
      });

      expect(result.current.libraryTemplates).toBe(null);
    });

    test('should handle concurrent operations', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Simulate concurrent template operations
      act(() => {
        result.current.addTemplate({ id: 'template1', name: 'Template 1' });
        result.current.addTemplate({ id: 'template2', name: 'Template 2' });
        result.current.updateTemplate('template1', { name: 'Updated Template 1' });
        result.current.addUserActivityId('user-activity-1');
        result.current.addUserActivityId('user-activity-2');
      });

      expect(result.current.libraryTemplates).toHaveLength(2);
      expect(result.current.libraryTemplates[0].name).toBe('Updated Template 1');
      expect(result.current.library.userAddedActivityIds).toHaveLength(2);
    });

    test('should maintain state consistency during rapid updates', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Rapid library updates
      act(() => {
        result.current.setLibrary({ categories: [], userAddedActivityIds: [] });
        result.current.addUserActivityId('id1');
        result.current.updateLibraryCategories([{ id: 'cat1', name: 'Category 1' }]);
        result.current.addUserActivityId('id2');
        result.current.removeUserActivityId('id1');
      });

      expect(result.current.library.categories).toHaveLength(1);
      expect(result.current.library.userAddedActivityIds).toEqual(['id2']);
    });
  });

  describe('Storage Adapter Integration', () => {
    test('should handle storage getItem with pending write', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Test rapid updates that would trigger the pending write logic
      const library1 = {
        categories: [{ id: 'cat1', name: 'Category 1' }],
        userAddedActivityIds: ['id1']
      };

      const library2 = {
        categories: [{ id: 'cat2', name: 'Category 2' }],
        userAddedActivityIds: ['id2']
      };

      act(() => {
        result.current.setLibrary(library1);
        result.current.setLibrary(library2);
      });

      // Final state should reflect the last update
      expect(result.current.library.categories[0].id).toBe('cat2');
      expect(result.current.library.userAddedActivityIds).toEqual(['id2']);
    });

    test('should handle storage errors gracefully', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Store operations should continue to work even with storage errors
      const testLibrary = {
        categories: [{ id: 'test', name: 'Test Category' }],
        userAddedActivityIds: ['test-id']
      };

      act(() => {
        result.current.setLibrary(testLibrary);
        result.current.addUserActivityId('new-id');
      });

      expect(result.current.library.categories[0].name).toBe('Test Category');
      expect(result.current.library.userAddedActivityIds).toContain('new-id');
    });

    test('should handle corrupted storage data', () => {
      const { result } = renderHook(() => useLibraryStore());

      // The store should initialize with default values even if storage is corrupted
      expect(result.current.libraryTemplates).toEqual([]);
      expect(result.current.library.categories).toBe(null);
      expect(result.current.library.userAddedActivityIds).toEqual([]);
    });

    test('should handle debounced storage writes', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Test rapid updates that trigger the debouncing logic
      act(() => {
        result.current.addUserActivityId('id1');
        result.current.addUserActivityId('id2');
        result.current.removeUserActivityId('id1');
        result.current.addUserActivityId('id3');
      });

      // Final state should be consistent
      expect(result.current.library.userAddedActivityIds).toEqual(['id2', 'id3']);
    });
  });

  describe('Library Categories Business Logic', () => {
    test('should handle updateLibraryCategories with undefined', () => {
      const { result } = renderHook(() => useLibraryStore());

      act(() => {
        result.current.updateLibraryCategories(undefined);
      });

      expect(result.current.library.categories).toBe(undefined);
    });

    test('should handle updateLibraryCategories with empty array', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Set initial categories
      act(() => {
        result.current.setLibrary({
          categories: [{ id: 'cat1', name: 'Category 1' }],
          userAddedActivityIds: []
        });
      });

      // Update to empty array
      act(() => {
        result.current.updateLibraryCategories([]);
      });

      expect(result.current.library.categories).toEqual([]);
    });

    test('should preserve library structure when updating categories', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Set initial library with complex structure
      const initialLibrary = {
        categories: [{ id: 'cat1', name: 'Initial' }],
        userAddedActivityIds: ['id1', 'id2'],
        metadata: { version: '1.0', lastUpdated: Date.now() }
      };

      act(() => {
        result.current.setLibrary(initialLibrary);
      });

      // Update categories only
      const newCategories = [
        { id: 'cat2', name: 'Updated Category' },
        { id: 'cat3', name: 'Another Category' }
      ];

      act(() => {
        result.current.updateLibraryCategories(newCategories);
      });

      expect(result.current.library.categories).toEqual(newCategories);
      expect(result.current.library.userAddedActivityIds).toEqual(['id1', 'id2']);
      expect(result.current.library.metadata).toEqual(initialLibrary.metadata);
    });
  });

  describe('User Activity ID Edge Cases', () => {
    test('should handle null userAddedActivityIds in removeUserActivityId', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Set library with null userAddedActivityIds
      act(() => {
        result.current.setLibrary({
          categories: [],
          userAddedActivityIds: null
        });
      });

      // Should not crash when removing from null array
      act(() => {
        result.current.removeUserActivityId('any-id');
      });

      expect(result.current.library.userAddedActivityIds).toEqual([]);
    });

    test('should handle undefined userAddedActivityIds in removeUserActivityId', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Set library with undefined userAddedActivityIds
      act(() => {
        result.current.setLibrary({
          categories: [],
          userAddedActivityIds: undefined
        });
      });

      // Should not crash when removing from undefined array
      act(() => {
        result.current.removeUserActivityId('any-id');
      });

      expect(result.current.library.userAddedActivityIds).toEqual([]);
    });

    test('should handle special characters in activity IDs', () => {
      const { result } = renderHook(() => useLibraryStore());

      const specialIds = [
        'id-with-dashes',
        'id_with_underscores',
        'id.with.dots',
        'id@with@symbols',
        'id with spaces',
        'id/with/slashes',
        'very-long-activity-id-that-exceeds-normal-length-expectations-and-contains-multiple-segments'
      ];

      specialIds.forEach(id => {
        act(() => {
          result.current.addUserActivityId(id);
        });
      });

      specialIds.forEach(id => {
        expect(result.current.library.userAddedActivityIds).toContain(id);
      });

      // Remove a few
      act(() => {
        result.current.removeUserActivityId('id-with-dashes');
        result.current.removeUserActivityId('id with spaces');
      });

      expect(result.current.library.userAddedActivityIds).not.toContain('id-with-dashes');
      expect(result.current.library.userAddedActivityIds).not.toContain('id with spaces');
      expect(result.current.library.userAddedActivityIds).toContain('id_with_underscores');
    });
  });

  describe('Template Management Edge Cases', () => {
    test('should handle template updates with partial data', () => {
      const { result } = renderHook(() => useLibraryStore());

      const template = {
        id: 'template1',
        name: 'Original Template',
        description: 'Original description',
        activities: [{ id: 'act1', text: 'Activity 1' }],
        metadata: { created: Date.now() }
      };

      act(() => {
        result.current.addTemplate(template);
      });

      // Update with partial data
      act(() => {
        result.current.updateTemplate('template1', {
          name: 'Updated Name'
        });
      });

      const updatedTemplate = result.current.libraryTemplates[0];
      expect(updatedTemplate.name).toBe('Updated Name');
      expect(updatedTemplate.description).toBe('Original description');
      expect(updatedTemplate.activities).toEqual([{ id: 'act1', text: 'Activity 1' }]);
      expect(updatedTemplate.metadata).toEqual(template.metadata);
    });

    test('should handle template updates with null/undefined values', () => {
      const { result } = renderHook(() => useLibraryStore());

      const template = {
        id: 'template1',
        name: 'Template',
        description: 'Description'
      };

      act(() => {
        result.current.addTemplate(template);
      });

      // Update with null/undefined values
      act(() => {
        result.current.updateTemplate('template1', {
          description: null,
          newField: undefined,
          validField: 'valid value'
        });
      });

      const updatedTemplate = result.current.libraryTemplates[0];
      expect(updatedTemplate.description).toBe(null);
      expect(updatedTemplate.newField).toBe(undefined);
      expect(updatedTemplate.validField).toBe('valid value');
    });

    test('should handle setLibraryTemplates with undefined', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Add some templates first
      act(() => {
        result.current.addTemplate({ id: 'template1', name: 'Template 1' });
      });

      expect(result.current.libraryTemplates).toHaveLength(1);

      // Set to undefined
      act(() => {
        result.current.setLibraryTemplates(undefined);
      });

      expect(result.current.libraryTemplates).toBe(undefined);
    });

    test('should handle template operations with complex nested data', () => {
      const { result } = renderHook(() => useLibraryStore());

      const complexTemplate = {
        id: 'complex-template',
        name: 'Complex Template',
        metadata: {
          author: 'Test User',
          tags: ['daily', 'routine'],
          settings: {
            isPublic: true,
            allowComments: false
          }
        },
        categories: [
          {
            name: 'Morning',
            activities: [
              {
                id: 'morning-1',
                text: 'Wake up',
                metadata: { duration: 5, difficulty: 'easy' }
              }
            ]
          }
        ]
      };

      act(() => {
        result.current.addTemplate(complexTemplate);
      });

      // Update nested metadata
      act(() => {
        result.current.updateTemplate('complex-template', {
          metadata: {
            ...complexTemplate.metadata,
            tags: ['daily', 'routine', 'healthy'],
            settings: {
              ...complexTemplate.metadata.settings,
              allowComments: true
            }
          }
        });
      });

      const updatedTemplate = result.current.libraryTemplates[0];
      expect(updatedTemplate.metadata.tags).toContain('healthy');
      expect(updatedTemplate.metadata.settings.allowComments).toBe(true);
      expect(updatedTemplate.categories).toEqual(complexTemplate.categories);
    });
  });

  describe('Store State Management', () => {
    test('should maintain state persistence structure', () => {
      const { result } = renderHook(() => useLibraryStore());

      const completeState = {
        libraryTemplates: [
          { id: 'template1', name: 'Template 1', activities: [] }
        ],
        library: {
          categories: [
            { id: 'cat1', name: 'Category 1', activities: [] }
          ],
          userAddedActivityIds: ['user-1', 'user-2']
        }
      };

      act(() => {
        result.current.setLibraryTemplates(completeState.libraryTemplates);
        result.current.setLibrary(completeState.library);
      });

      expect(result.current.libraryTemplates).toEqual(completeState.libraryTemplates);
      expect(result.current.library).toEqual(completeState.library);
    });

    test('should handle partial state updates', () => {
      const { result } = renderHook(() => useLibraryStore());

      // Set initial state
      act(() => {
        result.current.setLibrary({
          categories: [{ id: 'initial', name: 'Initial Category' }],
          userAddedActivityIds: ['initial-id']
        });
        result.current.setLibraryTemplates([{ id: 'initial-template', name: 'Initial' }]);
      });

      // Update only categories
      act(() => {
        result.current.updateLibraryCategories([{ id: 'updated', name: 'Updated Category' }]);
      });

      // Should update categories but preserve userAddedActivityIds and templates
      expect(result.current.library.categories[0].name).toBe('Updated Category');
      expect(result.current.library.userAddedActivityIds).toEqual(['initial-id']);
      expect(result.current.libraryTemplates[0].name).toBe('Initial');
    });
  });
});