// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SyncQRCode from '../SyncQRCode';

// Mock react-native-qrcode-svg
jest.mock('react-native-qrcode-svg', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    const { value, onError } = props;
    return React.createElement('QRCode', {
      testID: 'qr-code',
      'data-value': value,
      onPress: onError,
    });
  });
});

// Mock clipboard
jest.mock('@react-native-clipboard/clipboard', () => ({
  default: {
    setString: jest.fn(),
  },
}));

// Mock react-native Share
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: {
    share: jest.fn(),
  },
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
  qrValue: 'https://stackmap.app/share/abc123',
  qrTitle: 'Test Share',
  qrDescription: 'Test description',
  qrSize: 200,
  showCopyButton: true,
  showShareButton: true,
  customActions: [],
};

describe('SyncQRCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard on mobile', async () => {
      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.copyToClipboard('test text', 'Success message');

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

      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.copyToClipboard('test text', 'Success message');

      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Failed to copy. Please select and copy manually.',
        type: 'error',
      });
    });
  });

  describe('handleNativeShare', () => {
    it('should use native share on mobile', async () => {
      const { Share } = require('react-native');
      Share.share.mockResolvedValue({ action: 'sharedAction' });

      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.handleNativeShare();

      expect(Share.share).toHaveBeenCalledWith({
        message: 'Test description',
        url: 'https://stackmap.app/share/abc123',
        title: 'Test Share',
      });
    });

    it('should handle share error and fallback to clipboard', async () => {
      const { Share } = require('react-native');
      Share.share.mockRejectedValue(new Error('Share failed'));

      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.handleNativeShare();

      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Failed to share. Link copied instead.',
        type: 'warning',
      });

      const Clipboard = require('@react-native-clipboard/clipboard').default;
      expect(Clipboard.setString).toHaveBeenCalledWith('https://stackmap.app/share/abc123');
    });

    it('should not show error for user cancelled share', async () => {
      const { Share } = require('react-native');
      Share.share.mockRejectedValue(new Error('User did not share'));

      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.handleNativeShare();

      expect(defaultProps.showToast).not.toHaveBeenCalled();
    });
  });

  describe('renderQRCode', () => {
    it('should render QR code component with correct props', () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByTestId } = render(syncQRCode.renderMinimalQRCode());

      const qrCode = getByTestId('qr-code');
      expect(qrCode.props['data-value']).toBe('https://stackmap.app/share/abc123');
    });

    it('should show error message when no QR value', () => {
      const props = { ...defaultProps, qrValue: '' };
      const syncQRCode = SyncQRCode(props);
      const { getByText } = render(syncQRCode.renderMinimalQRCode());

      expect(getByText('QR code unavailable')).toBeTruthy();
    });
  });

  describe('renderQRHeader', () => {
    it('should render header with title and description', () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText } = render(syncQRCode.renderQRHeader());

      expect(getByText('Test Share')).toBeTruthy();
      expect(getByText('Test description')).toBeTruthy();
    });

    it('should return null when no title or description', () => {
      const props = { ...defaultProps, qrTitle: '', qrDescription: '' };
      const syncQRCode = SyncQRCode(props);
      const result = syncQRCode.renderQRHeader();

      expect(result).toBeNull();
    });
  });

  describe('renderActionButtons', () => {
    it('should render copy and share buttons by default', () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText } = render(syncQRCode.renderActionButtons());

      expect(getByText('Copy Link')).toBeTruthy();
      expect(getByText('Share')).toBeTruthy();
    });

    it('should not render share button on web', () => {
      // Mock Platform OS to web
      jest.doMock('react-native', () => ({
        ...jest.requireActual('react-native'),
        Platform: { OS: 'web' },
      }));

      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText, queryByText } = render(syncQRCode.renderActionButtons());

      expect(getByText('Copy Link')).toBeTruthy();
      expect(queryByText('Share')).toBeNull();
    });

    it('should not render buttons when disabled', () => {
      const props = {
        ...defaultProps,
        showCopyButton: false,
        showShareButton: false,
      };
      const syncQRCode = SyncQRCode(props);
      const result = syncQRCode.renderActionButtons();

      expect(result).toBeNull();
    });

    it('should render custom actions', () => {
      const customActions = [
        {
          label: 'Custom Action',
          icon: 'custom-icon',
          onPress: jest.fn(),
          variant: 'primary',
        },
      ];
      const props = { ...defaultProps, customActions };
      const syncQRCode = SyncQRCode(props);
      const { getByText } = render(syncQRCode.renderActionButtons());

      expect(getByText('Custom Action')).toBeTruthy();
    });
  });

  describe('renderQRCodeSection', () => {
    it('should render complete QR code section', () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText, getByTestId } = render(syncQRCode.renderQRCodeSection());

      expect(getByText('Test Share')).toBeTruthy();
      expect(getByText('Test description')).toBeTruthy();
      expect(getByTestId('qr-code')).toBeTruthy();
      expect(getByText('Copy Link')).toBeTruthy();
      expect(getByText('Share')).toBeTruthy();
    });
  });

  describe('renderShareInstructions', () => {
    it('should render share instructions', () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText } = render(syncQRCode.renderShareInstructions());

      expect(getByText(/Scan QR code with any device camera/)).toBeTruthy();
      expect(getByText(/Or copy and share the link directly/)).toBeTruthy();
      expect(getByText(/Use native share to send via messaging apps/)).toBeTruthy();
    });
  });

  describe('getShareContent', () => {
    it('should return correct share content object', () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const result = syncQRCode.getShareContent();

      expect(result).toEqual({
        title: 'Test Share',
        message: 'Test description',
        url: 'https://stackmap.app/share/abc123',
      });
    });

    it('should return default values when props missing', () => {
      const props = { ...defaultProps, qrTitle: '', qrDescription: '' };
      const syncQRCode = SyncQRCode(props);
      const result = syncQRCode.getShareContent();

      expect(result).toEqual({
        title: 'StackMap Share',
        message: 'Check out my StackMap activities',
        url: 'https://stackmap.app/share/abc123',
      });
    });
  });

  describe('button interactions', () => {
    it('should handle copy button press', async () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText } = render(syncQRCode.renderActionButtons());

      const copyButton = getByText('Copy Link');
      fireEvent.press(copyButton);

      await waitFor(() => {
        const Clipboard = require('@react-native-clipboard/clipboard').default;
        expect(Clipboard.setString).toHaveBeenCalledWith('https://stackmap.app/share/abc123');
      });
    });

    it('should handle share button press', async () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText } = render(syncQRCode.renderActionButtons());

      const shareButton = getByText('Share');
      fireEvent.press(shareButton);

      await waitFor(() => {
        const { Share } = require('react-native');
        expect(Share.share).toHaveBeenCalled();
      });
    });

    it('should handle custom action press', () => {
      const mockOnPress = jest.fn();
      const customActions = [
        {
          label: 'Custom Action',
          icon: 'custom-icon',
          onPress: mockOnPress,
        },
      ];
      const props = { ...defaultProps, customActions };
      const syncQRCode = SyncQRCode(props);
      const { getByText } = render(syncQRCode.renderActionButtons());

      const customButton = getByText('Custom Action');
      fireEvent.press(customButton);

      expect(mockOnPress).toHaveBeenCalled();
    });
  });
});