// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, Alert } from 'react-native';
import DataImport from '../DataImport';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: { OS: 'ios' },
  Alert: { alert: jest.fn() },
}));

jest.mock('../../../utils/platformHelpers.web', () => ({
  default: {
    readFile: jest.fn(),
    unlink: jest.fn(),
  },
  DocumentPicker: {
    pick: jest.fn(),
    types: { json: 'application/json' },
    errorCodes: { cancelled: 'cancelled' },
  },
}), { virtual: true });

jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(),
  types: { json: 'application/json' },
  errorCodes: { cancelled: 'cancelled' },
}));

jest.mock('react-native-fs', () => ({
  readFile: jest.fn(),
  readDir: jest.fn(),
  unlink: jest.fn(),
  DownloadDirectoryPath: '/downloads',
  ExternalDirectoryPath: '/external',
  DocumentDirectoryPath: '/documents',
}));

const mockTheme = {
  primary: '#007AFF',
  background: '#FFFFFF',
};

describe('DataImport', () => {
  let mockOnFileSelected;
  let mockOnError;

  beforeEach(() => {
    mockOnFileSelected = jest.fn();
    mockOnError = jest.fn();
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByText, getByTestId } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    expect(getByText('Import Data')).toBeTruthy();
    expect(getByText('Import your saved StackMap data from a backup file')).toBeTruthy();
  });

  it('shows different description for Android', () => {
    Platform.OS = 'android';

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    expect(getByText('Will search Downloads folder for export files')).toBeTruthy();
  });

  it('handles successful file selection on iOS', async () => {
    Platform.OS = 'ios';
    const mockDocumentPicker = require('react-native-document-picker');
    const mockRNFS = require('react-native-fs');

    const mockFileData = {
      version: '4.0',
      users: { '1': { name: 'Test User', icon: '👤' } },
      exportDate: '2024-01-01',
    };

    mockDocumentPicker.pick.mockResolvedValue([{
      name: 'test.json',
      fileCopyUri: '/temp/test.json',
    }]);

    mockRNFS.readFile.mockResolvedValue(JSON.stringify(mockFileData));
    mockRNFS.unlink.mockResolvedValue();

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Select File'));

    await waitFor(() => {
      expect(mockOnFileSelected).toHaveBeenCalledWith({
        file: { name: 'test.json', fileCopyUri: '/temp/test.json' },
        data: mockFileData,
      });
    });
  });

  it('handles file selection cancellation', async () => {
    Platform.OS = 'ios';
    const mockDocumentPicker = require('react-native-document-picker');

    const cancelError = new Error('User cancelled');
    cancelError.code = 'cancelled';
    mockDocumentPicker.pick.mockRejectedValue(cancelError);

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Select File'));

    await waitFor(() => {
      expect(mockOnError).not.toHaveBeenCalled();
      expect(mockOnFileSelected).not.toHaveBeenCalled();
    });
  });

  it('handles invalid JSON file', async () => {
    Platform.OS = 'ios';
    const mockDocumentPicker = require('react-native-document-picker');
    const mockRNFS = require('react-native-fs');

    mockDocumentPicker.pick.mockResolvedValue([{
      name: 'invalid.json',
      fileCopyUri: '/temp/invalid.json',
    }]);

    mockRNFS.readFile.mockResolvedValue('invalid json');

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Select File'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        expect.stringContaining('Invalid JSON file')
      );
    });
  });

  it('handles file without version field', async () => {
    Platform.OS = 'ios';
    const mockDocumentPicker = require('react-native-document-picker');
    const mockRNFS = require('react-native-fs');

    const invalidData = { users: {} }; // Missing version field

    mockDocumentPicker.pick.mockResolvedValue([{
      name: 'noversion.json',
      fileCopyUri: '/temp/noversion.json',
    }]);

    mockRNFS.readFile.mockResolvedValue(JSON.stringify(invalidData));

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Select File'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Invalid StackMap export file');
    });
  });

  it('handles file with no importable data', async () => {
    Platform.OS = 'ios';
    const mockDocumentPicker = require('react-native-document-picker');
    const mockRNFS = require('react-native-fs');

    const emptyData = { version: '4.0' }; // No users, activities, or library

    mockDocumentPicker.pick.mockResolvedValue([{
      name: 'empty.json',
      fileCopyUri: '/temp/empty.json',
    }]);

    mockRNFS.readFile.mockResolvedValue(JSON.stringify(emptyData));

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Select File'));

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('Export file contains no importable data');
    });
  });

  it('handles Android file search with no files found', async () => {
    Platform.OS = 'android';
    const mockRNFS = require('react-native-fs');

    mockRNFS.readDir.mockResolvedValue([]); // No files found

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Search for Files'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'How to Import Your Data 📱',
        expect.stringContaining('Downloads folder'),
        expect.any(Array)
      );
    });
  });

  it('handles Android file search with single file', async () => {
    Platform.OS = 'android';
    const mockRNFS = require('react-native-fs');

    const mockFileData = {
      version: '4.0',
      users: { '1': { name: 'Test User', icon: '👤' } },
      exportDate: '2024-01-01',
    };

    mockRNFS.readDir.mockResolvedValue([
      {
        name: 'stackmap-export-2024-01-01.json',
        path: '/downloads/stackmap-export-2024-01-01.json',
        size: 1024,
        mtime: new Date('2024-01-01'),
      }
    ]);

    mockRNFS.readFile.mockResolvedValue(JSON.stringify(mockFileData));

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Search for Files'));

    await waitFor(() => {
      expect(mockOnFileSelected).toHaveBeenCalledWith({
        file: {
          name: 'stackmap-export-2024-01-01.json',
          path: '/downloads/stackmap-export-2024-01-01.json',
        },
        data: mockFileData,
      });
    });
  });

  it('disables button when loading', () => {
    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
        loading={true}
      />
    );

    const button = getByText('Select File');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('disables button when disabled prop is true', () => {
    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
        disabled={true}
      />
    );

    const button = getByText('Select File');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('handles web file selection', async () => {
    Platform.OS = 'web';
    const mockPlatformHelpers = require('../../../utils/platformHelpers.web');

    const mockFileData = {
      version: '4.0',
      users: { '1': { name: 'Test User', icon: '👤' } },
      exportDate: '2024-01-01',
    };

    mockPlatformHelpers.DocumentPicker.pick.mockResolvedValue([{
      name: 'test.json',
      content: JSON.stringify(mockFileData),
    }]);

    const { getByText } = render(
      <DataImport
        theme={mockTheme}
        onFileSelected={mockOnFileSelected}
        onError={mockOnError}
      />
    );

    fireEvent.press(getByText('Select File'));

    await waitFor(() => {
      expect(mockOnFileSelected).toHaveBeenCalledWith({
        file: { name: 'test.json', content: JSON.stringify(mockFileData) },
        data: mockFileData,
      });
    });
  });
});