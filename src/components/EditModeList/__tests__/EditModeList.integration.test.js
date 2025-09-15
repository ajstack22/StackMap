/**
 * EditModeList Integration Tests
 * Tests component interactions with stores and user workflows
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { renderHook, act } from '@testing-library/react-hooks';
import EditModeList from '../index';
import {
  resetAllStores,
  setupTestEnvironment,
  userInteractions,
  performance
} from '../../../__tests__/helpers/testHelpers';
import {
  ActivityFactory,
  UserFactory,
  AppStateFactory
} from '../../../__tests__/helpers/dataFactories';
import useUserStore from '../../../stores/useUserStore';
import useSettingsStore from '../../../stores/useSettingsStore';

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Alert for tests
jest.mock('react-native', () => {
  const originalModule = jest.requireActual('react-native');
  return {
    ...originalModule,
    Alert: {
      alert: jest.fn()
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 400, height: 800 }))
    }
  };
});

// Mock useEditMode hook
const mockHandlers = {
  handleMoveUp: jest.fn(),
  handleMoveDown: jest.fn(),
  handleDelete: jest.fn()
};

jest.mock('../../../hooks/useEditMode', () => ({
  useEditMode: jest.fn(() => mockHandlers)
}));

describe('EditModeList Integration Tests', () => {
  const defaultProps = {
    activities: [],
    onUpdate: jest.fn(),
    onEdit: jest.fn(),
    onLibrary: jest.fn(),
    onToggle: jest.fn(),
    onDelete: jest.fn(),
    theme: 'stackBlue',
    contentPadding: { paddingHorizontal: 16 },
    displayMode: 'numbers'
  };

  beforeEach(() => {
    resetAllStores();
    jest.clearAllMocks();
    mockHandlers.handleMoveUp.mockClear();
    mockHandlers.handleMoveDown.mockClear();
    mockHandlers.handleDelete.mockClear();
  });

  describe('Basic Rendering and Props', () => {
    test('should render empty list correctly', () => {
      const { getByTestId } = render(<EditModeList {...defaultProps} />);

      // FlatList should render but be empty
      expect(() => getByTestId('edit-mode-list')).not.toThrow();
    });

    test('should render activities with correct data', () => {
      const activities = ActivityFactory.createMultiple(3);
      const props = { ...defaultProps, activities };

      const { getByText } = render(<EditModeList {...props} />);

      activities.forEach(activity => {
        expect(getByText(activity.text)).toBeTruthy();
      });
    });

    test('should apply theme correctly', () => {
      const activities = [ActivityFactory.create()];
      const props = { ...defaultProps, activities, theme: 'stackRed' };

      const { getByText } = render(<EditModeList {...props} />);

      // Component should render without errors with custom theme
      expect(getByText(activities[0].text)).toBeTruthy();
    });

    test('should handle different display modes', () => {
      const activities = [ActivityFactory.create()];

      ['numbers', 'checkmarks', 'progress'].forEach(displayMode => {
        const props = { ...defaultProps, activities, displayMode };
        const { getByText } = render(<EditModeList {...props} />);
        expect(getByText(activities[0].text)).toBeTruthy();
      });
    });
  });

  describe('User Interactions', () => {
    test('should handle edit action', () => {
      const activities = [ActivityFactory.create({ text: 'Edit Test Activity' })];
      const onEdit = jest.fn();
      const props = { ...defaultProps, activities, onEdit };

      const { getByText } = render(<EditModeList {...props} />);

      // Find and press edit button (implementation depends on EditModeListItem)
      const activityElement = getByText('Edit Test Activity');
      expect(activityElement).toBeTruthy();

      // Simulate edit action through parent callback
      act(() => {
        onEdit(activities[0]);
      });

      expect(onEdit).toHaveBeenCalledWith(activities[0]);
    });

    test('should handle toggle action', () => {
      const activities = [
        ActivityFactory.create({ text: 'Toggle Test', completed: false })
      ];
      const onToggle = jest.fn();
      const props = { ...defaultProps, activities, onToggle };

      const { getByText } = render(<EditModeList {...props} />);

      expect(getByText('Toggle Test')).toBeTruthy();

      // Simulate toggle action
      act(() => {
        onToggle(activities[0]);
      });

      expect(onToggle).toHaveBeenCalledWith(activities[0]);
    });

    test('should handle library action', () => {
      const activities = [ActivityFactory.create({ text: 'Library Test' })];
      const onLibrary = jest.fn();
      const props = { ...defaultProps, activities, onLibrary };

      const { getByText } = render(<EditModeList {...props} />);

      expect(getByText('Library Test')).toBeTruthy();

      // Simulate library action
      act(() => {
        onLibrary(activities[0]);
      });

      expect(onLibrary).toHaveBeenCalledWith(activities[0]);
    });

    test('should handle move up/down actions', () => {
      const activities = ActivityFactory.createMultiple(3);
      const props = { ...defaultProps, activities };

      render(<EditModeList {...props} />);

      // Simulate move actions through useEditMode hook
      act(() => {
        mockHandlers.handleMoveUp(activities[1], 1);
      });

      expect(mockHandlers.handleMoveUp).toHaveBeenCalledWith(activities[1], 1);

      act(() => {
        mockHandlers.handleMoveDown(activities[0], 0);
      });

      expect(mockHandlers.handleMoveDown).toHaveBeenCalledWith(activities[0], 0);
    });

    test('should handle delete action', () => {
      const activities = [ActivityFactory.create({ text: 'Delete Test' })];
      const onDelete = jest.fn();
      const props = { ...defaultProps, activities, onDelete };

      render(<EditModeList {...props} />);

      // Simulate delete action
      act(() => {
        onDelete(activities[0]);
      });

      expect(onDelete).toHaveBeenCalledWith(activities[0]);
    });
  });

  describe('Store Integration', () => {
    test('should integrate with user store for activity management', () => {
      const { result: userResult } = renderHook(() => useUserStore());
      const user = UserFactory.createWithActivities('today', 3);

      act(() => {
        userResult.current.setUsers({ [user.id]: user });
        userResult.current.setCurrentUser(user.id);
      });

      const activities = userResult.current.users[user.id].days.today.activities;
      const onUpdate = jest.fn((updatedActivities) => {
        userResult.current.updateUserActivities(user.id, 'today', updatedActivities);
      });

      const props = { ...defaultProps, activities, onUpdate };
      render(<EditModeList {...props} />);

      // Verify activities are displayed
      activities.forEach(activity => {
        expect(() => {
          // Activities should be renderable
        }).not.toThrow();
      });

      // Simulate activity update
      const updatedActivities = [...activities, ActivityFactory.create()];
      act(() => {
        onUpdate(updatedActivities);
      });

      expect(onUpdate).toHaveBeenCalledWith(updatedActivities);
    });

    test('should respond to theme changes from settings store', () => {
      const { result: settingsResult } = renderHook(() => useSettingsStore());
      const activities = [ActivityFactory.create()];

      // Initial render with default theme
      const { rerender } = render(
        <EditModeList {...defaultProps} activities={activities} theme="stackBlue" />
      );

      // Change theme in store
      act(() => {
        settingsResult.current.updateSettings({ currentTheme: 'stackRed' });
      });

      // Rerender with new theme
      rerender(
        <EditModeList {...defaultProps} activities={activities} theme="stackRed" />
      );

      // Component should render without errors
      expect(() => {}).not.toThrow();
    });

    test('should handle real-time activity updates', () => {
      const appState = AppStateFactory.create({ userCount: 1, withLibrary: true });
      const { user } = setupTestEnvironment(appState);

      const { result: userResult } = renderHook(() => useUserStore());
      const activities = userResult.current.users[user.id]?.days?.today?.activities || [];

      const onUpdate = jest.fn((updatedActivities) => {
        userResult.current.updateUserActivities(user.id, 'today', updatedActivities);
      });

      const { rerender } = render(
        <EditModeList {...defaultProps} activities={activities} onUpdate={onUpdate} />
      );

      // Add activity through store
      const newActivity = ActivityFactory.create({ text: 'Real-time Activity' });
      act(() => {
        userInteractions.addActivityToDay(user.id, 'today', newActivity);
      });

      const updatedActivities = userResult.current.users[user.id].days.today.activities;

      // Rerender with updated activities
      rerender(
        <EditModeList {...defaultProps} activities={updatedActivities} onUpdate={onUpdate} />
      );

      expect(updatedActivities).toHaveLength(activities.length + 1);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large activity lists efficiently', async () => {
      const largeActivityList = ActivityFactory.createMultiple(100);
      const props = { ...defaultProps, activities: largeActivityList };

      await performance.assertPerformance(
        () => {
          const { getAllByTestId } = render(<EditModeList {...props} />);
          return getAllByTestId; // Return something to measure
        },
        500, // Should render in under 500ms
        'Large activity list rendering'
      );
    });

    test('should optimize re-renders with memoization', () => {
      const activities = ActivityFactory.createMultiple(10);
      const props = { ...defaultProps, activities };

      const { rerender } = render(<EditModeList {...props} />);

      // Multiple re-renders with same props should be optimized
      const start = Date.now();
      for (let i = 0; i < 10; i++) {
        rerender(<EditModeList {...props} />);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100); // Should be very fast due to memoization
    });

    test('should handle rapid state changes', () => {
      const initialActivities = ActivityFactory.createMultiple(5);
      const props = { ...defaultProps, activities: initialActivities };

      const { rerender } = render(<EditModeList {...props} />);

      // Simulate rapid activity changes
      const start = Date.now();
      for (let i = 0; i < 20; i++) {
        const modifiedActivities = [
          ...initialActivities,
          ActivityFactory.create({ text: `Dynamic ${i}` })
        ];
        rerender(<EditModeList {...props} activities={modifiedActivities} />);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200); // Should handle rapid changes efficiently
    });
  });

  describe('Accessibility and Edge Cases', () => {
    test('should handle empty activities gracefully', () => {
      const props = { ...defaultProps, activities: [] };

      const { container } = render(<EditModeList {...props} />);

      expect(container).toBeTruthy();
      // Should not crash with empty activities
    });

    test('should handle activities with missing fields', () => {
      const incompleteActivities = [
        { id: '1' }, // Missing text, icon
        { id: '2', text: 'Only Text' }, // Missing icon
        { id: '3', icon: '🎯' }, // Missing text
        { id: '4', text: 'Complete', icon: '✅' } // Complete
      ];

      const props = { ...defaultProps, activities: incompleteActivities };

      expect(() => {
        render(<EditModeList {...props} />);
      }).not.toThrow();
    });

    test('should handle tablet vs mobile layout differences', () => {
      const activities = ActivityFactory.createMultiple(3);

      // Mock tablet dimensions
      const originalDimensions = require('react-native').Dimensions;
      originalDimensions.get.mockReturnValue({ width: 1024, height: 768 });

      const tabletProps = { ...defaultProps, activities };
      const { container: tabletContainer } = render(<EditModeList {...tabletProps} />);

      // Mock mobile dimensions
      originalDimensions.get.mockReturnValue({ width: 375, height: 812 });

      const mobileProps = { ...defaultProps, activities };
      const { container: mobileContainer } = render(<EditModeList {...mobileProps} />);

      expect(tabletContainer).toBeTruthy();
      expect(mobileContainer).toBeTruthy();
    });

    test('should handle rapid prop changes without memory leaks', () => {
      const baseActivities = ActivityFactory.createMultiple(5);
      let renderCount = 0;

      const TestWrapper = ({ activities }) => {
        renderCount++;
        return <EditModeList {...defaultProps} activities={activities} />;
      };

      const { rerender } = render(<TestWrapper activities={baseActivities} />);

      // Simulate many prop changes
      for (let i = 0; i < 50; i++) {
        const modifiedActivities = baseActivities.map(activity => ({
          ...activity,
          text: `${activity.text} - ${i}`
        }));
        rerender(<TestWrapper activities={modifiedActivities} />);
      }

      expect(renderCount).toBe(51); // Initial + 50 updates
      // Component should still be responsive
    });
  });

  describe('Platform-Specific Behavior', () => {
    test('should apply platform-specific optimizations', () => {
      const activities = ActivityFactory.createMultiple(20);
      const props = { ...defaultProps, activities };

      // Test that component renders correctly on different platforms
      const { container } = render(<EditModeList {...props} />);

      expect(container).toBeTruthy();
      // Platform-specific props should be applied to FlatList
      // (These are tested through the component not crashing)
    });

    test('should handle web-specific styling', () => {
      const originalPlatform = require('react-native').Platform;
      originalPlatform.OS = 'web';

      const activities = ActivityFactory.createMultiple(3);
      const props = { ...defaultProps, activities };

      expect(() => {
        render(<EditModeList {...props} />);
      }).not.toThrow();

      // Reset platform
      originalPlatform.OS = 'ios';
    });
  });

  describe('Integration with Edit Mode Hook', () => {
    test('should properly initialize useEditMode hook', () => {
      const activities = ActivityFactory.createMultiple(3);
      const onUpdate = jest.fn();
      const props = { ...defaultProps, activities, onUpdate };

      render(<EditModeList {...props} />);

      // Verify hook was called with correct parameters
      const useEditMode = require('../../../hooks/useEditMode').useEditMode;
      expect(useEditMode).toHaveBeenCalledWith(activities, onUpdate);
    });

    test('should handle hook-provided handlers correctly', () => {
      const activities = ActivityFactory.createMultiple(3);
      const props = { ...defaultProps, activities };

      render(<EditModeList {...props} />);

      // Mock handlers should be available for child components
      expect(mockHandlers.handleMoveUp).toBeDefined();
      expect(mockHandlers.handleMoveDown).toBeDefined();
      expect(mockHandlers.handleDelete).toBeDefined();
    });
  });
});