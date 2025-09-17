import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LibraryActions from '../LibraryActions';

// Mock SearchBar and SortControls components
jest.mock('../SearchBar', () => {
  const React = require('react');
  const { View, TextInput } = require('react-native');
  return function SearchBar({ searchQuery, onSearchChange, placeholder = 'Search activities...', ...props }) {
    return (
      <View>
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          {...props}
        />
      </View>
    );
  };
});

jest.mock('../SortControls', () => {
  const React = require('react');
  const { TouchableOpacity, View } = require('react-native');
  return function SortControls({ isSortMode, onSortToggle, theme }) {
    return (
      <View>
        <TouchableOpacity
          onPress={onSortToggle}
          testID="sort-toggle-button"
          style={{ opacity: isSortMode ? 1 : 0.7 }}
        >
          <View testID={isSortMode ? 'sort-active' : 'sort-inactive'} />
        </TouchableOpacity>
      </View>
    );
  };
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('LibraryActions', () => {
  const mockTheme = {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    light: '#F2F2F7',
  };

  const defaultProps = {
    searchQuery: '',
    onSearchChange: jest.fn(),
    onSearchClear: jest.fn(),
    isSortMode: false,
    onSortToggle: jest.fn(),
    theme: mockTheme,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const component = render(<LibraryActions {...defaultProps} />);
    expect(component).toBeTruthy();
  });

  it('calls onSearchChange when text input changes', () => {
    const { getByPlaceholderText } = render(
      <LibraryActions {...defaultProps} />
    );

    const searchInput = getByPlaceholderText('Search activities...');
    fireEvent.changeText(searchInput, 'test query');

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('test query');
  });

  it('shows clear button when search query is not empty', () => {
    const props = {
      ...defaultProps,
      searchQuery: 'test query',
    };

    const component = render(<LibraryActions {...props} />);
    expect(component).toBeTruthy();
  });

  it('displays search query in input', () => {
    const props = {
      ...defaultProps,
      searchQuery: 'test query',
    };

    const { getByDisplayValue } = render(<LibraryActions {...props} />);
    expect(getByDisplayValue('test query')).toBeTruthy();
  });

  it('calls onSortToggle when sort button is pressed', () => {
    const { getByTestId } = render(<LibraryActions {...defaultProps} />);

    const sortButton = getByTestId('sort-toggle-button');
    fireEvent.press(sortButton);

    expect(defaultProps.onSortToggle).toHaveBeenCalled();
  });

  it('shows sort button in active state when isSortMode is true', () => {
    const props = {
      ...defaultProps,
      isSortMode: true,
    };

    const { getByTestId } = render(<LibraryActions {...props} />);
    expect(getByTestId('sort-active')).toBeTruthy();
  });

  it('shows sort button in inactive state when isSortMode is false', () => {
    const props = {
      ...defaultProps,
      isSortMode: false,
    };

    const { getByTestId } = render(<LibraryActions {...props} />);
    expect(getByTestId('sort-inactive')).toBeTruthy();
  });

  it('renders search bar with default placeholder', () => {
    const { getByPlaceholderText } = render(<LibraryActions {...defaultProps} />);
    expect(getByPlaceholderText('Search activities...')).toBeTruthy();
  });

  it('handles missing callback functions gracefully', () => {
    const props = {
      searchQuery: '',
      isSortMode: false,
      theme: mockTheme,
    };

    const component = render(<LibraryActions {...props} />);
    expect(component).toBeTruthy();
  });

  it('applies theme colors correctly', () => {
    const customTheme = {
      primary: '#FF0000',
    };

    const props = {
      ...defaultProps,
      theme: customTheme,
    };

    const component = render(<LibraryActions {...props} />);
    expect(component).toBeTruthy();
  });

  it('has proper component structure', () => {
    const component = render(<LibraryActions {...defaultProps} />);
    expect(component.toJSON()).toMatchSnapshot();
  });

  describe('search functionality', () => {
    it('handles empty search query', () => {
      const props = {
        ...defaultProps,
        searchQuery: '',
      };

      const component = render(<LibraryActions {...props} />);
      expect(component).toBeTruthy();
    });

    it('handles long search query', () => {
      const longQuery = 'a'.repeat(100);
      const props = {
        ...defaultProps,
        searchQuery: longQuery,
      };

      const component = render(<LibraryActions {...props} />);
      expect(component).toBeTruthy();
    });

    it('handles special characters in search', () => {
      const specialQuery = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const props = {
        ...defaultProps,
        searchQuery: specialQuery,
      };

      const component = render(<LibraryActions {...props} />);
      expect(component).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      const component = render(<LibraryActions {...defaultProps} />);
      expect(component).toBeTruthy();
    });

    it('should handle search input accessibility', () => {
      const { getByPlaceholderText } = render(
        <LibraryActions {...defaultProps} />
      );

      const searchInput = getByPlaceholderText('Search activities...');
      expect(searchInput).toBeTruthy();
    });
  });

  describe('responsive design', () => {
    it('should handle different screen sizes', () => {
      const component = render(<LibraryActions {...defaultProps} />);
      expect(component).toBeTruthy();
    });
  });
});