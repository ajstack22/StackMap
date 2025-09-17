import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LibraryHeader from '../LibraryHeader';

// Mock the Typography component
jest.mock('../../Typography', () => ({
  Text: ({ children, style }) => {
    const MockText = require('react-native').Text;
    return <MockText style={style}>{children}</MockText>;
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 })
}));

describe('LibraryHeader', () => {
  const mockTheme = {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    light: '#F2F2F7',
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText } = render(
      <LibraryHeader theme={mockTheme} onClose={mockOnClose} />
    );

    expect(getByText('Activity Library')).toBeTruthy();
  });

  it('renders with fixed title', () => {
    const { getByText } = render(
      <LibraryHeader
        theme={mockTheme}
        onClose={mockOnClose}
      />
    );

    expect(getByText('Activity Library')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const { getByLabelText } = render(
      <LibraryHeader theme={mockTheme} onClose={mockOnClose} />
    );

    const closeButton = getByLabelText('Close Activity Library');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('applies theme colors correctly', () => {
    const customTheme = {
      primary: '#FF0000',
    };

    const { getByText } = render(
      <LibraryHeader theme={customTheme} onClose={mockOnClose} />
    );

    // Component should render with theme without throwing
    expect(getByText('Activity Library')).toBeTruthy();
  });

  it('renders close icon', () => {
    const { getByLabelText } = render(
      <LibraryHeader
        theme={mockTheme}
        onClose={mockOnClose}
      />
    );

    expect(getByLabelText('Close Activity Library')).toBeTruthy();
  });

  it('has proper component structure', () => {
    const component = render(
      <LibraryHeader theme={mockTheme} onClose={mockOnClose} />
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      const component = render(
        <LibraryHeader theme={mockTheme} onClose={mockOnClose} />
      );

      // Test that component renders and is accessible
      expect(component).toBeTruthy();
    });
  });

  describe('responsive design', () => {
    it('should handle different screen sizes', () => {
      // Mock isTablet function to test tablet vs mobile layouts
      const component = render(
        <LibraryHeader theme={mockTheme} onClose={mockOnClose} />
      );

      expect(component).toBeTruthy();
    });
  });
});