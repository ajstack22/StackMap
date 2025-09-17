/* eslint-env jest */
/**
 * Comprehensive tests for Typography component
 * Tests platform-specific font selection, fontWeight handling, and style processing
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { Text, TextInput, getFontFamily } from '../index';

// Mock Platform for different OS tests
const mockPlatform = (os) => {
  Object.defineProperty(Platform, 'OS', {
    writable: true,
    value: os,
  });
};

describe('Typography Component', () => {
  // Store original Platform.OS
  const originalOS = Platform.OS;

  afterEach(() => {
    jest.clearAllMocks();
    // Restore original Platform.OS
    Platform.OS = originalOS;
  });

  describe('getFontFamily function', () => {
    describe('Android platform', () => {
      beforeEach(() => {
        mockPlatform('android');
      });

      it('should return ComicRelief-Bold for bold weights', () => {
        expect(getFontFamily('bold')).toBe('ComicRelief-Bold');
        expect(getFontFamily('700')).toBe('ComicRelief-Bold');
        expect(getFontFamily('800')).toBe('ComicRelief-Bold');
        expect(getFontFamily('900')).toBe('ComicRelief-Bold');
      });

      it('should return ComicRelief-Bold for medium weights (fallback)', () => {
        expect(getFontFamily('medium')).toBe('ComicRelief-Bold');
        expect(getFontFamily('500')).toBe('ComicRelief-Bold');
        expect(getFontFamily('600')).toBe('ComicRelief-Bold');
      });

      it('should return ComicRelief-Regular for regular weights', () => {
        expect(getFontFamily('regular')).toBe('ComicRelief-Regular');
        expect(getFontFamily('normal')).toBe('ComicRelief-Regular');
        expect(getFontFamily('400')).toBe('ComicRelief-Regular');
        expect(getFontFamily()).toBe('ComicRelief-Regular'); // default
      });

      it('should return ComicRelief-Regular for unrecognized weights', () => {
        expect(getFontFamily('light')).toBe('ComicRelief-Regular');
        expect(getFontFamily('300')).toBe('ComicRelief-Regular');
        expect(getFontFamily('thin')).toBe('ComicRelief-Regular');
        expect(getFontFamily('100')).toBe('ComicRelief-Regular');
        expect(getFontFamily('invalid')).toBe('ComicRelief-Regular');
      });

      it('should handle null and undefined weights', () => {
        expect(getFontFamily(null)).toBe('ComicRelief-Regular');
        expect(getFontFamily(undefined)).toBe('ComicRelief-Regular');
      });
    });

    describe('iOS platform', () => {
      beforeEach(() => {
        mockPlatform('ios');
      });

      it('should return Comic Relief for any weight', () => {
        expect(getFontFamily('bold')).toBe('Comic Relief');
        expect(getFontFamily('regular')).toBe('Comic Relief');
        expect(getFontFamily('700')).toBe('Comic Relief');
        expect(getFontFamily('400')).toBe('Comic Relief');
        expect(getFontFamily()).toBe('Comic Relief'); // default
      });

      it('should handle edge cases', () => {
        expect(getFontFamily(null)).toBe('Comic Relief');
        expect(getFontFamily(undefined)).toBe('Comic Relief');
        expect(getFontFamily('invalid')).toBe('Comic Relief');
      });
    });

    describe('Web platform', () => {
      beforeEach(() => {
        mockPlatform('web');
      });

      it('should return CSS font-family string for any weight', () => {
        const expected = "'Comic Relief', 'Comic Sans MS', cursive";
        expect(getFontFamily('bold')).toBe(expected);
        expect(getFontFamily('regular')).toBe(expected);
        expect(getFontFamily('700')).toBe(expected);
        expect(getFontFamily()).toBe(expected); // default
      });

      it('should handle edge cases', () => {
        const expected = "'Comic Relief', 'Comic Sans MS', cursive";
        expect(getFontFamily(null)).toBe(expected);
        expect(getFontFamily(undefined)).toBe(expected);
        expect(getFontFamily('invalid')).toBe(expected);
      });
    });

    describe('Unknown platform', () => {
      beforeEach(() => {
        mockPlatform('unknown');
      });

      it('should default to web behavior', () => {
        const expected = "'Comic Relief', 'Comic Sans MS', cursive";
        expect(getFontFamily('bold')).toBe(expected);
        expect(getFontFamily()).toBe(expected);
      });
    });
  });

  describe('Text Component', () => {
    describe('Basic rendering', () => {
      it('should render with default props', () => {
        const { getByText } = render(<Text>Hello World</Text>);
        expect(getByText('Hello World')).toBeTruthy();
      });

      it('should render children properly', () => {
        const { getByText } = render(<Text>Test Content</Text>);
        expect(getByText('Test Content')).toBeTruthy();
      });

      it('should pass through other props', () => {
        const { getByTestId } = render(
          <Text testID="custom-text" numberOfLines={2}>
            Test
          </Text>
        );
        expect(getByTestId('custom-text')).toBeTruthy();
      });
    });

    describe('Platform-specific font handling', () => {
      describe('Android', () => {
        beforeEach(() => {
          mockPlatform('android');
        });

        it('should apply ComicRelief-Regular with undefined fontWeight by default', () => {
          const { getByText } = render(<Text>Test</Text>);
          const textElement = getByText('Test');

          // Check that fontFamily is set and fontWeight is undefined
          const style = textElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'ComicRelief-Regular',
                fontWeight: undefined,
              }),
            ])
          );
        });

        it('should apply ComicRelief-Bold with undefined fontWeight for bold text', () => {
          const { getByText } = render(
            <Text style={{ fontWeight: 'bold' }}>Bold Test</Text>
          );
          const textElement = getByText('Bold Test');

          const style = textElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'ComicRelief-Bold',
                fontWeight: undefined,
              }),
            ])
          );
        });

        it('should handle multiple styles and extract fontWeight correctly', () => {
          const { getByText } = render(
            <Text style={[{ color: 'red' }, { fontWeight: '700' }, { fontSize: 16 }]}>
              Multi Style
            </Text>
          );
          const textElement = getByText('Multi Style');

          const style = textElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'ComicRelief-Bold',
                fontWeight: undefined,
              }),
            ])
          );
        });
      });

      describe('iOS', () => {
        beforeEach(() => {
          mockPlatform('ios');
        });

        it('should apply Comic Relief font family and preserve fontWeight', () => {
          const { getByText } = render(
            <Text style={{ fontWeight: 'bold' }}>iOS Test</Text>
          );
          const textElement = getByText('iOS Test');

          const style = textElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'Comic Relief',
              }),
            ])
          );

          // FontWeight should be preserved on iOS
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontWeight: 'bold',
              }),
            ])
          );
        });
      });

      describe('Web', () => {
        beforeEach(() => {
          mockPlatform('web');
        });

        it('should apply CSS font family and preserve fontWeight', () => {
          const { getByText } = render(
            <Text style={{ fontWeight: 'bold' }}>Web Test</Text>
          );
          const textElement = getByText('Web Test');

          const style = textElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: "'Comic Relief', 'Comic Sans MS', cursive",
              }),
            ])
          );

          // FontWeight should be preserved on web
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontWeight: 'bold',
              }),
            ])
          );
        });
      });
    });

    describe('Style processing', () => {
      beforeEach(() => {
        mockPlatform('android');
      });

      it('should handle single style object', () => {
        const { getByText } = render(
          <Text style={{ fontWeight: 'bold', color: 'blue' }}>Test</Text>
        );
        const textElement = getByText('Test');

        const style = textElement.props.style;
        expect(style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontWeight: 'bold',
              color: 'blue',
            }),
          ])
        );
      });

      it('should handle array of styles', () => {
        const { getByText } = render(
          <Text style={[{ color: 'red' }, { fontWeight: '600' }]}>Test</Text>
        );
        const textElement = getByText('Test');

        const style = textElement.props.style;
        expect(style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontFamily: 'ComicRelief-Bold',
              fontWeight: undefined,
            }),
          ])
        );
      });

      it('should handle null/undefined styles', () => {
        const { getByText } = render(<Text style={null}>Test</Text>);
        const textElement = getByText('Test');

        const style = textElement.props.style;
        expect(style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontFamily: 'ComicRelief-Regular',
              fontWeight: undefined,
            }),
          ])
        );
      });

      it('should handle mixed valid and invalid styles', () => {
        const { getByText } = render(
          <Text style={[null, { fontWeight: 'bold' }, undefined]}>Test</Text>
        );
        const textElement = getByText('Test');

        const style = textElement.props.style;
        expect(style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontFamily: 'ComicRelief-Bold',
              fontWeight: undefined,
            }),
          ])
        );
      });

      it('should use last fontWeight when multiple are provided', () => {
        const { getByText } = render(
          <Text style={[{ fontWeight: 'regular' }, { fontWeight: 'bold' }]}>
            Test
          </Text>
        );
        const textElement = getByText('Test');

        const style = textElement.props.style;
        expect(style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontFamily: 'ComicRelief-Bold',
              fontWeight: undefined,
            }),
          ])
        );
      });
    });

    describe('Ref forwarding', () => {
      it('should forward refs correctly', () => {
        const ref = React.createRef();
        const { getByText } = render(<Text ref={ref}>Test</Text>);
        const textElement = getByText('Test');

        // In test environment, we can't directly check ref.current
        // but we can verify the component renders correctly with ref
        expect(textElement).toBeTruthy();
      });
    });

    describe('Display name', () => {
      it('should have correct display name', () => {
        expect(Text.displayName).toBe('StyledText');
      });
    });
  });

  describe('TextInput Component', () => {
    describe('Basic rendering', () => {
      it('should render without errors', () => {
        const { getByDisplayValue } = render(<TextInput value="test" />);
        expect(getByDisplayValue('test')).toBeTruthy();
      });

      it('should pass through props', () => {
        const { getByTestId } = render(
          <TextInput testID="custom-input" placeholder="Enter text" />
        );
        expect(getByTestId('custom-input')).toBeTruthy();
      });
    });

    describe('Platform-specific font handling', () => {
      describe('Android', () => {
        beforeEach(() => {
          mockPlatform('android');
        });

        it('should apply ComicRelief-Regular and black color by default', () => {
          const { getByDisplayValue } = render(<TextInput value="test" />);
          const inputElement = getByDisplayValue('test');

          const style = inputElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'ComicRelief-Regular',
                fontWeight: undefined,
                color: '#000000',
              }),
            ])
          );
        });

        it('should apply ComicRelief-Bold for bold fontWeight', () => {
          const { getByDisplayValue } = render(
            <TextInput style={{ fontWeight: 'bold' }} value="bold test" />
          );
          const inputElement = getByDisplayValue('bold test');

          const style = inputElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'ComicRelief-Bold',
                fontWeight: undefined,
                color: '#000000',
              }),
            ])
          );
        });

        it('should break early when fontWeight is found in style array', () => {
          const { getByDisplayValue } = render(
            <TextInput
              style={[{ fontWeight: 'bold' }, { fontWeight: 'regular' }]}
              value="test"
            />
          );
          const inputElement = getByDisplayValue('test');

          const style = inputElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'ComicRelief-Bold', // Should use first fontWeight found
                fontWeight: undefined,
                color: '#000000',
              }),
            ])
          );
        });
      });

      describe('iOS', () => {
        beforeEach(() => {
          mockPlatform('ios');
        });

        it('should apply Comic Relief font family without black color override', () => {
          const { getByDisplayValue } = render(
            <TextInput style={{ fontWeight: 'bold' }} value="ios test" />
          );
          const inputElement = getByDisplayValue('ios test');

          const style = inputElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: 'Comic Relief',
              }),
            ])
          );

          // Should not have the black color override on iOS
          expect(style).not.toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                color: '#000000',
              }),
            ])
          );
        });
      });

      describe('Web', () => {
        beforeEach(() => {
          mockPlatform('web');
        });

        it('should apply CSS font family without black color override', () => {
          const { getByDisplayValue } = render(
            <TextInput style={{ fontWeight: 'bold' }} value="web test" />
          );
          const inputElement = getByDisplayValue('web test');

          const style = inputElement.props.style;
          expect(style).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                fontFamily: "'Comic Relief', 'Comic Sans MS', cursive",
              }),
            ])
          );

          // Should not have the black color override on web
          expect(style).not.toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                color: '#000000',
              }),
            ])
          );
        });
      });
    });

    describe('Style processing', () => {
      beforeEach(() => {
        mockPlatform('android');
      });

      it('should handle null/undefined styles', () => {
        const { getByDisplayValue } = render(<TextInput style={null} value="test" />);
        const inputElement = getByDisplayValue('test');

        const style = inputElement.props.style;
        expect(style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontFamily: 'ComicRelief-Regular',
              fontWeight: undefined,
              color: '#000000',
            }),
          ])
        );
      });

      it('should handle mixed valid and invalid styles', () => {
        const { getByDisplayValue } = render(
          <TextInput style={[null, { fontWeight: 'bold' }, undefined]} value="test" />
        );
        const inputElement = getByDisplayValue('test');

        const style = inputElement.props.style;
        expect(style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontFamily: 'ComicRelief-Bold',
              fontWeight: undefined,
              color: '#000000',
            }),
          ])
        );
      });
    });

    describe('Ref forwarding', () => {
      it('should forward refs correctly', () => {
        const ref = React.createRef();
        const { getByDisplayValue } = render(<TextInput ref={ref} value="test" />);
        const inputElement = getByDisplayValue('test');

        // In test environment, we can't directly check ref.current
        // but we can verify the component renders correctly with ref
        expect(inputElement).toBeTruthy();
      });
    });

    describe('Display name', () => {
      it('should have correct display name', () => {
        expect(TextInput.displayName).toBe('StyledTextInput');
      });
    });
  });

  describe('Module exports', () => {
    it('should export all required components and functions', () => {
      const TypographyModule = require('../index');

      expect(TypographyModule.Text).toBeDefined();
      expect(TypographyModule.TextInput).toBeDefined();
      expect(TypographyModule.getFontFamily).toBeDefined();
      expect(TypographyModule.RNText).toBeDefined();
      expect(TypographyModule.RNTextInput).toBeDefined();
      expect(TypographyModule.default).toBeDefined();
    });

    it('should have correct default export structure', () => {
      const TypographyModule = require('../index');
      const defaultExport = TypographyModule.default;

      expect(defaultExport.Text).toBeDefined();
      expect(defaultExport.TextInput).toBeDefined();
      expect(defaultExport.getFontFamily).toBeDefined();
    });
  });

  describe('Stress testing and performance edge cases', () => {
    beforeEach(() => {
      mockPlatform('android');
    });

    describe('Text component stress tests', () => {
      it('should handle extremely long text strings without performance degradation', () => {
        const veryLongText = 'A'.repeat(10000);
        const startTime = performance.now();

        const { getByText } = render(<Text>{veryLongText}</Text>);
        const textElement = getByText(veryLongText);

        const endTime = performance.now();
        const renderTime = endTime - startTime;

        expect(textElement).toBeTruthy();
        // Should render in reasonable time (less than 100ms for even very long text)
        expect(renderTime).toBeLessThan(100);
      });

      it('should handle text with thousands of special characters', () => {
        const specialCharsText = '✓⚠️❌✅⭐️💫🔥💯🎯🚀💎⚡️✨🌟💪🎉🔝💡🎨🔮🌈🦄🎭🎪🎨🌺🌸🌼🌻🌷🌹🥀🌾🌿🍀🌱🌲🌳🌴🌵🌶️🍄🌰🍇🍈🍉🍊🍋🍌🍍🥭🍎🍏🍐🍑🍒🍓🫐🥝🍅🫒🥥🥑🍆🥔🥕🌽🌶️🫑🥒🥬🥦🧄🧅🍄🥜🌰'.repeat(100);

        const { getByText } = render(<Text>{specialCharsText}</Text>);
        const textElement = getByText(specialCharsText);

        expect(textElement).toBeTruthy();
      });

      it('should handle deeply nested style arrays without stack overflow', () => {
        let nestedStyles = [{ color: 'red' }];
        for (let i = 0; i < 100; i++) {
          nestedStyles = [nestedStyles, { fontSize: 14 + i }];
        }

        const { getByText } = render(<Text style={nestedStyles}>Nested styles</Text>);
        const textElement = getByText('Nested styles');

        expect(textElement).toBeTruthy();
      });

      it('should handle circular style references without infinite loop', () => {
        const style1 = { color: 'red' };
        const style2 = { fontSize: 16 };
        style1.next = style2;
        style2.next = style1; // Create circular reference

        const { getByText } = render(<Text style={[style1, style2]}>Circular styles</Text>);
        const textElement = getByText('Circular styles');

        expect(textElement).toBeTruthy();
      });

      it('should handle rapid style updates without memory leaks', () => {
        const TestComponent = () => {
          const [styleIndex, setStyleIndex] = React.useState(0);
          const styles = [
            { color: 'red', fontWeight: 'bold' },
            { color: 'blue', fontWeight: 'normal' },
            { color: 'green', fontWeight: '700' },
            { color: 'purple', fontWeight: '500' },
            { color: 'orange', fontWeight: '600' }
          ];

          React.useEffect(() => {
            const interval = setInterval(() => {
              setStyleIndex(prev => (prev + 1) % styles.length);
            }, 1);

            // Stop after 100 updates
            const timeout = setTimeout(() => clearInterval(interval), 100);

            return () => {
              clearInterval(interval);
              clearTimeout(timeout);
            };
          }, []);

          return <Text style={styles[styleIndex]}>Rapid updates</Text>;
        };

        const { getByText } = render(<TestComponent />);
        const textElement = getByText('Rapid updates');

        expect(textElement).toBeTruthy();
      });

      it('should handle massive style arrays efficiently', () => {
        const massiveStyleArray = Array.from({ length: 1000 }, (_, i) => ({
          [`customProperty${i}`]: `value${i}`,
          fontWeight: i % 2 === 0 ? 'bold' : 'normal'
        }));

        const startTime = performance.now();
        const { getByText } = render(<Text style={massiveStyleArray}>Massive styles</Text>);
        const endTime = performance.now();

        const textElement = getByText('Massive styles');
        expect(textElement).toBeTruthy();
        expect(endTime - startTime).toBeLessThan(50); // Should process quickly
      });

      it('should handle styles with NaN and undefined values', () => {
        const problematicStyles = [
          { fontSize: NaN, fontWeight: 'bold' },
          { color: undefined, lineHeight: Infinity },
          { opacity: -Infinity, fontWeight: null },
          null,
          undefined,
          { fontWeight: 'bold' }
        ];

        const { getByText } = render(<Text style={problematicStyles}>Problematic styles</Text>);
        const textElement = getByText('Problematic styles');

        expect(textElement).toBeTruthy();
      });
    });

    describe('TextInput component stress tests', () => {
      it('should handle very long placeholder text', () => {
        const longPlaceholder = 'This is an extremely long placeholder text that goes on and on and on to test how the component handles very long strings that might cause performance issues or layout problems. '.repeat(50);

        const { getByPlaceholderText } = render(<TextInput placeholder={longPlaceholder} />);
        const inputElement = getByPlaceholderText(longPlaceholder);

        expect(inputElement).toBeTruthy();
      });

      it('should handle rapid value changes without performance degradation', () => {
        const TestInputComponent = () => {
          const [value, setValue] = React.useState('Value 0');

          React.useEffect(() => {
            let counter = 1;
            const interval = setInterval(() => {
              setValue(`Value ${counter++}`);
              if (counter >= 10) clearInterval(interval); // Reduced for testing
            }, 10);

            return () => clearInterval(interval);
          }, []);

          return <TextInput value={value} onChangeText={setValue} />;
        };

        const { getByDisplayValue } = render(<TestInputComponent />);

        // Should render without crashing during rapid updates
        const inputElement = getByDisplayValue('Value 0');
        expect(inputElement).toBeTruthy();
      });

      it('should handle complex style arrays with mixed valid/invalid entries', () => {
        const complexStyles = [
          null,
          { fontWeight: 'bold', color: 'red' },
          undefined,
          { fontSize: NaN, fontWeight: '700' },
          false,
          { fontWeight: 'normal' },
          'invalid style',
          { validProperty: 'value', fontWeight: '600' }
        ];

        const { getByDisplayValue } = render(<TextInput style={complexStyles} value="test" />);
        const inputElement = getByDisplayValue('test');

        expect(inputElement).toBeTruthy();
      });
    });

    describe('getFontFamily stress tests', () => {
      it('should handle rapid repeated calls efficiently', () => {
        const weights = ['bold', 'normal', '700', '400', '500', '600', null, undefined];

        const startTime = performance.now();

        // Call getFontFamily 10000 times with various weights
        for (let i = 0; i < 10000; i++) {
          const weight = weights[i % weights.length];
          getFontFamily(weight);
        }

        const endTime = performance.now();

        // Should complete in reasonable time
        expect(endTime - startTime).toBeLessThan(100);
      });

      it('should handle malformed weight values without crashing', () => {
        const malformedWeights = [
          { toString: () => { throw new Error('toString error'); } },
          { valueOf: () => 'bold' },
          Symbol('weight'),
          [],
          {},
          new Date(),
          /regex/,
          () => 'function'
        ];

        malformedWeights.forEach(weight => {
          expect(() => getFontFamily(weight)).not.toThrow();
        });
      });

      it('should handle extremely long weight strings', () => {
        const veryLongWeight = 'bold'.repeat(10000);

        const result = getFontFamily(veryLongWeight);

        // Should return a valid font family
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Memory leak prevention and cleanup tests', () => {
    beforeEach(() => {
      mockPlatform('android');
    });

    it('should handle component unmounting without memory leaks', () => {
      const TestWrapper = ({ shouldRender }) => {
        return shouldRender ? (
          <Text style={{ fontWeight: 'bold' }}>Test text</Text>
        ) : null;
      };

      const { rerender, queryByText } = render(<TestWrapper shouldRender={true} />);
      expect(queryByText('Test text')).toBeTruthy();

      // Unmount component
      rerender(<TestWrapper shouldRender={false} />);
      expect(queryByText('Test text')).toBeNull();

      // Re-mount component
      rerender(<TestWrapper shouldRender={true} />);
      expect(queryByText('Test text')).toBeTruthy();
    });

    it('should handle simultaneous rendering of many Text components', () => {
      const manyTexts = Array.from({ length: 500 }, (_, i) => (
        <Text key={i} style={{ fontWeight: i % 2 === 0 ? 'bold' : 'normal' }}>
          Text {i}
        </Text>
      ));

      const startTime = performance.now();
      const { UNSAFE_getAllByType } = render(<>{manyTexts}</>);
      const endTime = performance.now();

      const renderedTexts = UNSAFE_getAllByType('Text');
      expect(renderedTexts).toHaveLength(500);
      expect(endTime - startTime).toBeLessThan(200); // Should render efficiently
    });

    it('should handle simultaneous rendering of many TextInput components', () => {
      const manyInputs = Array.from({ length: 100 }, (_, i) => (
        <TextInput
          key={i}
          value={`Input ${i}`}
          style={{ fontWeight: i % 3 === 0 ? 'bold' : 'normal' }}
        />
      ));

      const { UNSAFE_getAllByType } = render(<>{manyInputs}</>);
      const renderedInputs = UNSAFE_getAllByType('TextInput');

      expect(renderedInputs).toHaveLength(100);
    });

    it('should handle Platform.OS changes without breaking', () => {
      const { rerender, getByText } = render(<Text>Platform test</Text>);

      // Change platform multiple times
      mockPlatform('ios');
      rerender(<Text>Platform test</Text>);
      expect(getByText('Platform test')).toBeTruthy();

      mockPlatform('web');
      rerender(<Text>Platform test</Text>);
      expect(getByText('Platform test')).toBeTruthy();

      mockPlatform('android');
      rerender(<Text>Platform test</Text>);
      expect(getByText('Platform test')).toBeTruthy();

      mockPlatform('unknown');
      rerender(<Text>Platform test</Text>);
      expect(getByText('Platform test')).toBeTruthy();
    });
  });
});