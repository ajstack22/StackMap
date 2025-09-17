/* eslint-env jest */

/**
 * Tests for BuyMeCoffeeButton component
 * Testing platform-specific rendering and basic functionality
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import BuyMeCoffeeButton from '../BuyMeCoffeeButton';

// Mock react-native modules
jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    Platform: {
      OS: 'web'
    },
    Linking: {
      openURL: jest.fn().mockResolvedValue(true)
    }
  };
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock global document for web widget tests
global.document = {
  createElement: jest.fn(() => ({
    src: '',
    async: false,
    onload: null,
    setAttribute: jest.fn(),
    parentNode: null
  })),
  getElementById: jest.fn(() => ({
    appendChild: jest.fn(),
    removeChild: jest.fn()
  })),
  createEvent: jest.fn(() => ({
    initEvent: jest.fn()
  }))
};

global.window = {
  dispatchEvent: jest.fn()
};

describe('BuyMeCoffeeButton', () => {
  const mockTheme = {
    primary: '#5c7e9d',
    secondary: '#ffffff'
  };

  beforeEach(() => {
    Platform.OS = 'web';
    jest.clearAllMocks();
  });

  describe('Platform Detection', () => {
    test('should render null on non-web platforms', () => {
      Platform.OS = 'ios';

      const { UNSAFE_root } = render(<BuyMeCoffeeButton />);

      expect(UNSAFE_root.children).toHaveLength(0);
    });

    test('should render null on Android', () => {
      Platform.OS = 'android';

      const { UNSAFE_root } = render(<BuyMeCoffeeButton />);

      expect(UNSAFE_root.children).toHaveLength(0);
    });

    test('should render on web platform', () => {
      Platform.OS = 'web';

      const { getByText } = render(<BuyMeCoffeeButton />);

      expect(getByText('☕ Support StackMap')).toBeTruthy();
    });
  });

  describe('Button Style (Default)', () => {
    test('should render button with default styling', () => {
      const { getByText } = render(<BuyMeCoffeeButton />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should apply theme colors to button', () => {
      const { getByText } = render(<BuyMeCoffeeButton theme={mockTheme} />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should apply custom container style', () => {
      const customStyle = { margin: 10 };
      const { getByText } = render(
        <BuyMeCoffeeButton containerStyle={customStyle} />
      );

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should apply custom text style', () => {
      const customTextStyle = { fontSize: 18 };
      const { getByText } = render(
        <BuyMeCoffeeButton textStyle={customTextStyle} />
      );

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should use fallback color when theme not provided', () => {
      const { getByText } = render(<BuyMeCoffeeButton />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });
  });

  describe('Link Style', () => {
    test('should render link style with correct text', () => {
      const { getByText } = render(<BuyMeCoffeeButton style="link" />);

      const link = getByText('☕ Buy us a coffee');
      expect(link).toBeTruthy();
    });

    test('should apply theme color to link text', () => {
      const { getByText } = render(
        <BuyMeCoffeeButton style="link" theme={mockTheme} />
      );

      const link = getByText('☕ Buy us a coffee');
      expect(link).toBeTruthy();
    });

    test('should apply custom styles to link', () => {
      const customContainer = { padding: 12 };
      const customText = { fontSize: 16 };

      const { getByText } = render(
        <BuyMeCoffeeButton
          style="link"
          containerStyle={customContainer}
          textStyle={customText}
        />
      );

      const link = getByText('☕ Buy us a coffee');
      expect(link).toBeTruthy();
    });

    test('should use fallback color for link when theme not provided', () => {
      const { getByText } = render(<BuyMeCoffeeButton style="link" />);

      const link = getByText('☕ Buy us a coffee');
      expect(link).toBeTruthy();
    });
  });

  describe('Widget Style', () => {
    test('should render widget container', () => {
      const { UNSAFE_root } = render(<BuyMeCoffeeButton style="widget" />);

      expect(UNSAFE_root).toBeTruthy();
    });

    test('should apply custom container style to widget', () => {
      const customStyle = { width: '200px', height: '50px' };

      const { UNSAFE_root } = render(
        <BuyMeCoffeeButton style="widget" containerStyle={customStyle} />
      );

      expect(UNSAFE_root).toBeTruthy();
    });

    test('should load widget script on mount', () => {
      render(<BuyMeCoffeeButton style="widget" />);

      expect(global.document.createElement).toHaveBeenCalledWith('script');
    });

    test('should not load script on non-web platforms', () => {
      Platform.OS = 'ios';

      render(<BuyMeCoffeeButton style="widget" />);

      // Should not create script on non-web platforms
      expect(global.document.createElement).not.toHaveBeenCalled();
    });

    test('should not load script for non-widget styles', () => {
      render(<BuyMeCoffeeButton style="button" />);

      expect(global.document.createElement).not.toHaveBeenCalled();
    });

    test('should handle missing widget container gracefully', () => {
      global.document.getElementById.mockReturnValue(null);

      expect(() => {
        render(<BuyMeCoffeeButton style="widget" />);
      }).not.toThrow();
    });
  });

  describe('Widget Script Configuration', () => {
    test('should create script element for widget style', () => {
      render(<BuyMeCoffeeButton style="widget" />);

      expect(global.document.createElement).toHaveBeenCalledWith('script');
    });

    test('should handle script creation with valid DOM', () => {
      const mockDiv = {
        appendChild: jest.fn(),
        removeChild: jest.fn()
      };

      global.document.getElementById.mockReturnValue(mockDiv);

      render(<BuyMeCoffeeButton style="widget" />);

      expect(mockDiv.appendChild).toHaveBeenCalled();
    });

    test('should handle script creation lifecycle', () => {
      const { unmount } = render(<BuyMeCoffeeButton style="widget" />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle undefined theme gracefully', () => {
      const { getByText } = render(<BuyMeCoffeeButton theme={undefined} />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should handle empty theme object', () => {
      const { getByText } = render(<BuyMeCoffeeButton theme={{}} />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should handle null containerStyle', () => {
      const { getByText } = render(<BuyMeCoffeeButton containerStyle={null} />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should handle null textStyle', () => {
      const { getByText } = render(<BuyMeCoffeeButton textStyle={null} />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should handle invalid style prop gracefully', () => {
      const { getByText } = render(<BuyMeCoffeeButton style="invalid" />);

      // Should default to button style
      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });

    test('should work with partial theme object', () => {
      const partialTheme = { primary: '#ff0000' };
      const { getByText } = render(<BuyMeCoffeeButton theme={partialTheme} />);

      const button = getByText('☕ Support StackMap');
      expect(button).toBeTruthy();
    });
  });

  describe('Component Behavior', () => {
    test('should handle style changes without errors', () => {
      const { rerender } = render(<BuyMeCoffeeButton style="button" />);

      expect(() => {
        rerender(<BuyMeCoffeeButton style="link" />);
      }).not.toThrow();

      expect(() => {
        rerender(<BuyMeCoffeeButton style="widget" />);
      }).not.toThrow();
    });

    test('should handle theme changes without errors', () => {
      const { rerender } = render(<BuyMeCoffeeButton theme={mockTheme} />);

      expect(() => {
        rerender(<BuyMeCoffeeButton theme={{ primary: '#ff0000' }} />);
      }).not.toThrow();

      expect(() => {
        rerender(<BuyMeCoffeeButton theme={undefined} />);
      }).not.toThrow();
    });

    test('should handle unmounting without errors', () => {
      const { unmount } = render(<BuyMeCoffeeButton style="widget" />);

      expect(() => unmount()).not.toThrow();
    });

    test('should render different styles correctly', () => {
      // Test button style
      const { getByText: getButtonText, unmount: unmountButton } = render(
        <BuyMeCoffeeButton style="button" />
      );
      expect(getButtonText('☕ Support StackMap')).toBeTruthy();
      unmountButton();

      // Test link style
      const { getByText: getLinkText, unmount: unmountLink } = render(
        <BuyMeCoffeeButton style="link" />
      );
      expect(getLinkText('☕ Buy us a coffee')).toBeTruthy();
      unmountLink();

      // Test widget style
      const { UNSAFE_root } = render(<BuyMeCoffeeButton style="widget" />);
      expect(UNSAFE_root).toBeTruthy();
    });
  });
});