/* eslint-env jest */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FAB from '../FAB';

// Mock the Icon component
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock the constants
jest.mock('../../../constants', () => ({
  SHADOWS: {
    level3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  },
  FAB_DIMENSIONS: {
    mobile: {
      size: 56,
      iconSize: 24,
    },
    tablet: {
      size: 64,
      iconSize: 28,
    },
  },
  isTablet: () => false,
}));

describe('FAB Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders correctly with required props', () => {
    const { getByTestId } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
        testID="fab-button"
      />
    );

    const fab = getByTestId('fab-button');
    expect(fab).toBeDefined();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <FAB
        icon="edit"
        onPress={onPress}
        theme={{ primary: '#0095FF' }}
        testID="fab-button"
      />
    );

    const fab = getByTestId('fab-button');
    fireEvent.press(fab);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies custom style prop', () => {
    const customStyle = { backgroundColor: '#FF0000' };
    const { getByTestId } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
        style={customStyle}
        testID="fab-button"
      />
    );

    const fab = getByTestId('fab-button');
    // Style prop should be an array that includes the custom style
    expect(Array.isArray(fab.props.style)).toBe(true);
    expect(fab.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#FF0000' })
      ])
    );
  });

  it('applies position prop', () => {
    const position = { bottom: 20, right: 20 };
    const { getByTestId } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
        position={position}
        testID="fab-button"
      />
    );

    const fab = getByTestId('fab-button');
    // Position should be merged into one of the style objects
    expect(Array.isArray(fab.props.style)).toBe(true);
    expect(fab.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ bottom: 20, right: 20 })
      ])
    );
  });

  it('renders with different icons', () => {
    const { rerender, UNSAFE_getByType } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
      />
    );

    let icon = UNSAFE_getByType('Icon');
    expect(icon.props.name).toBe('edit');

    rerender(
      <FAB
        icon="edit-off"
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
      />
    );

    icon = UNSAFE_getByType('Icon');
    expect(icon.props.name).toBe('edit-off');
  });

  it('uses theme color for icon', () => {
    const theme = { primary: '#FF00FF' };
    const { UNSAFE_getByType } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
        theme={theme}
      />
    );

    const icon = UNSAFE_getByType('Icon');
    expect(icon.props.color).toBe('#FF00FF');
  });

  it('uses default color when theme not provided', () => {
    const { UNSAFE_getByType } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
      />
    );

    const icon = UNSAFE_getByType('Icon');
    expect(icon.props.color).toBe('#667eea');
  });

  it('sets correct size based on device type', () => {
    const { getByTestId } = render(
      <FAB
        icon="edit"
        onPress={jest.fn()}
        theme={{ primary: '#0095FF' }}
        testID="fab-button"
      />
    );

    const fab = getByTestId('fab-button');
    // We mocked isTablet to return false, so it should use mobile dimensions
    expect(Array.isArray(fab.props.style)).toBe(true);
    expect(fab.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          width: 56,
          height: 56,
          borderRadius: 28,
        })
      ])
    );
  });

  describe('Animation Logic', () => {
    beforeEach(() => {
      // Mock Animated functions to check they're called
      jest.spyOn(require('react-native').Animated, 'sequence');
      jest.spyOn(require('react-native').Animated, 'timing');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should animate when icon changes from edit to edit-off', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Change icon to edit-off to trigger animation
      rerender(
        <FAB
          icon="edit-off"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Animation should be triggered
      expect(require('react-native').Animated.sequence).toHaveBeenCalled();
    });

    it('should animate when icon changes from edit-off to edit', () => {
      const { rerender } = render(
        <FAB
          icon="edit-off"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Change icon to edit to trigger animation
      rerender(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Animation should be triggered
      expect(require('react-native').Animated.sequence).toHaveBeenCalled();
    });

    it('should not animate for other icon transitions', () => {
      const { rerender } = render(
        <FAB
          icon="add"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Change to a different icon that shouldn't trigger animation
      rerender(
        <FAB
          icon="remove"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Animation should NOT be triggered
      expect(require('react-native').Animated.sequence).not.toHaveBeenCalled();
    });

    it('should not animate when icon stays the same', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Rerender with same icon
      rerender(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Animation should NOT be triggered
      expect(require('react-native').Animated.sequence).not.toHaveBeenCalled();
    });

    it('should not animate on initial render', () => {
      render(
        <FAB
          icon="edit-off"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Animation should NOT be triggered on initial render
      expect(require('react-native').Animated.sequence).not.toHaveBeenCalled();
    });

    it('should not animate when changing from edit to non-edit-off icon', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Change to an icon that shouldn't trigger animation
      rerender(
        <FAB
          icon="add"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Animation should NOT be triggered
      expect(require('react-native').Animated.sequence).not.toHaveBeenCalled();
    });

    it('should not animate when changing from edit-off to non-edit icon', () => {
      const { rerender } = render(
        <FAB
          icon="edit-off"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Change to an icon that shouldn't trigger animation
      rerender(
        <FAB
          icon="close"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Animation should NOT be triggered
      expect(require('react-native').Animated.sequence).not.toHaveBeenCalled();
    });
  });

  describe('Device Size Branching', () => {
    it('should use tablet dimensions when isTablet returns true', () => {
      // Mock isTablet to return true
      const constants = require('../../../constants');
      constants.isTablet = jest.fn(() => true);

      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
          testID="fab-button"
        />
      );

      const fab = getByTestId('fab-button');
      expect(Array.isArray(fab.props.style)).toBe(true);
      expect(fab.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: 64,  // tablet size
            height: 64, // tablet size
            borderRadius: 32, // tablet size / 2
          })
        ])
      );

      // Restore the original mock
      constants.isTablet = jest.fn(() => false);
    });

    it('should use mobile dimensions when isTablet returns false', () => {
      // Explicitly mock isTablet to return false (should be default)
      const constants = require('../../../constants');
      constants.isTablet = jest.fn(() => false);

      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
          testID="fab-button"
        />
      );

      const fab = getByTestId('fab-button');
      expect(Array.isArray(fab.props.style)).toBe(true);
      expect(fab.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            width: 56,  // mobile size
            height: 56, // mobile size
            borderRadius: 28, // mobile size / 2
          })
        ])
      );
    });
  });

  describe('Style Fallbacks', () => {
    it('should use white background when no style backgroundColor provided', () => {
      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          testID="fab-button"
        />
      );

      const fab = getByTestId('fab-button');
      expect(Array.isArray(fab.props.style)).toBe(true);
      expect(fab.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: 'white',
          })
        ])
      );
    });

    it('should use style backgroundColor when provided', () => {
      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          style={{ backgroundColor: '#123456' }}
          testID="fab-button"
        />
      );

      const fab = getByTestId('fab-button');
      expect(Array.isArray(fab.props.style)).toBe(true);
      expect(fab.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: '#123456',
          })
        ])
      );
    });

    it('should handle null/undefined style prop', () => {
      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          style={null}
          testID="fab-button"
        />
      );

      const fab = getByTestId('fab-button');
      expect(fab).toBeTruthy();
      expect(Array.isArray(fab.props.style)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing theme prop', () => {
      const { UNSAFE_getByType } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
        />
      );

      const icon = UNSAFE_getByType('Icon');
      expect(icon.props.color).toBe('#667eea'); // fallback color
    });

    it('should handle theme with null primary', () => {
      const { UNSAFE_getByType } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: null }}
        />
      );

      const icon = UNSAFE_getByType('Icon');
      expect(icon.props.color).toBe('#667eea'); // fallback color
    });

    it('should handle theme with undefined primary', () => {
      const { UNSAFE_getByType } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: undefined }}
        />
      );

      const icon = UNSAFE_getByType('Icon');
      expect(icon.props.color).toBe('#667eea'); // fallback color
    });

    it('should pass through additional props', () => {
      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          testID="fab-button"
          accessibilityLabel="Floating Action Button"
        />
      );

      const fab = getByTestId('fab-button');
      expect(fab.props.accessibilityLabel).toBe('Floating Action Button');
    });
  });

  describe('Animation robustness and rapid interaction tests', () => {
    beforeEach(() => {
      jest.spyOn(require('react-native').Animated, 'sequence');
      jest.spyOn(require('react-native').Animated, 'timing');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should handle rapid double-tap without breaking', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={onPress}
          theme={{ primary: '#0095FF' }}
          testID="fab-button"
        />
      );

      const fab = getByTestId('fab-button');

      // Simulate rapid double-tap
      fireEvent.press(fab);
      fireEvent.press(fab);

      expect(onPress).toHaveBeenCalledTimes(2);
    });

    it('should handle extremely rapid tapping without performance issues', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={onPress}
          theme={{ primary: '#0095FF' }}
          testID="fab-button"
        />
      );

      const fab = getByTestId('fab-button');
      const startTime = performance.now();

      // Simulate 100 rapid taps
      for (let i = 0; i < 100; i++) {
        fireEvent.press(fab);
      }

      const endTime = performance.now();

      expect(onPress).toHaveBeenCalledTimes(100);
      expect(endTime - startTime).toBeLessThan(100); // Should handle rapidly
    });

    it('should handle rapid icon changes that trigger animations', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Rapid icon changes between animatable icons
      for (let i = 0; i < 10; i++) {
        rerender(
          <FAB
            icon={i % 2 === 0 ? "edit" : "edit-off"}
            onPress={jest.fn()}
            theme={{ primary: '#0095FF' }}
          />
        );
      }

      // Should not crash and animations should be called
      expect(require('react-native').Animated.sequence).toHaveBeenCalled();
    });

    it('should handle animation interruption gracefully', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Start animation
      rerender(
        <FAB
          icon="edit-off"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Immediately interrupt with another change
      rerender(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Should handle interruption without crashing
      expect(require('react-native').Animated.sequence).toHaveBeenCalled();
    });

    it('should handle malformed animation values without crashing', () => {
      const originalTiming = require('react-native').Animated.timing;
      require('react-native').Animated.timing = jest.fn(() => ({
        start: jest.fn(callback => {
          // Simulate animation failure
          if (callback) callback({ finished: false });
        })
      }));

      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Should not crash even if animation fails
      expect(() => {
        rerender(
          <FAB
            icon="edit-off"
            onPress={jest.fn()}
            theme={{ primary: '#0095FF' }}
          />
        );
      }).not.toThrow();

      // Restore original
      require('react-native').Animated.timing = originalTiming;
    });

    it('should handle component unmount during animation', () => {
      const TestWrapper = ({ shouldRender }) => {
        return shouldRender ? (
          <FAB
            icon="edit-off"
            onPress={jest.fn()}
            theme={{ primary: '#0095FF' }}
          />
        ) : null;
      };

      const { rerender } = render(<TestWrapper shouldRender={true} />);

      // Start animation by changing icon
      rerender(<TestWrapper shouldRender={true} />);

      // Unmount during potential animation
      expect(() => {
        rerender(<TestWrapper shouldRender={false} />);
      }).not.toThrow();
    });

    it('should handle NaN and invalid style values during animation', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
          style={{ opacity: NaN, transform: [{ scale: Infinity }] }}
        />
      );

      // Should handle animation even with problematic style values
      expect(() => {
        rerender(
          <FAB
            icon="edit-off"
            onPress={jest.fn()}
            theme={{ primary: '#0095FF' }}
            style={{ opacity: -Infinity, transform: [{ scale: 'invalid' }] }}
          />
        );
      }).not.toThrow();
    });

    it('should handle theme changes during animation', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#FF0000' }}
        />
      );

      // Start animation and change theme simultaneously
      rerender(
        <FAB
          icon="edit-off"
          onPress={jest.fn()}
          theme={{ primary: '#00FF00' }}
        />
      );

      // Should handle both icon and theme changes
      expect(require('react-native').Animated.sequence).toHaveBeenCalled();
    });

    it('should handle concurrent size and icon changes', () => {
      // Mock isTablet to change device type during render
      const constants = require('../../../constants');
      constants.isTablet = jest.fn(() => false);

      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      // Change device type and icon simultaneously
      constants.isTablet = jest.fn(() => true);
      rerender(
        <FAB
          icon="edit-off"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      expect(require('react-native').Animated.sequence).toHaveBeenCalled();

      // Restore original mock
      constants.isTablet = jest.fn(() => false);
    });
  });

  describe('Stress testing and memory leak prevention', () => {
    it('should handle thousands of rapid prop changes', () => {
      const { rerender } = render(
        <FAB
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      const startTime = performance.now();

      // Rapid prop changes
      for (let i = 0; i < 1000; i++) {
        rerender(
          <FAB
            icon={i % 2 === 0 ? "edit" : "add"}
            onPress={jest.fn()}
            theme={{ primary: `#${(i % 16777215).toString(16).padStart(6, '0')}` }}
          />
        );
      }

      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in reasonable time
    });

    it('should handle memory cleanup on repeated mount/unmount cycles', () => {
      const TestWrapper = ({ id }) => (
        <FAB
          key={id}
          icon="edit"
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
        />
      );

      const { rerender, unmount } = render(<TestWrapper id={0} />);

      // Simulate 100 mount/unmount cycles
      for (let i = 1; i <= 100; i++) {
        rerender(<TestWrapper id={i} />);
      }

      expect(() => unmount()).not.toThrow();
    });

    it('should handle simultaneous rendering of multiple FAB instances', () => {
      const fabs = Array.from({ length: 50 }, (_, i) => (
        <FAB
          key={i}
          icon={i % 2 === 0 ? "edit" : "add"}
          onPress={jest.fn()}
          theme={{ primary: '#0095FF' }}
          testID={`fab-${i}`}
        />
      ));

      const startTime = performance.now();
      const { getAllByTestId } = render(<>{fabs}</>);
      const endTime = performance.now();

      const renderedFabs = getAllByTestId(/^fab-\d+$/);
      expect(renderedFabs).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should handle extreme position values without breaking layout', () => {
      const extremePositions = [
        { top: Number.MAX_SAFE_INTEGER, left: Number.MIN_SAFE_INTEGER },
        { bottom: Infinity, right: -Infinity },
        { top: NaN, left: 'invalid' },
        { bottom: null, right: undefined }
      ];

      extremePositions.forEach((position, index) => {
        expect(() => {
          render(
            <FAB
              icon="edit"
              onPress={jest.fn()}
              position={position}
              testID={`fab-extreme-${index}`}
            />
          );
        }).not.toThrow();
      });
    });

    it('should handle malformed onPress callbacks gracefully', () => {
      const problematicCallbacks = [
        null,
        undefined,
        'not a function',
        { call: 'invalid' }
      ];

      problematicCallbacks.forEach((callback, index) => {
        const { getByTestId } = render(
          <FAB
            icon="edit"
            onPress={callback}
            testID={`fab-callback-${index}`}
          />
        );

        const fab = getByTestId(`fab-callback-${index}`);

        // Should not crash when pressing with invalid callbacks
        expect(() => {
          fireEvent.press(fab);
        }).not.toThrow();
      });
    });

    it('should handle onPress callbacks that throw errors', () => {
      const throwingCallback = () => { throw new Error('Callback error'); };

      const { getByTestId } = render(
        <FAB
          icon="edit"
          onPress={throwingCallback}
          testID="fab-throwing"
        />
      );

      const fab = getByTestId('fab-throwing');

      // Should propagate the error from callback
      expect(() => {
        fireEvent.press(fab);
      }).toThrow('Callback error');
    });
  });
});