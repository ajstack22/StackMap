// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RecoveryPhrase from '../RecoveryPhrase';
import syncService from '../../../../services/sync';

// Mock the sync service
jest.mock('../../../../services/sync', () => ({
  getRecoveryPhrase: jest.fn(),
  createInviteCode: jest.fn(),
}));

// Mock clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  default: {
    setString: jest.fn(),
  },
}));

// Mock Platform
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Platform: {
    OS: 'ios',
  },
}));

const mockTheme = {
  primary: '#007AFF',
  secondary: '#FF9500',
};

const defaultProps = {
  theme: mockTheme,
  showToast: jest.fn(),
  syncRecoveryPhrase: 'test-recovery-phrase-1234567890abcdef',
  generatedSyncKey: '',
  setGeneratedSyncKey: jest.fn(),
  showGeneratedKey: false,
  setShowGeneratedKey: jest.fn(),
  syncLoading: false,
  setSyncLoading: jest.fn(),
  setSyncError: jest.fn(),
};

describe('RecoveryPhrase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard on mobile', async () => {
      const recoveryPhrase = RecoveryPhrase(defaultProps);

      await recoveryPhrase.copyToClipboard('test text', 'Success message');

      const Clipboard = require('@react-native-clipboard/clipboard').default;
      expect(Clipboard.setString).toHaveBeenCalledWith('test text');
      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Success message',
      });
    });

    it('should handle clipboard error', async () => {
      const Clipboard = require('@react-native-clipboard/clipboard').default;
      Clipboard.setString.mockImplementation(() => {
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

  describe('generateDeviceInvite', () => {
    it('should generate device invite successfully', async () => {
      const mockResult = {
        inviteCode: 'abc123',
        inviteUrl: 'https://stackmap.app/sync/abc123#test-recovery-phrase',
      };
      syncService.createInviteCode.mockResolvedValue(mockResult);

      const recoveryPhrase = RecoveryPhrase(defaultProps);

      await recoveryPhrase.generateDeviceInvite();

      expect(defaultProps.setSyncLoading).toHaveBeenCalledWith(true);
      expect(syncService.createInviteCode).toHaveBeenCalledWith(24, 5, 'Manual invite');
      expect(defaultProps.setGeneratedSyncKey).toHaveBeenCalledWith(mockResult.inviteUrl);
      expect(defaultProps.setShowGeneratedKey).toHaveBeenCalledWith(true);
      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Sync key generated! Valid for 24 hours.',
        type: 'success',
      });
      expect(defaultProps.setSyncLoading).toHaveBeenCalledWith(false);
    });

    it('should handle missing recovery phrase', async () => {
      const props = { ...defaultProps, syncRecoveryPhrase: '' };
      syncService.getRecoveryPhrase.mockReturnValue('');

      const recoveryPhrase = RecoveryPhrase(props);

      await recoveryPhrase.generateDeviceInvite();

      expect(props.showToast).toHaveBeenCalledWith({
        message: 'Recovery phrase not available. Please disable and re-enable sync.',
        type: 'error',
      });
    });

    it('should handle invite generation error', async () => {
      syncService.createInviteCode.mockRejectedValue(new Error('Generation failed'));

      const recoveryPhrase = RecoveryPhrase(defaultProps);

      await recoveryPhrase.generateDeviceInvite();

      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Generation failed',
        type: 'error',
      });
    });
  });

  describe('regenerateDeviceInvite', () => {
    it('should regenerate device invite successfully', async () => {
      const mockResult = {
        inviteCode: 'def456',
        inviteUrl: 'https://stackmap.app/sync/def456#test-recovery-phrase',
      };
      syncService.createInviteCode.mockResolvedValue(mockResult);

      const props = {
        ...defaultProps,
        generatedSyncKey: 'https://stackmap.app/sync/abc123#old-phrase',
      };
      const recoveryPhrase = RecoveryPhrase(props);

      await recoveryPhrase.regenerateDeviceInvite();

      expect(syncService.createInviteCode).toHaveBeenCalledWith(24, 5, 'Manual invite');
      expect(props.setGeneratedSyncKey).toHaveBeenCalledWith(mockResult.inviteUrl);
      expect(props.showToast).toHaveBeenCalledWith({
        message: 'New sync key generated!',
        type: 'success',
      });
    });

    it('should handle regeneration error', async () => {
      syncService.createInviteCode.mockRejectedValue(new Error('Regeneration failed'));

      const recoveryPhrase = RecoveryPhrase(defaultProps);

      await recoveryPhrase.regenerateDeviceInvite();

      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Failed to generate new key',
        type: 'error',
      });
    });
  });

  describe('getSyncKeyParts', () => {
    it('should parse sync key parts correctly', () => {
      const props = {
        ...defaultProps,
        generatedSyncKey: 'https://stackmap.app/sync/abc123#test-recovery-phrase-123',
      };
      const recoveryPhrase = RecoveryPhrase(props);

      const result = recoveryPhrase.getSyncKeyParts();

      expect(result).toEqual({
        keyOnly: 'abc123#test-recovery-phrase-123',
        fullUrl: 'https://stackmap.app/sync/abc123#test-recovery-phrase-123',
        inviteCode: 'abc123',
        recoveryPhrase: 'test-recovery-phrase-123',
      });
    });

    it('should return null when no generated sync key', () => {
      const recoveryPhrase = RecoveryPhrase(defaultProps);

      const result = recoveryPhrase.getSyncKeyParts();

      expect(result).toBeNull();
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

  describe('renderAddDeviceSection', () => {
    it('should render add device button when not showing generated key', () => {
      const recoveryPhrase = RecoveryPhrase(defaultProps);
      const { getByText } = render(recoveryPhrase.renderAddDeviceSection());

      expect(getByText('Add Device')).toBeTruthy();
    });

    it('should render generated key display when showing generated key', () => {
      const props = {
        ...defaultProps,
        showGeneratedKey: true,
        generatedSyncKey: 'https://stackmap.app/sync/abc123#test-phrase',
      };
      const recoveryPhrase = RecoveryPhrase(props);
      const { getByText } = render(recoveryPhrase.renderAddDeviceSection());

      expect(getByText('Device Invite')).toBeTruthy();
      expect(getByText('abc123#test-phrase')).toBeTruthy();
      expect(getByText('Valid for 24 hours • Max 5 uses')).toBeTruthy();
      expect(getByText('Copy Key')).toBeTruthy();
      expect(getByText('Copy URL')).toBeTruthy();
      expect(getByText('Regenerate Key')).toBeTruthy();
    });
  });

  describe('renderSecurityWarnings', () => {
    it('should render security warnings section', () => {
      const recoveryPhrase = RecoveryPhrase(defaultProps);
      const { getByText } = render(recoveryPhrase.renderSecurityWarnings());

      expect(getByText('Security Notes')).toBeTruthy();
      expect(getByText(/Your data is encrypted end-to-end/)).toBeTruthy();
      expect(getByText(/Device invites expire automatically/)).toBeTruthy();
      expect(getByText(/Never share your permanent sync key/)).toBeTruthy();
    });
  });

  describe('button interactions', () => {
    it('should handle copy key button press', async () => {
      const props = {
        ...defaultProps,
        showGeneratedKey: true,
        generatedSyncKey: 'https://stackmap.app/sync/abc123#test-phrase',
      };
      const recoveryPhrase = RecoveryPhrase(props);
      const { getByText } = render(recoveryPhrase.renderAddDeviceSection());

      const copyKeyButton = getByText('Copy Key');
      fireEvent.press(copyKeyButton);

      await waitFor(() => {
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        expect(Clipboard.setString).toHaveBeenCalledWith('abc123#test-phrase');
      });
    });

    it('should handle copy URL button press', async () => {
      const props = {
        ...defaultProps,
        showGeneratedKey: true,
        generatedSyncKey: 'https://stackmap.app/sync/abc123#test-phrase',
      };
      const recoveryPhrase = RecoveryPhrase(props);
      const { getByText } = render(recoveryPhrase.renderAddDeviceSection());

      const copyUrlButton = getByText('Copy URL');
      fireEvent.press(copyUrlButton);

      await waitFor(() => {
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        expect(Clipboard.setString).toHaveBeenCalledWith('https://stackmap.app/sync/abc123#test-phrase');
      });
    });
  });
});