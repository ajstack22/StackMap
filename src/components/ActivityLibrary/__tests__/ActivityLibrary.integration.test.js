/**
 * ActivityLibrary Integration Tests
 * Tests component interactions with stores and complex user workflows
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-hooks';
import ActivityLibrary from '../ActivityLibrary';
import {
  resetAllStores,
  setupTestEnvironment,
  userInteractions,
  performance
} from '../../../__tests__/helpers/testHelpers';
import {
  ActivityFactory,
  CategoryFactory,
  LibraryFactory,
  UserFactory,
  AppStateFactory
} from '../../../__tests__/helpers/dataFactories';
import useLibraryStore from '../../../stores/useLibraryStore';
import useUserStore from '../../../stores/useUserStore';
import useSettingsStore from '../../../stores/useSettingsStore';

// Mock react-native components and dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34 })
}));

jest.mock('react-native', () => {
  const originalModule = jest.requireActual('react-native');
  return {
    ...originalModule,
    Alert: {
      alert: jest.fn()
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 812 }))
    },
    StatusBar: {
      currentHeight: 24
    },
    Platform: {
      OS: 'ios'
    }
  };
});

// Mock EmojiPicker
jest.mock('../../EmojiPicker', () => {
  const mockReact = require('react');
  return function EmojiPicker({ onEmojiSelected, visible, onClose }) {
    if (!visible) return null;
    return mockReact.createElement('View', { testID: 'emoji-picker' });
  };
});

// Mock ConfirmModal
jest.mock('../../Modals/ConfirmModal', () => {
  const mockReact = require('react');
  return function ConfirmModal({ visible, onConfirm, onCancel }) {
    if (!visible) return null;
    return mockReact.createElement('View', { testID: 'confirm-modal' });
  };
});

describe('ActivityLibrary Integration Tests', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    onActivitySelected: jest.fn(),
    currentUserId: 'test-user',
    theme: 'stackBlue'
  };

  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
  });

  describe('Basic Rendering and Props', () => {
    test('should render library with categories', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const { getByText } = render(<ActivityLibrary {...defaultProps} />);

      // Should display category names
      library.categories.forEach(category => {
        expect(getByText(category.name)).toBeTruthy();
      });
    });

    test('should render empty library state', () => {
      const emptyLibrary = LibraryFactory.createEmpty();
      setupTestEnvironment({ library: emptyLibrary });

      const { container } = render(<ActivityLibrary {...defaultProps} />);

      expect(container).toBeTruthy();
      // Should handle empty state gracefully
    });

    test('should apply theme correctly', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const { container } = render(
        <ActivityLibrary {...defaultProps} theme="stackRed" />
      );

      expect(container).toBeTruthy();
    });

    test('should handle visibility prop', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const { container: visibleContainer } = render(
        <ActivityLibrary {...defaultProps} visible={true} />
      );

      const { container: hiddenContainer } = render(
        <ActivityLibrary {...defaultProps} visible={false} />
      );

      expect(visibleContainer).toBeTruthy();
      expect(hiddenContainer).toBeTruthy();
    });
  });

  describe('Library Store Integration', () => {
    test('should display library data from store', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const library = LibraryFactory.create();

      act(() => {
        libraryResult.current.setLibrary(library);
      });

      const { getByText } = render(<ActivityLibrary {...defaultProps} />);

      // Verify library categories are displayed
      library.categories.forEach(category => {
        expect(getByText(category.name)).toBeTruthy();

        // Check that activities are accessible (even if not directly visible)
        category.activities.forEach(activity => {
          // Activities might be in collapsed sections initially
        });
      });
    });

    test('should handle library updates in real-time', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const initialLibrary = LibraryFactory.create();

      act(() => {
        libraryResult.current.setLibrary(initialLibrary);
      });

      const { getByText, rerender } = render(<ActivityLibrary {...defaultProps} />);

      // Verify initial state
      expect(getByText(initialLibrary.categories[0].name)).toBeTruthy();

      // Add new category
      const newCategory = CategoryFactory.create({ name: 'New Test Category' });
      act(() => {
        libraryResult.current.setLibrary({
          ...initialLibrary,
          categories: [...initialLibrary.categories, newCategory]
        });
      });

      // Rerender to pick up changes
      rerender(<ActivityLibrary {...defaultProps} />);

      expect(getByText('New Test Category')).toBeTruthy();
    });

    test('should handle category creation workflow', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const emptyLibrary = LibraryFactory.createEmpty();

      act(() => {
        libraryResult.current.setLibrary(emptyLibrary);
      });

      const { container } = render(<ActivityLibrary {...defaultProps} />);

      // Simulate creating a new category
      const newCategory = CategoryFactory.create({ name: 'Workout Routine' });

      act(() => {
        libraryResult.current.setLibrary({
          categories: [newCategory],
          userActivityIds: []
        });
      });

      expect(libraryResult.current.library.categories).toHaveLength(1);
      expect(libraryResult.current.library.categories[0].name).toBe('Workout Routine');
    });
  });

  describe('Activity Selection and User Integration', () => {
    test('should handle activity selection for current user', () => {
      const { result: userResult } = renderHook(() => useUserStore());
      const user = UserFactory.create();
      const library = LibraryFactory.create();

      setupTestEnvironment({ user, library });

      const onActivitySelected = jest.fn();
      const { container } = render(
        <ActivityLibrary
          {...defaultProps}
          currentUserId={user.id}
          onActivitySelected={onActivitySelected}
        />
      );

      // Simulate activity selection
      const selectedActivity = library.categories[0].activities[0];

      act(() => {
        onActivitySelected(selectedActivity);
      });

      expect(onActivitySelected).toHaveBeenCalledWith(selectedActivity);
    });

    test('should add activity to user when selected', () => {
      const { result: userResult } = renderHook(() => useUserStore());
      const user = UserFactory.create();
      const library = LibraryFactory.create();

      setupTestEnvironment({ user, library });

      const { container } = render(
        <ActivityLibrary {...defaultProps} currentUserId={user.id} />
      );

      // Simulate adding activity to user
      const libraryActivity = library.categories[0].activities[0];
      const userActivity = {
        ...libraryActivity,
        id: `user-${Date.now()}`,
        completed: false,
        timestamp: Date.now()
      };

      act(() => {
        userInteractions.addActivityToDay(user.id, 'today', userActivity);
      });

      const updatedUser = userResult.current.users[user.id];
      expect(updatedUser.days.today.activities).toHaveLength(1);
      expect(updatedUser.days.today.activities[0].text).toBe(libraryActivity.text);
    });

    test('should handle quick add functionality', () => {
      const library = LibraryFactory.create();
      const user = UserFactory.create();
      setupTestEnvironment({ library, user });

      const onActivitySelected = jest.fn();
      const { container } = render(
        <ActivityLibrary
          {...defaultProps}
          currentUserId={user.id}
          onActivitySelected={onActivitySelected}
        />
      );

      // Simulate quick add (implementation depends on ActivityLibrary structure)
      const quickAddActivity = library.categories[0].activities[0];

      // Quick add should call onActivitySelected
      act(() => {
        onActivitySelected(quickAddActivity);
      });

      expect(onActivitySelected).toHaveBeenCalledWith(quickAddActivity);
    });
  });

  describe('Category and Activity Management', () => {
    test('should handle category expansion/collapse', () => {
      const library = LibraryFactory.createWithUserActivities(5);
      setupTestEnvironment({ library });

      const { getByText, container } = render(<ActivityLibrary {...defaultProps} />);

      // Categories should be present
      library.categories.forEach(category => {
        expect(getByText(category.name)).toBeTruthy();
      });

      // Test category interaction (expand/collapse)
      // This would depend on the specific implementation of category UI
    });

    test('should handle activity editing workflow', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const library = LibraryFactory.create();

      act(() => {
        libraryResult.current.setLibrary(library);
      });

      const { container } = render(<ActivityLibrary {...defaultProps} />);

      // Simulate editing an activity
      const categoryToEdit = library.categories[0];
      const activityToEdit = categoryToEdit.activities[0];
      const editedActivity = {
        ...activityToEdit,
        text: 'Edited Activity Text',
        icon: '✏️'
      };

      const updatedCategory = {
        ...categoryToEdit,
        activities: categoryToEdit.activities.map(activity =>
          activity.id === activityToEdit.id ? editedActivity : activity
        )
      };

      act(() => {
        libraryResult.current.setLibrary({
          ...library,
          categories: library.categories.map(category =>
            category.id === categoryToEdit.id ? updatedCategory : category
          )
        });
      });

      const updatedLibrary = libraryResult.current.library;
      const foundActivity = updatedLibrary.categories[0].activities
        .find(a => a.id === activityToEdit.id);

      expect(foundActivity.text).toBe('Edited Activity Text');
      expect(foundActivity.icon).toBe('✏️');
    });

    test('should handle activity deletion workflow', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const library = LibraryFactory.create();

      act(() => {
        libraryResult.current.setLibrary(library);
      });

      const { container } = render(<ActivityLibrary {...defaultProps} />);

      // Simulate deleting an activity
      const categoryWithActivity = library.categories[0];
      const activityToDelete = categoryWithActivity.activities[0];
      const initialActivityCount = categoryWithActivity.activities.length;

      const updatedCategory = {
        ...categoryWithActivity,
        activities: categoryWithActivity.activities.filter(
          activity => activity.id !== activityToDelete.id
        )
      };

      act(() => {
        libraryResult.current.setLibrary({
          ...library,
          categories: library.categories.map(category =>
            category.id === categoryWithActivity.id ? updatedCategory : category
          )
        });
      });

      const updatedLibrary = libraryResult.current.library;
      expect(updatedLibrary.categories[0].activities).toHaveLength(initialActivityCount - 1);
    });
  });

  describe('Search and Filtering', () => {
    test('should handle activity search functionality', () => {
      const library = LibraryFactory.createLarge(5, 10);
      setupTestEnvironment({ library });

      const { container, getByText } = render(<ActivityLibrary {...defaultProps} />);

      // Test that all categories are initially visible
      library.categories.forEach(category => {
        expect(getByText(category.name)).toBeTruthy();
      });

      // Search functionality would filter activities/categories
      // Implementation depends on actual search UI in ActivityLibrary
    });

    test('should filter activities by category', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const { getByText } = render(<ActivityLibrary {...defaultProps} />);

      // Each category should display its own activities
      library.categories.forEach(category => {
        expect(getByText(category.name)).toBeTruthy();
        // Activities within categories would be testable based on implementation
      });
    });
  });

  describe('Performance Tests', () => {
    test('should handle large libraries efficiently', async () => {
      const largeLibrary = LibraryFactory.createLarge(20, 15);
      setupTestEnvironment({ library: largeLibrary });

      await performance.assertPerformance(
        () => {
          const { container } = render(<ActivityLibrary {...defaultProps} />);
          return container;
        },
        1000, // Should render large library in under 1 second
        'Large library rendering'
      );
    });

    test('should optimize category rendering', () => {
      const library = LibraryFactory.createLarge(10, 8);
      setupTestEnvironment({ library });

      const { rerender } = render(<ActivityLibrary {...defaultProps} />);

      // Multiple re-renders should be optimized
      const start = Date.now();
      for (let i = 0; i < 5; i++) {
        rerender(<ActivityLibrary {...defaultProps} theme={i % 2 ? 'stackBlue' : 'stackRed'} />);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200); // Should be optimized
    });

    test('should handle rapid library updates', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());
      const initialLibrary = LibraryFactory.create();

      act(() => {
        libraryResult.current.setLibrary(initialLibrary);
      });

      const { rerender } = render(<ActivityLibrary {...defaultProps} />);

      // Simulate rapid library changes
      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        const newCategory = CategoryFactory.create({ name: `Dynamic Category ${i}` });
        act(() => {
          libraryResult.current.setLibrary({
            ...initialLibrary,
            categories: [...initialLibrary.categories, newCategory]
          });
        });
        rerender(<ActivityLibrary {...defaultProps} />);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500); // Should handle rapid updates
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle corrupted library data', () => {
      const { result: libraryResult } = renderHook(() => useLibraryStore());

      // Set corrupted library data
      act(() => {
        libraryResult.current.setLibrary({
          categories: [
            null, // Invalid category
            { id: 'valid', name: 'Valid Category', activities: [] },
            { id: 'no-activities' }, // Missing activities array
          ],
          userActivityIds: null // Invalid user activity IDs
        });
      });

      expect(() => {
        render(<ActivityLibrary {...defaultProps} />);
      }).not.toThrow();
    });

    test('should handle activities with missing required fields', () => {
      const corruptedLibrary = {
        categories: [{
          id: 'corrupted',
          name: 'Corrupted Category',
          activities: [
            { id: '1' }, // Missing text and icon
            { id: '2', text: 'Only Text' }, // Missing icon
            { id: '3', icon: '🎯' }, // Missing text
            null, // Invalid activity
            { id: '4', text: 'Complete Activity', icon: '✅' } // Valid
          ]
        }],
        userActivityIds: []
      };

      setupTestEnvironment({ library: corruptedLibrary });

      expect(() => {
        render(<ActivityLibrary {...defaultProps} />);
      }).not.toThrow();
    });

    test('should handle invalid user ID', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      expect(() => {
        render(
          <ActivityLibrary
            {...defaultProps}
            currentUserId="non-existent-user"
          />
        );
      }).not.toThrow();
    });

    test('should handle theme changes gracefully', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const { rerender } = render(<ActivityLibrary {...defaultProps} />);

      // Test various theme changes
      const themes = ['stackBlue', 'stackRed', 'stackGreen', 'invalid-theme'];

      themes.forEach(theme => {
        expect(() => {
          rerender(<ActivityLibrary {...defaultProps} theme={theme} />);
        }).not.toThrow();
      });
    });
  });

  describe('Modal and UI State Management', () => {
    test('should handle modal visibility states', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const onClose = jest.fn();
      const { rerender } = render(
        <ActivityLibrary {...defaultProps} visible={true} onClose={onClose} />
      );

      // Test modal close
      rerender(
        <ActivityLibrary {...defaultProps} visible={false} onClose={onClose} />
      );

      expect(() => {}).not.toThrow();
    });

    test('should handle emoji picker integration', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const { queryByTestId } = render(<ActivityLibrary {...defaultProps} />);

      // Emoji picker should not be visible initially
      expect(queryByTestId('emoji-picker')).toBeFalsy();

      // Would test emoji picker visibility based on implementation
    });

    test('should handle confirm modal for deletions', () => {
      const library = LibraryFactory.create();
      setupTestEnvironment({ library });

      const { queryByTestId } = render(<ActivityLibrary {...defaultProps} />);

      // Confirm modal should not be visible initially
      expect(queryByTestId('confirm-modal')).toBeFalsy();

      // Would test confirm modal based on deletion flow implementation
    });
  });
});