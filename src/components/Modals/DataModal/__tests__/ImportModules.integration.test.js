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

// Mock ModalButton to avoid import issues
jest.mock('../../../ModalUtilities', () => ({
  ModalButton: ({ label, onPress, children, disabled, loading, ...props }) => {
    const React = require('react');
    const { TouchableOpacity, Text } = require('react-native');
    return React.createElement(
      TouchableOpacity,
      {
        onPress,
        testID: `modal-button-${label}`,
        accessibilityState: { disabled: disabled || loading }
      },
      React.createElement(Text, {}, label || children)
    );
  },
  FormInput: ({ value, onChangeText, placeholder, ...props }) => {
    const React = require('react');
    const { TextInput } = require('react-native');
    return React.createElement(TextInput, {
      value,
      onChangeText,
      placeholder,
      testID: `form-input-${placeholder}`,
      ...props
    });
  },
}));

// Mock Typography
jest.mock('../../../Typography', () => ({
  Text: ({ children, style, ...props }) => {
    const React = require('react');
    const { Text: RNText } = require('react-native');
    return React.createElement(RNText, { style, ...props }, children);
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return React.forwardRef((props, ref) => {
    return React.createElement(Text, {
      ref,
      testID: `icon-${props.name}`,
      ...props
    }, props.name || 'icon');
  });
});

// Create mock modules that will be available for dynamic require() calls
const mockDocumentPicker = {
  pick: jest.fn(),
  types: { json: 'application/json' },
  errorCodes: { cancelled: 'cancelled' },
};

const mockRNFS = {
  readFile: jest.fn(),
  readDir: jest.fn(),
  unlink: jest.fn(),
  DownloadDirectoryPath: '/downloads',
  ExternalDirectoryPath: '/external',
  DocumentDirectoryPath: '/documents',
};

jest.mock('react-native-document-picker', () => mockDocumentPicker);
jest.mock('react-native-fs', () => mockRNFS);

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
    // Set Platform.OS inside the test like the working DataImport test
    Platform.OS = 'ios';

    // Clear all previous mock calls and set up fresh mocks
    jest.clearAllMocks();

    // Use the exact same pattern as the working DataImport test
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

    const handleError = jest.fn();

    const { getByText: getImportText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={handleFileSelected}
        onError={handleError}
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

    // Find and press the close button (icon)
    const closeButton = getByTestId('icon-close');

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