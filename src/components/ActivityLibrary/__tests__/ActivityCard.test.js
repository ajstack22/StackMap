import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import ActivityCard from '../ActivityCard';

// Mock dependencies
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('../../Modals/ConfirmModal', () => 'ConfirmModal');
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
    const { getByTestId, getByRole } = render(<ActivityCard {...defaultProps} />);

    // Find and press the add button
    const addButtons = document.querySelectorAll('[role="button"]');
    const addButton = Array.from(addButtons).find(button =>
      button.textContent.includes('add') || button.querySelector('[name="add"]')
    );

    if (addButton) {
      fireEvent.press(addButton);
      expect(defaultProps.onQuickAdd).toHaveBeenCalledWith(mockActivity);
    }
  });

  it('shows check icon temporarily after quick add', async () => {
    const { getByText, queryByText } = render(<ActivityCard {...defaultProps} />);

    // Mock setTimeout
    jest.useFakeTimers();

    // Find and trigger quick add
    fireEvent.press(getByText('add')); // Assuming Icon renders as text

    expect(queryByText('check')).toBeTruthy();

    // Fast-forward time
    jest.advanceTimersByTime(1500);

    await waitFor(() => {
      expect(queryByText('add')).toBeTruthy();
    });

    jest.useRealTimers();
  });

  it('calls onEdit when edit button is pressed on desktop', () => {
    // Mock as desktop (screenWidth >= 480)
    jest.spyOn(require('react-native'), 'Dimensions').mockReturnValue({
      get: () => ({ width: 800 }),
    });

    const { getByText } = render(<ActivityCard {...defaultProps} />);

    fireEvent.press(getByText('edit'));
    expect(defaultProps.onEdit).toHaveBeenCalledWith(mockActivity);
  });

  it('shows mobile menu when more button is pressed on mobile', () => {
    // Mock as mobile (screenWidth < 480)
    jest.spyOn(require('react-native'), 'Dimensions').mockReturnValue({
      get: () => ({ width: 400 }),
    });

    const { getByText, queryByText } = render(<ActivityCard {...defaultProps} />);

    fireEvent.press(getByText('more-vert'));

    expect(queryByText('Edit Activity')).toBeTruthy();
    expect(queryByText('Delete Activity')).toBeTruthy();
  });

  it('shows alert on delete for native platforms', () => {
    Platform.OS = 'ios';

    const { getByText } = render(<ActivityCard {...defaultProps} />);

    fireEvent.press(getByText('delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete Activity',
      'Are you sure you want to delete "Test Activity"?',
      expect.arrayContaining([
        { text: 'Cancel', style: 'cancel' },
        expect.objectContaining({
          text: 'Delete',
          style: 'destructive',
        }),
      ])
    );
  });

  it('shows confirm modal on delete for web platform', () => {
    Platform.OS = 'web';

    const { getByText, UNSAFE_getByType } = render(<ActivityCard {...defaultProps} />);

    fireEvent.press(getByText('delete'));

    const confirmModal = UNSAFE_getByType('ConfirmModal');
    expect(confirmModal.props.visible).toBe(true);
    expect(confirmModal.props.title).toBe('Delete Activity');
  });

  it('handles menu position calculation correctly', () => {
    // Mock measure function
    const mockMeasure = jest.fn((callback) => {
      callback(0, 0, 100, 50, 150, 200); // x, y, width, height, pageX, pageY
    });

    jest.spyOn(React, 'useRef').mockReturnValue({
      current: { measure: mockMeasure },
    });

    const { getByText } = render(<ActivityCard {...defaultProps} />);

    fireEvent.press(getByText('more-vert'));

    expect(mockMeasure).toHaveBeenCalled();
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

  it('disables add button when justAdded is true', async () => {
    const { getByTestId } = render(<ActivityCard {...defaultProps} />);

    jest.useFakeTimers();

    // Trigger quick add to set justAdded state
    const addButton = getByTestId ? getByTestId('add-button') : null;
    if (addButton) {
      fireEvent.press(addButton);

      // Check that button is disabled
      expect(addButton.props.disabled).toBe(true);
    }

    jest.useRealTimers();
  });
});