// @ts-check
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

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
const mockClipboard = {
  setString: jest.fn(),
};

jest.mock('@react-native-clipboard/clipboard', () => ({
  default: mockClipboard,
}));

// Mock react-native Share and Platform
const mockShare = {
  share: jest.fn(),
};

const mockPlatform = {
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
};

// Override the jest.setup.js mock for react-native to set Platform.OS to 'ios'
jest.doMock('react-native', () => {
  const actualReactNative = jest.requireActual('react-native');
  return {
    ...actualReactNative,
    Share: mockShare,
    Platform: mockPlatform,
  };
});

// Import after mocking to ensure mock takes effect
import SyncQRCode from '../SyncQRCode';

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
  qrError: false,
  setQrError: jest.fn(),
};

describe('SyncQRCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboard.setString.mockClear();
    mockShare.share.mockClear();
    mockPlatform.OS = 'ios'; // Reset to iOS for each test

    // Also directly modify the react-native Platform object
    const ReactNative = require('react-native');
    ReactNative.Platform.OS = 'ios';
    ReactNative.Share = mockShare;
  });

  describe('copyToClipboard', () => {
    it('should copy text to clipboard on mobile', async () => {
      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.copyToClipboard('test text', 'Success message');

      expect(mockClipboard.setString).toHaveBeenCalledWith('test text');
      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Success message',
      });
    });

    it('should handle clipboard error', async () => {
      mockClipboard.setString.mockImplementation(() => {
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
      mockShare.share.mockResolvedValue({ action: 'sharedAction' });

      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.handleNativeShare();

      expect(mockShare.share).toHaveBeenCalledWith({
        message: 'Test description',
        url: 'https://stackmap.app/share/abc123',
        title: 'Test Share'
      });
    });

    it('should handle share error and fallback to clipboard', async () => {
      mockShare.share.mockRejectedValue(new Error('Share failed'));

      const syncQRCode = SyncQRCode(defaultProps);

      await syncQRCode.handleNativeShare();

      expect(defaultProps.showToast).toHaveBeenCalledWith({
        message: 'Failed to share. Link copied instead.',
        type: 'warning',
      });

      expect(mockClipboard.setString).toHaveBeenCalledWith('https://stackmap.app/share/abc123');
    });

    it('should not show error for user cancelled share', async () => {
      mockShare.share.mockRejectedValue(new Error('User did not share'));

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

    it('should show error message when qrError is true', () => {
      const props = { ...defaultProps, qrError: true };
      const syncQRCode = SyncQRCode(props);
      const { getByText } = render(syncQRCode.renderMinimalQRCode());

      expect(getByText('QR code unavailable')).toBeTruthy();
    });

    it('should use default qrError when not provided', () => {
      const props = { ...defaultProps };
      delete props.qrError; // Remove the prop entirely
      const syncQRCode = SyncQRCode(props);
      const { getByTestId } = render(syncQRCode.renderMinimalQRCode());

      // Should render QR code successfully with default qrError=false
      expect(getByTestId('qr-code')).toBeTruthy();
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
      // Temporarily override Platform.OS for this test
      const ReactNative = require('react-native');
      const originalOS = ReactNative.Platform.OS;
      ReactNative.Platform.OS = 'web';

      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText, queryByText } = render(syncQRCode.renderActionButtons());

      expect(getByText('Copy Link')).toBeTruthy();
      expect(queryByText('Share')).toBeNull();

      // Restore original platform
      ReactNative.Platform.OS = originalOS;
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
        expect(mockClipboard.setString).toHaveBeenCalledWith('https://stackmap.app/share/abc123');
      });
    });

    it('should handle share button press', async () => {
      const syncQRCode = SyncQRCode(defaultProps);
      const { getByText } = render(syncQRCode.renderActionButtons());

      const shareButton = getByText('Share');
      fireEvent.press(shareButton);

      await waitFor(() => {
        expect(mockShare.share).toHaveBeenCalled();
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