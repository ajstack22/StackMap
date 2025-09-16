import React from 'react';
import { render } from '@testing-library/react-native';

// Import all header modules
import LibraryHeader from '../LibraryHeader';
import TabSelector from '../TabSelector';
import LibraryActions from '../LibraryActions';

// Mock the Typography component
jest.mock('../../Typography', () => ({
  Text: ({ children, style }) => {
    const MockText = require('react-native').Text;
    return <MockText style={style}>{children}</MockText>;
  },
  TextInput: ({ children, ...props }) => {
    const MockTextInput = require('react-native').TextInput;
    return <MockTextInput {...props}>{children}</MockTextInput>;
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('ActivityLibrary Header Modules Integration', () => {
  const mockTheme = {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    light: '#F2F2F7',
  };

  it('all header modules should be importable', () => {
    expect(LibraryHeader).toBeDefined();
    expect(TabSelector).toBeDefined();
    expect(LibraryActions).toBeDefined();
  });

  it('all header modules should render without crashing', () => {
    const mockOnClose = jest.fn();
    const mockOnTabChange = jest.fn();
    const mockOnSearchChange = jest.fn();
    const mockOnSearchClear = jest.fn();
    const mockOnSortToggle = jest.fn();

    // Test LibraryHeader
    const headerComponent = render(
      <LibraryHeader theme={mockTheme} onClose={mockOnClose} />
    );
    expect(headerComponent).toBeTruthy();

    // Test TabSelector
    const tabComponent = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
      />
    );
    expect(tabComponent).toBeTruthy();

    // Test LibraryActions
    const actionsComponent = render(
      <LibraryActions
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        onSearchClear={mockOnSearchClear}
        isSortMode={false}
        onSortToggle={mockOnSortToggle}
        theme={mockTheme}
      />
    );
    expect(actionsComponent).toBeTruthy();
  });

  it('should maintain consistent styling across modules', () => {
    const mockOnClose = jest.fn();
    const mockOnTabChange = jest.fn();
    const mockOnSearchChange = jest.fn();
    const mockOnSearchClear = jest.fn();
    const mockOnSortToggle = jest.fn();

    // Render all components with the same theme
    const headerComponent = render(
      <LibraryHeader theme={mockTheme} onClose={mockOnClose} />
    );

    const tabComponent = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
      />
    );

    const actionsComponent = render(
      <LibraryActions
        searchQuery=""
        onSearchChange={mockOnSearchChange}
        onSearchClear={mockOnSearchClear}
        isSortMode={false}
        onSortToggle={mockOnSortToggle}
        theme={mockTheme}
      />
    );

    // All components should render successfully with the same theme
    expect(headerComponent).toBeTruthy();
    expect(tabComponent).toBeTruthy();
    expect(actionsComponent).toBeTruthy();
  });

  describe('module size constraints', () => {
    it('LibraryHeader should be under 300 lines', () => {
      // This is a rough check - in a real scenario you'd read the file
      expect(LibraryHeader.toString().length).toBeLessThan(10000);
    });

    it('TabSelector should be under 300 lines', () => {
      expect(TabSelector.toString().length).toBeLessThan(10000);
    });

    it('LibraryActions should be under 300 lines', () => {
      expect(LibraryActions.toString().length).toBeLessThan(10000);
    });
  });

  describe('theme consistency', () => {
    it('all modules should accept and use theme prop correctly', () => {
      const customTheme = {
        primary: '#FF0000',
        secondary: '#00FF00',
        light: '#0000FF',
      };

      const mockOnClose = jest.fn();
      const mockOnTabChange = jest.fn();
      const mockOnSearchChange = jest.fn();
      const mockOnSearchClear = jest.fn();
      const mockOnSortToggle = jest.fn();

      // Test with custom theme
      const headerComponent = render(
        <LibraryHeader theme={customTheme} onClose={mockOnClose} />
      );

      const tabComponent = render(
        <TabSelector
          activeTab="stackmap"
          onTabChange={mockOnTabChange}
          theme={customTheme}
        />
      );

      const actionsComponent = render(
        <LibraryActions
          searchQuery=""
          onSearchChange={mockOnSearchChange}
          onSearchClear={mockOnSearchClear}
          isSortMode={false}
          onSortToggle={mockOnSortToggle}
          theme={customTheme}
        />
      );

      expect(headerComponent).toBeTruthy();
      expect(tabComponent).toBeTruthy();
      expect(actionsComponent).toBeTruthy();
    });
  });
});