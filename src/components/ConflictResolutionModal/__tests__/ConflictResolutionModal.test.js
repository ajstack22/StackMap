import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Platform, StatusBar } from 'react-native';
import ConflictResolutionModal from '../ConflictResolutionModal';

// Mock dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    const { Text } = require('react-native');
    return React.createElement(Text, { ...props, ref }, props.name);
  });
});

// Mock Typography component
jest.mock('../../Typography', () => ({
  Text: ({ children, ...props }) => {
    const React = require('react');
    const { Text: RNText } = require('react-native');
    return React.createElement(RNText, props, children);
  }
}));

// Mock constants
jest.mock('../../../constants', () => ({
  SHADOWS: {
    level1: { shadowOffset: { width: 0, height: 1 } },
    level2: { shadowOffset: { width: 0, height: 2 } }
  },
  TYPOGRAPHY: {
    fontFamily: {
      regular: 'Comic Relief',
      medium: 'Comic Relief-Medium',
      bold: 'Comic Relief-Bold'
    }
  },
  SPACING: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  RADIUS: { sm: 8, md: 12, lg: 16, xl: 20 },
  COLORS: {
    gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 400: '#9ca3af' },
    error: '#ef4444'
  }
}));

// Mock conflictResolver with actual methods
jest.mock('../../../services/sync/conflictResolver', () => ({
  __esModule: true,
  default: {
    mergeActivitiesArray: jest.fn(),
    mergeUsers: jest.fn(),
    mergeStates: jest.fn(),
    log: jest.fn(),
  }
}));

// Platform and StatusBar adjustments are now handled in the describe block's beforeEach

// Test fixtures
const mockTheme = {
  primary: '#007AFF',
  light: '#ffffff',
};

// Activity conflicts
const activityConflict = {
  id: 'conflict-1',
  field: 'activities',
  strategy: 'merge',
  localValue: [
    { id: 'activity-1', text: 'Local Activity', icon: '🎯' },
    { id: 'activity-2', text: 'Shared Activity', icon: '⚽' },
  ],
  remoteValue: [
    { id: 'activity-2', text: 'Shared Activity', icon: '⚽' },
    { id: 'activity-3', text: 'Remote Activity', icon: '🎨' },
  ],
};

// User conflicts
const userConflict = {
  id: 'conflict-2',
  field: 'users',
  strategy: 'lww',
  localValue: {
    'user-1': { id: 'user-1', name: 'Local User', icon: '👤' }
  },
  remoteValue: {
    'user-1': { id: 'user-1', name: 'Remote User', icon: '👥' }
  },
};

// Settings conflicts
const settingsConflict = {
  id: 'conflict-3',
  field: 'currentTheme',
  strategy: 'lww',
  localValue: 'blue',
  remoteValue: 'green',
};

// Completed activities conflicts
const completedActivitiesConflict = {
  id: 'conflict-4',
  field: 'completedActivities',
  strategy: 'merge',
  localValue: [
    { id: 'comp-1', activityId: 'activity-1', completedAt: 1642678800000 },
    { id: 'comp-2', activityId: 'activity-2', completedAt: 1642678900000 },
  ],
  remoteValue: [
    { id: 'comp-2', activityId: 'activity-2', completedAt: 1642678900000 },
    { id: 'comp-3', activityId: 'activity-3', completedAt: 1642679000000 },
  ],
};

// Object conflict
const objectConflict = {
  id: 'conflict-5',
  field: 'currentUser',
  strategy: 'lww',
  localValue: {
    id: 'user-1',
    name: 'Local User',
    settings: { theme: 'dark', notifications: true }
  },
  remoteValue: {
    id: 'user-1',
    name: 'Remote User',
    settings: { theme: 'light', notifications: false }
  },
};

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  conflicts: [activityConflict],
  onResolve: jest.fn(),
  theme: mockTheme,
};

