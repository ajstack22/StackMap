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
});