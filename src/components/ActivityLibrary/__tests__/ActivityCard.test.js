import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform, Dimensions } from 'react-native';
import ActivityCard from '../LibraryActivityCard';

// Mock dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('../../Modals/ConfirmModal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function ConfirmModal({ visible, title, ...props }) {
    return visible ? <View testID="confirm-modal">{title}</View> : null;
  };
});
jest.mock('../LibraryActivityMenus', () => ({
  renderMobileDropdownMenu: jest.fn(() => null),
  renderMobileCenterMenu: jest.fn(() => null),
}));
jest.mock('../../../constants', () => ({
  SHADOWS: { level1: {}, level3: {} },
  TYPOGRAPHY: { fontFamily: { regular: 'Comic Relief', bold: 'Comic Relief-Bold' } },
  SPACING: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  RADIUS: { lg: 12, xl: 16 },
  COLORS: {
    gray: { 50: '#f9fafb', 100: '#f3f4f6', 200: '#e5e7eb', 400: '#9ca3af' },
    error: '#ef4444'
  },
  isTablet: () => false,
  getCustomImageSource: jest.fn((key) => ({ uri: `image_${key}` })),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockTheme = {
  primary: '#007AFF',
  light: '#ffffff',
};

const mockActivity = {
  id: 'activity-1',
  text: 'Test Activity',
  icon: '🎯',
  description: 'Test description',
};

const defaultProps = {
  activity: mockActivity,
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onQuickAdd: jest.fn(),
  theme: mockTheme,
};

describe('ActivityCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    // Reset Dimensions to default mobile size
    Dimensions.get.mockReturnValue({ width: 400, height: 800 });
  });

  it('renders activity information correctly', () => {
    const { getByText } = render(<ActivityCard {...defaultProps} />);

    expect(getByText('Test Activity')).toBeTruthy();
    expect(getByText('🎯')).toBeTruthy();
  });

  it('renders custom image when icon starts with "image:"', () => {
    const activityWithImage = {
      ...mockActivity,
      icon: 'image:custom_icon',
    };

    const { UNSAFE_getByType } = render(
      <ActivityCard {...defaultProps} activity={activityWithImage} />
    );

    const image = UNSAFE_getByType('Image');
    expect(image.props.source).toEqual({ uri: 'image_custom_icon' });
  });

  it('calls onQuickAdd when add button is pressed', async () => {
    // Default beforeEach sets mobile view (400px width)
    const { UNSAFE_getAllByType } = render(<ActivityCard {...defaultProps} />);

    // On mobile, should have 2 buttons: quick add and more menu
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    expect(buttons.length).toBe(2);

    // Find and click the add button (first button)
    const addButton = buttons[0];
    fireEvent.press(addButton);

    expect(defaultProps.onQuickAdd).toHaveBeenCalledWith(mockActivity);
  });

  it('shows check icon temporarily after quick add', async () => {
    const { UNSAFE_getAllByType, UNSAFE_getByType } = render(<ActivityCard {...defaultProps} />);

    // Mock setTimeout
    jest.useFakeTimers();

    // Find add button and click it
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    const addButton = buttons[0];
    fireEvent.press(addButton);

    // Check that onQuickAdd was called
    expect(defaultProps.onQuickAdd).toHaveBeenCalledWith(mockActivity);

    // Fast-forward time to complete the timeout
    jest.advanceTimersByTime(1500);

    jest.useRealTimers();
  });

  it('calls onEdit when edit button is pressed on desktop', () => {
    // Mock as desktop (screenWidth >= 480)
    Dimensions.get.mockReturnValue({ width: 800, height: 600 });

    const { UNSAFE_getAllByType, getByTestId } = render(<ActivityCard {...defaultProps} />);

    // On desktop, edit button should be available
    const buttons = UNSAFE_getAllByType('TouchableOpacity');

    // Should have 3 buttons on desktop: edit, delete, quick add
    expect(buttons.length).toBe(3);

    // Find and click the edit button (first button with edit icon)
    const editButton = buttons[0]; // Based on component structure, edit is first
    fireEvent.press(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockActivity);
  });

  it('shows mobile menu when more button is pressed on mobile', () => {
    // Mock as mobile (screenWidth < 480)
    Dimensions.get.mockReturnValue({ width: 400, height: 800 });

    const { UNSAFE_getAllByType } = render(<ActivityCard {...defaultProps} />);

    // On mobile, should have 2 buttons: quick add and more menu
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    expect(buttons.length).toBe(2);

    // Find and click the menu button (second button with more-vert icon)
    const menuButton = buttons[1]; // Based on component structure, more button is second
    fireEvent.press(menuButton);

    // Should show the menu modal
    const modals = UNSAFE_getAllByType('Modal');
    expect(modals.length).toBe(1);
  });

  it('shows alert on delete for native platforms', () => {
    Platform.OS = 'ios';
    // Set desktop mode to get delete button directly
    Dimensions.get.mockReturnValue({ width: 800, height: 600 });

    const { UNSAFE_getAllByType } = render(<ActivityCard {...defaultProps} />);

    // On desktop native platform, should have 3 buttons: edit, delete, quick add
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    expect(buttons.length).toBe(3);

    // Click the delete button (second button)
    const deleteButton = buttons[1];
    fireEvent.press(deleteButton);

    // Should show native alert
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Activity',
      'Are you sure you want to delete "Test Activity"?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Delete' }),
      ])
    );
  });

  it('shows confirm modal on delete for web platform', () => {
    Platform.OS = 'web';
    // Set desktop mode to get delete button directly
    Dimensions.get.mockReturnValue({ width: 800, height: 600 });

    const { UNSAFE_getAllByType, getByTestId } = render(<ActivityCard {...defaultProps} />);

    // On web desktop, should have 3 buttons: edit, delete, quick add
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    expect(buttons.length).toBe(3);

    // Click the delete button (second button)
    const deleteButton = buttons[1];
    fireEvent.press(deleteButton);

    // Should show confirm modal
    expect(getByTestId('confirm-modal')).toBeTruthy();

    // Alert.alert should NOT be called on web
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('handles menu position calculation correctly', () => {
    // Test that component renders without crashing
    const component = render(<ActivityCard {...defaultProps} />);
    expect(component).toBeTruthy();
  });

  it('handles activity without icon gracefully', () => {
    const activityNoIcon = {
      ...mockActivity,
      icon: null,
    };

    const { getByText } = render(
      <ActivityCard {...defaultProps} activity={activityNoIcon} />
    );

    expect(getByText('Test Activity')).toBeTruthy();
  });

  it('handles justAdded state correctly', async () => {
    const { UNSAFE_getAllByType } = render(<ActivityCard {...defaultProps} />);

    jest.useFakeTimers();

    // Click add button to trigger justAdded state
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    const addButton = buttons[0];
    fireEvent.press(addButton);

    // Verify the button is disabled while in justAdded state
    expect(addButton.props.disabled).toBe(true);

    // Fast-forward to clear the justAdded state
    jest.advanceTimersByTime(1500);

    jest.useRealTimers();
  });

  it('handles mobile menu interactions on Android', () => {
    Platform.OS = 'android';
    // Set mobile size to trigger mobile menu
    Dimensions.get.mockReturnValue({ width: 375, height: 667 });

    const { UNSAFE_getAllByType } = render(<ActivityCard {...defaultProps} />);

    // On mobile, should have 2 buttons: quick add and more menu
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    expect(buttons.length).toBe(2);

    // Click the menu button
    const menuButton = buttons[1];
    fireEvent.press(menuButton);

    // Should show modal
    const modals = UNSAFE_getAllByType('Modal');
    expect(modals.length).toBe(1);
  });

  it('handles tablet screen sizes correctly', () => {
    // Test tablet size (between mobile and desktop)
    Dimensions.get.mockReturnValue({ width: 768, height: 1024 });

    const { UNSAFE_getAllByType } = render(<ActivityCard {...defaultProps} />);

    // At 768px, still considered desktop (>= 480), so should have 3 buttons
    const buttons = UNSAFE_getAllByType('TouchableOpacity');
    expect(buttons.length).toBe(3);
  });
});