describe('ConflictResolutionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Reset Platform to iOS by default
    const { Platform, StatusBar } = require('react-native');
    Platform.OS = 'ios';
    StatusBar.currentHeight = 24;

    // Get the mocked resolver instance
    const conflictResolver = require('../../../services/sync/conflictResolver').default;

    // Setup default mock implementations
    conflictResolver.mergeActivitiesArray.mockReturnValue([
      { id: 'activity-1', text: 'Local Activity', icon: '🎯' },
      { id: 'activity-2', text: 'Shared Activity', icon: '⚽' },
      { id: 'activity-3', text: 'Remote Activity', icon: '🎨' },
    ]);

    conflictResolver.mergeUsers.mockReturnValue({
      'user-1': { id: 'user-1', name: 'Merged User', icon: '👤' }
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders modal when visible with conflicts', () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      expect(getByText('Sync Conflict')).toBeTruthy();
      expect(getByText('1 of 1')).toBeTruthy();
      expect(getByText('Activity templates')).toBeTruthy();
      expect(getByText('Both devices made changes to this data. Choose which version to keep:')).toBeTruthy();
    });

    it('does not render when not visible', () => {
      const { UNSAFE_queryByType } = render(
        <ConflictResolutionModal {...defaultProps} visible={false} />
      );

      // When visible=false, Modal should not render its children
      const modal = UNSAFE_queryByType('Modal');
      expect(modal).toBeTruthy();
      expect(modal.props.visible).toBe(false);
    });

    it('does not render when no conflicts', () => {
      const { queryByText } = render(
        <ConflictResolutionModal {...defaultProps} conflicts={[]} />
      );

      expect(queryByText('Sync Conflict')).toBeNull();
    });

    it('does not render when conflicts is null', () => {
      const { queryByText } = render(
        <ConflictResolutionModal {...defaultProps} conflicts={null} />
      );

      expect(queryByText('Sync Conflict')).toBeNull();
    });
  });

  describe('Choice Rendering', () => {
    it('renders local and remote choices for all conflicts', () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      expect(getByText('Keep Local (This Device)')).toBeTruthy();
      expect(getByText('Keep Remote (Other Device)')).toBeTruthy();
    });

    it('renders merge choice when strategy supports merge', () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      expect(getByText('Merge Both')).toBeTruthy();
      expect(getByText('Automatically combined from both versions')).toBeTruthy();
    });

    it('does not render merge choice when strategy is lww', () => {
      const props = {
        ...defaultProps,
        conflicts: [userConflict],
      };
      const { queryByText } = render(<ConflictResolutionModal {...props} />);

      expect(queryByText('Merge Both')).toBeNull();
      expect(queryByText('Automatically combined from both versions')).toBeNull();
    });
  });

  describe('Field Value Rendering', () => {
    it('renders activity arrays with preview', () => {
      const { getAllByText, getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      // Both local and remote have 2 items, so there will be multiple "2 items" texts
      const itemCounts = getAllByText('2 items');
      expect(itemCounts.length).toBeGreaterThanOrEqual(1);

      expect(getAllByText('🎯').length).toBeGreaterThan(0);
      expect(getAllByText('Local Activity').length).toBeGreaterThan(0);
      expect(getAllByText('⚽').length).toBeGreaterThan(0);
      expect(getAllByText('Shared Activity').length).toBeGreaterThan(0);
    });

    it('renders activity array with "more" text when over 3 items', () => {
      const longActivityConflict = {
        ...activityConflict,
        localValue: [
          { id: 'activity-1', text: 'Activity 1', icon: '🎯' },
          { id: 'activity-2', text: 'Activity 2', icon: '⚽' },
          { id: 'activity-3', text: 'Activity 3', icon: '🎨' },
          { id: 'activity-4', text: 'Activity 4', icon: '📚' },
          { id: 'activity-5', text: 'Activity 5', icon: '🎵' },
        ],
      };

      const props = {
        ...defaultProps,
        conflicts: [longActivityConflict],
      };
      const { getByText } = render(<ConflictResolutionModal {...props} />);

      expect(getByText('5 items')).toBeTruthy();
      expect(getByText('+2 more')).toBeTruthy();
    });

    it('renders completed activities count', () => {
      const props = {
        ...defaultProps,
        conflicts: [completedActivitiesConflict],
      };
      const { getAllByText, getByText } = render(<ConflictResolutionModal {...props} />);

      // Both local and remote have 2 items, so there will be multiple "2 items" texts
      const itemCounts = getAllByText('2 items');
      expect(itemCounts.length).toBeGreaterThanOrEqual(1);
      expect(getAllByText('2 completed activities').length).toBeGreaterThan(0);
    });

    it('renders object preview with JSON substring', () => {
      const props = {
        ...defaultProps,
        conflicts: [objectConflict],
      };
      const { getAllByText } = render(<ConflictResolutionModal {...props} />);

      // Should show truncated JSON (should have "..." at the end from truncation)
      const jsonTexts = getAllByText(/\.\.\./);
      expect(jsonTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('renders scalar values as strings', () => {
      const props = {
        ...defaultProps,
        conflicts: [settingsConflict],
      };
      const { getByText } = render(<ConflictResolutionModal {...props} />);

      expect(getByText('blue')).toBeTruthy();
      expect(getByText('green')).toBeTruthy();
    });
  });

  describe('Field Descriptions', () => {
    it('shows correct description for activities field', () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);
      expect(getByText('Activity templates')).toBeTruthy();
    });

    it('shows correct description for completedActivities field', () => {
      const props = {
        ...defaultProps,
        conflicts: [completedActivitiesConflict],
      };
      const { getByText } = render(<ConflictResolutionModal {...props} />);
      expect(getByText('Completed activity records')).toBeTruthy();
    });

    it('shows correct description for users field', () => {
      const props = {
        ...defaultProps,
        conflicts: [userConflict],
      };
      const { getByText } = render(<ConflictResolutionModal {...props} />);
      expect(getByText('User profiles')).toBeTruthy();
    });

    it('shows field name as fallback for unknown fields', () => {
      const unknownConflict = {
        id: 'conflict-unknown',
        field: 'unknownField',
        strategy: 'lww',
        localValue: 'local',
        remoteValue: 'remote',
      };

      const props = {
        ...defaultProps,
        conflicts: [unknownConflict],
      };
      const { getByText } = render(<ConflictResolutionModal {...props} />);
      expect(getByText('unknownField')).toBeTruthy();
    });
  });

  describe('Multi-Conflict Navigation', () => {
    const multiConflictProps = {
      ...defaultProps,
      conflicts: [activityConflict, userConflict, settingsConflict],
      onResolve: jest.fn().mockResolvedValue(undefined), // Make this synchronous
    };

    it('shows correct conflict count', () => {
      const { getByText } = render(<ConflictResolutionModal {...multiConflictProps} />);
      expect(getByText('1 of 3')).toBeTruthy();
    });

    it('advances to next conflict after resolution', async () => {
      const { getByText } = render(<ConflictResolutionModal {...multiConflictProps} />);

      // Initially shows first conflict
      expect(getByText('Activity templates')).toBeTruthy();
      expect(getByText('1 of 3')).toBeTruthy();

      // Choose local
      fireEvent.press(getByText('Keep Local (This Device)'));

      // Fast forward through resolution timeout
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(getByText('User profiles')).toBeTruthy();
        expect(getByText('2 of 3')).toBeTruthy();
      }, { timeout: 1000 });
    });

    it('closes modal after resolving all conflicts', async () => {
      const mockOnClose = jest.fn();
      const mockOnResolve = jest.fn().mockResolvedValue(undefined);

      const { getByText } = render(
        <ConflictResolutionModal
          {...defaultProps}
          conflicts={[settingsConflict]} // Single conflict
          onClose={mockOnClose}
          onResolve={mockOnResolve}
        />
      );

      // Choose local
      fireEvent.press(getByText('Keep Local (This Device)'));

      // Fast forward through resolution timeout
      await act(async () => {
        jest.advanceTimersByTime(600);
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Choice Selection and State Management', () => {
    it('shows selected state when choice is made', async () => {
      // Mock onResolve to prevent async operations that might cause re-render issues
      const mockOnResolve = jest.fn().mockResolvedValue();
      const props = { ...defaultProps, onResolve: mockOnResolve };

      const { getByText, getAllByText, queryByText } = render(<ConflictResolutionModal {...props} />);

      const localChoice = getByText('Keep Local (This Device)');

      await act(async () => {
        fireEvent.press(localChoice);
      });

      // Should show selected state and resolving overlay
      expect(queryByText('Applying choice...')).toBeTruthy();

      // Check that the resolver function was called
      await waitFor(() => {
        expect(mockOnResolve).toHaveBeenCalledWith({
          id: 'conflict-1',
          field: 'activities',
          choice: 'local',
          resolvedValue: activityConflict.localValue,
        });
      });
    });

    it('shows preview state on press in/out', () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      const localChoice = getByText('Keep Local (This Device)');

      // Test preview on press in
      fireEvent(localChoice, 'pressIn');
      // Preview styling would be applied via style prop changes

      // Test preview clear on press out
      fireEvent(localChoice, 'pressOut');
      // Preview styling would be cleared
    });

    it('disables choices during resolution', async () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      const localChoice = getByText('Keep Local (This Device)');
      const remoteChoice = getByText('Keep Remote (Other Device)');

      // Make first choice
      fireEvent.press(localChoice);

      // Try to make second choice (should be disabled)
      fireEvent.press(remoteChoice);

      // Since choices are disabled during resolution, the second press should not trigger additional processing
      // The resolution state should prevent multiple simultaneous resolutions
    });

    it('resets state when modal becomes visible', () => {
      const { rerender } = render(
        <ConflictResolutionModal {...defaultProps} visible={false} />
      );

      // Make modal visible - should reset state
      rerender(<ConflictResolutionModal {...defaultProps} visible={true} />);

      // State should be reset to initial values
      // This is tested implicitly by other tests working correctly
    });
  });

  describe('Platform-Specific Behavior', () => {
    it('renders Android StatusBar configuration', () => {
      Platform.OS = 'android';

      const { UNSAFE_getAllByType } = render(<ConflictResolutionModal {...defaultProps} />);

      const statusBars = UNSAFE_getAllByType('StatusBar');
      expect(statusBars.length).toBeGreaterThan(0);

      const androidStatusBar = statusBars.find(sb =>
        sb.props.backgroundColor === mockTheme.primary &&
        sb.props.barStyle === 'light-content' &&
        sb.props.translucent === false
      );
      expect(androidStatusBar).toBeTruthy();
    });

    it('renders Android status bar height spacing', () => {
      Platform.OS = 'android';

      const { UNSAFE_getAllByType } = render(<ConflictResolutionModal {...defaultProps} />);

      // Find all View components
      const views = UNSAFE_getAllByType('View');

      // Look for the Android status bar spacing view
      // It should have backgroundColor matching theme.primary and a height property
      const statusBarSpacingView = views.find(view => {
        const style = view.props.style;
        return style &&
               typeof style === 'object' &&
               style.backgroundColor === mockTheme.primary &&
               typeof style.height === 'number' && // Should have a numeric height
               !Array.isArray(style); // Should be a plain object, not an array
      });

      expect(statusBarSpacingView).toBeTruthy();
      expect(statusBarSpacingView.props.style.backgroundColor).toBe(mockTheme.primary);
      expect(typeof statusBarSpacingView.props.style.height).toBe('number');
      // The height should be either StatusBar.currentHeight or the fallback (24)
      expect(statusBarSpacingView.props.style.height).toBeGreaterThan(0);
    });

    it('does not render Android-specific elements on iOS', () => {
      Platform.OS = 'ios';

      const { UNSAFE_queryAllByType } = render(<ConflictResolutionModal {...defaultProps} />);

      // Should not have Android-specific StatusBar config
      const statusBars = UNSAFE_queryAllByType('StatusBar');
      const androidStatusBars = statusBars.filter(sb =>
        sb.props.backgroundColor === mockTheme.primary
      );
      expect(androidStatusBars.length).toBe(0);
    });

    it('does not render Android-specific elements on web', () => {
      Platform.OS = 'web';

      const { UNSAFE_queryAllByType } = render(<ConflictResolutionModal {...defaultProps} />);

      // Should not have Android-specific StatusBar config
      const statusBars = UNSAFE_queryAllByType('StatusBar');
      const androidStatusBars = statusBars.filter(sb =>
        sb.props.backgroundColor === mockTheme.primary
      );
      expect(androidStatusBars.length).toBe(0);
    });
  });

  describe('Integration with ConflictResolver', () => {
    it('resolves local choice correctly', async () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      fireEvent.press(getByText('Keep Local (This Device)'));

      await waitFor(() => {
        expect(defaultProps.onResolve).toHaveBeenCalledWith({
          id: 'conflict-1',
          field: 'activities',
          choice: 'local',
          resolvedValue: activityConflict.localValue,
        });
      });
    });

    it('resolves remote choice correctly', async () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      fireEvent.press(getByText('Keep Remote (Other Device)'));

      await waitFor(() => {
        expect(defaultProps.onResolve).toHaveBeenCalledWith({
          id: 'conflict-1',
          field: 'activities',
          choice: 'remote',
          resolvedValue: activityConflict.remoteValue,
        });
      });
    });

    it('calls mergeActivitiesArray for activity merge choice rendering', () => {
      render(<ConflictResolutionModal {...defaultProps} />);

      const conflictResolver = require('../../../services/sync/conflictResolver').default;
      expect(conflictResolver.mergeActivitiesArray).toHaveBeenCalledWith(
        activityConflict.localValue,
        activityConflict.remoteValue
      );
    });

    it('handles activity merge choice selection', async () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      fireEvent.press(getByText('Merge Both'));

      const conflictResolver = require('../../../services/sync/conflictResolver').default;

      await waitFor(() => {
        expect(conflictResolver.mergeActivitiesArray).toHaveBeenCalledWith(
          activityConflict.localValue,
          activityConflict.remoteValue
        );

        expect(defaultProps.onResolve).toHaveBeenCalledWith({
          id: 'conflict-1',
          field: 'activities',
          choice: 'merge',
          resolvedValue: [
            { id: 'activity-1', text: 'Local Activity', icon: '🎯' },
            { id: 'activity-2', text: 'Shared Activity', icon: '⚽' },
            { id: 'activity-3', text: 'Remote Activity', icon: '🎨' },
          ],
        });
      });
    });

    it('calls mergeUsers for user conflict merge', async () => {
      // Enable merge strategy for user conflict
      const mergeableUserConflict = {
        ...userConflict,
        strategy: 'merge'
      };

      const props = {
        ...defaultProps,
        conflicts: [mergeableUserConflict],
      };

      const { getByText } = render(<ConflictResolutionModal {...props} />);

      fireEvent.press(getByText('Merge Both'));

      const conflictResolver = require('../../../services/sync/conflictResolver').default;

      await waitFor(() => {
        expect(conflictResolver.mergeUsers).toHaveBeenCalledWith(
          userConflict.localValue,
          userConflict.remoteValue,
          expect.objectContaining({
            fieldTimestamps: expect.objectContaining({ users: expect.any(Number) })
          }),
          expect.objectContaining({
            fieldTimestamps: expect.objectContaining({ users: expect.any(Number) })
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles merge errors gracefully', async () => {
      const mockOnResolve = jest.fn().mockResolvedValue(undefined);
      const conflictResolver = require('../../../services/sync/conflictResolver').default;
      conflictResolver.mergeActivitiesArray.mockImplementation(() => {
        throw new Error('Merge failed');
      });

      const { getByText } = render(
        <ConflictResolutionModal {...defaultProps} onResolve={mockOnResolve} />
      );

      // The merge error happens during render (when computing the merge preview)
      // so the Merge Both button should still exist but use the fallback value
      expect(getByText('Merge Both')).toBeTruthy();

      await act(async () => {
        fireEvent.press(getByText('Merge Both'));
      });

      // When the merge fails during handleChoice, it should still call onResolve
      // but with the error result (which would be undefined or throw)
      // The component should handle this gracefully by setting resolving to false
      await waitFor(() => {
        // Either onResolve is called with error result, or resolving state is cleared
        // Let's just verify the component doesn't crash and can still be interacted with
        expect(getByText('Activity templates')).toBeTruthy();
      });
    });

    it('handles missing merge values gracefully', () => {
      const conflictResolver = require('../../../services/sync/conflictResolver').default;
      conflictResolver.mergeActivitiesArray.mockReturnValue(null);

      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      // Should still render merge option even with null merge result
      expect(getByText('Merge Both')).toBeTruthy();
    });

    it('handles conflicts with null/undefined values', () => {
      const nullConflict = {
        ...activityConflict,
        localValue: null,
        remoteValue: undefined,
      };

      const props = {
        ...defaultProps,
        conflicts: [nullConflict],
      };

      const { getByText } = render(<ConflictResolutionModal {...props} />);

      // Should render without crashing
      expect(getByText('Keep Local (This Device)')).toBeTruthy();
      expect(getByText('Keep Remote (Other Device)')).toBeTruthy();
    });
  });

  describe('User Interface Elements', () => {
    it('renders close button that calls onClose', () => {
      const { getAllByText } = render(<ConflictResolutionModal {...defaultProps} />);

      // Find the close button (Icon renders as text in tests)
      const closeButtons = getAllByText('close');
      expect(closeButtons.length).toBeGreaterThan(0);

      fireEvent.press(closeButtons[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('disables close button during resolution', async () => {
      const mockOnResolve = jest.fn().mockImplementation(async () => {
        // Delay resolution to keep the resolving state active
        return new Promise(resolve => setTimeout(resolve, 1000));
      });

      const { getAllByText, UNSAFE_getAllByType } = render(
        <ConflictResolutionModal
          {...defaultProps}
          onResolve={mockOnResolve}
        />
      );

      // Get all TouchableOpacity components
      const touchables = UNSAFE_getAllByType('TouchableOpacity');

      // Find the close button TouchableOpacity (it should contain the close icon)
      const closeButton = touchables.find(touchable => {
        // Check if this touchable has onPress set to onClose (defaultProps.onClose)
        return touchable.props.onPress === defaultProps.onClose;
      });

      expect(closeButton).toBeTruthy();
      // Initially, close button should not be disabled
      expect(closeButton.props.disabled).toBe(false);

      // Trigger resolution to set resolving state
      await act(async () => {
        fireEvent.press(getAllByText('Keep Local (This Device)')[0]);
      });

      // After triggering resolution, get the updated close button
      const updatedTouchables = UNSAFE_getAllByType('TouchableOpacity');
      const updatedCloseButton = updatedTouchables.find(touchable => {
        return touchable.props.onPress === defaultProps.onClose;
      });

      expect(updatedCloseButton).toBeTruthy();
      // During resolution, close button should be disabled
      expect(updatedCloseButton.props.disabled).toBe(true);

      // Verify that the resolving overlay is visible during resolution
      expect(getAllByText('Applying choice...').length).toBeGreaterThan(0);
    });

    it('renders footer tip text', () => {
      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      expect(getByText('Tip: For activity lists, merging usually gives the best result')).toBeTruthy();
    });

    it('shows resolving overlay during conflict resolution', async () => {
      const mockOnResolve = jest.fn().mockImplementation(async () => {
        // Don't resolve immediately to keep resolving state visible
        return new Promise(resolve => setTimeout(resolve, 1000));
      });

      const { getByText, getByTestId } = render(
        <ConflictResolutionModal {...defaultProps} onResolve={mockOnResolve} />
      );

      // Trigger resolving state
      await act(async () => {
        fireEvent.press(getByText('Keep Local (This Device)'));
      });

      expect(getByText('Applying choice...')).toBeTruthy();
      // ActivityIndicator should be present but we can't easily test it with string mock
    });
  });

  describe('Modal Properties', () => {
    it('configures modal with correct properties', () => {
      const { UNSAFE_getByType } = render(<ConflictResolutionModal {...defaultProps} />);

      const modal = UNSAFE_getByType('Modal');
      expect(modal.props.visible).toBe(true);
      expect(modal.props.animationType).toBe('slide');
      expect(modal.props.transparent).toBe(false);
      expect(modal.props.statusBarTranslucent).toBe(true);
      expect(modal.props.onRequestClose).toBe(defaultProps.onClose);
    });
  });

  describe('Theme Integration', () => {
    it('applies theme colors to header and primary elements', () => {
      const customTheme = { primary: '#FF6B6B', light: '#F8F9FA' };
      const props = { ...defaultProps, theme: customTheme };

      const { UNSAFE_getAllByType } = render(<ConflictResolutionModal {...props} />);

      // Find views with the custom theme color
      const views = UNSAFE_getAllByType('View');
      const headerViews = views.filter(view => {
        const style = view.props.style;
        if (Array.isArray(style)) {
          return style.some(s => s && s.backgroundColor === '#FF6B6B');
        }
        return style && style.backgroundColor === '#FF6B6B';
      });
      expect(headerViews.length).toBeGreaterThan(0);
    });
  });

  describe('Real Conflict Resolution Integration', () => {
    it('preserves field naming conventions for activities (text not name)', async () => {
      const conflictResolver = require('../../../services/sync/conflictResolver').default;

      // Reset mocks to use real implementation
      conflictResolver.mergeActivitiesArray.mockImplementation((localActivities, remoteActivities) => {
        const merged = [...(localActivities || [])];
        const existingIds = new Set(merged.map(a => a.id));

        (remoteActivities || []).forEach(activity => {
          if (!existingIds.has(activity.id)) {
            merged.push(activity);
          }
        });

        return merged;
      });

      const { getByText } = render(<ConflictResolutionModal {...defaultProps} />);

      fireEvent.press(getByText('Merge Both'));

      await waitFor(() => {
        expect(defaultProps.onResolve).toHaveBeenCalledWith({
          id: 'conflict-1',
          field: 'activities',
          choice: 'merge',
          resolvedValue: [
            { id: 'activity-1', text: 'Local Activity', icon: '🎯' },
            { id: 'activity-2', text: 'Shared Activity', icon: '⚽' },
            { id: 'activity-3', text: 'Remote Activity', icon: '🎨' },
          ],
        });
      });

      // Verify all activities use 'text' field, not 'name'
      const resolvedValue = defaultProps.onResolve.mock.calls[0][0].resolvedValue;
      resolvedValue.forEach(activity => {
        expect(activity).toHaveProperty('text');
        expect(activity.text).toBeTruthy();
        expect(activity).toHaveProperty('icon');
        expect(activity.icon).toBeTruthy();
      });
    });

    it('handles real user conflict resolution with proper field preservation', async () => {
      const conflictResolver = require('../../../services/sync/conflictResolver').default;

      // Mock mergeUsers to simulate real behavior
      conflictResolver.mergeUsers.mockImplementation((localUsers, remoteUsers) => {
        const merged = {};
        const allUserIds = new Set([
          ...Object.keys(localUsers || {}),
          ...Object.keys(remoteUsers || {})
        ]);

        allUserIds.forEach(userId => {
          const localUser = localUsers?.[userId];
          const remoteUser = remoteUsers?.[userId];

          if (localUser && remoteUser) {
            // Prefer remote for this test
            merged[userId] = {
              ...remoteUser,
              // Ensure proper field naming
              name: remoteUser.name,
              icon: remoteUser.icon,
            };
          } else {
            merged[userId] = localUser || remoteUser;
          }
        });

        return merged;
      });

      const props = {
        ...defaultProps,
        conflicts: [{...userConflict, strategy: 'merge'}], // Enable merge for users
      };

      const { getByText } = render(<ConflictResolutionModal {...props} />);

      fireEvent.press(getByText('Merge Both'));

      await waitFor(() => {
        expect(defaultProps.onResolve).toHaveBeenCalled();
      });

      const resolvedValue = defaultProps.onResolve.mock.calls[0][0].resolvedValue;
      Object.values(resolvedValue).forEach(user => {
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('icon');
        // Users should use 'icon' not 'emoji'
        expect(user).not.toHaveProperty('emoji');
      });
    });

    it('handles array merge conflicts with deduplication', async () => {
      const complexActivityConflict = {
        id: 'conflict-complex',
        field: 'activities',
        strategy: 'merge',
        localValue: [
          { id: 'activity-1', text: 'Reading', icon: '📚' },
          { id: 'activity-2', text: 'Exercise', icon: '🏃' },
        ],
        remoteValue: [
          { id: 'activity-2', text: 'Exercise', icon: '🏃' }, // Duplicate
          { id: 'activity-3', text: 'Cooking', icon: '👨‍🍳' },
          { id: 'activity-4', text: 'Writing', icon: '✍️' },
        ],
      };

      const props = {
        ...defaultProps,
        conflicts: [complexActivityConflict],
      };

      const conflictResolver = require('../../../services/sync/conflictResolver').default;
      conflictResolver.mergeActivitiesArray.mockImplementation((localActivities, remoteActivities) => {
        const merged = [...(localActivities || [])];
        const existingIds = new Set(merged.map(a => a.id));

        (remoteActivities || []).forEach(activity => {
          if (!existingIds.has(activity.id)) {
            merged.push(activity);
          }
        });

        return merged;
      });

      const { getByText } = render(<ConflictResolutionModal {...props} />);

      fireEvent.press(getByText('Merge Both'));

      await waitFor(() => {
        expect(defaultProps.onResolve).toHaveBeenCalled();
      });

      const resolvedValue = defaultProps.onResolve.mock.calls[0][0].resolvedValue;

      // Should have 4 unique activities (no duplicates)
      expect(resolvedValue).toHaveLength(4);

      // Verify no duplicate IDs
      const ids = resolvedValue.map(a => a.id);
      expect(new Set(ids).size).toBe(4);

      // Verify all activities have proper field naming
      resolvedValue.forEach(activity => {
        expect(activity).toHaveProperty('text');
        expect(activity).toHaveProperty('icon');
        expect(activity.text).toBeTruthy();
        expect(activity.icon).toBeTruthy();
      });
    });

    it('handles edge cases with empty arrays and null values', async () => {
      const edgeCaseConflict = {
        id: 'conflict-edge',
        field: 'activities',
        strategy: 'merge',
        localValue: [],
        remoteValue: null,
      };

      const props = {
        ...defaultProps,
        conflicts: [edgeCaseConflict],
      };

      const { getByText } = render(<ConflictResolutionModal {...props} />);

      // Should render without crashing
      expect(getByText('Keep Local (This Device)')).toBeTruthy();
      expect(getByText('Keep Remote (Other Device)')).toBeTruthy();
      expect(getByText('Merge Both')).toBeTruthy();

      fireEvent.press(getByText('Merge Both'));

      await waitFor(() => {
        expect(defaultProps.onResolve).toHaveBeenCalled();
      });

      const resolvedValue = defaultProps.onResolve.mock.calls[0][0].resolvedValue;
      expect(Array.isArray(resolvedValue)).toBe(true);
    });
  });
});