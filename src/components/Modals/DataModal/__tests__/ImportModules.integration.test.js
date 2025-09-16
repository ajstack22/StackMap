// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import DataImport from '../DataImport';
import ImportPreview from '../ImportPreview';
import ImportConfirmation from '../ImportConfirmation';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
}));

jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  types: { json: 'application/json' },
  errorCodes: { cancelled: 'cancelled' },
}));

jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
  unlink: jest.fn(),
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
    '2': { name: 'Jane Smith', icon: '👩' },
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
    userAddedActivityIds: [],
  },
  globalSettings: { theme: 'light' },
};

describe('Import Modules Integration', () => {
  let mockOnImportComplete;
  let mockShowToast;

  beforeEach(() => {
    mockOnImportComplete = jest.fn().mockResolvedValue();
    mockShowToast = jest.fn();
    jest.clearAllMocks();
  });

  it('completes full import workflow', async () => {
    // Mock file selection
    const mockDocumentPicker = require('react-native-document-picker');
    const mockRNFS = require('react-native-fs');

    mockDocumentPicker.pick.mockResolvedValue([{
      name: 'test.json',
      fileCopyUri: '/temp/test.json',
    }]);

    mockRNFS.readFile.mockResolvedValue(JSON.stringify(mockImportData));
    mockRNFS.unlink.mockResolvedValue();

    // Step 1: File Selection
    let selectedFile = null;
    let selectedData = null;

    const handleFileSelected = ({ file, data }) => {
      selectedFile = file;
      selectedData = data;
    };

    const { getByText: getImportText, rerender: rerenderImport } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={handleFileSelected}
        onError={jest.fn()}
      />
    );

    fireEvent.press(getImportText('Select File'));

    await waitFor(() => {
      expect(selectedFile).toBeTruthy();
      expect(selectedData).toEqual(mockImportData);
    });

    // Step 2: Preview and Selection
    let importMode = 'fresh';
    let importSelections = {};

    const handleModeChange = (mode) => {
      importMode = mode;
    };

    const handleSelectionChange = (selections) => {
      importSelections = selections;
    };

    const { getByText: getPreviewText, rerender: rerenderPreview } = render(
      <ImportPreview
        theme={mockTheme}
        importFile={selectedFile}
        importData={selectedData}
        importMode={importMode}
        importSelections={importSelections}
        isOnboarding={false}
        onImportModeChange={handleModeChange}
        onSelectionChange={handleSelectionChange}
        onRemoveFile={jest.fn()}
      />
    );

    // Wait for initial selections to be set
    await waitFor(() => {
      expect(Object.keys(importSelections).length).toBeGreaterThan(0);
    });

    // Change import mode
    fireEvent.press(getPreviewText('Merge with Existing'));
    expect(importMode).toBe('merge');

    // Toggle a user selection
    const johnDoeItem = getPreviewText('John Doe').parent;
    fireEvent.press(johnDoeItem);

    // Step 3: Import Confirmation
    const handleImportError = jest.fn();

    const { getByText: getConfirmText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={selectedData}
        importMode={importMode}
        importSelections={importSelections}
        onImportComplete={mockOnImportComplete}
        onError={handleImportError}
        showToast={mockShowToast}
      />
    );

    // Trigger import
    fireEvent.press(getConfirmText('Import Selected Items'));

    // Should show iOS alert
    const { Alert } = require('react-native');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Merge Import',
      'This will add the selected items to your existing data. Duplicate items will be skipped.',
      expect.any(Array)
    );

    // Execute the import by calling the onPress from the alert
    const alertCall = Alert.alert.mock.calls[0];
    const importButton = alertCall[2].find(button => button.text === 'Import');
    await importButton.onPress();

    await waitFor(() => {
      expect(mockOnImportComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'merge',
          users: expect.any(Object),
          activityCards: expect.any(Array),
          library: expect.any(Object),
        })
      );
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'Data merged successfully!',
    });
  });

  it('handles error propagation between modules', async () => {
    // Mock file selection error
    const mockDocumentPicker = require('react-native-document-picker');
    mockDocumentPicker.pick.mockRejectedValue(new Error('File selection failed'));

    const handleError = jest.fn();

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={jest.fn()}
        onError={handleError}
      />
    );

    fireEvent.press(getByText('Select File'));

    await waitFor(() => {
      expect(handleError).toHaveBeenCalledWith('Failed to select file. Please try again.');
    });
  });

  it('handles file removal and state reset', () => {
    const handleRemoveFile = jest.fn();

    const { getByTestId } = render(
      <ImportPreview
        theme={mockTheme}
        importFile={{ name: 'test.json' }}
        importData={mockImportData}
        importMode="fresh"
        importSelections={{}}
        onImportModeChange={jest.fn()}
        onSelectionChange={jest.fn()}
        onRemoveFile={handleRemoveFile}
      />
    );

    // Find and press the close button
    const closeButton = getByTestId('close-file-button') ||
                       getByText('close').parent; // Fallback

    fireEvent.press(closeButton);
    expect(handleRemoveFile).toHaveBeenCalled();
  });

  it('maintains state consistency across mode changes', () => {
    let currentMode = 'fresh';
    let currentSelections = {
      'user_1': true,
      'user_2': true,
      'activity_a1': true,
    };

    const handleModeChange = (mode) => {
      currentMode = mode;
    };

    const handleSelectionChange = (selections) => {
      currentSelections = selections;
    };

    const { getByText, rerender } = render(
      <ImportPreview
        theme={mockTheme}
        importFile={{ name: 'test.json' }}
        importData={mockImportData}
        importMode={currentMode}
        importSelections={currentSelections}
        onImportModeChange={handleModeChange}
        onSelectionChange={handleSelectionChange}
        onRemoveFile={jest.fn()}
      />
    );

    // Change mode
    fireEvent.press(getByText('Merge with Existing'));
    expect(currentMode).toBe('merge');

    // Re-render with new mode
    rerender(
      <ImportPreview
        theme={mockTheme}
        importFile={{ name: 'test.json' }}
        importData={mockImportData}
        importMode={currentMode}
        importSelections={currentSelections}
        onImportModeChange={handleModeChange}
        onSelectionChange={handleSelectionChange}
        onRemoveFile={jest.fn()}
      />
    );

    // Verify the mode is reflected in UI
    expect(getByText('Keep existing data and add selected items')).toBeTruthy();
  });

  it('validates data consistency in import confirmation', async () => {
    Platform.OS = 'ios';

    const invalidSelections = {
      'user_1': true,
      'nonexistent_user': true, // This should be ignored
      'activity_a1': true,
      'invalid_activity': true, // This should be ignored
    };

    const { getByText } = render(
      <ImportConfirmation
        theme={mockTheme}
        importData={mockImportData}
        importMode="fresh"
        importSelections={invalidSelections}
        onImportComplete={mockOnImportComplete}
        onError={jest.fn()}
        showToast={mockShowToast}
      />
    );

    fireEvent.press(getByText('Import Selected Items'));

    const { Alert } = require('react-native');
    const alertCall = Alert.alert.mock.calls[0];
    const importButton = alertCall[2].find(button => button.text === 'Import');
    await importButton.onPress();

    await waitFor(() => {
      const importCall = mockOnImportComplete.mock.calls[0][0];

      // Should only include valid users and activities
      expect(Object.keys(importCall.users)).toEqual(['1']);
      expect(importCall.activityCards).toHaveLength(1);
      expect(importCall.activityCards[0].id).toBe('a1');
    });
  });

  it('handles onboarding mode restrictions', () => {
    const { queryByText } = render(
      <ImportPreview
        theme={mockTheme}
        importFile={{ name: 'test.json' }}
        importData={mockImportData}
        importMode="fresh"
        importSelections={{}}
        isOnboarding={true}
        onImportModeChange={jest.fn()}
        onSelectionChange={jest.fn()}
        onRemoveFile={jest.fn()}
      />
    );

    // Import mode selection should not be visible in onboarding
    expect(queryByText('Import Mode')).toBeNull();
    expect(queryByText('Start Fresh')).toBeNull();
    expect(queryByText('Merge with Existing')).toBeNull();
  });
});