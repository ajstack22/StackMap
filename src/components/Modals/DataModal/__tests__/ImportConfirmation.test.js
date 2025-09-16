// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, Alert } from 'react-native';
import ImportConfirmation from '../ImportConfirmation';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
}));

const mockTheme = {
  primary: '#007AFF',
  background: '#FFFFFF',
};

const mockImportData = {
  version: '4.0',
  exportDate: '2024-01-01T00:00:00.000Z',
  users: {
    '1': { name: 'John Doe', icon: '👤' },
    '2': { name: 'Jane Smith', emoji: '👩' }, // Test emoji migration
  },
  activityCards: [
    { id: 'a1', text: 'Morning Exercise', icon: '🏃' },
    { id: 'a2', text: 'Read Book', icon: '📚' },
  ],
  library: {
    categories: [
      {
        id: 'c1',
        name: 'Wellness',
        activities: [
          { id: 't1', text: 'Meditation', icon: '🧘' },
        ],
      },
    ],
    userAddedActivityIds: ['a1'],
  },
  libraryTemplates: [],
  globalSettings: { theme: 'light' },
};

const mockImportSelections = {
  'user_1': true,
  'user_2': true,
  'activity_a1': true,
  'activity_a2': false,
  'category_c1': true,
  'template_c1_t1': true,
};

describe('ImportConfirmation', () => {
  let mockOnImportComplete;
  let mockOnError;
  let mockShowToast;

  beforeEach(() => {
    mockOnImportComplete = jest.fn();
    mockOnError = jest.fn();
    mockShowToast = jest.fn();
    jest.clearAllMocks();
  });

  it('renders import button correctly', () => {
    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    expect(getByText('Import Selected Items')).toBeTruthy();
  });

  it('disables button when no items selected', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={{}}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    const button = getByText('Import Selected Items');
    fireEvent.press(button);

    // Button should not trigger import when disabled (no selections)
    expect(mockOnImportComplete).not.toHaveBeenCalled();
  });

  it('disables button when disabled prop is true', () => {
    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        disabled={true}
        showToast={mockShowToast}
      />
    );

    const button = getByText('Import Selected Items');
    fireEvent.press(button);

    // Button should not trigger import when disabled prop is true
    expect(mockOnImportComplete).not.toHaveBeenCalled();
  });

  it('shows iOS alert for fresh import', () => {
    Platform.OS = 'ios';

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Start Fresh Import',
      'This will DELETE all your current data and replace it with only the selected items. This action cannot be undone.',
      expect.arrayContaining([
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', style: 'destructive', onPress: expect.any(Function) },
      ])
    );
  });

  it('shows iOS alert for merge import', () => {
    Platform.OS = 'ios';

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="merge"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Merge Import',
      'This will add the selected items to your existing data. Duplicate items will be skipped.',
      expect.any(Array)
    );
  });

  it('shows ConfirmModal for Android', () => {
    Platform.OS = 'android';

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    // Should show the ConfirmModal (not iOS Alert)
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('processes import data correctly', async () => {
    Platform.OS = 'ios';
    mockOnImportComplete.mockResolvedValue();

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    // Get the onPress function from the Alert.alert call
    const alertCall = Alert.alert.mock.calls[0];
    const importButton = alertCall[2].find(button => button.text === 'Import');

    // Execute the import
    await importButton.onPress();

    await waitFor(() => {
      expect(mockOnImportComplete).toHaveBeenCalledWith({
        mode: 'fresh',
        users: {
          '1': { name: 'John Doe', icon: '👤' },
          '2': { name: 'Jane Smith', icon: '👩' }, // emoji should be migrated to icon
        },
        activityCards: [
          { id: 'a1', text: 'Morning Exercise', icon: '🏃' },
        ],
        library: {
          categories: [
            {
              id: 'c1',
              name: 'Wellness',
              activities: [
                { id: 't1', text: 'Meditation', icon: '🧘' },
              ],
            },
          ],
          userAddedActivityIds: ['a1'],
        },
        libraryTemplates: [],
        globalSettings: { theme: 'light' },
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Data imported successfully!',
    });
  });

  it('handles user data validation', async () => {
    Platform.OS = 'ios';
    mockOnImportComplete.mockResolvedValue();

    const invalidUserData = {
      ...mockImportData,
      users: {
        '1': { name: { nested: 'object' }, icon: null }, // Invalid name and icon
        '2': { name: '', emoji: '👩' }, // Empty name, emoji instead of icon
        '3': { name: 'Valid User' }, // Missing icon
      },
    };

    const selections = {
      'user_1': true,
      'user_2': true,
      'user_3': true,
    };

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={invalidUserData}
        importMode="fresh"
        importSelections={selections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    const alertCall = Alert.alert.mock.calls[0];
    const importButton = alertCall[2].find(button => button.text === 'Import');
    await importButton.onPress();

    await waitFor(() => {
      expect(mockOnImportComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          users: {
            '1': { name: 'User', icon: '👤' }, // Should be fixed
            '2': { name: 'User', icon: '👩' }, // Should migrate emoji to icon and fix name
            '3': { name: 'Valid User', icon: '👤' }, // Should add default icon
          },
        })
      );
    });
  });

  it('handles import error', async () => {
    Platform.OS = 'ios';
    mockOnImportComplete.mockRejectedValue(new Error('Import failed'));

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    const alertCall = Alert.alert.mock.calls[0];
    const importButton = alertCall[2].find(button => button.text === 'Import');
    await importButton.onPress();

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to import data. Please try again.'
      );
    });
  });

  it('processes merge mode correctly', async () => {
    Platform.OS = 'ios';
    mockOnImportComplete.mockResolvedValue();

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="merge"
        importSelections={mockImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    const alertCall = Alert.alert.mock.calls[0];
    const importButton = alertCall[2].find(button => button.text === 'Import');
    await importButton.onPress();

    await waitFor(() => {
      expect(mockOnImportComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'merge',
        })
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Data merged successfully!',
    });
  });

  it('filters selections correctly', async () => {
    Platform.OS = 'ios';
    mockOnImportComplete.mockResolvedValue();

    const selectiveImportSelections = {
      'user_1': true,
      'user_2': false, // Not selected
      'activity_a1': false, // Not selected
      'activity_a2': true,
      'category_c1': false, // Category not selected, so templates shouldn't be included
      'template_c1_t1': true, // This should be ignored since category not selected
    };

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={selectiveImportSelections}
        onImportComplete={mockOnImportComplete}
        onError={mockOnError}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    const alertCall = Alert.alert.mock.calls[0];
    const importButton = alertCall[2].find(button => button.text === 'Import');
    await importButton.onPress();

    await waitFor(() => {
      expect(mockOnImportComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          users: {
            '1': expect.any(Object), // Only user 1 should be included
          },
          activityCards: [
            { id: 'a2', text: 'Read Book', icon: '📚' }, // Only activity a2
          ],
          library: {
            categories: [], // No categories selected
            userAddedActivityIds: ['a1'],
          },
        })
      );
    });
  });
});