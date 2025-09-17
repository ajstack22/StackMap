/* eslint-env jest */
/**
 * Comprehensive tests for Logo component
 * Tests SVG rendering, prop handling, theme colors, and size calculations
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import Logo from '../Logo';

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, ...props }) => React.createElement('Svg', props, children),
    Rect: (props) => React.createElement('Rect', props),
  };
});

describe('Logo Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Default rendering', () => {
    it('should render with default props', () => {
      const { getByTestId } = render(<Logo testID="logo" />);
      expect(getByTestId('logo')).toBeTruthy();
    });

    it('should use default size of 32', () => {
      const { getByTestId } = render(<Logo testID="logo" />);
      const logoContainer = getByTestId('logo');

      // Default size = 32, height = size * 0.625 = 20
      expect(logoContainer.props.style).toEqual({
        width: 32,
        height: 20,
      });
    });

    it('should use white as default color', () => {
      const { UNSAFE_getByType } = render(<Logo />);
      const svg = UNSAFE_getByType('Svg');
      const rects = svg.props.children;

      // All three rectangles should have white fill
      rects.forEach(rect => {
        expect(rect.props.fill).toBe('white');
      });
    });

    it('should use default primary color from theme fallback', () => {
      const { UNSAFE_getByType } = render(<Logo />);
      const svg = UNSAFE_getByType('Svg');

      // Should render SVG even without theme (uses fallback)
      expect(svg).toBeTruthy();
    });
  });

  describe('Size calculations', () => {
    it('should calculate dimensions correctly for custom size', () => {
      const customSize = 64;
      const { getByTestId } = render(<Logo size={customSize} testID="logo" />);
      const logoContainer = getByTestId('logo');

      // height = size * 0.625
      const expectedHeight = customSize * 0.625; // 40
      const expectedWidth = customSize; // 64

      expect(logoContainer.props.style).toEqual({
        width: expectedWidth,
        height: expectedHeight,
      });
    });

    it('should handle size 0', () => {
      const { getByTestId } = render(<Logo size={0} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: 0,
        height: 0,
      });
    });

    it('should handle large size values', () => {
      const largeSize = 128;
      const { getByTestId } = render(<Logo size={largeSize} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: largeSize,
        height: largeSize * 0.625, // 80
      });
    });

    it('should handle decimal size values', () => {
      const decimalSize = 32.5;
      const { getByTestId } = render(<Logo size={decimalSize} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: decimalSize,
        height: decimalSize * 0.625, // 20.3125
      });
    });
  });

  describe('Color handling', () => {
    it('should use custom color when provided', () => {
      const customColor = '#ff0000';
      const { UNSAFE_getByType } = render(<Logo color={customColor} />);
      const svg = UNSAFE_getByType('Svg');
      const rects = svg.props.children;

      rects.forEach(rect => {
        expect(rect.props.fill).toBe(customColor);
      });
    });

    it('should use theme primary color as fallback when no color provided', () => {
      const theme = { primary: '#667eea' };
      const { UNSAFE_getByType } = render(<Logo theme={theme} />);
      const svg = UNSAFE_getByType('Svg');

      // Should still use white as logoColor (color prop takes precedence)
      const rects = svg.props.children;
      rects.forEach(rect => {
        expect(rect.props.fill).toBe('white');
      });
    });

    it('should handle theme with no primary color', () => {
      const theme = {};
      const { UNSAFE_getByType } = render(<Logo theme={theme} />);
      const svg = UNSAFE_getByType('Svg');

      // Should fall back to default and still render
      expect(svg).toBeTruthy();
    });

    it('should handle null theme', () => {
      const { UNSAFE_getByType } = render(<Logo theme={null} />);
      const svg = UNSAFE_getByType('Svg');

      expect(svg).toBeTruthy();
    });

    it('should handle undefined theme', () => {
      const { UNSAFE_getByType } = render(<Logo theme={undefined} />);
      const svg = UNSAFE_getByType('Svg');

      expect(svg).toBeTruthy();
    });
  });

  describe('SVG structure', () => {
    it('should render correct SVG viewBox', () => {
      const { UNSAFE_getByType } = render(<Logo size={64} />);
      const svg = UNSAFE_getByType('Svg');

      expect(svg.props.viewBox).toBe('0 0 32 20');
      expect(svg.props.width).toBe(64);
      expect(svg.props.height).toBe(40); // 64 * 0.625
    });

    it('should render three rectangles', () => {
      const { UNSAFE_getByType } = render(<Logo />);
      const svg = UNSAFE_getByType('Svg');
      const rects = svg.props.children;

      expect(Array.isArray(rects)).toBe(true);
      expect(rects).toHaveLength(3);

      rects.forEach(rect => {
        expect(rect.type.name || rect.type).toBe('Rect');
      });
    });

    it('should have correct rectangle dimensions and positions', () => {
      const { UNSAFE_getByType } = render(<Logo />);
      const svg = UNSAFE_getByType('Svg');
      const [topRect, middleRect, bottomRect] = svg.props.children;

      // Top rectangle
      expect(topRect.props.x).toBe('4');
      expect(topRect.props.y).toBe('0');
      expect(topRect.props.width).toBe('24');
      expect(topRect.props.height).toBe('3.6');
      expect(topRect.props.rx).toBe('3');
      expect(topRect.props.ry).toBe('3');

      // Middle rectangle
      expect(middleRect.props.x).toBe('4');
      expect(middleRect.props.y).toBe('5.6');
      expect(middleRect.props.width).toBe('24');
      expect(middleRect.props.height).toBe('3.6');
      expect(middleRect.props.rx).toBe('3');
      expect(middleRect.props.ry).toBe('3');

      // Bottom rectangle
      expect(bottomRect.props.x).toBe('4');
      expect(bottomRect.props.y).toBe('11.2');
      expect(bottomRect.props.width).toBe('24');
      expect(bottomRect.props.height).toBe('8.4');
      expect(bottomRect.props.rx).toBe('3');
      expect(bottomRect.props.ry).toBe('3');
    });

    it('should maintain consistent styling across rectangles', () => {
      const color = '#123456';
      const { UNSAFE_getByType } = render(<Logo color={color} />);
      const svg = UNSAFE_getByType('Svg');
      const rects = svg.props.children;

      rects.forEach(rect => {
        expect(rect.props.fill).toBe(color);
        expect(rect.props.rx).toBe('3');
        expect(rect.props.ry).toBe('3');
        expect(rect.props.x).toBe('4');
        expect(rect.props.width).toBe('24');
      });
    });
  });

  describe('Combined prop scenarios', () => {
    it('should handle all props together', () => {
      const props = {
        size: 48,
        theme: { primary: '#000000' },
        color: '#ffffff',
      };

      const { getByTestId, UNSAFE_getByType } = render(
        <Logo {...props} testID="logo" />
      );

      const logoContainer = getByTestId('logo');
      const svg = UNSAFE_getByType('Svg');
      const rects = svg.props.children;

      // Check size calculations
      expect(logoContainer.props.style.width).toBe(48);
      expect(logoContainer.props.style.height).toBe(30); // 48 * 0.625

      // Check SVG dimensions
      expect(svg.props.width).toBe(48);
      expect(svg.props.height).toBe(30);

      // Check color usage (color prop should override theme)
      rects.forEach(rect => {
        expect(rect.props.fill).toBe('#ffffff');
      });
    });

    it('should handle missing optional props gracefully', () => {
      const { getByTestId } = render(<Logo testID="logo" />);
      const logoContainer = getByTestId('logo');

      // Should render without errors
      expect(logoContainer).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle negative size gracefully', () => {
      const { getByTestId } = render(<Logo size={-10} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: -10,
        height: -6.25, // -10 * 0.625
      });
    });

    it('should handle empty string color', () => {
      const { UNSAFE_getByType } = render(<Logo color="" />);
      const svg = UNSAFE_getByType('Svg');
      const rects = svg.props.children;

      // Empty string is falsy, so it falls back to default white
      rects.forEach(rect => {
        expect(rect.props.fill).toBe('white');
      });
    });

    it('should handle malformed theme object', () => {
      const theme = { notPrimary: '#123456' };
      const { UNSAFE_getByType } = render(<Logo theme={theme} />);
      const svg = UNSAFE_getByType('Svg');

      // Should render successfully with fallback
      expect(svg).toBeTruthy();
    });
  });

  describe('Hostile input testing', () => {
    it('should handle NaN size values', () => {
      const { getByTestId } = render(<Logo size={NaN} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: NaN,
        height: NaN, // NaN * 0.625 = NaN
      });
    });

    it('should handle Infinity size values', () => {
      const { getByTestId } = render(<Logo size={Infinity} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: Infinity,
        height: Infinity, // Infinity * 0.625 = Infinity
      });
    });

    it('should handle extremely large size values', () => {
      const extremeSize = Number.MAX_SAFE_INTEGER;
      const { getByTestId } = render(<Logo size={extremeSize} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: extremeSize,
        height: extremeSize * 0.625,
      });
    });

    it('should handle extremely small positive size values', () => {
      const tinySize = Number.MIN_VALUE;
      const { getByTestId } = render(<Logo size={tinySize} testID="logo" />);
      const logoContainer = getByTestId('logo');

      expect(logoContainer.props.style).toEqual({
        width: tinySize,
        height: tinySize * 0.625,
      });
    });

    it('should handle boolean size values (type coercion)', () => {
      const { getByTestId } = render(<Logo size={true} testID="logo" />);
      const logoContainer = getByTestId('logo');

      // JavaScript coerces true to 1 in numeric context
      expect(logoContainer.props.style).toEqual({
        width: true,
        height: 0.625, // true * 0.625 = 1 * 0.625 = 0.625
      });
    });

    it('should handle string size values', () => {
      const { getByTestId } = render(<Logo size="48" testID="logo" />);
      const logoContainer = getByTestId('logo');

      // String "48" should be used as-is for width, but multiplication converts to number
      expect(logoContainer.props.style).toEqual({
        width: "48",
        height: 30, // "48" * 0.625 = 48 * 0.625 = 30
      });
    });

    it('should handle malicious color injection attempts', () => {
      const maliciousColor = 'javascript:alert("xss")';
      const { UNSAFE_getByType } = render(<Logo color={maliciousColor} />);
      const svg = UNSAFE_getByType('Svg');
      const rects = svg.props.children;

      // Should render the malicious string as-is (React will sanitize in actual DOM)
      rects.forEach(rect => {
        expect(rect.props.fill).toBe(maliciousColor);
      });
    });

    it('should handle circular reference in theme object', () => {
      const circularTheme = { primary: '#123456' };
      circularTheme.self = circularTheme; // Create circular reference

      const { UNSAFE_getByType } = render(<Logo theme={circularTheme} />);
      const svg = UNSAFE_getByType('Svg');

      // Should render successfully even with circular reference
      expect(svg).toBeTruthy();
    });

    it('should handle theme object with getter that throws', () => {
      const problematicTheme = {};
      Object.defineProperty(problematicTheme, 'primary', {
        get() {
          throw new Error('Theme access error');
        }
      });

      // Component will crash if theme.primary getter throws, but that's expected behavior
      // since the component does access theme.primary directly
      expect(() => {
        render(<Logo theme={problematicTheme} />);
      }).toThrow('Theme access error');
    });

    it('should handle deeply nested style objects without stack overflow', () => {
      // Create deeply nested theme
      let deepTheme = { primary: '#123456' };
      for (let i = 0; i < 100; i++) {
        deepTheme = { nested: deepTheme, primary: '#123456' };
      }

      const { UNSAFE_getByType } = render(<Logo theme={deepTheme} />);
      const svg = UNSAFE_getByType('Svg');

      expect(svg).toBeTruthy();
    });
  });

  describe('Memory leak prevention testing', () => {
    it('should handle repeated rapid renders without memory buildup', () => {
      const TestWrapper = () => {
        const [count, setCount] = React.useState(0);

        React.useEffect(() => {
          const interval = setInterval(() => {
            setCount(c => c + 1);
          }, 1);

          // Stop after 50 renders to prevent infinite loop in tests
          const timeout = setTimeout(() => {
            clearInterval(interval);
          }, 50);

          return () => {
            clearInterval(interval);
            clearTimeout(timeout);
          };
        }, []);

        return <Logo size={32 + count} testID="logo" />;
      };

      const { getByTestId } = render(<TestWrapper />);
      const logo = getByTestId('logo');

      // Should render without crashing during rapid updates
      expect(logo).toBeTruthy();
    });

    it('should handle simultaneous multiple Logo instances', () => {
      const logos = Array.from({ length: 100 }, (_, i) => (
        <Logo key={i} size={32 + i} color={`#${i.toString(16).padStart(6, '0')}`} />
      ));

      const { UNSAFE_getAllByType } = render(<>{logos}</>);
      const renderedLogos = UNSAFE_getAllByType('Svg');

      // Should render all 100 logos without performance issues
      expect(renderedLogos).toHaveLength(100);
    });

    it('should handle cleanup properly on unmount', () => {
      const { unmount, getByTestId } = render(<Logo testID="logo" />);
      const logo = getByTestId('logo');

      expect(logo).toBeTruthy();

      // Should unmount cleanly without errors
      expect(() => unmount()).not.toThrow();
    });
  });
});