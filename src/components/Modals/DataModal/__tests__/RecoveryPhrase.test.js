// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RecoveryPhrase from '../RecoveryPhrase';
import syncService from '../../../../services/sync';

// Mock the sync service
jest.mock('../../../../services/sync', () => ({
  getRecoveryPhrase: jest.fn(),
}));

// Mock clipboard
const mockClipboard = {
  setString: jest.fn(),
};

jest.mock('@react-native-clipboard/clipboard', () => ({
  default: mockClipboard,
}));

// Mock Platform
const mockPlatform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
};

jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: mockPlatform,
}));

const mockTheme = {
  primary: '#007AFF',
  secondary: '#FF9500',
};

const defaultProps = {
  theme: mockTheme,
  showToast: jest.fn(),
  syncRecoveryPhrase: 'test-recovery-phrase-1234567890abcdef',
};

describe('RecoveryPhrase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.setString.mockClear();
    mockPlatform.OS = 'ios'; // Reset to iOS for each test

    // Also directly modify the react-native Platform object
    const ReactNative = require('react-native');
    ReactNative.Platform.OS = 'ios';
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard on mobile', async () => {
      const recoveryPhrase = RecoveryPhrase(defaultProps);

      await recoveryPhrase.copyToClipboard('test text', 'Success message');

      expect(mockClipboard.setString).toHaveBeenCalledWith('test text');
      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Success message',
      });
    });

    it('should handle clipboard error', async () => {
      mockClipboard.setString.mockImplementation(() => {
        throw new Error('Clipboard error');
      });

      const recoveryPhrase = RecoveryPhrase(defaultProps);

      await recoveryPhrase.copyToClipboard('test text', 'Success message');

      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Failed to copy. Please select and copy manually.',
        type: 'error',
      });
    });
  });

  describe('renderRecoveryPhraseDisplay', () => {
    it('should render recovery phrase display when phrase exists', () => {
      const recoveryPhrase = RecoveryPhrase(defaultProps);
      const { getByText } = render(recoveryPhrase.renderRecoveryPhraseDisplay());

      expect(getByText('Your Sync Key')).toBeTruthy();
      expect(getByText('Keep this key safe. You\'ll need it to sync with other devices.')).toBeTruthy();
      expect(getByText('test-recovery-phrase-1234567890abcdef')).toBeTruthy();
      expect(getByText('Copy Key')).toBeTruthy();
    });

    it('should not render when phrase starts with ERROR', () => {
      const props = { ...defaultProps, syncRecoveryPhrase: 'ERROR: Something went wrong' };
      const recoveryPhrase = RecoveryPhrase(props);
      const result = recoveryPhrase.renderRecoveryPhraseDisplay();

      expect(result).toBeNull();
    });

    it('should not render when no phrase', () => {
      const props = { ...defaultProps, syncRecoveryPhrase: '' };
      const recoveryPhrase = RecoveryPhrase(props);
      const result = recoveryPhrase.renderRecoveryPhraseDisplay();

      expect(result).toBeNull();
    });
  });

  describe('renderSecurityWarnings', () => {
    it('should render security warnings section', () => {
      const recoveryPhrase = RecoveryPhrase(defaultProps);
      const { getByText } = render(recoveryPhrase.renderSecurityWarnings());

      expect(getByText('Security Notes')).toBeTruthy();
      expect(getByText(/Your data is encrypted end-to-end/)).toBeTruthy();
      expect(getByText(/Keep your recovery phrase safe/)).toBeTruthy();
    });
  });
});