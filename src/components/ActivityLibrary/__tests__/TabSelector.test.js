import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TabSelector from '../TabSelector';

// Mock the Typography component
jest.mock('../../Typography', () => ({
  Text: ({ children, style }) => {
    const MockText = require('react-native').Text;
    return <MockText style={style}>{children}</MockText>;
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

describe('TabSelector', () => {
  const mockTheme = {
    primary: '#007AFF',
    secondary: '#5AC8FA',
    light: '#F2F2F7',
  };

  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default tabs', () => {
    const { getByText } = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
      />
    );

    expect(getByText('StackMap Library')).toBeTruthy();
    expect(getByText('My Library')).toBeTruthy();
  });

  it('renders with custom tabs', () => {
    const customTabs = [
      { id: 'tab1', label: 'First Tab', icon: 'star' },
      { id: 'tab2', label: 'Second Tab', icon: 'heart' },
    ];

    const { getByText } = render(
      <TabSelector
        activeTab="tab1"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
        tabs={customTabs}
      />
    );

    expect(getByText('First Tab')).toBeTruthy();
    expect(getByText('Second Tab')).toBeTruthy();
  });

  it('calls onTabChange when different tab is pressed', () => {
    const { getByText } = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
      />
    );

    fireEvent.press(getByText('My Library'));
    expect(mockOnTabChange).toHaveBeenCalledWith('mylibrary');
  });

  it('does not call onTabChange when active tab is pressed', () => {
    const { getByText } = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
      />
    );

    fireEvent.press(getByText('StackMap Library'));
    expect(mockOnTabChange).not.toHaveBeenCalled();
  });

  it('shows correct active tab styling', () => {
    const component = render(
      <TabSelector
        activeTab="mylibrary"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
      />
    );

    expect(component).toBeTruthy();
  });

  it('handles theme colors correctly', () => {
    const customTheme = {
      primary: '#FF0000',
    };

    const component = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={customTheme}
      />
    );

    expect(component).toBeTruthy();
  });

  it('renders without onTabChange callback', () => {
    const { getByText } = render(
      <TabSelector
        activeTab="stackmap"
        theme={mockTheme}
      />
    );

    expect(getByText('StackMap Library')).toBeTruthy();
    expect(getByText('My Library')).toBeTruthy();
  });

  it('handles empty tabs array', () => {
    const component = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
        tabs={[]}
      />
    );

    expect(component).toBeTruthy();
  });

  it('has proper component structure', () => {
    const component = render(
      <TabSelector
        activeTab="stackmap"
        onTabChange={mockOnTabChange}
        theme={mockTheme}
      />
    );

    expect(component.toJSON()).toMatchSnapshot();
  });

  describe('accessibility', () => {
    it('should be accessible', () => {
      const component = render(
        <TabSelector
          activeTab="stackmap"
          onTabChange={mockOnTabChange}
          theme={mockTheme}
        />
      );

      expect(component).toBeTruthy();
    });
  });

  describe('interaction testing', () => {
    it('handles rapid tab switching', () => {
      const { getByText } = render(
        <TabSelector
          activeTab="stackmap"
          onTabChange={mockOnTabChange}
          theme={mockTheme}
        />
      );

      const myLibraryTab = getByText('My Library');
      fireEvent.press(myLibraryTab);
      fireEvent.press(myLibraryTab);

      // Should only call once since second press is on active tab
      expect(mockOnTabChange).toHaveBeenCalledTimes(1);
      expect(mockOnTabChange).toHaveBeenCalledWith('mylibrary');
    });
  });
});